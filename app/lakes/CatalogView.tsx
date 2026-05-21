"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import type { Lake } from "@/lib/supabase";
import FishIcon from "@/app/components/FishIcon";
import LakeCard, { toLakeCardData } from "@/app/components/LakeCard";
import { getLakeRouteSlug } from "@/lib/lake-slug";

const LakesMap = dynamic(() => import("./LakesMap"), { ssr: false });

const FISH_CHIPS = [
  "Короп",
  "Щука",
  "Судак",
  "Карась",
  "Лящ",
  "Окунь",
  "Амур",
  "Сом",
  "Форель",
  "Товстолоб",
];

const REGIONS = [
  "Київ",
  "Київська область",
  "Вінницька область",
  "Волинська область",
  "Дніпропетровська область",
  "Донецька область",
  "Житомирська область",
  "Закарпатська область",
  "Запорізька область",
  "Івано-Франківська область",
  "Кіровоградська область",
  "Луганська область",
  "Львівська область",
  "Миколаївська область",
  "Одеська область",
  "Полтавська область",
  "Рівненська область",
  "Сумська область",
  "Тернопільська область",
  "Харківська область",
  "Херсонська область",
  "Хмельницька область",
  "Черкаська область",
  "Чернівецька область",
  "Чернігівська область",
];

interface Props {
  lakes: Lake[];
  total: number;
}

function MapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6 9 4Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 4v13M15 6v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DotIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <circle cx="6" cy="6" r="6" />
    </svg>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="dk-empty-state oz-card">
      <div className="dk-empty-state__icon" aria-hidden="true">
        <MapIcon />
      </div>
      <h3>Нічого не знайшли</h3>
      <p>Спробуйте змінити область, рибу або пошуковий запит.</p>
      <button type="button" className="oz-btn-primary" onClick={onReset}>
        Скинути фільтри
      </button>
    </div>
  );
}

export default function CatalogView({ lakes, total }: Props) {
  const [showMap, setShowMap] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const bottomPanelRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFish = searchParams.get("fish") ?? "";
  const currentRegion = searchParams.get("region") ?? "";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const nextUrl = params.toString() ? `/lakes?${params.toString()}` : "/lakes";
    router.push(nextUrl);
  };

  useEffect(() => {
    if (!selectedId || !bottomPanelRef.current) return;
    const card = bottomPanelRef.current.querySelector(`[data-id="${selectedId}"]`);
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedId]);

  useEffect(() => {
    document.body.style.overflow = showMap ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMap]);

  return (
    <>
      <div className="dk-catalog-toolbar">
        <div className="dk-catalog-toolbar__count">{total} озер знайдено</div>
        <div className="dk-segmented" role="tablist" aria-label="Режим перегляду каталогу">
          <button
            type="button"
            className={`dk-segmented__button${showMap ? "" : " is-active"}`}
            onClick={() => setShowMap(false)}
          >
            Список
          </button>
          <button
            type="button"
            className={`dk-segmented__button${showMap ? " is-active" : ""}`}
            onClick={() => setShowMap(true)}
          >
            На карті
          </button>
        </div>
      </div>

      {lakes.length === 0 ? (
        <EmptyState onReset={() => router.push("/lakes")} />
      ) : (
        <div className="dk-lakes-grid">
          {lakes.map((lake) => (
            <LakeCard
              key={lake.id}
              lake={toLakeCardData({
                href: `/lakes/${getLakeRouteSlug(lake)}`,
                name: lake.name,
                image_url: lake.image_url,
                area_ha: lake.area_ha,
                city: lake.city,
                location_text: lake.location_text,
                fish_species: lake.fish_species,
                price_uah: lake.price_uah,
              })}
              onMouseEnter={() => setHoveredId(lake.id)}
              onMouseLeave={() => setHoveredId(null)}
            />
          ))}
        </div>
      )}

      {showMap && (
        <div className="dk-map-overlay">
          <div className="dk-map-topbar">
            <div className="dk-map-filters no-scrollbar">
              <span className="dk-map-filters__label">Риба:</span>
              {FISH_CHIPS.map((fishName) => (
                <button
                  key={fishName}
                  type="button"
                  onClick={() => updateFilter("fish", currentFish === fishName ? "" : fishName)}
                  className={`dk-map-fish-chip${currentFish === fishName ? " active" : ""}`}
                >
                  <FishIcon name={fishName} size={13} />
                  <span>{fishName}</span>
                </button>
              ))}

              <div className="dk-map-divider" aria-hidden="true" />

              <select
                value={currentRegion}
                onChange={(e) => updateFilter("region", e.target.value)}
                className="dk-map-region-select"
              >
                <option value="">Регіон</option>
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            <button type="button" onClick={() => setShowMap(false)} className="dk-map-close">
              Закрити
            </button>
          </div>

          <div className="dk-map-stage">
            <LakesMap
              lakes={lakes}
              hoveredId={hoveredId}
              selectedId={selectedId}
              onMarkerClick={(id) => setSelectedId(id === selectedId ? null : id)}
            />
            <div className="dk-map-count">
              <DotIcon />
              <span>{lakes.filter((lake) => lake.lat && lake.lng).length} озер на карті</span>
            </div>
          </div>

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

function MapBottomCard({
  lake,
  isSelected,
  onHover,
  onClick,
}: {
  lake: Lake;
  isSelected: boolean;
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
        <div className="dk-map-card-placeholder" aria-hidden="true">
          <MapIcon />
        </div>
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
