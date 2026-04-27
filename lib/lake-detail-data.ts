import { getLakeStructuredData, getStructuredAmenitiesEntries, getStructuredFishEntries, getStructuredPricingEntries, getStructuredRulesEntries, type StructuredLakeData } from "@/lib/lake-structured";
import type { Lake } from "@/lib/supabase";

type AmenityItem = {
  key: string;
  label: string;
  note: string | null;
};

export type LakeDetailData = {
  structured: StructuredLakeData;
  fishSpecies: string[];
  amenityNames: string[];
  amenityItems: AmenityItem[];
  priceText: string | null;
  priceEnabled: boolean;
  rulesText: string | null;
  rulesEnabled: boolean;
  catchQuotaText: string | null;
  catchQuotaEnabled: boolean;
  workScheduleSummary: string | null;
  showWorkSchedule: boolean;
  additionalServicesText: string | null;
  additionalServicesEnabled: boolean;
  stockingText: string | null;
  stockingEnabled: boolean;
  amenitiesEnabled: boolean;
  mapsUrl: string | null;
  wazeUrl: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function getRawStructuredAmenities(extra: Lake["extra"]): AmenityItem[] {
  const structured = isRecord(extra) && isRecord(extra.structured) ? extra.structured : null;
  const amenities = structured && isRecord(structured.amenities) ? structured.amenities : null;
  if (!amenities) return [];

  return Object.entries(amenities)
    .map(([key, value]) => {
      if (!isRecord(value) || value.available !== true) return null;
      const label = typeof value.label === "string" && value.label.trim() ? value.label.trim() : key;
      const note = typeof value.note === "string" && value.note.trim() ? value.note.trim() : null;
      return { key, label, note };
    })
    .filter((item): item is AmenityItem => Boolean(item));
}

function dedupeAmenities(items: AmenityItem[]): AmenityItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const id = item.key || item.label;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export function buildLakeDetailData(lake: Lake): LakeDetailData {
  const structured = getLakeStructuredData(lake.extra);
  const structuredFish = getStructuredFishEntries(structured);
  const structuredPricing = getStructuredPricingEntries(structured);
  const structuredRules = getStructuredRulesEntries(structured);
  const structuredAmenities = getStructuredAmenitiesEntries(structured)
    .filter((item) => item.available)
    .map((item) => ({ key: item.key, label: item.label, note: item.note }));
  const rawStructuredAmenities = getRawStructuredAmenities(lake.extra);
  const amenityItems = dedupeAmenities([...rawStructuredAmenities, ...structuredAmenities]);

  const fishSpecies = structuredFish.length > 0 ? structuredFish.map((item) => item.name) : (lake.fish_species ?? []);
  const amenityNames = [
    ...(lake.amenities ?? []).map((item) => item.name),
    ...amenityItems.map((item) => item.label),
  ].filter((value, index, array) => Boolean(value) && array.indexOf(value) === index);

  const hasScheduleData = Boolean(
    lake.work_schedule_summary ||
      lake.show_work_schedule ||
      structured.schedule?.is24h ||
      structured.schedule?.bookingRequired ||
      structured.schedule?.seasonal ||
      structured.schedule?.winterFishing != null ||
      structured.schedule?.nightFishing != null ||
      structured.schedule?.nightStart ||
      structured.schedule?.nightEnd ||
      structured.schedule?.checkInFrom ||
      structured.schedule?.checkOutUntil ||
      structured.schedule?.note,
  );

  const hasStockingData = Boolean(
    lake.stocking_text ||
      lake.stocking_enabled ||
      structured.stocking?.status != null ||
      structured.stocking?.frequency ||
      structured.stocking?.lastDate ||
      (structured.stocking?.lastSpecies?.length ?? 0) > 0 ||
      structured.stocking?.lastAmount ||
      structured.stocking?.note,
  );

  const hasQuotaData = Boolean(
    lake.catch_quota_text ||
      lake.catch_quota_enabled ||
      structured.catchQuota &&
        [
          structured.catchQuota.totalKg,
          structured.catchQuota.peacefulKg,
          structured.catchQuota.predatorKg,
          structured.catchQuota.overLimitPriceUah,
          structured.catchQuota.trophyReleaseFromKg,
          structured.catchQuota.catchAndRelease,
          structured.catchQuota.note,
        ].some((value) => value !== null && value !== undefined && value !== ""),
  );

  const hasServicesData = Boolean(lake.additional_services_text || lake.additional_services_enabled);
  const hasAmenitiesData = Boolean(amenityNames.length > 0 || amenityItems.length > 0 || lake.amenities_enabled);
  const hasPriceData = Boolean(lake.price_details_text || structuredPricing.length > 0 || lake.price_details_enabled);
  const hasRulesData = Boolean(lake.lake_rules_text || structuredRules.length > 0 || lake.lake_rules_enabled);

  return {
    structured,
    fishSpecies,
    amenityNames,
    amenityItems,
    priceText: lake.price_details_text ?? null,
    priceEnabled: hasPriceData,
    rulesText: lake.lake_rules_text ?? null,
    rulesEnabled: hasRulesData,
    catchQuotaText: lake.catch_quota_text ?? null,
    catchQuotaEnabled: hasQuotaData,
    workScheduleSummary: lake.work_schedule_summary ?? null,
    showWorkSchedule: hasScheduleData,
    additionalServicesText: lake.additional_services_text ?? null,
    additionalServicesEnabled: hasServicesData,
    stockingText: lake.stocking_text ?? null,
    stockingEnabled: hasStockingData,
    amenitiesEnabled: hasAmenitiesData,
    mapsUrl: lake.location_google_url ?? (lake.lat && lake.lng ? `https://maps.google.com/?q=${lake.lat},${lake.lng}` : null),
    wazeUrl: lake.location_waze_url,
  };
}
