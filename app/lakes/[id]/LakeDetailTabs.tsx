"use client";

import { useState } from "react";

interface Props {
  description:      string | null;
  fishSpecies:      string[] | null;
  priceText:        string | null;
  priceEnabled:     boolean;
  rulesText:        string | null;
  catchQuotaText:   string | null;
}

const FISH_ICONS: Record<string, string> = {
  Короп: "🐟", Щука: "🦈", Судак: "🐡", Карась: "🫧",
  Лящ: "🐠", Окунь: "🎣", Амур: "🌿", Сом: "🐋",
  Форель: "🏔️", Товстолоб: "🐟",
};

export default function LakeDetailTabs({
  description, fishSpecies, priceText, priceEnabled, rulesText, catchQuotaText,
}: Props) {
  const [tab, setTab] = useState<"desc" | "fish" | "price" | "rules">("desc");

  const tabs = [
    { key: "desc",  label: "Опис" },
    { key: "fish",  label: "🐟 Риби" },
    { key: "price", label: "💰 Ціни" },
    { key: "rules", label: "📋 Правила" },
  ] as const;

  return (
    <div className="dk-tabs-section">
      {/* Tab nav */}
      <div className="dk-tabs-nav">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`dk-tab-btn${tab === t.key ? " active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Опис */}
      {tab === "desc" && (
        <div className="dk-tab-desc">
          {description ? (
            <p>{description}</p>
          ) : (
            <p className="dk-tab-empty">Опис ще не додано</p>
          )}
          {catchQuotaText && (
            <div style={{ marginTop: 20, padding: "16px", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: "0 0 6px" }}>⚖️ Норма вилову</p>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0 }}>{catchQuotaText}</p>
            </div>
          )}
        </div>
      )}

      {/* Риби */}
      {tab === "fish" && (
        <div>
          {fishSpecies && fishSpecies.length > 0 ? (
            <div className="dk-fish-grid">
              {fishSpecies.map((f) => (
                <span key={f} className="dk-fish-chip">
                  <span>{FISH_ICONS[f] ?? "🐟"}</span> {f}
                </span>
              ))}
            </div>
          ) : (
            <p className="dk-tab-empty">Список риб ще не додано</p>
          )}
        </div>
      )}

      {/* Ціни */}
      {tab === "price" && (
        <div>
          {priceEnabled && priceText ? (
            <div>
              {/* Try to parse structured pricing lines, fallback to text block */}
              {parsePriceLines(priceText).length > 0 ? (
                parsePriceLines(priceText).map((item, i) => (
                  <div key={i} className="dk-price-card">
                    <div>
                      <p className="dk-price-label">{item.label}</p>
                      {item.desc && <p className="dk-price-desc">{item.desc}</p>}
                    </div>
                    {item.amount && (
                      <span className="dk-price-amount">{item.amount} <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-muted)" }}>грн</span></span>
                    )}
                  </div>
                ))
              ) : (
                <p className="dk-price-text">{priceText}</p>
              )}
            </div>
          ) : (
            <p className="dk-tab-empty">Ціни ще не вказано</p>
          )}
        </div>
      )}

      {/* Правила */}
      {tab === "rules" && (
        <div>
          {rulesText ? (
            <ul className="dk-rules-list">
              {rulesText.split("\n").filter((line) => line.trim()).map((line, i) => (
                <li key={i}>
                  <span className="dk-rule-num">{i + 1}</span>
                  <span>{line.replace(/^[-•*\d.]+\s*/, "").trim()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dk-tab-empty">Правила ще не додано</p>
          )}
        </div>
      )}
    </div>
  );
}

/* Try to parse price lines like "День 750 грн норма 2.5кг" */
function parsePriceLines(text: string): { label: string; amount: string | null; desc: string | null }[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return [];

  // Heuristic: line has a number followed by грн/₴
  const results = lines.map((line) => {
    const amountMatch = line.match(/(\d[\d\s]*)\s*(грн|₴)/i);
    if (!amountMatch) return null;
    const amount = amountMatch[1].trim();
    const rest = line.replace(amountMatch[0], "").trim();
    const parts = rest.split(/[-–—|,]/);
    const label = parts[0]?.trim() || line;
    const desc  = parts.slice(1).join(",").trim() || null;
    return { label, amount, desc };
  }).filter(Boolean) as { label: string; amount: string; desc: string | null }[];

  return results.length >= 1 ? results : [];
}
