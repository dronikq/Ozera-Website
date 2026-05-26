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
const TRAFFIC_AUDIT_DEBUG = envFlag("TRAFFIC_AUDIT_DEBUG");
const TRAFFIC_AUDIT_PHASE_TIMEOUT_MS = envMs("TRAFFIC_AUDIT_PHASE_TIMEOUT_MS", 45000);
const TRAFFIC_AUDIT_NAV_TIMEOUT_MS = envMs("TRAFFIC_AUDIT_NAV_TIMEOUT_MS", 60000);
const WAIT_SHORT_MS = 1200;
const WAIT_WEATHER_MS = 1800;
const MAX_DETAIL_PAGES = Number.parseInt(process.env.TRAFFIC_AUDIT_DETAIL_LIMIT || "0", 10);
const TRAFFIC_AUDIT_MARKDOWN = process.env.TRAFFIC_AUDIT_MARKDOWN === "1";
const TRAFFIC_AUDIT_SKIP_MAP = envFlag("TRAFFIC_AUDIT_SKIP_MAP");
const TRAFFIC_AUDIT_SKIP_DETAILS = envFlag("TRAFFIC_AUDIT_SKIP_DETAILS");
const TRAFFIC_AUDIT_SKIP_GALLERY = envFlag("TRAFFIC_AUDIT_SKIP_GALLERY");
const TRAFFIC_AUDIT_SKIP_WARM = envFlag("TRAFFIC_AUDIT_SKIP_WARM");
const TRAFFIC_AUDIT_SKIP_WEATHER_WAIT = envFlag("TRAFFIC_AUDIT_SKIP_WEATHER_WAIT");
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
const auditState = {
  startedAt: null,
  finishedAt: null,
  completedPhases: [],
  warnings: [],
  scenarioProgress: {
    cold: createScenarioProgress("cold"),
    warm: createScenarioProgress("warm"),
  },
  currentScenario: null,
  currentStep: null,
  currentDetail: null,
  browser: null,
  context: null,
  page: null,
  failureFinalized: false,
  partialReportPath: null,
};

function sanitizeLabel(value) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-|-$/g, "") || "latest";
}

function envFlag(name, fallback = false) {
  const raw = process.env[name];
  if (raw == null) return fallback;
  return raw === "1" || raw.toLowerCase() === "true";
}

function envMs(name, fallbackMs) {
  const raw = process.env[name];
  if (!raw) return fallbackMs;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallbackMs;
  return parsed;
}

function envMb(name, fallbackMb) {
  const raw = process.env[name];
  if (!raw) return fallbackMb * 1024 * 1024;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return fallbackMb * 1024 * 1024;
  return parsed * 1024 * 1024;
}

function createScenarioProgress(name) {
  return {
    name,
    status: "pending",
    startedAt: null,
    finishedAt: null,
    currentPhase: null,
    currentDetail: null,
    detailLinksFound: 0,
    detailLinksPlanned: 0,
    detailPagesVisited: 0,
    completedPhases: [],
    warnings: [],
    skipped: false,
  };
}

function debugLog(message) {
  if (!TRAFFIC_AUDIT_DEBUG) return;
  console.log(`[traffic-audit] ${message}`);
}

function pushWarning(message, extra = {}) {
  const warning = {
    message,
    phase: currentPhase,
    scenario: auditState.currentScenario,
    ...extra,
  };
  auditState.warnings.push(warning);
  const scenario = auditState.scenarioProgress[auditState.currentScenario];
  if (scenario) scenario.warnings.push(warning);
  return warning;
}

function markPhaseComplete(phaseName, scenarioName) {
  auditState.completedPhases.push({
    scenario: scenarioName,
    phase: phaseName,
    completedAt: new Date().toISOString(),
  });
  const scenario = auditState.scenarioProgress[scenarioName];
  if (scenario) scenario.completedPhases.push(phaseName);
}

function countRecordsForPhase(runName, phaseName) {
  return records.filter((record) => record.run === runName && record.phase === phaseName).length;
}

function countRecordsForPhases(runName, phaseNames) {
  return records.filter((record) => record.run === runName && phaseNames.includes(record.phase)).length;
}

function countRecordsForDetail(runName, detailSlug, detailIndex) {
  return records.filter(
    (record) =>
      record.run === runName &&
      record.detailPageSlug === detailSlug &&
      record.detailPageIndex === detailIndex,
  ).length;
}

function collectScenarioProgressSnapshot(name) {
  const scenario = auditState.scenarioProgress[name];
  if (!scenario) return null;
  return {
    ...scenario,
    completedPhases: [...scenario.completedPhases],
    warnings: [...scenario.warnings],
  };
}

function buildPartialReport(error) {
  const coldRecords = records.filter((record) => record.run === "cold");
  const warmRecords = records.filter((record) => record.run === "warm");
  const coldDetailPageBreakdown = buildDetailPageBreakdown(coldRecords);
  const warmDetailPageBreakdown = buildDetailPageBreakdown(warmRecords);
  const coldSummary = summarize(coldRecords, coldDetailPageBreakdown, auditState.scenarioProgress.cold.detailPagesVisited ?? 0);
  const warmSummary = summarize(warmRecords, warmDetailPageBreakdown, auditState.scenarioProgress.warm.detailPagesVisited ?? 0);
  const repeated = repeatedDownloads(coldRecords, warmRecords);
  coldSummary.repeatedDownloadsBetweenColdAndWarm = { count: 0, knownTransferBytes: 0, knownResourceBytes: 0, unknownTransferBytesRequestCount: 0, knownBytes: 0, top20: [] };
  warmSummary.repeatedDownloadsBetweenColdAndWarm = repeated;

  const completedPhases = [...auditState.completedPhases];
  return {
    label: LABEL,
    baseUrl: BASE_URL,
    startedAt: auditState.startedAt,
    finishedAt: new Date().toISOString(),
    partial: true,
    error: {
      name: error?.name ?? "Error",
      message: error?.message ?? "Audit interrupted",
      stack: error?.stack ?? null,
    },
    currentPhase,
    currentScenario: auditState.currentScenario,
    currentStep: auditState.currentStep,
    completedPhases,
    warnings: [...auditState.warnings],
    scenarioProgress: {
      cold: collectScenarioProgressSnapshot("cold"),
      warm: collectScenarioProgressSnapshot("warm"),
    },
    coldDetailPagesVisited: auditState.scenarioProgress.cold.detailPagesVisited ?? 0,
    warmDetailPagesVisited: auditState.scenarioProgress.warm.detailPagesVisited ?? 0,
    totalDetailPagesVisited:
      (auditState.scenarioProgress.cold.detailPagesVisited ?? 0) + (auditState.scenarioProgress.warm.detailPagesVisited ?? 0),
    supabaseRequests: coldSummary.supabaseRequests + warmSummary.supabaseRequests,
    supabaseStorageRequests: coldSummary.supabaseStorageRequests + warmSummary.supabaseStorageRequests,
    thresholds: {
      hugeImageBytes: IMAGE_HUGE_THRESHOLD_BYTES,
      mapInitialImageRequests: 5,
    },
    runs: {
      cold: {
        summary: coldSummary,
        requests: coldRecords,
        detailPageBreakdown: coldDetailPageBreakdown,
        detailPagesVisited: auditState.scenarioProgress.cold.detailPagesVisited ?? 0,
      },
      warm: {
        summary: warmSummary,
        requests: warmRecords,
        detailPageBreakdown: warmDetailPageBreakdown,
        detailPagesVisited: auditState.scenarioProgress.warm.detailPagesVisited ?? 0,
      },
    },
    performanceEntries,
  };
}

async function writeJsonReport(report, suffix = "") {
  const suffixPart = suffix ? `-${suffix}` : "";
  const labelPath = path.join(TMP_DIR, `traffic-audit-${LABEL}${suffixPart}.json`);
  fs.writeFileSync(labelPath, JSON.stringify(report, null, 2));
  if (!suffix) {
    const latestPath = path.join(TMP_DIR, "traffic-audit-latest.json");
    fs.writeFileSync(latestPath, JSON.stringify(report, null, 2));
    return { labelPath, latestPath };
  }
  return { labelPath, latestPath: null };
}

async function finalizeFailure(error, exitCode = 1) {
  if (auditState.failureFinalized) return;
  auditState.failureFinalized = true;
  auditState.finishedAt = new Date().toISOString();

  const partialReport = buildPartialReport(error);
  try {
    debugLog("audit: partial report write start");
    const { labelPath } = await writeJsonReport(partialReport, "partial");
    auditState.partialReportPath = labelPath;
    console.error(`Partial traffic audit written: ${labelPath}`);
    debugLog("audit: partial report write done");
  } catch (writeError) {
    console.error("Failed to write partial traffic audit report:", writeError);
  }

  try {
    await auditState.page?.close().catch(() => {});
    await auditState.context?.close().catch(() => {});
    await auditState.browser?.close().catch(() => {});
  } catch {
    // Ignore cleanup failures while unwinding from a fatal error or signal.
  }

  if (error) {
    console.error(error);
  }

  process.exit(exitCode);
}

function registerSignalHandlers() {
  const onSignal = (signalName) => {
    void finalizeFailure(new Error(`Received ${signalName}`), 130);
  };

  process.once("SIGINT", () => onSignal("SIGINT"));
  process.once("SIGTERM", () => onSignal("SIGTERM"));
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

function isSchemeRequest(rawUrl, decodedUrl) {
  const checkUrl = `${rawUrl} ${decodedUrl}`;
  return /\bscheme\b/i.test(checkUrl) || /\/scheme[\-_/.?]/i.test(checkUrl) || /scheme\.(png|jpe?g|webp|avif|gif)$/i.test(checkUrl);
}

function isImageContentType(contentType = "") {
  return `${contentType || ""}`.toLowerCase().startsWith("image/");
}

function isSuccessfulStatus(status) {
  return Number.isInteger(status) && status >= 200 && status < 300;
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

function isJpegLike(url, contentType = "") {
  const normalizedContentType = `${contentType || ""}`.toLowerCase();
  if (normalizedContentType.includes("image/jpeg") || normalizedContentType.includes("image/jpg")) return true;
  try {
    return /\.jpe?g($|[?#])/i.test(new URL(url, BASE_URL).pathname);
  } catch {
    return /\.jpe?g($|[?#])/i.test(url);
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

function classify(rawUrl, resourceType, responseHeaders = {}, status = null, routeGroupParam = currentRouteGroup, phaseParam = currentPhase) {
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
  const isSchemeSuccessfulResponse = isSuccessfulStatus(status);
  const isSchemeImageResponse = isSchemeImage && isImageContentType(schemeContentType);
  const isSchemeFailed = isSchemeImage && (!isSchemeSuccessfulResponse || !isSchemeImageResponse);
  const isSchemeFormatCandidate = isSchemeImage && isSchemeSuccessfulResponse && isSchemeImageResponse;
  const isSchemeWebp = isSchemeFormatCandidate && (isWebpLike(rawUrl, schemeContentType) || isWebpLike(decoded, schemeContentType));
  const isSchemePng = isSchemeFormatCandidate && (isPngLike(rawUrl, schemeContentType) || isPngLike(decoded, schemeContentType));
  const isSchemeJpeg = isSchemeFormatCandidate && (isJpegLike(rawUrl, schemeContentType) || isJpegLike(decoded, schemeContentType));

  let imageVariant = "unknown";
  let lakeImageClass = null;
  if (imageLike || isSupabaseStorage || isNextImageOptimizer) {
    const checkUrl = `${rawUrl} ${decoded}`;
    const isWebp = isWebpLike(rawUrl, contentType) || isWebpLike(decoded, contentType);
    if (checkUrl.includes("/original/")) {
      imageVariant = "original";
      lakeImageClass = "lake_original";
    } else if (checkUrl.includes("/medium/")) {
      imageVariant = "medium";
      lakeImageClass = isWebp ? "lake_medium_webp" : "lake_medium_legacy";
    } else if (checkUrl.includes("/thumb/")) {
      imageVariant = "thumb";
      lakeImageClass = isWebp ? "lake_thumb_webp" : "lake_thumb_legacy";
    } else if (isSameOrigin && /placeholder|ozera_splash|icon\.png/i.test(url.pathname)) {
      imageVariant = "placeholder";
      lakeImageClass = "lake_placeholder";
    } else if (isSupabaseStorage && imageLike && !isSchemeImage) {
      imageVariant = "legacy";
      lakeImageClass = "lake_legacy_image_url";
    }
  }
  if (isSchemeImage) imageVariant = "unknown";

  let offenderCategory = lakeImageClass || "unknown_external";
  if (isSchemeImage) {
    if (isSchemeWebp) offenderCategory = "scheme_webp";
    else if (isSupabaseStorage || isSameOrigin) offenderCategory = "scheme_legacy";
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
    isSchemeFailed,
    imageVariant,
    lakeImageClass,
    category: offenderCategory,
    schemeKind: isSchemeWebp ? "webp" : isSchemePng ? "png" : isSchemeJpeg ? "jpeg" : null,
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
    const flags = classify(record.url, record.resourceType, selectedHeaders(headers), response.status(), record.routeGroup, record.phase);
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
      isSchemeFailed: flags.isSchemeFailed,
    };
    record.imageVariant = flags.imageVariant;
    record.category = flags.category;
    record.schemeKind = flags.schemeKind;
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

function phaseTimedOut(error) {
  return `${error?.message || ""}`.includes("Phase timeout");
}

async function waitForKnownSelectors(page, selectors = [], timeout = TRAFFIC_AUDIT_PHASE_TIMEOUT_MS) {
  const filtered = selectors.filter(Boolean);
  if (!filtered.length) return false;

  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const selector of filtered) {
      const visible = await page.locator(selector).first().isVisible().catch(() => false);
      if (visible) return true;
    }
    await page.waitForTimeout(250);
  }
  return false;
}

async function settlePage(page, { selectors = [], timeout = TRAFFIC_AUDIT_PHASE_TIMEOUT_MS, settleMs = WAIT_SHORT_MS } = {}) {
  await page.waitForLoadState("domcontentloaded", { timeout }).catch(() => {});
  await waitForKnownSelectors(page, selectors, timeout).catch(() => {});
  await page.waitForTimeout(settleMs);
  await collectPerformance(page, page.__trafficRunName);
}

async function goto(page, urlPath, routeGroup, phase = routeGroup, options = {}) {
  currentRouteGroup = routeGroup;
  currentPhase = phase;
  await page.goto(new URL(urlPath, BASE_URL).toString(), {
    waitUntil: "domcontentloaded",
    timeout: options.timeout ?? TRAFFIC_AUDIT_NAV_TIMEOUT_MS,
  });
  await settlePage(page, {
    selectors: options.selectors ?? [],
    timeout: options.timeout ?? TRAFFIC_AUDIT_PHASE_TIMEOUT_MS,
    settleMs: options.settleMs ?? WAIT_SHORT_MS,
  });
}

async function runPhase({ scenarioName, phaseName, phaseLabel, critical = true, timeoutMs = TRAFFIC_AUDIT_PHASE_TIMEOUT_MS, doneMessage = null }, fn) {
  auditState.currentScenario = scenarioName;
  auditState.currentStep = phaseName;
  currentPhase = phaseName;
  currentRouteGroup = phaseToRouteGroup(phaseName);

  const scenario = auditState.scenarioProgress[scenarioName];
  if (scenario) scenario.currentPhase = phaseName;

  debugLog(`${scenarioName}: ${phaseLabel} start`);

  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Phase timeout after ${timeoutMs}ms: ${scenarioName}:${phaseLabel}`));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([Promise.resolve().then(fn), timeoutPromise]);
    markPhaseComplete(phaseName, scenarioName);
    if (doneMessage) {
      debugLog(`${scenarioName}: ${phaseLabel} done ${doneMessage(result)}`);
    } else {
      debugLog(`${scenarioName}: ${phaseLabel} done`);
    }
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    const isTimeout = phaseTimedOut(error);
    if (isTimeout) {
      const warning = pushWarning(`${scenarioName}:${phaseLabel} timed out after ${timeoutMs}ms`, {
        phaseName,
        phaseLabel,
        timeoutMs,
      });
      debugLog(`${scenarioName}: ${phaseLabel} timeout after ${timeoutMs}ms`);
      if (critical) {
        const fatal = new Error(warning.message);
        fatal.cause = error;
        throw fatal;
      }
      return null;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
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
  const limited = MAX_DETAIL_PAGES > 0 ? filtered.slice(0, MAX_DETAIL_PAGES) : filtered;
  return {
    allLinks: filtered,
    links: limited,
  };
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
  await waitForKnownSelectors(page, ['[role="dialog"][aria-label="Схема озера"]', 'button[aria-label="Закрити схему озера"]'], TRAFFIC_AUDIT_PHASE_TIMEOUT_MS);
  await page.waitForTimeout(1200);
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
  await waitForKnownSelectors(page, [".dk-map-overlay", ".leaflet-container"], TRAFFIC_AUDIT_PHASE_TIMEOUT_MS);
  await page.waitForTimeout(2000);
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
    await goto(page, link, "seo", "privacy-terms", {
      selectors: ["main", "h1", "article"],
      timeout: TRAFFIC_AUDIT_NAV_TIMEOUT_MS,
    });
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
  const scenario = auditState.scenarioProgress[runName];
  scenario.status = "running";
  scenario.startedAt = new Date().toISOString();
  scenario.skipped = false;
  scenario.detailPagesVisited = 0;
  scenario.detailLinksFound = 0;
  scenario.detailLinksPlanned = 0;
  currentDetailPageIndex = 0;
  currentDetailPageSlug = null;

  try {
    await runPhase(
      {
        scenarioName: runName,
        phaseName: "home",
        phaseLabel: "home",
        critical: true,
        doneMessage: () => `requests=${countRecordsForPhase(runName, "home")}`,
      },
      async () => {
        await goto(page, "/", "home", "home", {
          selectors: ["main", "h1"],
          timeout: TRAFFIC_AUDIT_NAV_TIMEOUT_MS,
        });
      },
    );

    await runPhase(
      {
        scenarioName: runName,
        phaseName: "catalog-initial",
        phaseLabel: "catalog",
        critical: true,
        doneMessage: () => `requests=${countRecordsForPhase(runName, "catalog-initial")}`,
      },
      async () => {
        await goto(page, "/lakes", "catalog", "catalog-initial", {
          selectors: [".dk-lakes-grid", ".dk-empty", "h1"],
          timeout: TRAFFIC_AUDIT_NAV_TIMEOUT_MS,
        });
      },
    );

    await runPhase(
      {
        scenarioName: runName,
        phaseName: "catalog-scroll",
        phaseLabel: "catalog scroll",
        critical: true,
        doneMessage: () => `requests=${countRecordsForPhase(runName, "catalog-scroll")}`,
      },
      async () => {
        await scrollToEnd(page);
      },
    );

    const { allLinks, links: detailLinks } = await getDetailLinks(page);
    scenario.detailLinksFound = allLinks.length;
    scenario.detailLinksPlanned = detailLinks.length;
    debugLog(`${runName}: catalog links found=${allLinks.length}${MAX_DETAIL_PAGES > 0 ? ` limited=${detailLinks.length}` : ""}`);

    if (!TRAFFIC_AUDIT_SKIP_DETAILS) {
      for (let i = 0; i < detailLinks.length; i += 1) {
        const link = detailLinks[i];
        const detailPath = new URL(link, BASE_URL).pathname;
        const detailIndex = i + 1;
        scenario.currentDetail = {
          index: detailIndex,
          total: detailLinks.length,
          path: detailPath,
        };
        currentDetailPageSlug = detailPath;
        currentDetailPageIndex = detailIndex;

        await runPhase(
          {
            scenarioName: runName,
            phaseName: "detail-page",
            phaseLabel: `detail ${detailIndex}/${detailLinks.length} ${detailPath}`,
            critical: true,
            doneMessage: () => `requests=${countRecordsForDetail(runName, detailPath, detailIndex)}`,
          },
          async () => {
            await goto(page, link, "detail", "detail-page", {
              selectors: ["h1", ".dk-gallery-main-wrap", ".dk-info-card"],
              timeout: TRAFFIC_AUDIT_NAV_TIMEOUT_MS,
            });

            if (!TRAFFIC_AUDIT_SKIP_WEATHER_WAIT) {
              await runPhase(
                {
                  scenarioName: runName,
                  phaseName: "detail-weather",
                  phaseLabel: `detail ${detailIndex}/${detailLinks.length} weather wait`,
                  critical: false,
                  doneMessage: () => `requests=${countRecordsForDetail(runName, detailPath, detailIndex)}`,
                },
                async () => {
                  currentPhase = "detail-weather";
                  await page.waitForTimeout(WAIT_WEATHER_MS);
                  await collectPerformance(page, page.__trafficRunName);
                },
              );
            } else if (TRAFFIC_AUDIT_DEBUG) {
              debugLog(`${runName}: detail ${detailIndex}/${detailLinks.length} weather wait skipped`);
            }

            if (!TRAFFIC_AUDIT_SKIP_GALLERY) {
              await runPhase(
                {
                  scenarioName: runName,
                  phaseName: "detail-gallery",
                  phaseLabel: `detail ${detailIndex}/${detailLinks.length} gallery`,
                  critical: false,
                  doneMessage: () => `requests=${countRecordsForDetail(runName, detailPath, detailIndex)}`,
                },
                async () => {
                  currentPhase = "detail-gallery";
                  await clickGalleryThumbs(page);
                },
              );
            } else if (TRAFFIC_AUDIT_DEBUG) {
              debugLog(`${runName}: detail ${detailIndex}/${detailLinks.length} gallery skipped`);
            }

            await runPhase(
              {
                scenarioName: runName,
                phaseName: "detail-scheme",
                phaseLabel: `detail ${detailIndex}/${detailLinks.length} scheme`,
                critical: false,
                doneMessage: () => `requests=${countRecordsForDetail(runName, detailPath, detailIndex)}`,
              },
              async () => {
                currentPhase = "detail-scheme";
                await openSchemeViewer(page);
              },
            );
          },
        );

        scenario.detailPagesVisited += 1;
        scenario.currentDetail = null;
        currentDetailPageSlug = null;
      }
    } else if (TRAFFIC_AUDIT_DEBUG) {
      debugLog(`${runName}: detail phase skipped`);
    }

    await runPhase(
      {
        scenarioName: runName,
        phaseName: "catalog-return",
        phaseLabel: "catalog return",
        critical: true,
        doneMessage: () => `requests=${countRecordsForPhase(runName, "catalog-return")}`,
      },
      async () => {
        await goto(page, "/lakes", "catalog", "catalog-return", {
          selectors: [".dk-lakes-grid", ".dk-empty", "h1"],
          timeout: TRAFFIC_AUDIT_NAV_TIMEOUT_MS,
        });
      },
    );

    if (!TRAFFIC_AUDIT_SKIP_MAP) {
      await runPhase(
        {
          scenarioName: runName,
          phaseName: "map-open",
          phaseLabel: "map",
          critical: false,
          doneMessage: () => `requests=${countRecordsForPhases(runName, ["map-open", "map-popup"])}`,
        },
        async () => {
          await openMapAndMaybePopups(page);
        },
      );
    } else if (TRAFFIC_AUDIT_DEBUG) {
      debugLog(`${runName}: map skipped`);
    }

    await runPhase(
      {
        scenarioName: runName,
        phaseName: "privacy-terms",
        phaseLabel: "privacy terms",
        critical: false,
        doneMessage: () => `requests=${countRecordsForPhase(runName, "privacy-terms")}`,
      },
      async () => {
        await visitSeoLinks(page);
      },
    );

    scenario.status = "done";
    scenario.finishedAt = new Date().toISOString();
    return { detailPagesVisited: scenario.detailPagesVisited };
  } catch (error) {
    scenario.status = "failed";
    scenario.finishedAt = new Date().toISOString();
    throw error;
  }
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
  const schemeWebpRecords = phaseRecords.filter((record) => record.category === "scheme_webp");
  const schemeLegacyRecords = phaseRecords.filter((record) => record.category === "scheme_legacy");
  const schemeExternalRecords = phaseRecords.filter((record) => record.category === "scheme_external");
  const schemePngRecords = phaseRecords.filter((record) => record.schemeKind === "png");
  const schemeJpegRecords = phaseRecords.filter((record) => record.schemeKind === "jpeg");
  const schemeFailedRecords = phaseRecords.filter((record) => record.flags.isSchemeFailed);
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
    schemeWebpRequests: schemeWebpRecords.length,
    schemeWebpKnownResourceBytes: sum(schemeWebpRecords, () => true),
    schemeLegacyRequests: schemeLegacyRecords.length,
    schemeLegacyKnownResourceBytes: sum(schemeLegacyRecords, () => true),
    schemeExternalRequests: schemeExternalRecords.length,
    schemeExternalKnownResourceBytes: sum(schemeExternalRecords, () => true),
    schemePngRequests: schemePngRecords.length,
    schemePngKnownResourceBytes: sum(schemePngRecords, () => true),
    schemeJpegRequests: schemeJpegRecords.length,
    schemeJpegKnownResourceBytes: sum(schemeJpegRecords, () => true),
    schemeFailedRequests: schemeFailedRecords.length,
    schemeFailedKnownResourceBytes: sum(schemeFailedRecords, () => true),
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

function schemeRecommendationForRecord(record) {
  if (record.category === "scheme_failed") {
    return "Scheme URL failed to load in public UI. Replace with a reachable WebP storage asset or clear the broken scheme_image_url in APP/data.";
  }
  if (record.category === "scheme_external" && record.schemeKind === "jpeg") {
    return "External JPEG scheme detected. Replace with a WebP storage upload from APP/admin or during data migration.";
  }
  if (record.category === "scheme_external") {
    return "External scheme URL detected. Replace with a storage WebP asset if one exists; otherwise clean up the lake scheme source in APP/data.";
  }
  if (record.category === "scheme_legacy") {
    return "Legacy scheme storage path detected. Migrate the lake scheme to the WebP storage pipeline.";
  }
  if (record.category === "scheme_png" || record.category === "scheme_jpeg") {
    return "Non-WebP scheme detected. Re-upload/convert the scheme asset to WebP in APP/admin or via migration.";
  }
  return "Review the scheme source in APP/data and prefer the storage WebP asset.";
}

function collectSchemeDataOffenders(recordsForRun) {
  const offenders = [];
  for (const record of recordsForRun) {
    const isSchemeRelated =
      record.category === "scheme_external" ||
      record.category === "scheme_legacy" ||
      record.category === "scheme_png" ||
      record.category === "scheme_jpeg" ||
      record.flags.isSchemeFailed;

    if (!isSchemeRelated) continue;

    const lakeUrl = record.detailPageSlug ?? null;
    offenders.push({
      lakeUrl,
      lakeSlug: lakeUrl ? slugFromLakePath(lakeUrl) : null,
      url: record.url,
      status: record.status,
      contentType: record.responseHeaders?.["content-type"] ?? null,
      category: record.category,
      schemeKind: record.schemeKind ?? null,
      type: record.flags.isSchemeFailed ? "scheme_failed" : record.category,
      recommendation: schemeRecommendationForRecord(record),
    });
  }

  const seen = new Set();
  return offenders.filter((item) => {
    const key = `${item.lakeUrl}|${item.url}|${item.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
    if (record.category === "lake_original") {
      violations.push({ type: "original_path_loaded", url: record.url, routeGroup: record.routeGroup, phase: record.phase, knownTransferBytes: record.knownTransferBytes, knownResourceBytes: record.knownResourceBytes, bytes: record.knownResourceBytes });
    }
    if (record.category === "lake_legacy_image_url") {
      violations.push({ type: "legacy_lake_image_loaded", url: record.url, routeGroup: record.routeGroup, phase: record.phase, knownTransferBytes: record.knownTransferBytes, knownResourceBytes: record.knownResourceBytes, bytes: record.knownResourceBytes });
    }
    if (record.category === "lake_thumb_legacy" || record.category === "lake_medium_legacy") {
      violations.push({ type: "legacy_lake_variant_loaded", url: record.url, routeGroup: record.routeGroup, phase: record.phase, knownTransferBytes: record.knownTransferBytes, knownResourceBytes: record.knownResourceBytes, bytes: record.knownResourceBytes });
    }
    if (record.category === "lake_legacy_image_url" && ["home", "catalog", "detail", "map"].includes(record.routeGroup)) {
      violations.push({ type: "public_ui_loaded_lake_image_without_variant", url: record.url, routeGroup: record.routeGroup, phase: record.phase, knownTransferBytes: record.knownTransferBytes, knownResourceBytes: record.knownResourceBytes, bytes: record.knownResourceBytes });
    }
    if (record.category === "lake_medium_webp" && ["home", "catalog", "map"].includes(record.routeGroup)) {
      violations.push({ type: "catalog_should_use_thumb_variant", url: record.url, routeGroup: record.routeGroup, phase: record.phase, knownTransferBytes: record.knownTransferBytes, knownResourceBytes: record.knownResourceBytes, bytes: record.knownResourceBytes });
    }
    if (record.category === "lake_thumb_webp" && record.routeGroup === "detail" && ["detail-page", "detail-gallery"].includes(record.phase)) {
      violations.push({ type: "detail_should_use_medium_variant", url: record.url, routeGroup: record.routeGroup, phase: record.phase, knownTransferBytes: record.knownTransferBytes, knownResourceBytes: record.knownResourceBytes, bytes: record.knownResourceBytes });
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
    if (record.category === "lake_thumb_webp" || record.category === "lake_thumb_legacy" || record.category === "lake_medium_webp" || record.category === "lake_medium_legacy" || record.category === "lake_original" || record.category === "lake_legacy_image_url" || record.category === "lake_placeholder") {
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
    const schemePngCount = count(recordsForRun, (record) => record.schemeKind === "png");
    const schemeJpegCount = count(recordsForRun, (record) => record.schemeKind === "jpeg");
    const schemeFailedCount = count(recordsForRun, (record) => record.flags.isSchemeFailed);
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
    if (schemeJpegCount > 0) {
      violations.push({
        type: "scheme_jpeg_requires_webp",
        count: schemeJpegCount,
      });
    }
    if (schemeFailedCount > 0) {
      violations.push({
        type: "scheme_failed_requires_webp",
        count: schemeFailedCount,
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
    schemeWebpRequests: count(recordsForRun, (record) => record.category === "scheme_webp"),
    schemeWebpKnownResourceBytes: sum(recordsForRun, (record) => record.category === "scheme_webp"),
    schemeLegacyRequests: count(recordsForRun, (record) => record.category === "scheme_legacy"),
    schemeLegacyKnownResourceBytes: sum(recordsForRun, (record) => record.category === "scheme_legacy"),
    schemeExternalRequests: count(recordsForRun, (record) => record.category === "scheme_external"),
    schemeExternalKnownResourceBytes: sum(recordsForRun, (record) => record.category === "scheme_external"),
    schemePngRequests: count(recordsForRun, (record) => record.schemeKind === "png"),
    schemePngKnownResourceBytes: sum(recordsForRun, (record) => record.schemeKind === "png"),
    schemeJpegRequests: count(recordsForRun, (record) => record.schemeKind === "jpeg"),
    schemeJpegKnownResourceBytes: sum(recordsForRun, (record) => record.schemeKind === "jpeg"),
    schemeFailedRequests: count(recordsForRun, (record) => record.flags.isSchemeFailed),
    schemeFailedKnownResourceBytes: sum(recordsForRun, (record) => record.flags.isSchemeFailed),
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
    top20LakeThumbWebp: topByCategory(recordsForRun, ["lake_thumb_webp"]),
    top20LakeThumbLegacy: topByCategory(recordsForRun, ["lake_thumb_legacy"]),
    top20LakeMediumWebp: topByCategory(recordsForRun, ["lake_medium_webp"]),
    top20LakeMediumLegacy: topByCategory(recordsForRun, ["lake_medium_legacy"]),
    top20LakeOriginal: topByCategory(recordsForRun, ["lake_original"]),
    top20LakeLegacyImageUrl: topByCategory(recordsForRun, ["lake_legacy_image_url"]),
    top20SchemeImages: topByCategory(recordsForRun, ["scheme_external", "scheme_webp", "scheme_legacy", "scheme_png", "scheme_jpeg"]),
    top20SchemeWebp: top(recordsForRun, (record) => record.schemeKind === "webp"),
    top20SchemeLegacy: topByCategory(recordsForRun, ["scheme_legacy"]),
    top20SchemeExternal: topByCategory(recordsForRun, ["scheme_external"]),
    top20SchemePng: top(recordsForRun, (record) => record.schemeKind === "png"),
    top20SchemeJpeg: top(recordsForRun, (record) => record.schemeKind === "jpeg"),
    top20SchemeFailed: top(recordsForRun, (record) => record.flags.isSchemeFailed),
    schemeDataOffenders: collectSchemeDataOffenders(recordsForRun),
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
    top20LakeThumbWebp: "lake_thumb_webp",
    top20LakeThumbLegacy: "lake_thumb_legacy",
    top20LakeMediumWebp: "lake_medium_webp",
    top20LakeMediumLegacy: "lake_medium_legacy",
    top20LakeOriginal: "lake_original",
    top20LakeLegacyImageUrl: "lake_legacy_image_url",
    top20SchemeImages: "scheme_images",
    top20SchemeWebp: "scheme_webp",
    top20SchemeLegacy: "scheme_legacy",
    top20SchemeExternal: "scheme_external",
    top20SchemePng: "scheme_png",
    top20SchemeJpeg: "scheme_jpeg",
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
  const topSchemeLegacy = (cold.top20SchemeLegacy ?? []).slice(0, 3);
  const topSchemeExternal = (cold.top20SchemeExternal ?? []).slice(0, 3);
  const topSchemePng = (cold.top20SchemePng ?? []).slice(0, 3);
  const topSchemeJpeg = (cold.top20SchemeJpeg ?? []).slice(0, 3);
  const topSchemeFailed = (cold.top20SchemeFailed ?? []).slice(0, 3);
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

  const schemeLegacyBytes = sumArray((cold.top20SchemeLegacy ?? []).map((item) => item.knownResourceBytes));
  if (schemeLegacyBytes > 0) {
    const schemeLegacyTop = topSchemeLegacy
      .map((item) => `${topOffenderLabel(item)} (${formatBytes(item.knownResourceBytes)})`)
      .join(", ");
    lines.push(`Scheme legacy remaining: ${formatBytes(schemeLegacyBytes)} across ${schemeLegacyTop || "n/a"}.`);
  }

  const schemeExternalBytes = sumArray((cold.top20SchemeExternal ?? []).map((item) => item.knownResourceBytes));
  if (schemeExternalBytes > 0) {
    const schemeExternalTop = topSchemeExternal
      .map((item) => `${topOffenderLabel(item)} (${formatBytes(item.knownResourceBytes)})`)
      .join(", ");
    lines.push(`Scheme external remaining: ${formatBytes(schemeExternalBytes)} across ${schemeExternalTop || "n/a"}.`);
  }

  const schemeFormatBytes = sumArray([
    ...(cold.top20SchemePng ?? []).map((item) => item.knownResourceBytes),
    ...(cold.top20SchemeJpeg ?? []).map((item) => item.knownResourceBytes),
  ]);
  if (schemeFormatBytes > 0) {
    const schemeFormatTop = [...topSchemePng, ...topSchemeJpeg]
      .map((item) => `${topOffenderLabel(item)} (${formatBytes(item.knownResourceBytes)})`)
      .join(", ");
    lines.push(`Scheme PNG/JPG remaining: ${formatBytes(schemeFormatBytes)} across ${schemeFormatTop || "n/a"}.`);
  }

  const schemeFailedBytes = sumArray((cold.top20SchemeFailed ?? []).map((item) => item.knownResourceBytes));
  if (schemeFailedBytes > 0) {
    const schemeFailedTop = topSchemeFailed
      .map((item) => `${topOffenderLabel(item)} (${formatBytes(item.knownResourceBytes)})`)
      .join(", ");
    lines.push(`Scheme failed/unreachable: ${formatBytes(schemeFailedBytes)} across ${schemeFailedTop || "n/a"}.`);
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
    "top20LakeThumbWebp",
    "top20LakeThumbLegacy",
    "top20LakeMediumWebp",
    "top20LakeMediumLegacy",
    "top20LakeOriginal",
    "top20LakeLegacyImageUrl",
    "top20SchemeImages",
    "top20SchemeWebp",
    "top20SchemeLegacy",
    "top20SchemeExternal",
    "top20SchemePng",
    "top20SchemeJpeg",
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
  const schemeDataOffenderRows = (cold.schemeDataOffenders ?? []).map((item) => [
    item.lakeSlug || "n/a",
    item.lakeUrl || "n/a",
    item.type || "n/a",
    item.status ?? "n/a",
    item.contentType || "n/a",
    item.url,
    item.recommendation,
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
        ["Scheme WebP", `${formatCount(cold.schemeWebpRequests)} / ${formatBytes(cold.schemeWebpKnownResourceBytes)}`, `${formatCount(warm.schemeWebpRequests)} / ${formatBytes(warm.schemeWebpKnownResourceBytes)}`],
        ["Scheme legacy", `${formatCount(cold.schemeLegacyRequests)} / ${formatBytes(cold.schemeLegacyKnownResourceBytes)}`, `${formatCount(warm.schemeLegacyRequests)} / ${formatBytes(warm.schemeLegacyKnownResourceBytes)}`],
        ["Scheme external remaining", `${formatCount(cold.schemeExternalRequests)} / ${formatBytes(cold.schemeExternalKnownResourceBytes)}`, `${formatCount(warm.schemeExternalRequests)} / ${formatBytes(warm.schemeExternalKnownResourceBytes)}`],
        ["Scheme PNG remaining", `${formatCount(cold.schemePngRequests)} / ${formatBytes(cold.schemePngKnownResourceBytes)}`, `${formatCount(warm.schemePngRequests)} / ${formatBytes(warm.schemePngKnownResourceBytes)}`],
        ["Scheme JPG remaining", `${formatCount(cold.schemeJpegRequests)} / ${formatBytes(cold.schemeJpegKnownResourceBytes)}`, `${formatCount(warm.schemeJpegRequests)} / ${formatBytes(warm.schemeJpegKnownResourceBytes)}`],
        ["Scheme failed", `${formatCount(cold.schemeFailedRequests)} / ${formatBytes(cold.schemeFailedKnownResourceBytes)}`, `${formatCount(warm.schemeFailedRequests)} / ${formatBytes(warm.schemeFailedKnownResourceBytes)}`],
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
    "## 4. Scheme Breakdown",
    markdownTable(
      ["Metric", "Cold", "Warm"],
      [
        ["Scheme WebP requests", formatCount(cold.schemeWebpRequests), formatCount(warm.schemeWebpRequests)],
        ["Scheme WebP resource", formatBytes(cold.schemeWebpKnownResourceBytes), formatBytes(warm.schemeWebpKnownResourceBytes)],
        ["Scheme legacy requests", formatCount(cold.schemeLegacyRequests), formatCount(warm.schemeLegacyRequests)],
        ["Scheme legacy resource", formatBytes(cold.schemeLegacyKnownResourceBytes), formatBytes(warm.schemeLegacyKnownResourceBytes)],
        ["Scheme external requests", formatCount(cold.schemeExternalRequests), formatCount(warm.schemeExternalRequests)],
        ["Scheme external resource", formatBytes(cold.schemeExternalKnownResourceBytes), formatBytes(warm.schemeExternalKnownResourceBytes)],
        ["Scheme PNG requests", formatCount(cold.schemePngRequests), formatCount(warm.schemePngRequests)],
        ["Scheme PNG resource", formatBytes(cold.schemePngKnownResourceBytes), formatBytes(warm.schemePngKnownResourceBytes)],
        ["Scheme JPG requests", formatCount(cold.schemeJpegRequests), formatCount(warm.schemeJpegRequests)],
        ["Scheme JPG resource", formatBytes(cold.schemeJpegKnownResourceBytes), formatBytes(warm.schemeJpegKnownResourceBytes)],
        ["Scheme failed requests", formatCount(cold.schemeFailedRequests), formatCount(warm.schemeFailedRequests)],
        ["Scheme failed resource", formatBytes(cold.schemeFailedKnownResourceBytes), formatBytes(warm.schemeFailedKnownResourceBytes)],
      ],
    ),
    "",
    "## 5. Scheme Data Offenders",
    schemeDataOffenderRows.length
      ? markdownTable(
          ["Slug", "Page", "Type", "Status", "Content-Type", "URL", "Recommendation"],
          schemeDataOffenderRows,
        )
      : "_No scheme data offenders detected._",
    "",
    "## 6. Route/Phase Breakdown Table",
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
    "## 7. Top Expensive Detail Pages",
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
    "## 8. Top Offenders by Category",
    markdownTable(["Category", "Requests", "Resource", "Top offender", "Top offender bytes"], topOffenderRows),
    "",
    "## 9. Top Remaining Scheme Offenders",
    markdownTable(
      ["Bucket", "Requests", "Resource", "Top offender", "Top offender bytes"],
      buildTopOffenderTable(cold, ["top20SchemeExternal", "top20SchemePng", "top20SchemeJpeg", "top20SchemeFailed"]),
    ),
    "",
    "## 10. Violations/regressions",
    violationRows.length ? markdownTable(["Violation", "Count"], violationRows) : "- None",
    "",
    "## 11. Recommendations generated from detected data",
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
  auditState.startedAt = new Date().toISOString();
  console.log(
    `Traffic audit started: label=${LABEL} baseUrl=${BASE_URL} headed=${HEADED ? "1" : "0"} protectionBypass=${VERCEL_AUTOMATION_BYPASS_SECRET ? "enabled" : "disabled"}`,
  );
  registerSignalHandlers();

  auditState.browser = await chromium.launch({ headless: !HEADED });
  auditState.context = await auditState.browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    extraHTTPHeaders: VERCEL_AUTOMATION_BYPASS_SECRET
      ? { "x-vercel-protection-bypass": VERCEL_AUTOMATION_BYPASS_SECRET }
      : undefined,
  });
  auditState.page = await auditState.context.newPage();

  try {
    attachPageCollectors(auditState.page, "cold");
    const coldScenario = await runScenario(auditState.page, "cold");

    let warmScenario = { detailPagesVisited: 0 };
    if (!TRAFFIC_AUDIT_SKIP_WARM) {
      auditState.page.removeAllListeners("request");
      auditState.page.removeAllListeners("response");
      auditState.page.removeAllListeners("requestfailed");
      attachPageCollectors(auditState.page, "warm");
      warmScenario = await runScenario(auditState.page, "warm");
    } else {
      auditState.scenarioProgress.warm.status = "skipped";
      auditState.scenarioProgress.warm.skipped = true;
      auditState.scenarioProgress.warm.startedAt = new Date().toISOString();
      auditState.scenarioProgress.warm.finishedAt = new Date().toISOString();
      debugLog("warm: skipped");
    }

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
    const auditTruncated =
      TRAFFIC_AUDIT_SKIP_MAP ||
      TRAFFIC_AUDIT_SKIP_DETAILS ||
      TRAFFIC_AUDIT_SKIP_GALLERY ||
      TRAFFIC_AUDIT_SKIP_WARM ||
      TRAFFIC_AUDIT_SKIP_WEATHER_WAIT;
    const valid = auditTruncated || !(totalDetailPagesVisited === 0 && totalSupabaseRequests === 0 && totalSupabaseStorageRequests === 0);
    const invalidReason = valid
      ? null
      : "No lake detail pages visited and no Supabase requests detected. Likely Vercel Deployment Protection page or catalog not loaded.";

    const report = {
      label: LABEL,
      baseUrl: BASE_URL,
      startedAt: auditState.startedAt,
      finishedAt: new Date().toISOString(),
      valid,
      invalidReason,
      partial: false,
      coldDetailPagesVisited,
      warmDetailPagesVisited,
      totalDetailPagesVisited,
      supabaseRequests: totalSupabaseRequests,
      supabaseStorageRequests: totalSupabaseStorageRequests,
      thresholds: {
        hugeImageBytes: IMAGE_HUGE_THRESHOLD_BYTES,
        mapInitialImageRequests: 5,
      },
      skips: {
        map: TRAFFIC_AUDIT_SKIP_MAP,
        details: TRAFFIC_AUDIT_SKIP_DETAILS,
        gallery: TRAFFIC_AUDIT_SKIP_GALLERY,
        warm: TRAFFIC_AUDIT_SKIP_WARM,
        weatherWait: TRAFFIC_AUDIT_SKIP_WEATHER_WAIT,
      },
      scenarios: {
        cold: collectScenarioProgressSnapshot("cold"),
        warm: collectScenarioProgressSnapshot("warm"),
      },
      completedPhases: [...auditState.completedPhases],
      warnings: [...auditState.warnings],
      scenarioProgress: {
        cold: collectScenarioProgressSnapshot("cold"),
        warm: collectScenarioProgressSnapshot("warm"),
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

    debugLog("audit: report write start");
    if (TRAFFIC_AUDIT_MARKDOWN) {
      report.markdownPath = writeMarkdownReport(report);
    }

    const { labelPath, latestPath } = await writeJsonReport(report);
    debugLog("audit: report write done");

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

    auditState.finishedAt = new Date().toISOString();
    if (!valid) {
      process.exitCode = 2;
    }
  } catch (error) {
    await finalizeFailure(error, 1);
    return;
  } finally {
    if (!auditState.failureFinalized) {
      await auditState.page?.close().catch(() => {});
      await auditState.context?.close().catch(() => {});
      await auditState.browser?.close().catch(() => {});
    }
  }
}

main().catch((error) => {
  void finalizeFailure(error, 1);
});
