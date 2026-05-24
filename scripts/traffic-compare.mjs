import fs from "node:fs";
import path from "node:path";

const [beforePath, afterPath] = process.argv.slice(2);

if (!beforePath || !afterPath) {
  console.error("Usage: npm run traffic:compare -- tmp/traffic-audit-before.json tmp/traffic-audit-after.json");
  process.exit(1);
}

const before = readJson(beforePath);
const after = readJson(afterPath);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8"));
}

function numberOrNull(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function metric(summary, key, fallbackKey = null) {
  const value = numberOrNull(summary?.[key]);
  if (value != null) return value;
  return fallbackKey ? numberOrNull(summary?.[fallbackKey]) ?? 0 : 0;
}

function transferMetric(summary, key) {
  return numberOrNull(summary?.[key]);
}

function variant(summary, name) {
  return summary?.variantBreakdown?.[name] ?? { count: 0, bytes: 0 };
}

function delta(beforeValue, afterValue) {
  const saved = beforeValue - afterValue;
  const percentReduction = beforeValue > 0 ? (saved / beforeValue) * 100 : 0;
  return {
    before: beforeValue,
    after: afterValue,
    saved,
    percentReduction: Number(percentReduction.toFixed(2)),
  };
}

function nullableDelta(beforeValue, afterValue, limitation) {
  if (beforeValue == null || afterValue == null) {
    return {
      before: beforeValue,
      after: afterValue,
      saved: null,
      percentReduction: null,
      limitation,
    };
  }

  return delta(beforeValue, afterValue);
}

function compareByteGroup(beforeSummary, afterSummary, label, transferKey, resourceKey, legacyKey) {
  return {
    knownTransferBytes: nullableDelta(
      transferMetric(beforeSummary, transferKey),
      transferMetric(afterSummary, transferKey),
      `${label} transfer delta is limited because at least one report lacks reliable PerformanceResourceTiming.transferSize data.`,
    ),
    knownResourceBytes: delta(
      metric(beforeSummary, resourceKey, legacyKey),
      metric(afterSummary, resourceKey, legacyKey),
    ),
  };
}

function compareVariant(beforeSummary, afterSummary, name) {
  const beforeVariant = variant(beforeSummary, name);
  const afterVariant = variant(afterSummary, name);
  return {
    requests: delta(metric(beforeVariant, "count"), metric(afterVariant, "count")),
    knownTransferBytes: nullableDelta(
      numberOrNull(beforeVariant.knownTransferBytes),
      numberOrNull(afterVariant.knownTransferBytes),
      `${name} transfer delta is limited because at least one report lacks reliable transfer bytes.`,
    ),
    knownResourceBytes: delta(
      metric(beforeVariant, "knownResourceBytes", "bytes"),
      metric(afterVariant, "knownResourceBytes", "bytes"),
    ),
    bytes: delta(metric(beforeVariant, "knownResourceBytes", "bytes"), metric(afterVariant, "knownResourceBytes", "bytes")),
  };
}

function repeated(summary) {
  return summary?.repeatedDownloadsBetweenColdAndWarm ?? {};
}

function compareRepeated(beforeSummary, afterSummary) {
  const beforeRepeated = repeated(beforeSummary);
  const afterRepeated = repeated(afterSummary);
  return {
    count: delta(metric(beforeRepeated, "count"), metric(afterRepeated, "count")),
    knownTransferBytes: nullableDelta(
      numberOrNull(beforeRepeated.knownTransferBytes),
      numberOrNull(afterRepeated.knownTransferBytes),
      "Repeated download transfer delta is limited because the before report used content-length fallback instead of reliable transfer bytes.",
    ),
    knownResourceBytes: delta(
      metric(beforeRepeated, "knownResourceBytes", "knownBytes"),
      metric(afterRepeated, "knownResourceBytes", "knownBytes"),
    ),
    unknownTransferBytesRequestCount: {
      before: numberOrNull(beforeRepeated.unknownTransferBytesRequestCount),
      after: numberOrNull(afterRepeated.unknownTransferBytesRequestCount),
    },
    top20: afterRepeated.top20 ?? [],
  };
}

function transferAvailable(summary) {
  return typeof summary?.totalKnownTransferBytes === "number";
}

function compareRun(runName) {
  const beforeSummary = before.runs?.[runName]?.summary ?? {};
  const afterSummary = after.runs?.[runName]?.summary ?? {};
  const limitations = [];

  if (!transferAvailable(beforeSummary)) {
    limitations.push("Before report has no totalKnownTransferBytes; old content-length fallback cannot be treated as actual network transfer.");
  }
  if (!transferAvailable(afterSummary)) {
    limitations.push("After report has no totalKnownTransferBytes; transfer reduction cannot be treated as fact.");
  }
  if (metric(afterSummary, "unknownTransferBytesRequestCount") > 0) {
    limitations.push(
      `After ${runName} has ${metric(afterSummary, "unknownTransferBytesRequestCount")} requests with unknown transfer bytes; totalKnownResourceBytes is resource size, not transfer.`,
    );
  }

  return {
    totals: compareByteGroup(beforeSummary, afterSummary, `${runName} total`, "totalKnownTransferBytes", "totalKnownResourceBytes", "totalKnownBytes"),
    images: compareByteGroup(beforeSummary, afterSummary, `${runName} image`, "imageKnownTransferBytes", "imageKnownResourceBytes", "imageKnownBytes"),
    supabaseStorage: compareByteGroup(
      beforeSummary,
      afterSummary,
      `${runName} Supabase Storage`,
      "supabaseStorageKnownTransferBytes",
      "supabaseStorageKnownResourceBytes",
      "supabaseStorageKnownBytes",
    ),
    nextImage: compareByteGroup(beforeSummary, afterSummary, `${runName} Next image`, "nextImageKnownTransferBytes", "nextImageKnownResourceBytes", "nextImageKnownBytes"),
    weather: compareByteGroup(beforeSummary, afterSummary, `${runName} weather`, "weatherKnownTransferBytes", "weatherKnownResourceBytes", "weatherKnownBytes"),
    requests: {
      total: delta(metric(beforeSummary, "totalRequests"), metric(afterSummary, "totalRequests")),
      image: delta(metric(beforeSummary, "imageRequests"), metric(afterSummary, "imageRequests")),
      supabaseStorage: delta(metric(beforeSummary, "supabaseStorageRequests"), metric(afterSummary, "supabaseStorageRequests")),
      unknownTransferBytes: {
        before: numberOrNull(beforeSummary.unknownTransferBytesRequestCount),
        after: numberOrNull(afterSummary.unknownTransferBytesRequestCount),
      },
    },
    variants: {
      original: compareVariant(beforeSummary, afterSummary, "original"),
      medium: compareVariant(beforeSummary, afterSummary, "medium"),
      thumb: compareVariant(beforeSummary, afterSummary, "thumb"),
      legacy: compareVariant(beforeSummary, afterSummary, "legacy"),
      placeholder: compareVariant(beforeSummary, afterSummary, "placeholder"),
      unknown: compareVariant(beforeSummary, afterSummary, "unknown"),
    },
    repeatedDownloadsBetweenColdAndWarm: compareRepeated(beforeSummary, afterSummary),
    routeGroupBreakdown: {
      before: beforeSummary.routeGroupBreakdown ?? {},
      after: afterSummary.routeGroupBreakdown ?? {},
    },
    phaseBreakdown: {
      before: beforeSummary.phaseBreakdown ?? {},
      after: afterSummary.phaseBreakdown ?? {},
    },
    top20ByResource: afterSummary.top20LargestRequests ?? [],
    top20ByTransfer: afterSummary.top20ByTransfer ?? [],
    top20SupabaseMediumImages: afterSummary.top20SupabaseMediumImages ?? [],
    top20ExternalImages: afterSummary.top20ExternalImages ?? [],
    top20LocalAssets: afterSummary.top20LocalAssets ?? [],
    remainingViolations: afterSummary.violations ?? [],
    topRemainingOffenders: afterSummary.top20LargestRequests ?? [],
    limitations,
  };
}

const cold = compareRun("cold");
const warm = compareRun("warm");

const report = {
  generatedAt: new Date().toISOString(),
  before: {
    label: before.label,
    baseUrl: before.baseUrl,
    startedAt: before.startedAt,
    finishedAt: before.finishedAt,
  },
  after: {
    label: after.label,
    baseUrl: after.baseUrl,
    startedAt: after.startedAt,
    finishedAt: after.finishedAt,
  },
  cold,
  warm,
  estimatedSavedKnownTransferBytes: {
    cold: cold.totals.knownTransferBytes,
    warm: warm.totals.knownTransferBytes,
  },
  estimatedSavedKnownResourceBytes: {
    cold: cold.totals.knownResourceBytes,
    warm: warm.totals.knownResourceBytes,
  },
  remainingViolations: {
    cold: after.runs?.cold?.summary?.violations ?? [],
    warm: after.runs?.warm?.summary?.violations ?? [],
  },
  limitations: Array.from(new Set([...cold.limitations, ...warm.limitations])),
};

const outPath = path.join(process.cwd(), "tmp", "traffic-optimization-report.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

console.log(`Traffic optimization report written: ${outPath}`);
logRun("Cold", cold);
logRun("Warm", warm);
console.log(`Remaining violations: cold=${report.remainingViolations.cold.length}, warm=${report.remainingViolations.warm.length}`);
if (report.limitations.length > 0) {
  console.log(`Limitations: ${report.limitations.join(" ")}`);
}

function logRun(label, run) {
  const transfer = run.totals.knownTransferBytes;
  const resource = run.totals.knownResourceBytes;
  const transferText = transfer.saved == null
    ? "transfer saved unavailable"
    : `transfer saved ${formatBytes(transfer.saved)} (${transfer.percentReduction}%)`;
  console.log(`${label}: ${transferText}; resource saved ${formatBytes(resource.saved)} (${resource.percentReduction}%)`);
}

function formatBytes(value) {
  return `${((value ?? 0) / 1024 / 1024).toFixed(2)} MB`;
}
