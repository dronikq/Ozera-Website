import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.TRAFFIC_AUDIT_BASE_URL || "http://localhost:3000";
const LABEL = sanitizeLabel(process.env.TRAFFIC_AUDIT_LABEL || "latest");
const HEADED = process.argv.includes("--headed") || process.env.TRAFFIC_AUDIT_HEADED === "1";
const VERCEL_AUTOMATION_BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() || "";
const TMP_DIR = path.join(process.cwd(), "tmp");
const ROUTE_BUNDLE_STATS_PATH = path.join(process.cwd(), ".next/diagnostics/route-bundle-stats.json");
const IMAGE_HUGE_THRESHOLD_BYTES = 1024 * 1024;
const LOCAL_IMAGE_HUGE_THRESHOLD_BYTES = 500 * 1024;
const SUPABASE_STORAGE_HUGE_THRESHOLD_BYTES = envMb("TRAFFIC_AUDIT_SUPABASE_STORAGE_THRESHOLD_MB", 35);
const JS_BUNDLE_HUGE_THRESHOLD_BYTES = envMb("TRAFFIC_AUDIT_JS_BUNDLE_THRESHOLD_MB", 6);
const WAIT_SHORT_MS = 1200;
const WAIT_WEATHER_MS = 1800;
const MAX_DETAIL_PAGES = Number.parseInt(process.env.TRAFFIC_AUDIT_DETAIL_LIMIT || "0", 10);
const TRAFFIC_AUDIT_MARKDOWN = process.env.TRAFFIC_AUDIT_MARKDOWN === "1";
const PHASE_KEYS = [
  "home",
  "catalog-initial",
  "catalog-scroll",
  "map-open",
  "map-popup",
  "catalog-return",
  "detail-total",
  "detail-page",
  "detail-gallery",
  "detail-weather",
  "detail-scheme",
  "privacy-terms",
  "static",
];
const STATIC_CATEGORIES = new Set(["next_static_js", "next_static_css", "font", "local_static"]);
const LAKE_CATEGORIES = new Set(["lake_thumb", "lake_medium", "lake_original", "lake_legacy", "lake_placeholder"]);

fs.mkdirSync(TMP_DIR, { recursive: true });

const base = new URL(BASE_URL);
const routeBundleStats = loadRouteBundleStats();
const records = [];
const performanceEntries = [];
const requestIds = new WeakMap();
let requestSeq = 0;
let currentRouteGroup = "unknown";
let currentPhase = "idle";
let currentDetailPageSlug = null;
let currentDetailPageIndex = 0;

function sanitizeLabel(value) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "latest";
}

function envMb(name, fallbackMb) {
  const raw = process.env[name];
  if (!raw) return fallbackMb * 1024 * 1024;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return fallbackMb * 1024 * 1024;
  return parsed * 1024 * 1024;
}

function loadRouteBundleStats() {
  try {
    if (!fs.existsSync(ROUTE_BUNDLE_STATS_PATH)) return null;
    const parsed = JSON.parse(fs.readFileSync(ROUTE_BUNDLE_STATS_PATH, "utf8"));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function headerValue(headers, name) {
  return headers[name.toLowerCase()] ?? null;
}

function selectedHeaders(headers) {
  return {
    "cache-control": headerValue(headers, "cache-control"),
    "cdn-cache-control": headerValue(headers, "cdn-cache-control"),
    "cf-cache-status": headerValue(headers, "cf-cache-status"),
    "vercel-cdn-cache": headerValue(headers, "vercel-cdn-cache"),
    "x-cache": headerValue(headers, "x-cache"),
    "x-vercel-cache": headerValue(headers, "x-vercel-cache"),
    age: headerValue(headers, "age"),
    "content-length": headerValue(headers, "content-length"),
    "content-type": headerValue(headers, "content-type"),
    etag: headerValue(headers, "etag"),
    "last-modified": headerValue(headers, "last-modified"),
  };
}

function getContentLength(headers) {
  const raw = headerValue(headers, "content-length");
  if (!raw) return null;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDecodedUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    if (u.pathname === "/_next/image" && u.searchParams.get("url")) {
      return decodeURIComponent(u.searchParams.get("url") || "");
    }
  } catch {
    return rawUrl;
  }
  return rawUrl;
}

function hostIncludes(rawUrl, fragments) {
  try {
    const host = new URL(rawUrl).hostname;
    return fragments.some((fragment) => host.includes(fragment));
  } catch {
    return false;
  }
}

function pathIncludes(rawUrl, fragments) {
  const decoded = getDecodedUrl(rawUrl);
  try {
    const u = new URL(decoded, BASE_URL);
    return fragments.some((fragment) => u.pathname.includes(fragment));
  } catch {
    return fragments.some((fragment) => decoded.includes(fragment));
  }
}

function phaseToRouteGroup(phase) {
  const phaseValue = `${phase || ""}`.toLowerCase();
  if (phaseValue.startsWith("detail-")) return "detail";
  if (phaseValue.startsWith("catalog-")) return "catalog";
  if (phaseValue.startsWith("map-")) return "map";
  if (phaseValue === "privacy-terms") return "seo";
  if (phaseValue === "static") return "static";
  return phaseValue || "unknown";
}

function isImageByHeadersOrType(record) {
  const type = record.responseHeaders?.["content-type"] || "";
  return record.resourceType === "image" || type.startsWith("image/");
}

function isSameOriginRequest(rawUrl) {
  try {
    return new URL(rawUrl, BASE_URL).origin === base.origin;
  } catch {
    return false;
  }
}

function isLakeImageVariant(imageVariant) {
  return LAKE_CATEGORIES.has(`lake_${imageVariant}`);
}

function isSchemeRequest(rawUrl, decodedUrl) {
  const checkUrl = `${rawUrl} ${decodedUrl}`;
  return /\bscheme\b/i.test(checkUrl) || /\/scheme[\-_/.?]/i.test(checkUrl) || /scheme\.(png|jpe?g|webp|avif|gif)$/i.test(checkUrl);
}

function isWebpLike(url, contentType = "") {
  const normalizedContentType = `${contentType || ""}`.toLowerCase();
  if (normalizedContentType.includes("image/webp")) return true;
  try {
    return /\.webp($|[?#])/i.test(new URL(url, BASE_URL).pathname);
  } catch {
    return /\.webp($|[?#])/i.test(url);
  }
}

function isPngLike(url, contentType = "") {
  const normalizedContentType = `${contentType || ""}`.toLowerCase();
  if (normalizedContentType.includes("image/png")) return true;
  try {
    return /\.png($|[?#])/i.test(new URL(url, BASE_URL).pathname);
  } catch {
    return /\.png($|[?#])/i.test(url);
  }
}

function isAnalyticsRequest(rawUrl, responseHeaders = {}) {
  return (
    hostIncludes(rawUrl, [
      "vitals.vercel-insights.com",
      "va.vercel-scripts.com",
      "www.google-analytics.com",
      "www.googletagmanager.com",
      "stats.g.doubleclick.net",
    ]) ||
    /google-analytics|googletagmanager|vercel-analytics|vercel-insights/i.test(responseHeaders["content-type"] || "")
  );
}

function isSentryRequest(rawUrl) {
  return hostIncludes(rawUrl, ["sentry.io", "ingest.sentry.io"]);
}

function isVercelInternalRequest(rawUrl) {
  return hostIncludes(rawUrl, ["vercel.com", "vercel.app", "vcap.services"]) || /\/_vercel\//.test(rawUrl);
}

function isStaticResource(record, url, contentType) {
  return (
    (isSameOriginRequest(record.url) && (url.pathname.startsWith("/_next/static/") || /\.(css|js|svg|png|jpg|jpeg|webp|ico|json|txt|woff2?)$/i.test(url.pathname))) ||
    record.resourceType === "font" ||
    record.resourceType === "stylesheet" ||
    record.resourceType === "script" ||
    contentType.startsWith("text/css") ||
    contentType.includes("javascript") ||
    contentType.includes("font")
  );
}

function classify(rawUrl, resourceType, responseHeaders = {}, routeGroupParam = currentRouteGroup, phaseParam = currentPhase) {
  const decoded = getDecodedUrl(rawUrl);
  let url;
  try {
    url = new URL(rawUrl, BASE_URL);
  } catch {
    url = new URL(BASE_URL);
  }

  const decodedUrl = (() => {
    try {
      return new URL(decoded, BASE_URL);
    } catch {
      return url;
    }
  })();

  const isSameOrigin = url.origin === base.origin;
  const isSupabase = hostIncludes(decoded, [".supabase.co"]) || hostIncludes(rawUrl, [".supabase.co"]);
  const isSupabaseStorage = isSupabase && pathIncludes(decoded, ["/storage/v1/object", "/storage/v1/render/image"]);
  const isSupabaseRest = isSupabase && pathIncludes(decoded, ["/rest/v1/"]);
  const isNextImageOptimizer = isSameOrigin && url.pathname === "/_next/image";
  const isTileProvider = hostIncludes(rawUrl, [
    "tile.openstreetmap.org",
    "basemaps.cartocdn.com",
    "cartodb-basemaps",
    "tiles.stadiamaps.com",
  ]);
  const isWeatherApi =
    (isSameOrigin && url.pathname === "/api/weather") ||
    hostIncludes(rawUrl, ["api.open-meteo.com", "api.met.no"]);
  const contentType = responseHeaders["content-type"] || "";
  const imageLike = resourceType === "image" || contentType.startsWith("image/") || isNextImageOptimizer;
  const isExternalImage = imageLike && !isSameOrigin && !isSupabaseStorage && !isTileProvider;
  const isStaticAsset = isStaticResource({ url: rawUrl, resourceType }, url, contentType);
  const isSchemeImage = imageLike && (phaseParam === "detail-scheme" || isSchemeRequest(rawUrl, decoded));
  const schemeContentType = contentType || "";

  let imageVariant = "unknown";
  if (imageLike || isSupabaseStorage || isNextImageOptimizer) {
    const checkUrl = `${rawUrl} ${decoded}`;
    if (checkUrl.includes("/original/")) imageVariant = "original";
    else if (checkUrl.includes("/medium/")) imageVariant = "medium";
    else if (checkUrl.includes("/thumb/")) imageVariant = "thumb";
    else if (isSameOrigin && /placeholder|ozera_splash|icon\.png/i.test(url.pathname)) imageVariant = "placeholder";
    else if (isSupabaseStorage && imageLike) imageVariant = "legacy";
  }

  let offenderCategory = "unknown_external";
  if (isLakeImageVariant(imageVariant)) offenderCategory = `lake_${imageVariant}`;
  else if (isSchemeImage) {
    if (isSupabaseStorage) offenderCategory = "scheme_storage";
    else if (isWebpLike(rawUrl, schemeContentType) || isWebpLike(decoded, schemeContentType)) offenderCategory = "scheme_webp";
    else if (isPngLike(rawUrl, schemeContentType) || isPngLike(decoded, schemeContentType)) offenderCategory = "scheme_png";
    else offenderCategory = "scheme_external";
  }
  else if (isTileProvider) offenderCategory = "map_tile";
  else if (isWeatherApi) offenderCategory = "weather_api";
  else if (isSupabaseRest) offenderCategory = "supabase_rest";
  else if (resourceType === "script" || /\.js(\?.*)?$/i.test(url.pathname) || url.pathname.includes("/_next/static/")) offenderCategory = "next_static_js";
  else if (resourceType === "stylesheet" || /\.css(\?.*)?$/i.test(url.pathname)) offenderCategory = "next_static_css";
  else if (resourceType === "font" || /\.(woff2?|otf|ttf|eot)(\?.*)?$/i.test(url.pathname)) offenderCategory = "font";
  else if (isAnalyticsRequest(rawUrl, responseHeaders)) offenderCategory = "analytics";
  else if (isSentryRequest(rawUrl)) offenderCategory = "sentry";
  else if (isVercelInternalRequest(rawUrl)) offenderCategory = "vercel_internal";
  else if (isSameOrigin && isStaticAsset) offenderCategory = "local_static";
  else if (!isSameOrigin) offenderCategory = "unknown_external";
  else if (isStaticAsset) offenderCategory = "local_static";
  else offenderCategory = "local_static";

  const routeGroupFromUrl = (() => {
    if (isWeatherApi) return "weather";
    if (isTileProvider) return "map";
    if (isStaticAsset || STATIC_CATEGORIES.has(offenderCategory)) return "static";
    if (isSameOrigin) {
      if (url.pathname === "/") return "home";
      if (url.pathname === "/lakes") return "catalog";
      if (url.pathname.startsWith("/lakes/") && url.pathname !== "/lakes/add") return "detail";
      if (url.pathname === "/privacy" || url.pathname === "/terms" || url.pathname === "/sitemap.xml" || url.pathname === "/robots.txt") return "seo";
      if (url.pathname.startsWith("/api/")) return "unknown";
    }
    if (routeGroupParam === "map") return "map";
    return routeGroupParam || "unknown";
  })();
  const routeGroup = phaseToRouteGroup(phaseParam) || routeGroupFromUrl;

  return {
    isSupabase,
    isSupabaseStorage,
    isSupabaseRest,
    isNextImageOptimizer,
    isExternalImage,
    isTileProvider,
    isWeatherApi,
    isStaticAsset,
    isSchemeImage,
    imageVariant,
    category: offenderCategory,
    routeGroup,
    decodedImageSource: decoded !== rawUrl ? decoded : null,
    decodedHost: decodedUrl.hostname,
  };
}

function attachPageCollectors(page, runName) {
  page.on("request", (request) => {
    const id = ++requestSeq;
    const requestHeaders = request.headers();
    const record = {
      id,
      run: runName,
      url: request.url(),
      method: request.method(),
      status: null,
      statusText: null,
      resourceType: request.resourceType(),
      routeGroup: currentRouteGroup,
      phase: currentPhase,
      requestHeaders: {
        "cache-control": requestHeaders["cache-control"] ?? null,
        pragma: requestHeaders.pragma ?? null,
      },
      responseHeaders: selectedHeaders({}),
      contentLength: null,
      transferSize: null,
      encodedBodySize: null,
      decodedBodySize: null,
      knownTransferBytes: null,
      knownTransferBytesSource: null,
      knownResourceBytes: null,
      knownResourceBytesSource: null,
      guessedBytes: null,
      guessedBytesSource: null,
      failed: false,
      failureText: null,
      flags: {},
      imageVariant: "unknown",
      category: "unknown_external",
      detailPageSlug: currentDetailPageSlug,
      detailPageIndex: currentDetailPageIndex,
    };
    records.push(record);
    requestIds.set(request, id);
  });

  page.on("response", (response) => {
    const request = response.request();
    const record = records.find((item) => item.id === requestIds.get(request));
    if (!record) return;
    const headers = response.headers();
    const flags = classify(record.url, record.resourceType, selectedHeaders(headers), record.routeGroup, record.phase);
    record.status = response.status();
    record.statusText = response.statusText();
    record.responseHeaders = selectedHeaders(headers);
    record.contentLength = getContentLength(headers);
    record.flags = {
      isSupabase: flags.isSupabase,
      isSupabaseStorage: flags.isSupabaseStorage,
      isSupabaseRest: flags.isSupabaseRest,
      isNextImageOptimizer: flags.isNextImageOptimizer,
      isExternalImage: flags.isExternalImage,
      isTileProvider: flags.isTileProvider,
      isWeatherApi: flags.isWeatherApi,
      isStaticAsset: flags.isStaticAsset,
      isSchemeImage: flags.isSchemeImage,
    };
    record.imageVariant = flags.imageVariant;
    record.category = flags.category;
    record.routeGroup = flags.routeGroup;
    record.decodedImageSource = flags.decodedImageSource;
  });

  page.on("requestfailed", (request) => {
    const record = records.find((item) => item.id === requestIds.get(request));
    if (!record) return;
    record.failed = true;
    record.failureText = request.failure()?.errorText ?? "request failed";
  });
}

async function collectPerformance(page, runName) {
  try {
    const entries = await page.evaluate(() => {
      const resources = performance.getEntriesByType("resource").map((entry) => ({
        name: entry.name,
        entryType: entry.entryType,
        initiatorType: entry.initiatorType,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize,
        decodedBodySize: entry.decodedBodySize,
      }));
      performance.clearResourceTimings();
      return resources;
    });
    performanceEntries.push(
      ...entries.map((entry) => ({
        ...entry,
        run: runName,
        routeGroup: currentRouteGroup,
        phase: currentPhase,
      })),
    );
  } catch {
    // Cross-document navigations can race with evaluation; response headers still provide fallback data.
  }
}

function mergePerformance(recordsForRun, perfForRun) {
  const byUrl = new Map();
  for (const entry of perfForRun) {
    if (!byUrl.has(entry.name)) byUrl.set(entry.name, []);
    byUrl.get(entry.name).push(entry);
  }

  for (const record of recordsForRun) {
    const entries = byUrl.get(record.url);
    const entry = entries?.shift();
    if (entry) {
      record.transferSize = Number.isFinite(entry.transferSize) ? entry.transferSize : null;
      record.encodedBodySize = Number.isFinite(entry.encodedBodySize) ? entry.encodedBodySize : null;
      record.decodedBodySize = Number.isFinite(entry.decodedBodySize) ? entry.decodedBodySize : null;
    }

    const transferBytes = getReliableTransferBytes(record);
    record.knownTransferBytes = transferBytes.value;
    record.knownTransferBytesSource = transferBytes.source;

    const resourceBytes = getKnownResourceBytes(record);
    record.knownResourceBytes = resourceBytes.value;
    record.knownResourceBytesSource = resourceBytes.source;

    // Compatibility field for older tooling. This is resource size, not proof of bytes transferred.
    record.guessedBytes = record.knownResourceBytes ?? record.knownTransferBytes;
    record.guessedBytesSource = record.knownResourceBytesSource ?? record.knownTransferBytesSource;
  }
}

function isSameOriginUrl(rawUrl) {
  try {
    return new URL(rawUrl, BASE_URL).origin === base.origin;
  } catch {
    return false;
  }
}

function getReliableTransferBytes(record) {
  if (!Number.isFinite(record.transferSize)) {
    return { value: null, source: null };
  }

  if (record.transferSize > 0) {
    return { value: record.transferSize, source: "performance.transferSize" };
  }

  if (record.transferSize === 0) {
    const hasBodyTiming =
      (Number.isFinite(record.encodedBodySize) && record.encodedBodySize > 0) ||
      (Number.isFinite(record.decodedBodySize) && record.decodedBodySize > 0);
    const emptySameOriginResponse =
      isSameOriginUrl(record.url) &&
      (record.status === 204 || record.status === 304 || record.contentLength === 0);

    if (hasBodyTiming || emptySameOriginResponse) {
      return { value: 0, source: "performance.transferSize" };
    }
  }

  return { value: null, source: null };
}

function getKnownResourceBytes(record) {
  if (Number.isFinite(record.encodedBodySize) && record.encodedBodySize > 0) {
    return { value: record.encodedBodySize, source: "performance.encodedBodySize" };
  }

  if (record.contentLength != null) {
    return { value: record.contentLength, source: "content-length" };
  }

  return { value: null, source: null };
}

async function waitForNetwork(page, timeout = 9000) {
  await page.waitForLoadState("domcontentloaded", { timeout }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout }).catch(() => page.waitForTimeout(WAIT_SHORT_MS));
  await collectPerformance(page, page.__trafficRunName);
}

async function goto(page, urlPath, routeGroup, phase = routeGroup) {
  currentRouteGroup = routeGroup;
  currentPhase = phase;
  await page.goto(new URL(urlPath, BASE_URL).toString(), { waitUntil: "domcontentloaded", timeout: 45000 });
  await waitForNetwork(page);
}

async function scrollToEnd(page) {
  currentPhase = `${currentRouteGroup}-scroll`;
  let previousHeight = 0;
  for (let i = 0; i < 14; i += 1) {
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.evaluate(() => window.scrollBy(0, Math.max(window.innerHeight * 0.85, 600)));
    await page.waitForTimeout(450);
    await collectPerformance(page, page.__trafficRunName);
    const y = await page.evaluate(() => window.scrollY + window.innerHeight);
    if (height === previousHeight && y >= height - 10) break;
    previousHeight = height;
  }
}

async function getDetailLinks(page) {
  const links = await page.evaluate(() => {
    const seen = new Set();
    for (const anchor of document.querySelectorAll('a[href^="/lakes/"], a[href*="/lakes/"]')) {
      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) continue;
      if (!url.pathname.startsWith("/lakes/")) continue;
      if (url.pathname === "/lakes/add") continue;
      seen.add(url.pathname);
    }
    return Array.from(seen);
  });
  const filtered = links.filter((href) => href !== "/lakes" && href.split("/").length >= 3);
  return MAX_DETAIL_PAGES > 0 ? filtered.slice(0, MAX_DETAIL_PAGES) : filtered;
}

async function clickGalleryThumbs(page) {
  currentPhase = "detail-gallery";
  const thumbs = page.locator(".dk-gallery-thumb");
  const count = Math.min(await thumbs.count().catch(() => 0), 3);
  for (let i = 0; i < count; i += 1) {
    await thumbs.nth(i).click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(350);
    await collectPerformance(page, page.__trafficRunName);
  }
}

async function openSchemeViewer(page) {
  currentPhase = "detail-scheme";
  const schemeButton = page.getByRole("button", { name: /Переглянути схему водойми|Відкрити схему озера/i }).first();
  if (!(await schemeButton.count().catch(() => 0))) return;

  await schemeButton.click({ timeout: 3000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => page.waitForTimeout(1200));
  await collectPerformance(page, page.__trafficRunName);

  const closeButton = page.getByRole("button", { name: /Закрити схему озера/i }).first();
  if (await closeButton.count().catch(() => 0)) {
    await closeButton.click({ timeout: 3000 }).catch(() => {});
  } else {
    await page.keyboard.press("Escape").catch(() => {});
  }
  await page.waitForTimeout(350);
}

async function openMapAndMaybePopups(page) {
  currentRouteGroup = "map";
  currentPhase = "map-open";
  const mapButton = page.getByRole("button", { name: /карт/i }).first();
  if (!(await mapButton.count().catch(() => 0))) return;
  await mapButton.click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(3500);
  await collectPerformance(page, page.__trafficRunName);

  currentPhase = "map-popup";
  const popupTargets = page.locator(".leaflet-interactive, .map-cluster-icon");
  const count = Math.min(await popupTargets.count().catch(() => 0), 5);
  for (let i = 0; i < count; i += 1) {
    await popupTargets.nth(i).hover({ timeout: 2500 }).catch(() => {});
    await page.waitForTimeout(700);
    await popupTargets.nth(i).click({ timeout: 2500 }).catch(() => {});
    await page.waitForTimeout(700);
    await collectPerformance(page, page.__trafficRunName);
  }
}

async function visitSeoLinks(page) {
  currentRouteGroup = "seo";
  currentPhase = "privacy-terms";
  const links = await page.evaluate(() => {
    const wanted = new Set(["/privacy", "/terms"]);
    const found = new Set();
    for (const anchor of document.querySelectorAll("a[href]")) {
      const url = new URL(anchor.href, window.location.origin);
      if (url.origin === window.location.origin && wanted.has(url.pathname)) found.add(url.pathname);
    }
    return Array.from(found);
  }).catch(() => []);

  for (const link of links) {
    await goto(page, link, "seo", "privacy-terms");
  }
}

function slugFromLakePath(link) {
  try {
    const url = new URL(link, BASE_URL);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.at(-1) || url.pathname;
  } catch {
    return link.split("/").filter(Boolean).at(-1) || link;
  }
}

function topResourcesForPage(recordsForRun) {
  return recordsForRun
    .filter((record) => typeof record.knownResourceBytes === "number")
    .sort((a, b) => resourceBytes(b) - resourceBytes(a))
    .slice(0, 5)
    .map((record) => ({
      url: record.url,
      category: record.category,
      method: record.method,
      status: record.status,
      resourceType: record.resourceType,
      phase: record.phase,
      knownTransferBytes: record.knownTransferBytes,
      knownResourceBytes: record.knownResourceBytes,
      imageVariant: record.imageVariant,
      contentType: record.responseHeaders?.["content-type"],
    }));
}

function summarizeDetailPage(recordsForRun, lakePath, detailIndex) {
  const pageRecords = recordsForRun.filter(
    (record) => record.detailPageSlug === lakePath && record.detailPageIndex === detailIndex,
  );
  const imageRecords = pageRecords.filter(imageLike);
  const schemeLoaded = pageRecords.some((record) => `${record.category || ""}`.startsWith("scheme_"));
  return {
    lakeUrl: lakePath,
    lakeSlug: slugFromLakePath(lakePath),
    requestsCount: pageRecords.length,
    knownTransferBytes: sumTransfer(pageRecords, () => true),
    knownResourceBytes: sum(pageRecords, () => true),
    imageResourceBytes: sum(imageRecords, () => true),
    mediumCount: count(pageRecords, (record) => record.imageVariant === "medium"),
    thumbCount: count(pageRecords, (record) => record.imageVariant === "thumb"),
    schemeImageLoaded: schemeLoaded,
    weatherRequestsCount: count(pageRecords, (record) => record.flags.isWeatherApi),
    top5Resources: topResourcesForPage(pageRecords),
  };
}

function buildDetailPageBreakdown(recordsForRun) {
  const pages = new Map();
  for (const record of recordsForRun) {
    if (!record.detailPageSlug) continue;
    const key = `${record.detailPageIndex}|${record.detailPageSlug}`;
    if (!pages.has(key)) {
      pages.set(key, { lakePath: record.detailPageSlug, detailIndex: record.detailPageIndex });
    }
  }

  return Array.from(pages.values())
    .sort((a, b) => a.detailIndex - b.detailIndex)
    .map(({ lakePath, detailIndex }) => summarizeDetailPage(recordsForRun, lakePath, detailIndex));
}

async function runScenario(page, runName) {
  page.__trafficRunName = runName;

  await goto(page, "/", "home", "home");
  await goto(page, "/lakes", "catalog", "catalog-initial");
  await scrollToEnd(page);
  const detailLinks = await getDetailLinks(page);

  for (const link of detailLinks) {
    currentDetailPageSlug = new URL(link, BASE_URL).pathname;
    currentDetailPageIndex += 1;
    await goto(page, link, "detail", "detail-page");
    currentPhase = "detail-weather";
    await page.waitForTimeout(WAIT_WEATHER_MS);
    await collectPerformance(page, runName);
    currentPhase = "detail-gallery";
    await clickGalleryThumbs(page);
    currentPhase = "detail-scheme";
    await openSchemeViewer(page);
    currentDetailPageSlug = null;
  }

  await goto(page, "/lakes", "catalog", "catalog-return");
  await openMapAndMaybePopups(page);
  await visitSeoLinks(page);

  return { detailPagesVisited: detailLinks.length };
}

function resourceBytes(record) {
  return typeof record.knownResourceBytes === "number" ? record.knownResourceBytes : 0;
}

function transferBytes(record) {
  return typeof record.knownTransferBytes === "number" ? record.knownTransferBytes : 0;
}

function sum(recordsToSum, predicate) {
  return recordsToSum.reduce((total, record) => total + (predicate(record) ? resourceBytes(record) : 0), 0);
}

function sumTransfer(recordsToSum, predicate) {
  return recordsToSum.reduce((total, record) => total + (predicate(record) ? transferBytes(record) : 0), 0);
}

function count(recordsToCount, predicate) {
  return recordsToCount.reduce((total, record) => total + (predicate(record) ? 1 : 0), 0);
}

function imageLike(record) {
  return isImageByHeadersOrType(record) || record.flags.isNextImageOptimizer;
}

function knownResourceBytes(record) {
  return typeof record.knownResourceBytes === "number";
}

function knownTransferBytes(record) {
  return typeof record.knownTransferBytes === "number";
}

function phasePredicate(phase) {
  switch (phase) {
    case "home":
    case "catalog-initial":
    case "catalog-scroll":
    case "map-open":
    case "map-popup":
    case "catalog-return":
    case "detail-page":
    case "detail-gallery":
    case "detail-weather":
    case "detail-scheme":
    case "privacy-terms":
      return (record) => record.phase === phase;
    case "detail-total":
      return (record) => Boolean(record.detailPageSlug);
    case "static":
      return (record) => STATIC_CATEGORIES.has(record.category);
    default:
      return () => false;
  }
}

function phaseSummary(recordsForRun, phase) {
  const phaseRecords = recordsForRun.filter(phasePredicate(phase));
  const imageRecords = phaseRecords.filter(imageLike);
  return {
    totalRequests: phaseRecords.length,
    totalKnownTransferBytes: sumTransfer(phaseRecords, () => true),
    totalKnownResourceBytes: sum(phaseRecords, () => true),
    unknownTransferBytesRequestCount: count(phaseRecords, (record) => !knownTransferBytes(record)),
    imageRequests: imageRecords.length,
    imageKnownTransferBytes: sumTransfer(imageRecords, () => true),
    imageKnownResourceBytes: sum(imageRecords, () => true),
    supabaseStorageRequests: count(phaseRecords, (record) => record.flags.isSupabaseStorage),
    supabaseStorageKnownTransferBytes: sumTransfer(phaseRecords, (record) => record.flags.isSupabaseStorage),
    supabaseStorageKnownResourceBytes: sum(phaseRecords, (record) => record.flags.isSupabaseStorage),
    supabaseRestRequests: count(phaseRecords, (record) => record.flags.isSupabaseRest),
    supabaseRestKnownTransferBytes: sumTransfer(phaseRecords, (record) => record.flags.isSupabaseRest),
    supabaseRestKnownResourceBytes: sum(phaseRecords, (record) => record.flags.isSupabaseRest),
    jsRequests: count(phaseRecords, (record) => record.category === "next_static_js"),
    jsKnownResourceBytes: sum(phaseRecords, (record) => record.category === "next_static_js"),
    cssRequests: count(phaseRecords, (record) => record.category === "next_static_css"),
    cssKnownResourceBytes: sum(phaseRecords, (record) => record.category === "next_static_css"),
    fontRequests: count(phaseRecords, (record) => record.category === "font"),
    fontKnownResourceBytes: sum(phaseRecords, (record) => record.category === "font"),
    tileRequests: count(phaseRecords, (record) => record.category === "map_tile"),
    tileKnownResourceBytes: sum(phaseRecords, (record) => record.category === "map_tile"),
    weatherRequests: count(phaseRecords, (record) => record.category === "weather_api"),
    weatherKnownResourceBytes: sum(phaseRecords, (record) => record.category === "weather_api"),
    externalRequests: count(phaseRecords, (record) => !isSameOriginUrl(record.url)),
    externalKnownResourceBytes: sum(phaseRecords, (record) => !isSameOriginUrl(record.url)),
  };
}

function variantSummary(recordsForRun) {
  const variants = ["original", "medium", "thumb", "legacy", "placeholder", "unknown"];
  return Object.fromEntries(
    variants.map((variant) => {
      const items = recordsForRun.filter((record) => imageLike(record) && record.imageVariant === variant);
      return [
        variant,
        {
          count: items.length,
          knownTransferBytes: sumTransfer(items, () => true),
          knownResourceBytes: sum(items, () => true),
          bytes: sum(items, () => true),
        },
      ];
    }),
  );
}

function top(recordsForRun, predicate, limit = 20) {
  return recordsForRun
    .filter((record) => predicate(record) && knownResourceBytes(record))
    .sort((a, b) => resourceBytes(b) - resourceBytes(a))
    .slice(0, limit)
    .map((record) => ({
      url: record.url,
      decodedImageSource: record.decodedImageSource ?? undefined,
      method: record.method,
      status: record.status,
      resourceType: record.resourceType,
      routeGroup: record.routeGroup,
      phase: record.phase,
      category: record.category,
      knownTransferBytes: record.knownTransferBytes,
      knownResourceBytes: record.knownResourceBytes,
      bytes: resourceBytes(record),
      contentType: record.responseHeaders["content-type"],
      cacheControl: record.responseHeaders["cache-control"],
      imageVariant: record.imageVariant,
    }));
}

function topByTransfer(recordsForRun, predicate, limit = 20) {
  return recordsForRun
    .filter((record) => predicate(record) && knownTransferBytes(record))
    .sort((a, b) => transferBytes(b) - transferBytes(a))
    .slice(0, limit)
    .map((record) => ({
      url: record.url,
      decodedImageSource: record.decodedImageSource ?? undefined,
      method: record.method,
      status: record.status,
      resourceType: record.resourceType,
      routeGroup: record.routeGroup,
      phase: record.phase,
      category: record.category,
      knownTransferBytes: record.knownTransferBytes,
      knownResourceBytes: record.knownResourceBytes,
      bytes: transferBytes(record),
      contentType: record.responseHeaders["content-type"],
      cacheControl: record.responseHeaders["cache-control"],
      imageVariant: record.imageVariant,
    }));
}

function topByCategory(recordsForRun, categories, limit = 20) {
  return top(recordsForRun, (record) => categories.includes(record.category), limit);
}

function groupBy(recordsForRun, selector) {
  const grouped = new Map();
  for (const record of recordsForRun) {
    const key = selector(record);
    const current = grouped.get(key) ?? { count: 0, knownTransferBytes: 0, knownResourceBytes: 0 };
    current.count += 1;
    current.knownTransferBytes += transferBytes(record);
    current.knownResourceBytes += resourceBytes(record);
    grouped.set(key, current);
  }
  return Object.fromEntries(Array.from(grouped.entries()).sort(([a], [b]) => a.localeCompare(b)));
}

function normalizeRepeatUrl(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}

function isClearlyNetworkResponse(record) {
  if (record.status === 304) return false;
  const explicitCacheHeaders = [
    record.responseHeaders["x-vercel-cache"],
    record.responseHeaders["vercel-cdn-cache"],
    record.responseHeaders["cf-cache-status"],
    record.responseHeaders["x-cache"],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/\b(miss|bypass|dynamic|expired|revalidated)\b/.test(explicitCacheHeaders)) return true;
  if ((record.responseHeaders["cache-control"] || "").toLowerCase().includes("no-store")) return true;
  return false;
}

function repeatedDownloads(coldRecords, warmRecords) {
  const coldUrls = new Set(coldRecords.filter((record) => record.status && record.status < 400).map((record) => normalizeRepeatUrl(record.url)));
  const repeated = warmRecords
    .filter((record) => coldUrls.has(normalizeRepeatUrl(record.url)))
    .filter((record) => record.status !== 304)
    .filter((record) => transferBytes(record) > 0 || isClearlyNetworkResponse(record))
    .sort((a, b) => transferBytes(b) - transferBytes(a) || resourceBytes(b) - resourceBytes(a));

  return {
    count: repeated.length,
    knownTransferBytes: sumTransfer(repeated, () => true),
    knownResourceBytes: sum(repeated, () => true),
    unknownTransferBytesRequestCount: count(repeated, (record) => !knownTransferBytes(record)),
    knownBytes: sumTransfer(repeated, () => true),
    top20: repeated.slice(0, 20).map((record) => ({
      url: record.url,
      knownTransferBytes: record.knownTransferBytes,
      knownResourceBytes: record.knownResourceBytes,
      bytes: transferBytes(record),
      status: record.status,
      resourceType: record.resourceType,
      routeGroup: record.routeGroup,
      phase: record.phase,
      imageVariant: record.imageVariant,
      cacheControl: record.responseHeaders["cache-control"],
    })),
  };
}

function collectViolations(recordsForRun, summary, detailPagesVisited) {
  const violations = [];
  for (const record of recordsForRun) {
    if (record.imageVariant === "original") {
      violations.push({ type: "original_path_loaded", url: record.url, routeGroup: record.routeGroup, phase: record.phase, knownTransferBytes: record.knownTransferBytes, knownResourceBytes: record.knownResourceBytes, bytes: record.knownResourceBytes });
    }
    if (record.imageVariant === "legacy") {
      violations.push({ type: "legacy_lake_image_loaded", url: record.url, routeGroup: record.routeGroup, phase: record.phase, knownTransferBytes: record.knownTransferBytes, knownResourceBytes: record.knownResourceBytes, bytes: record.knownResourceBytes });
    }
    if (record.imageVariant === "legacy" && ["home", "catalog", "detail", "map"].includes(record.routeGroup)) {
      violations.push({ type: "public_ui_loaded_lake_image_without_variant", url: record.url, routeGroup: record.routeGroup, phase: record.phase, knownTransferBytes: record.knownTransferBytes, knownResourceBytes: record.knownResourceBytes, bytes: record.knownResourceBytes });
    }
    if (record.flags.isWeatherApi && (record.responseHeaders["cache-control"] || "").includes("no-store")) {
      violations.push({ type: "no_store_weather_request", url: record.url, routeGroup: record.routeGroup, phase: record.phase, cacheControl: record.responseHeaders["cache-control"] });
    }
    if (record.url.includes("/api/") && !record.responseHeaders["cache-control"]) {
      violations.push({ type: "no_cache_header_on_public_api", url: record.url, routeGroup: record.routeGroup, phase: record.phase });
    }
    if (imageLike(record) && knownResourceBytes(record) && resourceBytes(record) > IMAGE_HUGE_THRESHOLD_BYTES) {
      violations.push({ type: "huge_image_over_threshold", url: record.url, routeGroup: record.routeGroup, phase: record.phase, knownTransferBytes: record.knownTransferBytes, knownResourceBytes: record.knownResourceBytes, bytes: record.knownResourceBytes });
    }
    if (isSameOriginUrl(record.url) && imageLike(record) && knownResourceBytes(record) && resourceBytes(record) > LOCAL_IMAGE_HUGE_THRESHOLD_BYTES) {
      violations.push({ type: "huge_local_asset", url: record.url, routeGroup: record.routeGroup, phase: record.phase, knownTransferBytes: record.knownTransferBytes, knownResourceBytes: record.knownResourceBytes, bytes: record.knownResourceBytes });
    }
    if (`${record.category || ""}`.startsWith("scheme_")) {
      if (record.phase !== "detail-scheme") {
        violations.push({ type: "scheme_loaded_before_user_action", url: record.url, routeGroup: record.routeGroup, phase: record.phase, knownTransferBytes: record.knownTransferBytes, knownResourceBytes: record.knownResourceBytes, bytes: record.knownResourceBytes });
      }
    }
    if (record.category === "lake_thumb" || record.category === "lake_medium" || record.category === "lake_original" || record.category === "lake_legacy" || record.category === "lake_placeholder") {
      if (record.phase === "map-open") {
        violations.push({ type: "map_loaded_lake_images_initially", url: record.url, routeGroup: record.routeGroup, phase: record.phase, knownTransferBytes: record.knownTransferBytes, knownResourceBytes: record.knownResourceBytes, bytes: record.knownResourceBytes });
      }
    }
  }

  const mapInitialImages = recordsForRun.filter(
    (record) =>
      record.phase === "map-open" &&
      imageLike(record) &&
      !record.flags.isTileProvider &&
      !record.flags.isStaticAsset,
  );
  if (mapInitialImages.length > 2) {
    violations.push({
      type: "map_loaded_many_images_initially",
      count: mapInitialImages.length,
      bytes: sum(mapInitialImages, () => true),
      threshold: 2,
    });
  }

  const mediumCount = summary?.variantBreakdown?.medium?.count ?? 0;
  const thumbCount = summary?.variantBreakdown?.thumb?.count ?? 0;
  const originalCount = summary?.variantBreakdown?.original?.count ?? 0;
  const legacyCount = summary?.variantBreakdown?.legacy?.count ?? 0;
  if (detailPagesVisited > 0 && thumbCount === 0) {
    violations.push({
      type: "thumb_zero_when_lakes_loaded",
      detailPagesVisited,
      thumbCount,
    });
  }
  if (detailPagesVisited > 0 && mediumCount > detailPagesVisited * 3) {
    violations.push({
      type: "medium_too_high",
      detailPagesVisited,
      mediumCount,
      threshold: detailPagesVisited * 3,
    });
  }
  if (originalCount > 0) {
    violations.push({ type: "original_loaded", count: originalCount });
  }
  if (legacyCount > 0) {
    violations.push({ type: "legacy_loaded", count: legacyCount });
  }
  if ((summary?.supabaseStorageKnownResourceBytes ?? 0) > SUPABASE_STORAGE_HUGE_THRESHOLD_BYTES) {
    violations.push({
      type: "supabase_storage_resource_too_high",
      knownResourceBytes: summary.supabaseStorageKnownResourceBytes,
      threshold: SUPABASE_STORAGE_HUGE_THRESHOLD_BYTES,
    });
  }
  if ((summary?.jsKnownResourceBytes ?? 0) > JS_BUNDLE_HUGE_THRESHOLD_BYTES) {
    violations.push({
      type: "js_bundle_too_high",
      knownResourceBytes: summary.jsKnownResourceBytes,
      threshold: JS_BUNDLE_HUGE_THRESHOLD_BYTES,
    });
  }

  if (process.env.TRAFFIC_AUDIT_REQUIRE_WEBP === "1") {
    const schemeExternalCount = count(recordsForRun, (record) => record.category === "scheme_external");
    const schemePngCount = count(recordsForRun, (record) => record.category === "scheme_png");
    if (schemeExternalCount > 0) {
      violations.push({
        type: "scheme_external_requires_webp",
        count: schemeExternalCount,
      });
    }
    if (schemePngCount > 0) {
      violations.push({
        type: "scheme_png_requires_webp",
        count: schemePngCount,
      });
    }
  }

  return violations;
}

function summarize(recordsForRun, detailPageBreakdown = [], detailPagesVisited = 0) {
  const imageRecords = recordsForRun.filter(imageLike);
  const summary = {
    totalRequests: recordsForRun.length,
    totalKnownTransferBytes: sumTransfer(recordsForRun, () => true),
    totalKnownResourceBytes: sum(recordsForRun, () => true),
    totalKnownBytes: sum(recordsForRun, () => true),
    unknownTransferBytesRequestCount: count(recordsForRun, (record) => !knownTransferBytes(record)),
    unknownResourceBytesRequestCount: count(recordsForRun, (record) => !knownResourceBytes(record)),
    unknownBytesRequestCount: count(recordsForRun, (record) => !knownResourceBytes(record)),
    imageRequests: imageRecords.length,
    imageKnownTransferBytes: sumTransfer(imageRecords, () => true),
    imageKnownResourceBytes: sum(imageRecords, () => true),
    imageKnownBytes: sum(imageRecords, () => true),
    supabaseRequests: count(recordsForRun, (record) => record.flags.isSupabase),
    supabaseKnownTransferBytes: sumTransfer(recordsForRun, (record) => record.flags.isSupabase),
    supabaseKnownResourceBytes: sum(recordsForRun, (record) => record.flags.isSupabase),
    supabaseKnownBytes: sum(recordsForRun, (record) => record.flags.isSupabase),
    supabaseStorageRequests: count(recordsForRun, (record) => record.flags.isSupabaseStorage),
    supabaseStorageKnownTransferBytes: sumTransfer(recordsForRun, (record) => record.flags.isSupabaseStorage),
    supabaseStorageKnownResourceBytes: sum(recordsForRun, (record) => record.flags.isSupabaseStorage),
    supabaseStorageKnownBytes: sum(recordsForRun, (record) => record.flags.isSupabaseStorage),
    supabaseRestRequests: count(recordsForRun, (record) => record.flags.isSupabaseRest),
    supabaseRestKnownTransferBytes: sumTransfer(recordsForRun, (record) => record.flags.isSupabaseRest),
    supabaseRestKnownResourceBytes: sum(recordsForRun, (record) => record.flags.isSupabaseRest),
    supabaseRestKnownBytes: sum(recordsForRun, (record) => record.flags.isSupabaseRest),
    nextImageRequests: count(recordsForRun, (record) => record.flags.isNextImageOptimizer),
    nextImageKnownTransferBytes: sumTransfer(recordsForRun, (record) => record.flags.isNextImageOptimizer),
    nextImageKnownResourceBytes: sum(recordsForRun, (record) => record.flags.isNextImageOptimizer),
    nextImageKnownBytes: sum(recordsForRun, (record) => record.flags.isNextImageOptimizer),
    jsRequests: count(recordsForRun, (record) => record.category === "next_static_js"),
    jsKnownResourceBytes: sum(recordsForRun, (record) => record.category === "next_static_js"),
    cssRequests: count(recordsForRun, (record) => record.category === "next_static_css"),
    cssKnownResourceBytes: sum(recordsForRun, (record) => record.category === "next_static_css"),
    fontRequests: count(recordsForRun, (record) => record.category === "font"),
    fontKnownResourceBytes: sum(recordsForRun, (record) => record.category === "font"),
    externalImageRequests: count(recordsForRun, (record) => record.flags.isExternalImage),
    externalImageKnownTransferBytes: sumTransfer(recordsForRun, (record) => record.flags.isExternalImage),
    externalImageKnownResourceBytes: sum(recordsForRun, (record) => record.flags.isExternalImage),
    externalImageKnownBytes: sum(recordsForRun, (record) => record.flags.isExternalImage),
    tileRequests: count(recordsForRun, (record) => record.flags.isTileProvider),
    tileKnownTransferBytes: sumTransfer(recordsForRun, (record) => record.category === "map_tile"),
    tileKnownResourceBytes: sum(recordsForRun, (record) => record.category === "map_tile"),
    tileKnownBytes: sum(recordsForRun, (record) => record.category === "map_tile"),
    weatherRequests: count(recordsForRun, (record) => record.category === "weather_api"),
    weatherKnownTransferBytes: sumTransfer(recordsForRun, (record) => record.category === "weather_api"),
    weatherKnownResourceBytes: sum(recordsForRun, (record) => record.category === "weather_api"),
    weatherKnownBytes: sum(recordsForRun, (record) => record.category === "weather_api"),
    routeGroupBreakdown: groupBy(recordsForRun, (record) => record.routeGroup ?? "unknown"),
    phaseBreakdown: Object.fromEntries(PHASE_KEYS.map((phase) => [phase, phaseSummary(recordsForRun, phase)])),
    variantBreakdown: variantSummary(recordsForRun),
    top20LargestRequests: top(recordsForRun, () => true),
    top20ByTransfer: topByTransfer(recordsForRun, () => true),
    top20SupabaseMediumImages: top(recordsForRun, (record) => record.flags.isSupabaseStorage && record.imageVariant === "medium"),
    top20ExternalImages: top(recordsForRun, (record) => record.flags.isExternalImage),
    top20LocalAssets: top(recordsForRun, (record) => record.flags.isStaticAsset && isSameOriginUrl(record.url)),
    top20SupabaseStorageRequests: top(recordsForRun, (record) => record.flags.isSupabaseStorage),
    top20ImageRequests: top(recordsForRun, imageLike),
    top20ImageTransferRequests: topByTransfer(recordsForRun, imageLike),
    top20SupabaseMediumImageTransferRequests: topByTransfer(recordsForRun, (record) => record.flags.isSupabaseStorage && record.imageVariant === "medium"),
    top20ExternalImageTransferRequests: topByTransfer(recordsForRun, (record) => record.flags.isExternalImage),
    top20LocalAssetTransferRequests: topByTransfer(recordsForRun, (record) => record.flags.isStaticAsset && isSameOriginUrl(record.url)),
    top20LakeThumb: topByCategory(recordsForRun, ["lake_thumb"]),
    top20LakeMedium: topByCategory(recordsForRun, ["lake_medium"]),
    top20SchemeImages: topByCategory(recordsForRun, ["scheme_external", "scheme_webp", "scheme_png", "scheme_storage"]),
    top20MapTiles: topByCategory(recordsForRun, ["map_tile"]),
    top20JsBundles: topByCategory(recordsForRun, ["next_static_js"]),
    top20Css: topByCategory(recordsForRun, ["next_static_css"]),
    top20Fonts: topByCategory(recordsForRun, ["font"]),
    top20Weather: topByCategory(recordsForRun, ["weather_api"]),
    top20UnknownExternal: topByCategory(recordsForRun, ["unknown_external"]),
    detailPageBreakdown,
  };
  summary.violations = collectViolations(recordsForRun, summary, detailPagesVisited);
  return summary;
}

function mb(value) {
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

function formatBytes(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return mb(value);
}

function formatCount(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return `${value}`;
}

function mdEscape(value) {
  return `${value ?? ""}`.replace(/\|/g, "\\|");
}

function markdownTable(headers, rows) {
  const headerRow = `| ${headers.map(mdEscape).join(" | ")} |`;
  const separator = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map((cell) => mdEscape(cell)).join(" | ")} |`).join("\n");
  return [headerRow, separator, body].filter(Boolean).join("\n");
}

function sortByResourceDesc(items) {
  return [...items].sort((a, b) => (numberValue(b.knownResourceBytes) - numberValue(a.knownResourceBytes)) || (numberValue(b.knownTransferBytes) - numberValue(a.knownTransferBytes)));
}

function numberValue(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function sumArray(values) {
  return values.reduce((total, value) => total + numberValue(value), 0);
}

function topOffenderLabel(entry) {
  return entry?.url ? new URL(entry.url, BASE_URL).pathname : "n/a";
}

function formatRouteBundleHotspots(stats, limit = 4) {
  if (!Array.isArray(stats) || stats.length === 0) return [];

  const chunkFrequency = new Map();
  for (const row of stats) {
    for (const chunk of row.firstLoadChunkPaths ?? []) {
      chunkFrequency.set(chunk, (chunkFrequency.get(chunk) ?? 0) + 1);
    }
  }

  return [...stats]
    .sort((a, b) => numberValue(b.firstLoadUncompressedJsBytes) - numberValue(a.firstLoadUncompressedJsBytes))
    .slice(0, limit)
    .map((row) => {
      const uniqueChunks = (row.firstLoadChunkPaths ?? [])
        .filter((chunk) => (chunkFrequency.get(chunk) ?? 0) === 1)
        .map((chunk) => chunk.replace(/^\.\//, ""))
        .slice(0, 3);
      return `${row.route} (${formatBytes(numberValue(row.firstLoadUncompressedJsBytes))}${uniqueChunks.length ? `, unique: ${uniqueChunks.join(", ")}` : ""})`;
    });
}

function phaseRow(summary, phase) {
  return [
    phase,
    formatCount(summary.totalRequests),
    formatBytes(summary.totalKnownTransferBytes),
    formatBytes(summary.totalKnownResourceBytes),
    formatCount(summary.unknownTransferBytesRequestCount),
    formatCount(summary.imageRequests),
    formatBytes(summary.imageKnownResourceBytes),
    formatCount(summary.supabaseStorageRequests),
    formatBytes(summary.supabaseStorageKnownResourceBytes),
    formatCount(summary.jsRequests),
    formatBytes(summary.jsKnownResourceBytes),
    formatCount(summary.cssRequests),
    formatBytes(summary.cssKnownResourceBytes),
    formatCount(summary.fontRequests),
    formatBytes(summary.fontKnownResourceBytes),
    formatCount(summary.tileRequests),
    formatBytes(summary.tileKnownResourceBytes),
    formatCount(summary.weatherRequests),
    formatBytes(summary.weatherKnownResourceBytes),
    formatCount(summary.externalRequests),
    formatBytes(summary.externalKnownResourceBytes),
  ];
}

function buildTopOffenderTable(summary, keys) {
  const labels = {
    top20LakeThumb: "lake_thumb",
    top20LakeMedium: "lake_medium",
    top20SchemeImages: "scheme_images",
    top20MapTiles: "map_tiles",
    top20JsBundles: "js_bundles",
    top20Css: "css",
    top20Fonts: "fonts",
    top20Weather: "weather",
    top20UnknownExternal: "unknown_external",
  };

  return keys.map((key) => {
    const items = summary[key] ?? [];
    const sorted = sortByResourceDesc(items);
    const totalBytes = sumArray(sorted.map((item) => item.knownResourceBytes));
    const topItem = sorted[0];
    return [
      labels[key] ?? key,
      formatCount(sorted.length),
      formatBytes(totalBytes),
      topItem ? topOffenderLabel(topItem) : "n/a",
      topItem ? formatBytes(topItem.knownResourceBytes) : "n/a",
    ];
  });
}

function recommendationLines(report) {
  const lines = [];
  const cold = report.runs.cold.summary;
  const warm = report.runs.warm.summary;
  const coldMap = cold.phaseBreakdown["map-open"] ?? {};
  const coldWeather = cold.phaseBreakdown["detail-weather"] ?? {};
  const mediumCount = cold.variantBreakdown.medium?.count ?? 0;
  const detailPagesVisited = report.totalDetailPagesVisited || 0;
  const topJsBundles = (cold.top20JsBundles ?? []).slice(0, 3);
  const topSchemeOffenders = (cold.top20SchemeImages ?? []).slice(0, 3);
  const repeatedDownloads = warm.repeatedDownloadsBetweenColdAndWarm ?? {};
  const schemeOffenderBytes = sumArray((cold.top20SchemeImages ?? []).map((item) => item.knownResourceBytes));

  if (detailPagesVisited > 0 && mediumCount > detailPagesVisited * 3) {
    lines.push("Many medium images were loaded. Inspect gallery and detail-page loading to reduce redundant medium fetches.");
  }

  if (schemeOffenderBytes > 500 * 1024) {
    const schemeTop = topSchemeOffenders
      .map((item) => `${topOffenderLabel(item)} (${formatBytes(item.knownResourceBytes)})`)
      .join(", ");
    lines.push(`Scheme images are still expensive (${formatBytes(schemeOffenderBytes)} across top offenders: ${schemeTop}). Migrate scheme assets into the optimized Storage pipeline, then serve WebP thumb/full variants from immutable hashed paths.`);
  }

  if ((coldMap.tileKnownResourceBytes ?? 0) > 0) {
    lines.push("Map tiles still cost traffic. Consider lazy-loading the map, shrinking the initial viewport, or improving tile cache behavior.");
  }

  if ((cold.jsKnownResourceBytes ?? 0) > JS_BUNDLE_HUGE_THRESHOLD_BYTES) {
    const bundleRoutes = formatRouteBundleHotspots(routeBundleStats);
    const bundleList = topJsBundles.map((item) => `${topOffenderLabel(item)} (${formatBytes(item.knownResourceBytes)})`).join(", ");
    const routeList = bundleRoutes.length ? ` Top route bundles: ${bundleRoutes.join("; ")}.` : "";
    lines.push(`JS bundle weight is high (${formatBytes(cold.jsKnownResourceBytes)}). Inspect the bundle analyzer and split heavy code paths with dynamic imports.${routeList} Top network JS resources: ${bundleList}.`);
  }

  if ((coldWeather.weatherKnownResourceBytes ?? 0) > 0) {
    lines.push("Weather requests are present. Cache or dedupe weather fetches where the same lake page is revisited.");
  }

  if ((warm.totalKnownTransferBytes ?? 0) > 0) {
    lines.push("Warm transfer is still non-zero. Inspect cache headers and confirm repeat requests are being served from cache.");
  }

  if ((cold.supabaseStorageKnownResourceBytes ?? 0) > SUPABASE_STORAGE_HUGE_THRESHOLD_BYTES) {
    lines.push("Supabase Storage traffic is still heavy. Recheck image sizing, variants, and any pages that preload lake media too early.");
  }

  if ((repeatedDownloads.count ?? 0) > 0 && (repeatedDownloads.knownTransferBytes ?? 0) < 1024 * 1024) {
    lines.push(`Repeated warm downloads are visible but transfer remains low (${formatCount(repeatedDownloads.count)} requests, ${formatBytes(repeatedDownloads.knownTransferBytes)}). Keep this as a low-priority cache-header follow-up.`);
  }

  if (!lines.length) {
    lines.push("No material hotspots were detected from the current thresholds.");
  }

  return lines;
}

function buildMarkdownReport(report) {
  const cold = report.runs.cold.summary;
  const warm = report.runs.warm.summary;
  const coldTopDetailPages = [...(report.runs.cold.detailPageBreakdown ?? [])].sort((a, b) => numberValue(b.knownResourceBytes) - numberValue(a.knownResourceBytes)).slice(0, 5);
  const warmTopDetailPages = [...(report.runs.warm.detailPageBreakdown ?? [])].sort((a, b) => numberValue(b.knownResourceBytes) - numberValue(a.knownResourceBytes)).slice(0, 5);
  const phaseRows = PHASE_KEYS.map((phase) => {
    const phaseSummaryValue = cold.phaseBreakdown[phase] ?? {};
    return phaseRow(phaseSummaryValue, phase);
  });

  const topOffenderRows = buildTopOffenderTable(cold, [
    "top20LakeThumb",
    "top20LakeMedium",
    "top20SchemeImages",
    "top20MapTiles",
    "top20JsBundles",
    "top20Css",
    "top20Fonts",
    "top20Weather",
    "top20UnknownExternal",
  ]);

  const coldVariantRows = Object.entries(cold.variantBreakdown).map(([name, variant]) => [
    name,
    formatCount(variant.count),
    formatBytes(variant.knownResourceBytes),
    formatBytes(variant.knownTransferBytes),
  ]);
  const warmVariantRows = Object.entries(warm.variantBreakdown).map(([name, variant]) => [
    name,
    formatCount(variant.count),
    formatBytes(variant.knownResourceBytes),
    formatBytes(variant.knownTransferBytes),
  ]);

  const violationCounts = new Map();
  for (const item of [...(cold.violations ?? []), ...(warm.violations ?? [])]) {
    violationCounts.set(item.type, (violationCounts.get(item.type) ?? 0) + 1);
  }

  const violationRows = [...violationCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, countValue]) => [type, formatCount(countValue)]);

  return [
    `# Traffic Audit: ${report.label}`,
    "",
    "## 1. Executive Summary",
    `- Base URL: ${report.baseUrl}`,
    `- Cold detail pages visited: ${report.runs.cold.detailPagesVisited ?? 0}`,
    `- Warm detail pages visited: ${report.runs.warm.detailPagesVisited ?? 0}`,
    `- Total detail pages visited: ${report.totalDetailPagesVisited ?? 0}`,
    `- Cold transfer: ${formatBytes(cold.totalKnownTransferBytes)}`,
    `- Cold resource: ${formatBytes(cold.totalKnownResourceBytes)}`,
    `- Warm transfer: ${formatBytes(warm.totalKnownTransferBytes)}`,
    `- Warm resource: ${formatBytes(warm.totalKnownResourceBytes)}`,
    `- Cold violations: ${cold.violations.length}`,
    `- Warm violations: ${warm.violations.length}`,
    "",
    "## 2. Cold vs Warm",
    markdownTable(
      ["Metric", "Cold", "Warm"],
      [
        ["Total requests", formatCount(cold.totalRequests), formatCount(warm.totalRequests)],
        ["Known transfer", formatBytes(cold.totalKnownTransferBytes), formatBytes(warm.totalKnownTransferBytes)],
        ["Known resource", formatBytes(cold.totalKnownResourceBytes), formatBytes(warm.totalKnownResourceBytes)],
        ["Image resource", formatBytes(cold.imageKnownResourceBytes), formatBytes(warm.imageKnownResourceBytes)],
        ["Supabase Storage resource", formatBytes(cold.supabaseStorageKnownResourceBytes), formatBytes(warm.supabaseStorageKnownResourceBytes)],
        ["Repeated network downloads", formatCount(cold.repeatedDownloadsBetweenColdAndWarm?.count ?? 0), formatCount(warm.repeatedDownloadsBetweenColdAndWarm?.count ?? 0)],
      ],
    ),
    "",
    "## 3. Variant Breakdown",
    "### Cold",
    markdownTable(["Variant", "Requests", "Resource", "Transfer"], coldVariantRows),
    "",
    "### Warm",
    markdownTable(["Variant", "Requests", "Resource", "Transfer"], warmVariantRows),
    "",
    "## 4. Route/Phase Breakdown Table",
    "> `detail-total` is a rollup over all requests attributed to detail pages. `static` groups static assets by category so the page-flow phases stay readable.",
    markdownTable(
      [
        "Phase",
        "Requests",
        "Transfer",
        "Resource",
        "Unknown transfer",
        "Images",
        "Image resource",
        "Supabase storage",
        "Storage resource",
        "JS",
        "JS resource",
        "CSS",
        "CSS resource",
        "Fonts",
        "Font resource",
        "Tiles",
        "Tile resource",
        "Weather",
        "Weather resource",
        "External",
        "External resource",
      ],
      phaseRows,
    ),
    "",
    "## 5. Top Expensive Detail Pages",
    "### Cold",
    markdownTable(
      ["Lake", "Slug", "Requests", "Transfer", "Resource", "Image resource", "Medium", "Thumb", "Scheme loaded", "Weather requests"],
      coldTopDetailPages.map((page) => [
        page.lakeUrl,
        page.lakeSlug,
        formatCount(page.requestsCount),
        formatBytes(page.knownTransferBytes),
        formatBytes(page.knownResourceBytes),
        formatBytes(page.imageResourceBytes),
        formatCount(page.mediumCount),
        formatCount(page.thumbCount),
        page.schemeImageLoaded ? "yes" : "no",
        formatCount(page.weatherRequestsCount),
      ]),
    ),
    "",
    "### Warm",
    markdownTable(
      ["Lake", "Slug", "Requests", "Transfer", "Resource", "Image resource", "Medium", "Thumb", "Scheme loaded", "Weather requests"],
      warmTopDetailPages.map((page) => [
        page.lakeUrl,
        page.lakeSlug,
        formatCount(page.requestsCount),
        formatBytes(page.knownTransferBytes),
        formatBytes(page.knownResourceBytes),
        formatBytes(page.imageResourceBytes),
        formatCount(page.mediumCount),
        formatCount(page.thumbCount),
        page.schemeImageLoaded ? "yes" : "no",
        formatCount(page.weatherRequestsCount),
      ]),
    ),
    "",
    "## 6. Top Offenders by Category",
    markdownTable(["Category", "Requests", "Resource", "Top offender", "Top offender bytes"], topOffenderRows),
    "",
    "## 7. Violations/regressions",
    violationRows.length ? markdownTable(["Violation", "Count"], violationRows) : "- None",
    "",
    "## 8. Recommendations generated from detected data",
    ...recommendationLines(report).map((line) => `- ${line}`),
    "",
  ].join("\n");
}

function writeMarkdownReport(report) {
  const markdown = buildMarkdownReport(report);
  const markdownPath = path.join(TMP_DIR, `traffic-audit-${LABEL}.md`);
  fs.writeFileSync(markdownPath, markdown);
  return markdownPath;
}

async function main() {
  const startedAt = new Date().toISOString();
  console.log(
    `Traffic audit started: label=${LABEL} baseUrl=${BASE_URL} headed=${HEADED ? "1" : "0"} protectionBypass=${VERCEL_AUTOMATION_BYPASS_SECRET ? "enabled" : "disabled"}`,
  );
  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    extraHTTPHeaders: VERCEL_AUTOMATION_BYPASS_SECRET
      ? { "x-vercel-protection-bypass": VERCEL_AUTOMATION_BYPASS_SECRET }
      : undefined,
  });
  const page = await context.newPage();

  try {
    attachPageCollectors(page, "cold");
    const coldScenario = await runScenario(page, "cold");

    page.removeAllListeners("request");
    page.removeAllListeners("response");
    page.removeAllListeners("requestfailed");
    attachPageCollectors(page, "warm");
    const warmScenario = await runScenario(page, "warm");

    const coldRecords = records.filter((record) => record.run === "cold");
    const warmRecords = records.filter((record) => record.run === "warm");
    mergePerformance(coldRecords, performanceEntries.filter((entry) => entry.run === "cold"));
    mergePerformance(warmRecords, performanceEntries.filter((entry) => entry.run === "warm"));

    const coldDetailPageBreakdown = buildDetailPageBreakdown(coldRecords);
    const warmDetailPageBreakdown = buildDetailPageBreakdown(warmRecords);
    const coldSummary = summarize(coldRecords, coldDetailPageBreakdown, coldScenario.detailPagesVisited ?? 0);
    const warmSummary = summarize(warmRecords, warmDetailPageBreakdown, warmScenario.detailPagesVisited ?? 0);
    const repeated = repeatedDownloads(coldRecords, warmRecords);
    coldSummary.repeatedDownloadsBetweenColdAndWarm = { count: 0, knownTransferBytes: 0, knownResourceBytes: 0, unknownTransferBytesRequestCount: 0, knownBytes: 0, top20: [] };
    warmSummary.repeatedDownloadsBetweenColdAndWarm = repeated;
    const coldDetailPagesVisited = coldScenario.detailPagesVisited ?? 0;
    const warmDetailPagesVisited = warmScenario.detailPagesVisited ?? 0;
    const totalDetailPagesVisited = coldDetailPagesVisited + warmDetailPagesVisited;
    const totalSupabaseRequests = coldSummary.supabaseRequests + warmSummary.supabaseRequests;
    const totalSupabaseStorageRequests = coldSummary.supabaseStorageRequests + warmSummary.supabaseStorageRequests;
    const valid = !(totalDetailPagesVisited === 0 && totalSupabaseRequests === 0 && totalSupabaseStorageRequests === 0);
    const invalidReason = valid
      ? null
      : "No lake detail pages visited and no Supabase requests detected. Likely Vercel Deployment Protection page or catalog not loaded.";

    const report = {
      label: LABEL,
      baseUrl: BASE_URL,
      startedAt,
      finishedAt: new Date().toISOString(),
      valid,
      invalidReason,
      coldDetailPagesVisited,
      warmDetailPagesVisited,
      totalDetailPagesVisited,
      supabaseRequests: totalSupabaseRequests,
      supabaseStorageRequests: totalSupabaseStorageRequests,
      thresholds: {
        hugeImageBytes: IMAGE_HUGE_THRESHOLD_BYTES,
        mapInitialImageRequests: 5,
      },
      scenarios: {
        cold: coldScenario,
        warm: warmScenario,
      },
      runs: {
        cold: {
          summary: coldSummary,
          requests: coldRecords,
          detailPageBreakdown: coldDetailPageBreakdown,
          detailPagesVisited: coldDetailPagesVisited,
        },
        warm: {
          summary: warmSummary,
          requests: warmRecords,
          detailPageBreakdown: warmDetailPageBreakdown,
          detailPagesVisited: warmDetailPagesVisited,
        },
      },
      performanceEntries,
    };
    if (TRAFFIC_AUDIT_MARKDOWN) {
      report.markdownPath = writeMarkdownReport(report);
    }

    const labelPath = path.join(TMP_DIR, `traffic-audit-${LABEL}.json`);
    const latestPath = path.join(TMP_DIR, "traffic-audit-latest.json");
    fs.writeFileSync(labelPath, JSON.stringify(report, null, 2));
    fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));

    console.log(`Traffic audit written: ${labelPath}`);
    console.log(`Latest copy written: ${latestPath}`);
    if (report.markdownPath) {
      console.log(`Markdown report written: ${report.markdownPath}`);
    }
    console.log(`Cold transfer known: ${mb(coldSummary.totalKnownTransferBytes)}, resource known: ${mb(coldSummary.totalKnownResourceBytes)}, unknown transfer requests: ${coldSummary.unknownTransferBytesRequestCount}`);
    console.log(`Cold images transfer/resource: ${mb(coldSummary.imageKnownTransferBytes)} / ${mb(coldSummary.imageKnownResourceBytes)}, storage transfer/resource: ${mb(coldSummary.supabaseStorageKnownTransferBytes)} / ${mb(coldSummary.supabaseStorageKnownResourceBytes)}`);
    console.log(`Warm transfer known: ${mb(warmSummary.totalKnownTransferBytes)}, resource known: ${mb(warmSummary.totalKnownResourceBytes)}, unknown transfer requests: ${warmSummary.unknownTransferBytesRequestCount}`);
    console.log(`Warm images transfer/resource: ${mb(warmSummary.imageKnownTransferBytes)} / ${mb(warmSummary.imageKnownResourceBytes)}, storage transfer/resource: ${mb(warmSummary.supabaseStorageKnownTransferBytes)} / ${mb(warmSummary.supabaseStorageKnownResourceBytes)}`);
    console.log(`Warm repeated network downloads: ${repeated.count}, known transfer ${mb(repeated.knownTransferBytes)}, unknown transfer requests ${repeated.unknownTransferBytesRequestCount}`);
    console.log(`Violations: cold=${coldSummary.violations.length}, warm=${warmSummary.violations.length}`);

    if (!valid) {
      process.exitCode = 2;
    }
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
