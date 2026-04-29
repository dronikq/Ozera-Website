"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Lake } from "@/lib/supabase";
import { getLakeRouteSlug } from "@/lib/lake-slug";

const LakesMap = dynamic(() => import("./LakesMap"), { ssr: false });

interface Props {
  lakes: Lake[];
}

export default function LakesList({ lakes }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="flex gap-6 items-start">
      {/* Left: normal page-scroll list */}
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

      {/* Right: sticky map */}
      <div
        className="w-[45%] shrink-0 sticky top-20 rounded-2xl overflow-hidden shadow-md"
        style={{ height: "calc(100vh - 80px)" }}
      >
        <LakesMap lakes={lakes} hoveredId={hoveredId} />
      </div>
    </div>
  );
}

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
      href={`/lakes/${getLakeRouteSlug(lake)}`}
      onMouseEnter={() => onHover(lake.id)}
      onMouseLeave={() => onHover(null)}
      className={`group rounded-2xl border bg-white overflow-hidden transition-all ${
        isHovered
          ? "border-[#f5c842] shadow-lg"
          : "border-blue-100 hover:border-blue-300 hover:shadow-sm"
      }`}
    >
      {/* Photo */}
      <div className="h-44 bg-blue-50 overflow-hidden">
        {lake.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lake.image_url}
            alt={lake.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">🌊</div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-1.5">
        <h2 className="font-bold text-[#0f2a4a] group-hover:text-blue-600 transition-colors">
          {lake.name}
        </h2>
        {lake.city && (
          <p className="text-xs text-blue-500 font-medium">{lake.city}</p>
        )}
        {lake.location_text && (
          <p className="text-sm text-slate-400 flex items-center gap-1">
            <span>📍</span> {lake.location_text}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-1">
          {lake.area_ha && (
            <span className="text-xs text-slate-400">{lake.area_ha} га</span>
          )}
          {lake.max_depth_m && (
            <span className="text-xs text-slate-400">до {lake.max_depth_m} м</span>
          )}
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
      </div>
    </Link>
  );
}
