"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getLakeStructuredData,
  getStructuredAmenitiesEntries,
  getStructuredFishEntries,
  getStructuredPricingEntries,
  getStructuredRulesEntries,
  type StructuredLakeData,
} from "@/lib/lake-structured";
import FishIcon from "@/app/components/FishIcon";

interface Props {
  description: string | null;
  fishSpecies: string[];
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
  amenityNames: string[];
  amenityItems?: { key: string; label: string; note: string | null }[];
  structured?: StructuredLakeData;
}

export default function LakeDetailTabs({
  description,
  fishSpecies,
  priceText,
  priceEnabled,
  rulesText,
  rulesEnabled,
  catchQuotaText,
  catchQuotaEnabled,
  workScheduleSummary,
  showWorkSchedule,
  additionalServicesText,
  additionalServicesEnabled,
  stockingText,
  stockingEnabled,
  amenitiesEnabled,
  amenityNames,
  amenityItems = [],
  structured,
}: Props) {
  const lakeStructured = structured ?? getLakeStructuredData(null);
  const structuredFish = getStructuredFishEntries(lakeStructured);
  const structuredPricing = getStructuredPricingEntries(lakeStructured);
  const structuredRules = getStructuredRulesEntries(lakeStructured);
  const structuredAmenities = getStructuredAmenitiesEntries(lakeStructured).filter((item) => item.available);
  const visibleAmenities =
    amenityItems.length > 0
      ? amenityItems
      : structuredAmenities.length > 0
        ? structuredAmenities.map((item) => ({
            key: item.key,
            label: item.label,
            note: item.note,
          }))
        : amenityNames.map((name) => ({
            key: name,
            label: name,
            note: null,
          }));

  const structuredCatchQuotaVisible = Boolean(
    lakeStructured.catchQuota &&
      [
        lakeStructured.catchQuota.totalKg,
        lakeStructured.catchQuota.peacefulKg,
        lakeStructured.catchQuota.predatorKg,
        lakeStructured.catchQuota.overLimitPriceUah,
        lakeStructured.catchQuota.trophyReleaseFromKg,
        lakeStructured.catchQuota.catchAndRelease,
        lakeStructured.catchQuota.note,
      ].some((value) => value !== null && value !== undefined && value !== ""),
  );

  const fishEntries =
    structuredFish.length > 0
      ? structuredFish
      : fishSpecies.map((name) => ({
          name,
          icon: FISH_ICONS[name] ?? "🐟",
          trophy: false,
          releaseFromKg: null,
        }));

  const rulesVisible = structuredRules.filter((rule) => {
    if (rule.type === "number") return typeof rule.value === "number" && Number.isFinite(rule.value);
    return rule.value === true || rule.value === false;
  });

  const hasScheduleData = Boolean(
    workScheduleSummary ||
      showWorkSchedule ||
      lakeStructured.schedule?.is24h ||
      lakeStructured.schedule?.bookingRequired ||
      lakeStructured.schedule?.seasonal ||
      lakeStructured.schedule?.winterFishing != null ||
      lakeStructured.schedule?.nightFishing != null ||
      lakeStructured.schedule?.nightStart ||
      lakeStructured.schedule?.nightEnd ||
      lakeStructured.schedule?.checkInFrom ||
      lakeStructured.schedule?.checkOutUntil ||
      lakeStructured.schedule?.note,
  );

  const hasStockingData = Boolean(
    stockingText ||
      stockingEnabled ||
      lakeStructured.stocking?.status != null ||
      lakeStructured.stocking?.frequency ||
      lakeStructured.stocking?.lastDate ||
      (lakeStructured.stocking?.lastSpecies?.length ?? 0) > 0 ||
      lakeStructured.stocking?.lastAmount ||
      lakeStructured.stocking?.note,
  );

  const hasQuotaData = Boolean(
    catchQuotaEnabled &&
      (
        catchQuotaText ||
        structuredCatchQuotaVisible
      ),
  );

  const hasServicesData = Boolean(additionalServicesText || additionalServicesEnabled);
  const hasAmenitiesData = Boolean(amenityNames.length > 0 || visibleAmenities.length > 0 || amenitiesEnabled);

  const availableTabs = useMemo(
    () =>
      [
        { key: "desc", label: "Опис" },
        fishEntries.length > 0 ? { key: "fish", label: "🐟 Риби" } : null,
        priceEnabled && (priceText || structuredPricing.length > 0) ? { key: "price", label: "💰 Ціни" } : null,
        rulesEnabled && (rulesText || rulesVisible.length > 0) ? { key: "rules", label: "📋 Правила" } : null,
        hasQuotaData ? { key: "quota", label: "⚖️ Норми вилову" } : null,
        hasScheduleData ? { key: "schedule", label: "🕒 Графік роботи" } : null,
        hasServicesData ? { key: "services", label: "🏕️ Додаткові послуги" } : null,
        hasAmenitiesData ? { key: "amenities", label: "✅ Зручності" } : null,
        hasStockingData ? { key: "stocking", label: "🐠 Зариблення" } : null,
      ].filter(Boolean) as { key: TabKey; label: string }[],
    [
      fishEntries.length,
      hasAmenitiesData,
      hasQuotaData,
      hasScheduleData,
      hasServicesData,
      hasStockingData,
      priceEnabled,
      priceText,
      rulesEnabled,
      rulesText,
      rulesVisible.length,
      structuredPricing.length,
      amenityNames.length,
      visibleAmenities.length,
    ],
  );

  type TabKey = "desc" | "fish" | "price" | "rules" | "quota" | "schedule" | "services" | "amenities" | "stocking";
  const [tab, setTab] = useState<TabKey>("desc");

  useEffect(() => {
    if (!availableTabs.some((t) => t.key === tab)) {
      setTab(availableTabs[0]?.key ?? "desc");
    }
  }, [availableTabs, tab]);
  return (
    <div className="dk-tabs-section">
      <div className="dk-tabs-nav">
        {availableTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`dk-tab-btn${tab === t.key ? " active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "desc" && (
        <div className="dk-tab-desc">
          {description ? <p>{description}</p> : <p className="dk-tab-empty">Опис ще не додано</p>}
        </div>
      )}

      {tab === "fish" && (
        <div>
          {fishSpecies.length > 0 && (
            <p style={{ margin: "0 0 16px", color: "var(--text-secondary)", fontSize: 15 }}>
              Риба: {fishSpecies.join(", ")}.
            </p>
          )}
          {fishEntries.length > 0 ? (
            <div className="dk-fish-grid">
              {fishEntries.map((f) => (
                <div
                  key={f.name}
                  className="dk-fish-chip"
                  style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <FishIcon name={f.name} size={20} />
                    <span>{f.name}</span>
                  </div>
                  {(f.trophy || f.releaseFromKg) && (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.35 }}>
                      {f.trophy ? "Трофейна" : ""}
                      {f.trophy && f.releaseFromKg ? " • " : ""}
                      {f.releaseFromKg ? `Від ${f.releaseFromKg} кг` : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="dk-tab-empty">Список риб ще не додано</p>
          )}
        </div>
      )}

      {tab === "price" && (
        <div>
          {priceText && (
            <div style={{ marginBottom: 18 }}>
              <p className="dk-price-text">{priceText}</p>
            </div>
          )}

          {structuredPricing.length > 0 && (
            <div style={{ display: "grid", gap: 18 }}>
              {groupPricingByCategory(structuredPricing).map((group) => (
                <div key={group.categoryKey} className="dk-price-category">
                  <p className="dk-price-label" style={{ marginBottom: 10 }}>{group.categoryLabel}</p>
                  <div style={{ display: "grid", gap: 10 }}>
                    {group.items.map((item) => (
                      <div key={`${item.categoryKey}-${item.periodKey}`} className="dk-price-card">
                        <div>
                          <p className="dk-price-label">{item.periodLabel}</p>
                          {item.note && <p className="dk-price-desc">{item.note}</p>}
                        </div>
                        {item.price != null && (
                          <span className="dk-price-amount">
                            {item.price}{" "}
                            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>грн</span>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!priceText && structuredPricing.length === 0 && <p className="dk-tab-empty">Ціни ще не вказано</p>}
        </div>
      )}

      {tab === "rules" && (
        <div>
          {rulesText && (
            <div style={{ marginBottom: 18, padding: "16px", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 8px" }}>Текст правил</p>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-line" }}>{rulesText}</p>
            </div>
          )}
          {rulesVisible.length > 0 ? (
            <ul className="dk-rules-list">
              {rulesVisible.map((rule, i) => (
                <li key={rule.key}>
                  <span className="dk-rule-num">{i + 1}</span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span>
                      {rule.label}
                      {rule.type === "number"
                        ? rule.value != null
                          ? `: ${rule.value}`
                          : ": —"
                        : `: ${rule.value === true ? "Так" : "Ні"}`}
                    </span>
                    {rule.note && <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{rule.note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            !rulesText && <p className="dk-tab-empty">Правила ще не додано</p>
          )}
        </div>
      )}

      {tab === "quota" && (
        <div>
          {catchQuotaText && (
            <div style={{ marginBottom: 18, padding: "16px", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 8px" }}>Текст норм вилову</p>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-line" }}>{catchQuotaText}</p>
            </div>
          )}
          {structuredCatchQuotaVisible ? (
            <div style={{ display: "grid", gap: 8 }}>
              {lakeStructured.catchQuota.totalKg != null && <QuotaRow label="Загальна норма" value={`${lakeStructured.catchQuota.totalKg} кг`} />}
              {lakeStructured.catchQuota.peacefulKg != null && <QuotaRow label="Мирна риба" value={`${lakeStructured.catchQuota.peacefulKg} кг`} />}
              {lakeStructured.catchQuota.predatorKg != null && <QuotaRow label="Хижа риба" value={`${lakeStructured.catchQuota.predatorKg} кг`} />}
              {lakeStructured.catchQuota.overLimitPriceUah != null && <QuotaRow label="Перелов" value={`${lakeStructured.catchQuota.overLimitPriceUah} грн/кг`} />}
              {lakeStructured.catchQuota.trophyReleaseFromKg != null && <QuotaRow label="Трофей відпускати від" value={`${lakeStructured.catchQuota.trophyReleaseFromKg} кг`} />}
              {lakeStructured.catchQuota.catchAndRelease != null && (
                <QuotaRow
                  label="Catch & Release"
                  value={lakeStructured.catchQuota.catchAndRelease === true ? "Так" : lakeStructured.catchQuota.catchAndRelease === false ? "Ні" : "Не уточнено"}
                />
              )}
              {lakeStructured.catchQuota.note && <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "6px 0 0" }}>{lakeStructured.catchQuota.note}</p>}
            </div>
          ) : (
            !catchQuotaText && <p className="dk-tab-empty">Норми вилову ще не додано</p>
          )}
        </div>
      )}

      {tab === "schedule" && (
        <div>
          {workScheduleSummary && (
            <div style={{ marginBottom: 18, padding: "16px", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 8px" }}>Текст графіку</p>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-line" }}>{workScheduleSummary}</p>
            </div>
          )}
          <div className="dk-services-grid">
            {lakeStructured.schedule?.is24h && <ServiceItem icon="✅" label="Цілодобово" />}
            {lakeStructured.schedule?.bookingRequired && <ServiceItem icon="✅" label="За попередньою бронню" />}
            {lakeStructured.schedule?.seasonal && <ServiceItem icon="✅" label="Працює сезонно" />}
            {lakeStructured.schedule?.winterFishing != null && <ServiceItem icon="ℹ️" label={`Зимова риболовля: ${describeBool(lakeStructured.schedule.winterFishing)}`} />}
            {lakeStructured.schedule?.nightFishing != null && <ServiceItem icon="🌙" label={`Нічна риболовля: ${describeBool(lakeStructured.schedule.nightFishing)}`} />}
            {lakeStructured.schedule?.nightStart && lakeStructured.schedule?.nightEnd && <ServiceItem icon="⏰" label={`Ніч: ${lakeStructured.schedule.nightStart} – ${lakeStructured.schedule.nightEnd}`} />}
            {lakeStructured.schedule?.checkInFrom && <ServiceItem icon="🚪" label={`Заїзд з ${lakeStructured.schedule.checkInFrom}`} />}
            {lakeStructured.schedule?.checkOutUntil && <ServiceItem icon="🚪" label={`Виїзд до ${lakeStructured.schedule.checkOutUntil}`} />}
            {lakeStructured.schedule?.note && <ServiceItem icon="📝" label={lakeStructured.schedule.note} />}
          </div>
        </div>
      )}

      {tab === "services" && (
        <div>
          {additionalServicesText ? (
            <div className="dk-services-grid">
              {additionalServicesText.split("\n").filter((l) => l.trim()).map((s, i) => (
                <div key={i} className="dk-service-item">
                  <span style={{ fontSize: 20, flexShrink: 0 }}>✅</span>
                  <span>{s.replace(/^[-•*]\s*/, "").trim()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="dk-tab-empty">Додаткові послуги ще не додано</p>
          )}
        </div>
      )}

      {tab === "amenities" && (
        <div>
          {amenityNames.length > 0 && (
            <p style={{ margin: "0 0 14px", color: "var(--text-secondary)", fontSize: 15 }}>
              {amenityNames.join(", ")}
            </p>
          )}
          {visibleAmenities.length > 0 ? (
            <div className="dk-amenities">
              {visibleAmenities.map((a) => (
                <span key={a.key} className="dk-amenity" title={a.note ?? a.label}>
                  {a.label}
                  {a.note ? <small style={{ display: "block", marginTop: 4, fontSize: 11, opacity: 0.72 }}>{a.note}</small> : null}
                </span>
              ))}
            </div>
          ) : (
            amenityNames.length === 0 && <p className="dk-tab-empty">Зручності ще не додано</p>
          )}
        </div>
      )}

      {tab === "stocking" && (
        <div>
          {stockingText && (
            <div style={{ marginBottom: 18, padding: "16px", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 8px" }}>Текст зариблення</p>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0, whiteSpace: "pre-line" }}>{stockingText}</p>
            </div>
          )}
          <div className="dk-services-grid">
            {lakeStructured.stocking?.status != null && <ServiceItem icon="✅" label={`Статус: ${describeBool(lakeStructured.stocking.status)}`} />}
            {lakeStructured.stocking?.frequency && lakeStructured.stocking.frequency !== "unknown" && (
              <ServiceItem
                icon="📆"
                label={`Регулярність: ${lakeStructured.stocking.frequency === "regular" ? "Регулярно" : lakeStructured.stocking.frequency === "seasonal" ? "Сезонно" : lakeStructured.stocking.frequency === "one_time" ? "Разово" : lakeStructured.stocking.frequency}`}
              />
            )}
            {lakeStructured.stocking?.lastDate && <ServiceItem icon="🗓️" label={`Останнє зариблення: ${lakeStructured.stocking.lastDate}`} />}
            {lakeStructured.stocking?.lastSpecies?.length ? <ServiceItem icon="🐟" label={lakeStructured.stocking.lastSpecies.join(", ")} /> : null}
            {lakeStructured.stocking?.lastAmount && <ServiceItem icon="⚖️" label={lakeStructured.stocking.lastAmount} />}
            {lakeStructured.stocking?.note && <ServiceItem icon="📝" label={lakeStructured.stocking.note} />}
          </div>
        </div>
      )}
    </div>
  );
}

function ServiceItem({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="dk-service-item">
      <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function describeBool(value: boolean | null | undefined) {
  if (value === true) return "Так";
  if (value === false) return "Ні";
  return "Не уточнено";
}

function groupPricingByCategory(entries: {
  categoryKey: string;
  categoryLabel: string;
  periodKey: string;
  periodLabel: string;
  available: boolean | null;
  price: number | null;
  note: string | null;
}[]) {
  const groups = new Map<string, { categoryKey: string; categoryLabel: string; items: typeof entries }>();
  entries.forEach((entry) => {
    const existing = groups.get(entry.categoryKey);
    if (existing) {
      existing.items.push(entry);
      return;
    }
    groups.set(entry.categoryKey, { categoryKey: entry.categoryKey, categoryLabel: entry.categoryLabel, items: [entry] });
  });
  return Array.from(groups.values());
}

function QuotaRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 14 }}>
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
      <span style={{ color: "var(--text-secondary)", fontWeight: 600, textAlign: "right" }}>{value}</span>
    </div>
  );
}

