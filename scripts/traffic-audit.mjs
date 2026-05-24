import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const BASE_URL = process.env.TRAFFIC_AUDIT_BASE_URL || "http://localhost:3000";
const LABEL = sanitizeLabel(process.env.TRAFFIC_AUDIT_LABEL || "latest");
const HEADED = process.argv.includes("--headed") || process.env.TRAFFIC_AUDIT_HEADED === "1";
const TMP_DIR = path.join(process.cwd(), "tmp");
const IMAGE_HUGE_THRESHOLD_BYTES = 1024 * 1024;
const WAIT_SHORT_MS = 1200;
const WAIT_WEATHER_MS = 1800;
const MAX_DETAIL_PAGES = Number.parseInt(process.env.TRAFFIC_AUDIT_DETAIL_LIMIT || "0", 10);

fs.mkdirSync(TMP_DIR, { recursive: true });

const base = new URL(BASE_URL);
const records = [];
const performanceEntries = [];
const requestIds = new WeakMap();
let requestSeq = 0;
let currentRouteGroup = "unknown";
let currentPhase = "idle";

function sanitizeLabel(value) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "latest";
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

function routeGroupFromPhase(routeGroup, phase) {
  const phaseValue = `${phase || ""}`.toLowerCase();
  if (phaseValue.startsWith("detail-gallery")) return "gallery";
  if (phaseValue.startsWith("scheme")) return "scheme";
  if (phaseValue.startsWith("map")) return "map";
  if (routeGroup === "map") return "map";
  if (routeGroup === "weather") return "weather";
  return routeGroup;
}

function isImageByHeadersOrType(record) {
  const type = record.responseHeaders?.["content-type"] || "";
  return record.resourceType === "image" || type.startsWith("image/");
}

function classify(rawUrl, resourceType, responseHeaders = {}, routeGroupParam = currentRouteGroup) {
  const decoded = getDecodedUrl(rawUrl);
  const checkUrl = `${rawUrl} ${decoded}`;
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
  const isStaticAsset =
    (isSameOrigin && (url.pathname.startsWith("/_next/static/") || /\.(css|js|svg|png|jpg|jpeg|webp|ico|json|txt|woff2?)$/i.test(url.pathname))) ||
    resourceType === "font" ||
    resourceType === "stylesheet" ||
    resourceType === "script";

  const contentType = responseHeaders["content-type"] || "";
  const imageLike = resourceType === "image" || contentType.startsWith("image/") || isNextImageOptimizer;
  const isExternalImage = imageLike && !isSameOrigin && !isSupabaseStorage && !isTileProvider;

  let imageVariant = "unknown";
  if (imageLike || isSupabaseStorage || isNextImageOptimizer) {
    if (checkUrl.includes("/original/")) imageVariant = "original";
    else if (checkUrl.includes("/medium/")) imageVariant = "medium";
    else if (checkUrl.includes("/thumb/")) imageVariant = "thumb";
    else if (isSameOrigin && /placeholder|ozera_splash|icon\.png/i.test(url.pathname)) imageVariant = "placeholder";
    else if (isSupabaseStorage && imageLike) imageVariant = "legacy";
  }

  const routeGroupFromUrl = (() => {
    if (isWeatherApi) return "weather";
    if (isTileProvider) return "map";
    if (isStaticAsset) return "static";
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
  const routeGroup = routeGroupFromPhase(routeGroupFromUrl, currentPhase);

  return {
    isSupabase,
    isSupabaseStorage,
    isSupabaseRest,
    isNextImageOptimizer,
    isExternalImage,
    isTileProvider,
    isWeatherApi,
    isStaticAsset,
    imageVariant,
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
    };
    records.push(record);
    requestIds.set(request, id);
  });

  page.on("response", (response) => {
    const request = response.request();
    const record = records.find((item) => item.id === requestIds.get(request));
    if (!record) return;
    const headers = response.headers();
    const flags = classify(record.url, record.resourceType, selectedHeaders(headers), record.routeGroup);
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
    };
    record.imageVariant = flags.imageVariant;
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
  currentPhase = "scheme-open";
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
  currentPhase = "map-initial";
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
  currentPhase = "seo-discovery";
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
    await goto(page, link, "seo", "seo");
  }
}

async function runScenario(page, runName) {
  page.__trafficRunName = runName;

  await goto(page, "/", "home", "home");
  await goto(page, "/lakes", "catalog", "catalog");
  await scrollToEnd(page);
  const detailLinks = await getDetailLinks(page);

  for (const link of detailLinks) {
    await goto(page, link, "detail", "detail");
    await page.waitForTimeout(WAIT_WEATHER_MS);
    await collectPerformance(page, runName);
    await clickGalleryThumbs(page);
    await openSchemeViewer(page);
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
      knownTransferBytes: record.knownTransferBytes,
      knownResourceBytes: record.knownResourceBytes,
      bytes: transferBytes(record),
      contentType: record.responseHeaders["content-type"],
      cacheControl: record.responseHeaders["cache-control"],
      imageVariant: record.imageVariant,
    }));
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

function collectViolations(recordsForRun) {
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
  }

  const mapInitialImages = recordsForRun.filter(
    (record) =>
      record.phase === "map-initial" &&
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

  return violations;
}

function summarize(recordsForRun) {
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
    externalImageRequests: count(recordsForRun, (record) => record.flags.isExternalImage),
    externalImageKnownTransferBytes: sumTransfer(recordsForRun, (record) => record.flags.isExternalImage),
    externalImageKnownResourceBytes: sum(recordsForRun, (record) => record.flags.isExternalImage),
    externalImageKnownBytes: sum(recordsForRun, (record) => record.flags.isExternalImage),
    tileRequests: count(recordsForRun, (record) => record.flags.isTileProvider),
    tileKnownTransferBytes: sumTransfer(recordsForRun, (record) => record.flags.isTileProvider),
    tileKnownResourceBytes: sum(recordsForRun, (record) => record.flags.isTileProvider),
    tileKnownBytes: sum(recordsForRun, (record) => record.flags.isTileProvider),
    weatherRequests: count(recordsForRun, (record) => record.flags.isWeatherApi),
    weatherKnownTransferBytes: sumTransfer(recordsForRun, (record) => record.flags.isWeatherApi),
    weatherKnownResourceBytes: sum(recordsForRun, (record) => record.flags.isWeatherApi),
    weatherKnownBytes: sum(recordsForRun, (record) => record.flags.isWeatherApi),
    routeGroupBreakdown: groupBy(recordsForRun, (record) => record.routeGroup ?? "unknown"),
    phaseBreakdown: groupBy(recordsForRun, (record) => record.phase ?? "unknown"),
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
    violations: collectViolations(recordsForRun),
  };
  return summary;
}

function mb(value) {
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
}

async function main() {
  const startedAt = new Date().toISOString();
  const browser = await chromium.launch({ headless: !HEADED });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
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

    const coldSummary = summarize(coldRecords);
    const warmSummary = summarize(warmRecords);
    const repeated = repeatedDownloads(coldRecords, warmRecords);
    coldSummary.repeatedDownloadsBetweenColdAndWarm = { count: 0, knownTransferBytes: 0, knownResourceBytes: 0, unknownTransferBytesRequestCount: 0, knownBytes: 0, top20: [] };
    warmSummary.repeatedDownloadsBetweenColdAndWarm = repeated;

    const report = {
      label: LABEL,
      baseUrl: BASE_URL,
      startedAt,
      finishedAt: new Date().toISOString(),
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
        },
        warm: {
          summary: warmSummary,
          requests: warmRecords,
        },
      },
      performanceEntries,
    };

    const labelPath = path.join(TMP_DIR, `traffic-audit-${LABEL}.json`);
    const latestPath = path.join(TMP_DIR, "traffic-audit-latest.json");
    fs.writeFileSync(labelPath, JSON.stringify(report, null, 2));
    fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));

    console.log(`Traffic audit written: ${labelPath}`);
    console.log(`Latest copy written: ${latestPath}`);
    console.log(`Cold transfer known: ${mb(coldSummary.totalKnownTransferBytes)}, resource known: ${mb(coldSummary.totalKnownResourceBytes)}, unknown transfer requests: ${coldSummary.unknownTransferBytesRequestCount}`);
    console.log(`Cold images transfer/resource: ${mb(coldSummary.imageKnownTransferBytes)} / ${mb(coldSummary.imageKnownResourceBytes)}, storage transfer/resource: ${mb(coldSummary.supabaseStorageKnownTransferBytes)} / ${mb(coldSummary.supabaseStorageKnownResourceBytes)}`);
    console.log(`Warm transfer known: ${mb(warmSummary.totalKnownTransferBytes)}, resource known: ${mb(warmSummary.totalKnownResourceBytes)}, unknown transfer requests: ${warmSummary.unknownTransferBytesRequestCount}`);
    console.log(`Warm images transfer/resource: ${mb(warmSummary.imageKnownTransferBytes)} / ${mb(warmSummary.imageKnownResourceBytes)}, storage transfer/resource: ${mb(warmSummary.supabaseStorageKnownTransferBytes)} / ${mb(warmSummary.supabaseStorageKnownResourceBytes)}`);
    console.log(`Warm repeated network downloads: ${repeated.count}, known transfer ${mb(repeated.knownTransferBytes)}, unknown transfer requests ${repeated.unknownTransferBytesRequestCount}`);
    console.log(`Violations: cold=${coldSummary.violations.length}, warm=${warmSummary.violations.length}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
