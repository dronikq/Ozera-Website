#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

const REPORT_PATH = path.join(process.cwd(), "tmp", "scheme_image_webp_migration_report.json");
const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "lake-images";
const DEFAULT_QUALITY = 88;
const DEFAULT_MAX_WIDTH = 1600;
const SUPPORTED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
]);

const args = parseArgs(process.argv.slice(2));
const apply = args.apply;
const limit = parseOptionalPositiveInt(args.limit);
const maxWidth = parseOptionalPositiveInt(args.maxWidth) ?? DEFAULT_MAX_WIDTH;
const quality = parseOptionalPositiveInt(args.quality) ?? DEFAULT_QUALITY;
const force = args.force;
const lakeId = args.lakeId;

const supabaseUrl = process.env.SUPABASE_URL?.trim() || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const result = {
    apply: false,
    force: false,
    limit: null,
    lakeId: null,
    quality: null,
    maxWidth: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--apply") {
      result.apply = true;
      continue;
    }
    if (arg === "--force") {
      result.force = true;
      continue;
    }

    const [flag, inlineValue] = arg.split("=", 2);
    const readValue = () => {
      if (inlineValue != null) return inlineValue;
      const next = argv[i + 1];
      if (next == null || next.startsWith("--")) return null;
      i += 1;
      return next;
    };

    if (flag === "--limit") {
      result.limit = readValue();
      continue;
    }
    if (flag === "--lake-id") {
      result.lakeId = readValue();
      continue;
    }
    if (flag === "--quality") {
      result.quality = readValue();
      continue;
    }
    if (flag === "--max-width") {
      result.maxWidth = readValue();
      continue;
    }
  }

  return result;
}

function parseOptionalPositiveInt(value) {
  if (value == null) return null;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function assertUuid(value, label) {
  if (!value) return null;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(value)) {
    fail(`Invalid ${label}: expected UUID`);
  }
  return value;
}

function normalizeContentType(value) {
  return `${value || ""}`.split(";")[0].trim().toLowerCase();
}

function isSupabaseUrl(rawUrl) {
  try {
    return new URL(rawUrl).hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
}

function isAlreadyOptimizedSchemeUrl(rawUrl) {
  if (!rawUrl) return false;
  try {
    const url = new URL(rawUrl);
    if (!isSupabaseUrl(rawUrl)) return false;
    const pathname = url.pathname.toLowerCase();
    const search = url.searchParams;
    return (
      (pathname.includes("/storage/v1/object/public/") && pathname.endsWith(".webp")) ||
      (pathname.includes("/storage/v1/render/image/") && `${search.get("format") || ""}`.toLowerCase() === "webp")
    );
  } catch {
    return false;
  }
}

function getSourceHost(rawUrl) {
  try {
    return new URL(rawUrl).hostname;
  } catch {
    return "";
  }
}

function getFileExtension(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const cleanPath = url.pathname.toLowerCase();
    if (cleanPath.endsWith(".jpeg")) return "jpeg";
    if (cleanPath.endsWith(".jpg")) return "jpg";
    if (cleanPath.endsWith(".png")) return "png";
    if (cleanPath.endsWith(".webp")) return "webp";
    if (cleanPath.endsWith(".avif")) return "avif";
    if (cleanPath.endsWith(".gif")) return "gif";
  } catch {
    // Ignore malformed URLs here; the caller will handle them.
  }
  return "";
}

function detectSourceFormat(rawUrl, contentType) {
  const normalizedType = normalizeContentType(contentType);
  if (normalizedType) {
    return SUPPORTED_CONTENT_TYPES.has(normalizedType) ? normalizedType : "unsupported";
  }

  const ext = getFileExtension(rawUrl);
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "avif") return "image/avif";
  if (ext === "gif") return "image/gif";
  return "";
}

function buildPublicUrl(bucket, objectPath) {
  const encodedPath = objectPath.split("/").map((segment) => encodeURIComponent(segment)).join("/");
  return new URL(`/storage/v1/object/public/${bucket}/${encodedPath}`, supabaseUrl).toString();
}

function buildObjectPath(lakeIdValue, hash) {
  return `lakes/${lakeIdValue}/scheme/${hash}.webp`;
}

async function fetchSourceImage(rawUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  try {
    const response = await fetch(rawUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "OzeraSchemeWebPMigration/1.0",
        accept: "image/*,*/*;q=0.8",
      },
    });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponseBuffer(response) {
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function convertToWebp(buffer) {
  let image = sharp(buffer, { failOnError: true });
  const metadata = await image.metadata();
  if (typeof metadata.width === "number" && metadata.width > maxWidth) {
    image = image.resize({ width: maxWidth, withoutEnlargement: true });
  }

  return image.webp({
    quality,
    alphaQuality: quality,
    effort: 6,
    smartSubsample: true,
  }).toBuffer();
}

function hashWebpBuffer(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex").slice(0, 32);
}

function buildReportItem({
  lakeId: itemLakeId,
  lakeName,
  oldUrl,
  newUrl = null,
  host,
  contentType = null,
  oldBytes = null,
  newBytes = null,
  action,
  reason = null,
  error = null,
  regression = false,
}) {
  const savingsBytes = typeof oldBytes === "number" && typeof newBytes === "number" ? oldBytes - newBytes : null;
  const savingsPercent =
    typeof oldBytes === "number" && oldBytes > 0 && typeof newBytes === "number"
      ? ((oldBytes - newBytes) / oldBytes) * 100
      : null;

  return {
    lakeId: itemLakeId,
    lakeName,
    oldUrl,
    newUrl,
    host,
    contentType,
    oldBytes,
    newBytes,
    savingsBytes,
    savingsPercent,
    action,
    reason,
    error,
    regression,
  };
}

async function main() {
  if (!supabaseUrl) fail("Missing required env var: SUPABASE_URL");
  if (!serviceRoleKey) fail("Missing required env var: SUPABASE_SERVICE_ROLE_KEY");

  assertUuid(lakeId, "--lake-id");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  let query = supabase.from("lakes").select("id, name, scheme_image_url").order("name", { ascending: true });
  if (lakeId) query = query.eq("id", lakeId);
  if (limit != null) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    fail(`Failed to load lakes: ${error.message}`);
  }

  const lakes = Array.isArray(data) ? data : [];
  const totalLakes = lakes.length;
  const lakesWithScheme = lakes.filter((lake) => `${lake.scheme_image_url || ""}`.trim().length > 0).length;
  const items = [];

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let candidateCount = 0;
  let oldBytesTotal = 0;
  let newBytesTotal = 0;

  for (const lake of lakes) {
    const oldUrl = `${lake.scheme_image_url || ""}`.trim();
    const host = oldUrl ? getSourceHost(oldUrl) : "";
    const lakeName = lake.name || lake.id;

    if (!oldUrl) {
      continue;
    }

    if (isAlreadyOptimizedSchemeUrl(oldUrl)) {
      skipped += 1;
      items.push(
        buildReportItem({
          lakeId: lake.id,
          lakeName,
          oldUrl,
          host,
          action: "skipped",
          reason: "already_optimized_supabase_webp",
        }),
      );
      continue;
    }

    candidateCount += 1;

    let response;
    try {
      response = await fetchSourceImage(oldUrl);
    } catch (fetchError) {
      failed += 1;
      items.push(
        buildReportItem({
          lakeId: lake.id,
          lakeName,
          oldUrl,
          host,
          action: "failed",
          error: `unreachable: ${fetchError?.message || "fetch failed"}`,
        }),
      );
      continue;
    }

    if (!response.ok) {
      failed += 1;
      items.push(
        buildReportItem({
          lakeId: lake.id,
          lakeName,
          oldUrl,
          host,
          action: "failed",
          error: `unreachable: HTTP ${response.status} ${response.statusText}`.trim(),
        }),
      );
      continue;
    }

    const sourceType = detectSourceFormat(oldUrl, response.headers.get("content-type"));
    if (!sourceType || sourceType === "unsupported") {
      skipped += 1;
      if (response.body) await response.body.cancel().catch(() => {});
      items.push(
        buildReportItem({
          lakeId: lake.id,
          lakeName,
          oldUrl,
          host,
          contentType: response.headers.get("content-type"),
          action: "skipped",
          reason: "unsupported_content_type",
        }),
      );
      continue;
    }

    let sourceBuffer;
    try {
      sourceBuffer = await readResponseBuffer(response);
    } catch (readError) {
      failed += 1;
      items.push(
        buildReportItem({
          lakeId: lake.id,
          lakeName,
          oldUrl,
          host,
          contentType: response.headers.get("content-type"),
          action: "failed",
          error: `download_failed: ${readError?.message || "unable to read response body"}`,
        }),
      );
      continue;
    }

    let webpBuffer;
    try {
      webpBuffer = await convertToWebp(sourceBuffer);
    } catch (convertError) {
      failed += 1;
      items.push(
        buildReportItem({
          lakeId: lake.id,
          lakeName,
          oldUrl,
          host,
          contentType: response.headers.get("content-type"),
          oldBytes: sourceBuffer.length,
          action: "failed",
          error: `convert_failed: ${convertError?.message || "sharp conversion failed"}`,
        }),
      );
      continue;
    }

    const oldBytes = sourceBuffer.length;
    const newBytes = webpBuffer.length;
    const regression = oldBytes > 0 && newBytes > oldBytes * 1.05;
    const objectHash = hashWebpBuffer(webpBuffer);
    const objectPath = buildObjectPath(lake.id, objectHash);
    const newUrl = buildPublicUrl(DEFAULT_BUCKET, objectPath);
    const itemBase = {
      lakeId: lake.id,
      lakeName,
      oldUrl,
      newUrl,
      host,
      contentType: response.headers.get("content-type"),
      oldBytes,
      newBytes,
      regression,
    };

    processed += 1;
    oldBytesTotal += oldBytes;
    newBytesTotal += newBytes;

    if (regression && !force) {
      skipped += 1;
      items.push(
        buildReportItem({
          ...itemBase,
          action: "skipped",
          reason: "webp_regression_over_5_percent",
        }),
      );
      continue;
    }

    if (!apply) {
      items.push(
        buildReportItem({
          ...itemBase,
          action: "would_update",
        }),
      );
      continue;
    }

    const uploadResult = await supabase.storage.from(DEFAULT_BUCKET).upload(objectPath, webpBuffer, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });

    let uploadedNewObject = false;
    if (uploadResult.error) {
      const message = uploadResult.error.message || "storage upload failed";
      const alreadyExists = /already exists|resource already exists|duplicate/i.test(message);
      if (!alreadyExists) {
        failed += 1;
        items.push(
          buildReportItem({
            ...itemBase,
            action: "failed",
            error: `upload_failed: ${message}`,
          }),
        );
        continue;
      }
    } else {
      uploadedNewObject = true;
    }

    const updateResult = await supabase
      .from("lakes")
      .update({ scheme_image_url: newUrl })
      .eq("id", lake.id)
      .select("id")
      .maybeSingle();

    if (updateResult.error || !updateResult.data) {
      if (uploadedNewObject) {
        await supabase.storage.from(DEFAULT_BUCKET).remove([objectPath]).catch(() => {});
      }
      failed += 1;
      items.push(
        buildReportItem({
          ...itemBase,
          action: "failed",
          error: `db_update_failed: ${updateResult.error?.message || "no row updated"}`,
        }),
      );
      continue;
    }

    updated += 1;
    items.push(
      buildReportItem({
        ...itemBase,
        action: "updated",
      }),
    );
  }

  const itemSummaries = items.map((item) => ({
    lakeId: item.lakeId,
    lakeName: item.lakeName,
    oldUrl: item.oldUrl,
    newUrl: item.newUrl,
    host: item.host,
    contentType: item.contentType,
    oldBytes: item.oldBytes,
    newBytes: item.newBytes,
    savingsBytes: item.savingsBytes,
    savingsPercent: item.savingsPercent,
    action: item.action,
    reason: item.reason,
    error: item.error,
  }));

  const regressions = itemSummaries.filter((item) => typeof item.savingsBytes === "number" && item.savingsBytes < 0);
  const topSavings = itemSummaries
    .filter((item) => typeof item.savingsBytes === "number" && item.savingsBytes > 0)
    .sort((a, b) => (b.savingsBytes || 0) - (a.savingsBytes || 0))
    .slice(0, 10);

  const report = {
    generatedAt: new Date().toISOString(),
    apply,
    totalLakes,
    lakesWithScheme,
    candidates: candidateCount,
    skipped,
    processed,
    updated,
    failed,
    oldBytes: oldBytesTotal,
    newBytes: newBytesTotal,
    savingsBytes: oldBytesTotal - newBytesTotal,
    savingsPercent: oldBytesTotal > 0 ? ((oldBytesTotal - newBytesTotal) / oldBytesTotal) * 100 : null,
    items: itemSummaries,
    topSavings,
    regressions,
    defaults: {
      bucket: DEFAULT_BUCKET,
      quality,
      maxWidth,
      force,
    },
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(`Scheme image WebP migration report written: ${REPORT_PATH}`);
  console.log(`apply=${apply ? "1" : "0"} totalLakes=${totalLakes} lakesWithScheme=${lakesWithScheme} candidates=${candidateCount}`);
  console.log(`processed=${processed} updated=${updated} skipped=${skipped} failed=${failed}`);
  console.log(`oldBytes=${oldBytesTotal} newBytes=${newBytesTotal} savingsBytes=${oldBytesTotal - newBytesTotal}`);

  if (apply && failed > 0) {
    process.exitCode = 2;
  }
}

main().catch((error) => {
  console.error(error?.message || error);
  process.exit(1);
});
