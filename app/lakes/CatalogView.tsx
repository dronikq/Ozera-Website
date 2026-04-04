"use client";

import { useState, Suspense } from "react";
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
  const [showMap, setShowMap] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div>
      {showMap ? (
        /* ── MAP MODE: filters on top, list + map side by side ── */
        <div>
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <Suspense>
              <FiltersBar />
            </Suspense>
            <button
              onClick={() => setShowMap(false)}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border border-blue-200 bg-white text-slate-500 hover:border-blue-400 hover:text-[#0f2a4a] transition-all shrink-0"
            >
              <span>⊠</span> Сховати карту
            </button>
          </div>

          <div className="flex gap-6 items-start">
            {/* List */}
            <div className="flex-1 flex flex-col gap-4">
              {lakes.length === 0 ? (
                <p className="text-slate-400 text-center py-20">Нічого не знайдено</p>
              ) : (
                lakes.map((lake) => (
                  <LakeCard
                    key={lake.id}
                    lake={lake}
                    isHovered={hoveredId === lake.id}
                    onHover={setHoveredId}
                  />
                ))
              )}
            </div>

            {/* Map */}
            <div
              className="w-[45%] shrink-0 sticky top-20 rounded-2xl overflow-hidden shadow-md"
              style={{ height: "calc(100vh - 80px)" }}
            >
              <LakesMap lakes={lakes} hoveredId={hoveredId} />
            </div>
          </div>
        </div>
      ) : (
        /* ── LIST MODE: filters on left, grid on right ── */
        <div className="flex gap-8 items-start">
          {/* Left sidebar — filters */}
          <div className="w-64 shrink-0 sticky top-20 flex flex-col gap-4">
            <p className="text-sm text-slate-400">Знайдено {total} озер</p>
            <Suspense>
              <FiltersBar vertical />
            </Suspense>
          </div>

          {/* Right — grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <span />
              <button
                onClick={() => setShowMap(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border border-blue-200 bg-white text-slate-500 hover:border-blue-400 hover:text-[#0f2a4a] transition-all"
              >
                <span>🗺</span> Показати карту
              </button>
            </div>

            {lakes.length === 0 ? (
              <p className="text-slate-400 text-center py-20">Нічого не знайдено</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {lakes.map((lake) => (
                  <GridCard key={lake.id} lake={lake} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── List card (map mode) ── */
function LakeCard({
  lake,
  isHovered,
  onHover,
}: {
  lake: Lake;
  isHovered: boolean;
  onHover: (id: string | null) => void;
}) {
  return (
    <Link
      href={`/lakes/${lake.id}`}
      onMouseEnter={() => onHover(lake.id)}
      onMouseLeave={() => onHover(null)}
      className={`group rounded-2xl border bg-white overflow-hidden transition-all ${
        isHovered ? "border-[#f5c842] shadow-lg" : "border-blue-100 hover:border-blue-300 hover:shadow-sm"
      }`}
    >
      <div className="h-44 bg-blue-50 overflow-hidden">
        {lake.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lake.image_url} alt={lake.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🌊</div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1.5">
        <h2 className="font-bold text-[#0f2a4a] group-hover:text-blue-600 transition-colors">{lake.name}</h2>
        {lake.city && <p className="text-xs text-blue-500 font-medium">{lake.city}</p>}
        {lake.location_text && (
          <p className="text-sm text-slate-400 flex items-center gap-1">
            <span>📍</span> {lake.location_text}
          </p>
        )}
        <CardTags lake={lake} />
      </div>
    </Link>
  );
}

/* ── Grid card (list mode) ── */
function GridCard({ lake }: { lake: Lake }) {
  return (
    <Link
      href={`/lakes/${lake.id}`}
      className="group rounded-2xl border border-blue-100 bg-white overflow-hidden hover:border-blue-400 hover:shadow-md transition-all"
    >
      <div className="h-44 bg-blue-50 overflow-hidden">
        {lake.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lake.image_url} alt={lake.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🌊</div>
        )}
      </div>
      <div className="p-4 flex flex-col gap-1.5">
        <h2 className="font-bold text-[#0f2a4a] group-hover:text-blue-600 transition-colors">{lake.name}</h2>
        {lake.city && <p className="text-xs text-blue-500 font-medium">{lake.city}</p>}
        {lake.location_text && (
          <p className="text-sm text-slate-400 flex items-center gap-1 truncate">
            <span>📍</span> <span className="truncate">{lake.location_text}</span>
          </p>
        )}
        <CardTags lake={lake} />
      </div>
    </Link>
  );
}

function CardTags({ lake }: { lake: Lake }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {lake.area_ha && <span className="text-xs text-slate-400">{lake.area_ha} га</span>}
      {lake.max_depth_m && <span className="text-xs text-slate-400">до {lake.max_depth_m} м</span>}
      {lake.price_uah && (
        <span className="text-xs font-semibold text-[#0f2a4a] bg-[#f5c842]/20 px-1.5 py-0.5 rounded-md">
          від {lake.price_uah} грн
        </span>
      )}
      {lake.fish_species && lake.fish_species.length > 0 && (
        <span className="text-xs text-blue-500">
          🐟 {lake.fish_species.slice(0, 2).join(", ")}
          {lake.fish_species.length > 2 ? ` +${lake.fish_species.length - 2}` : ""}
        </span>
      )}
    </div>
  );
}
