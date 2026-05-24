"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import type { Lake } from "@/lib/supabase";
import FishIcon from "@/app/components/FishIcon";
import { getLakeRouteSlug } from "@/lib/lake-slug";

const LakesMap = dynamic(() => import("./LakesMap"), { ssr: false });

const FISH_CHIPS = [
  { value: "Короп", emoji: "🐟" }, { value: "Щука", emoji: "🦈" },
  { value: "Судак", emoji: "🐡" }, { value: "Карась", emoji: "🫧" },
  { value: "Лящ",   emoji: "🐠" }, { value: "Окунь", emoji: "🎣" },
  { value: "Амур",  emoji: "🌿" }, { value: "Сом",   emoji: "🐋" },
  { value: "Форель",emoji: "🏔️"}, { value: "Товстолоб", emoji: "🐟" },
];

const REGIONS = [
  "Київ","Київська область","Вінницька область","Волинська область",
  "Дніпропетровська область","Донецька область","Житомирська область",
  "Закарпатська область","Запорізька область","Івано-Франківська область",
  "Кіровоградська область","Луганська область","Львівська область",
  "Миколаївська область","Одеська область","Полтавська область",
  "Рівненська область","Сумська область","Тернопільська область",
  "Харківська область","Херсонська область","Хмельницька область",
  "Черкаська область","Чернівецька область","Чернігівська область",
];

interface Props { lakes: Lake[]; }

export default function CatalogView({ lakes }: Props) {
  const [showMap, setShowMap] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const bottomPanelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFish   = searchParams.get("fish")   ?? "";
  const currentRegion = searchParams.get("region") ?? "";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`/lakes?${params.toString()}`);
  };

  useEffect(() => {
    if (!selectedId || !bottomPanelRef.current) return;
    const card = bottomPanelRef.current.querySelector(`[data-id="${selectedId}"]`);
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedId]);

  useEffect(() => {
    document.body.style.overflow = showMap ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [showMap]);

  useEffect(() => {
    const openMap = () => setShowMap(true);
    window.addEventListener("dk-open-lakes-map", openMap as EventListener);
    return () => window.removeEventListener("dk-open-lakes-map", openMap as EventListener);
  }, []);

  return (
    <>
      {/* ── GRID ── */}
      {lakes.length === 0 ? (
        <div className="dk-empty">
          <span className="dk-empty-icon">🎣</span>
          <p className="dk-empty-title">Нічого не знайдено</p>
          <p className="dk-empty-sub">Спробуй змінити фільтри</p>
        </div>
      ) : (
        <div className="dk-lakes-grid">
          {lakes.map((lake) => (
            <GridCard key={lake.id} lake={lake} />
          ))}
        </div>
      )}

      {/* ── MAP OVERLAY ── */}
      {showMap && (
        <div className="dk-map-overlay">
          {/* Top filter bar */}
          <div className="dk-map-topbar">
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }} className="no-scrollbar">
              <span style={{ fontSize: 13, color: "var(--text-muted)", flexShrink: 0 }}>Риба:</span>
              {FISH_CHIPS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => updateFilter("fish", currentFish === f.value ? "" : f.value)}
                  className={`dk-map-fish-chip${currentFish === f.value ? " active" : ""}`}
                >
                  <FishIcon name={f.value} size={13} /> {f.value}
                </button>
              ))}
              <div style={{ width: 1, height: 20, background: "var(--border)", flexShrink: 0 }} />
              <select
                value={currentRegion}
                onChange={(e) => updateFilter("region", e.target.value)}
                className="dk-map-region-select"
              >
                <option value="">🌍 Регіон</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {(currentFish || currentRegion) && (
                <button
                  onClick={() => { updateFilter("fish", ""); updateFilter("region", ""); }}
                  style={{ flexShrink: 0, padding: "6px 10px", borderRadius: 8, border: "1px solid #FF5C5C", background: "transparent", color: "#FF5C5C", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                >✕</button>
              )}
            </div>
            <button onClick={() => setShowMap(false)} className="dk-map-close">✕ Закрити</button>
          </div>

          {/* Map */}
          <div style={{ flex: 1, position: "relative" }}>
            <LakesMap
              lakes={lakes}
              hoveredId={hoveredId}
              selectedId={selectedId}
              onMarkerClick={(id) => setSelectedId(id === selectedId ? null : id)}
            />
            <div className="dk-map-count">📍 {lakes.filter(l => l.lat && l.lng).length} озер на карті</div>
          </div>

          {/* Bottom cards panel */}
          <div className="dk-map-bottom">
            <div ref={bottomPanelRef} className="dk-map-cards no-scrollbar">
              {lakes.map((lake) => (
                <MapBottomCard
                  key={lake.id}
                  lake={lake}
                  isSelected={selectedId === lake.id}
                  onHover={setHoveredId}
                  onClick={() => setSelectedId(lake.id === selectedId ? null : lake.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Dark grid card ── */
function GridCard({ lake }: { lake: Lake }) {
  const fish = lake.fish_species ?? [];
  return (
    <Link href={`/lakes/${getLakeRouteSlug(lake)}`} className="dk-lake-card">
      <div className="dk-lake-card-photo">
        {lake.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lake.image_url} alt={lake.name} className="dk-lake-card-img" />
        ) : (
          <div className="dk-lake-card-placeholder">🌊</div>
        )}
        {lake.area_ha && (
          <span className="dk-area-badge">{lake.area_ha} га</span>
        )}
      </div>

      <div className="dk-lake-card-body">
        <p className="dk-lake-card-name">{lake.name}</p>

        {lake.city && (
          <p className="dk-lake-card-region">
            <span>📍</span> {lake.city}
          </p>
        )}
        {lake.location_text && (
          <p className="dk-lake-card-location">🗺 {lake.location_text}</p>
        )}

        {fish.length > 0 && (
          <div className="dk-lake-card-fish">
            {fish.slice(0, 3).map((f) => (
              <span key={f} className="dk-fish-tag"><FishIcon name={f} size={11} /> {f}</span>
            ))}
            {fish.length > 3 && (
              <span className="dk-fish-more">+{fish.length - 3}</span>
            )}
          </div>
        )}

        <span className="dk-btn-card">Переглянути →</span>
      </div>
    </Link>
  );
}

/* ── Dark horizontal card in map bottom panel ── */
function MapBottomCard({
  lake, isSelected, onHover, onClick,
}: {
  lake: Lake; isSelected: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
}) {
  return (
    <div
      data-id={lake.id}
      className={`dk-map-card${isSelected ? " selected" : ""}`}
      onMouseEnter={() => onHover(lake.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
    >
      {lake.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={lake.image_url} alt={lake.name} className="dk-map-card-img" />
      ) : (
        <div className="dk-map-card-placeholder">🌊</div>
      )}
      <div className="dk-map-card-body">
        <p className="dk-map-card-name">{lake.name}</p>
        {lake.city && <p className="dk-map-card-city">{lake.city}</p>}
        <Link
          href={`/lakes/${getLakeRouteSlug(lake)}`}
          onClick={(e) => e.stopPropagation()}
          className="dk-map-card-link"
        >
          Відкрити →
        </Link>
      </div>
    </div>
  );
}
