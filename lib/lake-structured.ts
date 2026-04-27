export type TriValue = true | false | null;

export type StructuredFishRow = {
  present?: boolean;
  trophy?: boolean;
  releaseFromKg?: string | null;
};

export type StructuredPricingCell = {
  available?: TriValue;
  price?: number | null;
  note?: string | null;
};

export type StructuredCatchQuota = {
  totalKg?: number | null;
  peacefulKg?: number | null;
  predatorKg?: number | null;
  overLimitPriceUah?: number | null;
  trophyReleaseFromKg?: number | null;
  catchAndRelease?: TriValue;
  note?: string | null;
};

export type StructuredSchedule = {
  is24h?: boolean;
  bookingRequired?: boolean;
  seasonal?: boolean;
  winterFishing?: TriValue;
  nightFishing?: TriValue;
  nightStart?: string | null;
  nightEnd?: string | null;
  checkInFrom?: string | null;
  checkOutUntil?: string | null;
  note?: string | null;
};

export type StructuredStocking = {
  status?: TriValue;
  frequency?: string;
  lastDate?: string | null;
  lastSpecies?: string[];
  lastAmount?: string | null;
  note?: string | null;
};

export type StructuredRuleRow = {
  value?: TriValue | number | null;
  note?: string | null;
};

export type StructuredAmenityRow = {
  label?: string;
  available?: boolean;
  note?: string | null;
};

export type StructuredVerified = {
  source?: string | null;
  lastVerifiedAt?: string | null;
  completion?: Record<string, boolean>;
  internalNote?: string | null;
};

export type StructuredLakeData = {
  version: number;
  fish: Record<string, StructuredFishRow>;
  pricing: Record<string, Record<string, StructuredPricingCell>>;
  catchQuota: StructuredCatchQuota;
  schedule: StructuredSchedule;
  stocking: StructuredStocking;
  rules: Record<string, StructuredRuleRow>;
  amenities: Record<string, StructuredAmenityRow>;
  verified: StructuredVerified;
};

type RecordLike = Record<string, unknown>;

function isRecord(value: unknown): value is RecordLike {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function asBool(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  return undefined;
}

function asTri(value: unknown): TriValue {
  if (value === true) return true;
  if (value === false) return false;
  return null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export const STRUCTURED_FISH = [
  "Короп",
  "Сазан",
  "Карась",
  "Амур білий",
  "Товстолоб",
  "Щука",
  "Судак",
  "Окунь",
  "Сом",
  "Лин",
  "Плітка",
  "Лящ",
  "Форель веселкова",
  "Осетер",
  "Стерлядь",
  "Білизна",
  "Краснопірка",
  "Рак",
] as const;

export const FISH_ICONS: Record<string, string> = {
  "Короп": "🐟",
  "Сазан": "🐟",
  "Карась": "🐡",
  "Амур білий": "🌿",
  "Товстолоб": "🐟",
  "Щука": "🦈",
  "Судак": "🐟",
  "Окунь": "🎣",
  "Сом": "🐋",
  "Лин": "🐟",
  "Плітка": "🐟",
  "Лящ": "🐠",
  "Форель веселкова": "🏔️",
  "Осетер": "🐟",
  "Стерлядь": "🐟",
  "Білизна": "🐟",
  "Краснопірка": "🐟",
  "Рак": "🦀",
};

export const STRUCTURED_RULES = [
  { key: "rod_count", label: "Кількість вудилищ на 1 квиток", type: "number" as const },
  { key: "hook_count", label: "Кількість гачків на снасть", type: "number" as const },
  { key: "spinning_allowed", label: "Спінінг дозволено", type: "tri" as const },
  { key: "feeder_allowed", label: "Фідер дозволено", type: "tri" as const },
  { key: "carp_tackle_allowed", label: "Карпові снасті дозволено", type: "tri" as const },
  { key: "own_boat_allowed", label: "Власний човен дозволено", type: "tri" as const },
  { key: "bait_boat_allowed", label: "Кораблик для закорму дозволено", type: "tri" as const },
  { key: "landing_net_required", label: "Підсак обов’язковий", type: "tri" as const },
  { key: "carp_mat_required", label: "Карповий мат обов’язковий", type: "tri" as const },
  { key: "keepnet_required", label: "Садок обов’язковий", type: "tri" as const },
  { key: "fire_allowed", label: "Багаття / мангал", type: "tri" as const },
  { key: "tents_allowed", label: "Намети дозволені", type: "tri" as const },
  { key: "swimming_allowed", label: "Купання дозволене", type: "tri" as const },
  { key: "pets_allowed", label: "Домашні тварини дозволені", type: "tri" as const },
  { key: "noise_limited", label: "Музика / шум обмежені", type: "tri" as const },
  { key: "night_entry_allowed", label: "Нічний заїзд / виїзд дозволений", type: "tri" as const },
  { key: "booking_required", label: "Попередня бронь обов’язкова", type: "tri" as const },
  { key: "alcohol_limited", label: "Алкоголь обмежений або заборонений", type: "tri" as const },
] as const;

export const STRUCTURED_PRICE_CATEGORIES = [
  { key: "peaceful", label: "Мирна риба" },
  { key: "predator", label: "Хижа риба" },
  { key: "sport", label: "C&R / спорт" },
  { key: "guest", label: "Гість без риболовлі" },
] as const;

export const STRUCTURED_PRICE_PERIODS = [
  { key: "hourly", label: "Погодинно" },
  { key: "half_day", label: "Півдня" },
  { key: "daylight", label: "Світловий день" },
  { key: "night", label: "Ніч" },
  { key: "day_24h", label: "Доба" },
] as const;

export const STRUCTURED_AMENITIES = [
  { key: "parking", label: "Парковка" },
  { key: "toilet", label: "Туалет" },
  { key: "shower", label: "Душ" },
  { key: "electricity", label: "Електрика на секторі" },
  { key: "drinking_water", label: "Питна вода" },
  { key: "wifi", label: "Wi‑Fi" },
  { key: "gazebos", label: "Альтанки" },
  { key: "houses", label: "Будиночки" },
  { key: "piers", label: "Містки" },
  { key: "grill", label: "Мангал" },
  { key: "firewood", label: "Дрова" },
  { key: "cafe", label: "Кафе" },
  { key: "bait_shop", label: "Магазин наживки" },
  { key: "gear_rental", label: "Прокат снастей" },
  { key: "boat_rental", label: "Оренда човна" },
  { key: "fish_cleaning", label: "Чистка риби" },
  { key: "card_payment", label: "Оплата картою" },
  { key: "playground", label: "Дитячий майданчик" },
] as const;

export function getLakeStructuredData(extra: Record<string, unknown> | null | undefined): StructuredLakeData {
  const safeExtra = isRecord(extra) ? extra : {};
  const stored = isRecord(safeExtra.structured) ? safeExtra.structured : {};
  return {
    version: 1,
    fish: isRecord(stored.fish) ? Object.fromEntries(
      Object.entries(stored.fish).map(([name, row]) => [
        name,
        {
          present: asBool(isRecord(row) ? row.present : undefined),
          trophy: asBool(isRecord(row) ? row.trophy : undefined),
          releaseFromKg: asString(isRecord(row) ? row.releaseFromKg : undefined),
        },
      ]),
    ) : {},
    pricing: isRecord(stored.pricing) ? (stored.pricing as StructuredLakeData["pricing"]) : {},
    catchQuota: isRecord(stored.catchQuota)
      ? {
          totalKg: asNumber(stored.catchQuota.totalKg),
          peacefulKg: asNumber(stored.catchQuota.peacefulKg),
          predatorKg: asNumber(stored.catchQuota.predatorKg),
          overLimitPriceUah: asNumber(stored.catchQuota.overLimitPriceUah),
          trophyReleaseFromKg: asNumber(stored.catchQuota.trophyReleaseFromKg),
          catchAndRelease: asTri(stored.catchQuota.catchAndRelease),
          note: asString(stored.catchQuota.note),
        }
      : {},
    schedule: isRecord(stored.schedule)
      ? {
          is24h: asBool(stored.schedule.is24h),
          bookingRequired: asBool(stored.schedule.bookingRequired),
          seasonal: asBool(stored.schedule.seasonal),
          winterFishing: asTri(stored.schedule.winterFishing),
          nightFishing: asTri(stored.schedule.nightFishing),
          nightStart: asString(stored.schedule.nightStart),
          nightEnd: asString(stored.schedule.nightEnd),
          checkInFrom: asString(stored.schedule.checkInFrom),
          checkOutUntil: asString(stored.schedule.checkOutUntil),
          note: asString(stored.schedule.note),
        }
      : {},
    stocking: isRecord(stored.stocking)
      ? {
          status: asTri(stored.stocking.status),
          frequency: asString(stored.stocking.frequency) ?? "unknown",
          lastDate: asString(stored.stocking.lastDate),
          lastSpecies: asStringArray(stored.stocking.lastSpecies),
          lastAmount: asString(stored.stocking.lastAmount),
          note: asString(stored.stocking.note),
        }
      : {},
    rules: isRecord(stored.rules) ? Object.fromEntries(
      Object.entries(stored.rules).map(([key, row]) => [
        key,
        {
          value: isRecord(row) ? (typeof row.value === "number" ? row.value : asTri(row.value)) : null,
          note: asString(isRecord(row) ? row.note : undefined),
        },
      ]),
    ) : {},
    amenities: isRecord(stored.amenities) ? Object.fromEntries(
      Object.entries(stored.amenities).map(([key, row]) => [
        key,
        {
          label: asString(isRecord(row) ? row.label : undefined) ?? key,
          available: isRecord(row) ? row.available === true : false,
          note: asString(isRecord(row) ? row.note : undefined),
        },
      ]),
    ) : {},
    verified: isRecord(stored.verified)
      ? {
          source: asString(stored.verified.source),
          lastVerifiedAt: asString(stored.verified.lastVerifiedAt),
          completion: isRecord(stored.verified.completion) ? Object.fromEntries(
            Object.entries(stored.verified.completion).map(([key, value]) => [key, value === true]),
          ) : {},
          internalNote: asString(stored.verified.internalNote),
        }
      : {},
  };
}

export function hasStructuredValue<T extends object>(value: T | null | undefined): boolean {
  return !!value && Object.keys(value).length > 0;
}

export function getStructuredFishEntries(structured: StructuredLakeData) {
  return STRUCTURED_FISH
    .map((name) => {
      const row = structured.fish[name];
      if (!row || row.present !== true) return null;
      return {
        name,
        icon: FISH_ICONS[name] ?? "🐟",
        trophy: row.trophy === true,
        releaseFromKg: row.releaseFromKg ?? null,
      };
    })
    .filter(Boolean) as { name: string; icon: string; trophy: boolean; releaseFromKg: string | null }[];
}

export function getStructuredRulesEntries(structured: StructuredLakeData) {
  return STRUCTURED_RULES
    .map((rule) => {
      const row = structured.rules[rule.key];
      if (!row) return null;
      return {
        key: rule.key,
        label: rule.label,
        type: rule.type,
        value: row.value ?? null,
        note: row.note ?? null,
      };
    })
    .filter(Boolean) as { key: string; label: string; type: "number" | "tri"; value: TriValue | number | null; note: string | null }[];
}

export function getStructuredPricingEntries(structured: StructuredLakeData) {
  return STRUCTURED_PRICE_CATEGORIES.flatMap((category) =>
    STRUCTURED_PRICE_PERIODS.map((period) => {
      const cell = structured.pricing?.[category.key]?.[period.key];
      return {
        categoryKey: category.key,
        categoryLabel: category.label,
        periodKey: period.key,
        periodLabel: period.label,
        available: cell?.available ?? null,
        price: cell?.price ?? null,
        note: cell?.note ?? null,
      };
    }).filter((cell) => cell.available !== null || cell.price !== null || cell.note !== null),
  );
}

export function getStructuredAmenitiesEntries(structured: StructuredLakeData) {
  return STRUCTURED_AMENITIES
    .map((amenity) => {
      const row = structured.amenities[amenity.key];
      if (!row) return null;
      return {
        key: amenity.key,
        label: row.label || amenity.label,
        available: row.available === true,
        note: row.note ?? null,
      };
    })
    .filter(Boolean) as { key: string; label: string; available: boolean; note: string | null }[];
}

export function hasStructuredFish(structured: StructuredLakeData) {
  return getStructuredFishEntries(structured).length > 0;
}

export function hasStructuredRules(structured: StructuredLakeData) {
  return getStructuredRulesEntries(structured).length > 0;
}

export function hasStructuredAmenities(structured: StructuredLakeData) {
  return getStructuredAmenitiesEntries(structured).length > 0;
}

export function describeTri(value: TriValue) {
  if (value === true) return "Дозволено";
  if (value === false) return "Заборонено";
  return "Не уточнено";
}
