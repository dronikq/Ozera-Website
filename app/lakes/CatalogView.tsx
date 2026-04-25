"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Lake } from "@/lib/supabase";
import FiltersBar from "./FiltersBar";

const LakesMap = dynamic(() => import("./LakesMap"), { ssr: false });

interface Props {
  lakes: Lake[];
  total: number;
}

export default function CatalogView({ lakes, total }: Props) {
  const [showMap, setShowMap] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const bottomPanelRef = useRef<HTMLDivElement>(null);

  // Scroll selected card into view in bottom panel
  useEffect(() => {
    if (!selectedId || !bottomPanelRef.current) return;
    const card = bottomPanelRef.current.querySelector(`[data-id="${selectedId}"]`);
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedId]);

  // Lock body scroll when map overlay is open
  useEffect(() => {
    if (showMap) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showMap]);

  return (
    <>
      {/* ── FILTERS ROW ── */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <Suspense>
          <FiltersBar />
        </Suspense>
        <div className="ml-auto shrink-0">
          <button
            onClick={() => setShowMap(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#0f2a4a] text-white hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
          >
            🗺️ На карті
          </button>
        </div>
      </div>

      {/* ── GRID ── */}
      {lakes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <span className="text-5xl">🎣</span>
          <p className="text-lg font-medium">Нічого не знайдено</p>
          <p className="text-sm">Спробуй змінити фільтри</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {lakes.map((lake) => (
            <GridCard key={lake.id} lake={lake} />
          ))}
        </div>
      )}

      {/* ── MAP OVERLAY ── */}
      {showMap && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Top bar */}
          <div className="shrink-0 bg-white/95 backdrop-blur-xl border-b border-blue-100 px-5 py-3 flex items-center gap-4 shadow-sm z-10">
            <div className="flex-1 min-w-0">
              <Suspense>
                <FiltersBar />
              </Suspense>
            </div>
            <button
              onClick={() => setShowMap(false)}
              className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border border-blue-200 bg-white text-slate-500 hover:border-red-300 hover:text-red-500 transition-all"
            >
              ✕ Закрити
            </button>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <LakesMap
              lakes={lakes}
              hoveredId={hoveredId}
              selectedId={selectedId}
              onMarkerClick={(id) => setSelectedId(id === selectedId ? null : id)}
            />

            {/* Lakes count badge */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-md border border-blue-100 text-xs font-medium text-slate-600 pointer-events-none">
              📍 {lakes.filter(l => l.lat && l.lng).length} озер на карті
            </div>
          </div>

          {/* Bottom cards panel */}
          <div className="shrink-0 bg-white border-t border-blue-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
            <div
              ref={bottomPanelRef}
              className="flex gap-3 overflow-x-auto px-5 py-4 no-scrollbar"
            >
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

/* ── Grid card (default view) ── */
function GridCard({ lake }: { lake: Lake }) {
  return (
    <Link
      href={`/lakes/${lake.id}`}
      className="group rounded-2xl border border-blue-100 bg-white overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-200"
    >
      <div className="h-48 bg-blue-50 overflow-hidden relative">
        {lake.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lake.image_url}
            alt={lake.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-blue-50 to-blue-100">🌊</div>
        )}
        {lake.price_uah && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold text-[#0f2a4a] shadow-sm">
            від {lake.price_uah} ₴
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h2 className="font-bold text-[#0f2a4a] group-hover:text-blue-600 transition-colors leading-tight">
          {lake.name}
        </h2>
        {lake.city && (
          <p className="text-xs text-blue-500 font-medium">{lake.city}</p>
        )}
        {lake.location_text && (
          <p className="text-sm text-slate-400 flex items-center gap-1 truncate">
            <span>📍</span>
            <span className="truncate">{lake.location_text}</span>
          </p>
        )}
        {lake.fish_species && lake.fish_species.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap mt-0.5">
            <span className="text-xs">🐟</span>
            <span className="text-xs text-slate-500">
              {lake.fish_species.slice(0, 3).join(", ")}
              {lake.fish_species.length > 3 ? ` +${lake.fish_species.length - 3}` : ""}
            </span>
          </div>
        )}
        {lake.area_ha && (
          <p className="text-xs text-slate-400">{lake.area_ha} га</p>
        )}
      </div>
    </Link>
  );
}

/* ── Horizontal card in map bottom panel ── */
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
      className={`shrink-0 w-56 rounded-2xl border bg-white overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected
          ? "border-blue-500 shadow-lg shadow-blue-100 ring-2 ring-blue-400/30"
          : "border-blue-100 hover:border-blue-300 hover:shadow-md"
      }`}
      onMouseEnter={() => onHover(lake.id)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
    >
      <div className="h-28 bg-blue-50 overflow-hidden">
        {lake.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lake.image_url} alt={lake.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-blue-50 to-blue-100">🌊</div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1">
        <p className="font-semibold text-[#0f2a4a] text-sm leading-tight truncate">{lake.name}</p>
        {lake.city && <p className="text-xs text-blue-500">{lake.city}</p>}
        {lake.price_uah && (
          <p className="text-xs font-bold text-[#0f2a4a]">від {lake.price_uah} ₴</p>
        )}
        <Link
          href={`/lakes/${lake.id}`}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Відкрити →
        </Link>
      </div>
    </div>
  );
}
