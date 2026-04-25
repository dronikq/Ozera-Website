"use client";

import { useEffect, useRef, useState } from "react";
import type { Lake } from "@/lib/supabase";

const TILE_STYLES = [
  {
    id: "positron",
    label: "Світла",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap contributors © CARTO",
  },
  {
    id: "osm",
    label: "Стандарт",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  },
  {
    id: "voyager",
    label: "Voyager",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap contributors © CARTO",
  },
];

type LakePinData = Pick<
  Lake,
  "id" | "name" | "lat" | "lng" | "city" | "location_text" | "image_url" | "price_uah" | "fish_species"
>;

interface Props {
  lakes: LakePinData[];
  hoveredId: string | null;
  selectedId?: string | null;
  onMarkerClick?: (id: string) => void;
}

export default function LakesMap({ lakes, hoveredId, selectedId, onMarkerClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Record<string, import("leaflet").CircleMarker>>({});
  const tileLayerRef = useRef<import("leaflet").TileLayer | null>(null);
  const [activeStyle, setActiveStyle] = useState("positron");

  const lakesWithCoords = lakes.filter((l) => l.lat != null && l.lng != null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      const map = L.map(containerRef.current!, {
        center: [49.0, 31.5],
        zoom: 6,
        zoomControl: true,
      });

      const style = TILE_STYLES.find((s) => s.id === activeStyle) ?? TILE_STYLES[0];
      tileLayerRef.current = L.tileLayer(style.url, {
        attribution: style.attribution,
        maxZoom: 18,
      }).addTo(map);

      lakesWithCoords.forEach((lake) => {
        const marker = L.circleMarker([lake.lat!, lake.lng!], {
          radius: 9,
          fillColor: "#f5c842",
          color: "#0f2a4a",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9,
        }).addTo(map);

        // Build hover card HTML
        const imgHtml = lake.image_url
          ? `<img src="${lake.image_url}" alt="${lake.name}" style="width:100%;height:110px;object-fit:cover;display:block;" />`
          : `<div style="width:100%;height:110px;background:linear-gradient(135deg,#e0f0ff,#bfdbff);display:flex;align-items:center;justify-content:center;font-size:32px;">🌊</div>`;

        const locationLine = lake.location_text || lake.city || "";
        const fishLine = lake.fish_species?.length
          ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">🐟 ${lake.fish_species.slice(0, 2).join(", ")}${lake.fish_species.length > 2 ? ` +${lake.fish_species.length - 2}` : ""}</div>`
          : "";

        const priceLine = lake.price_uah
          ? `<div style="margin-top:5px;"><span style="background:#f5c842;color:#0f2a4a;font-size:11px;font-weight:700;padding:2px 7px;border-radius:6px;">від ${lake.price_uah} ₴</span></div>`
          : "";

        const tooltipHtml = `
          <div class="lake-pin-card">
            ${imgHtml}
            <div style="padding:10px 12px 12px;">
              <div style="font-weight:700;font-size:13px;color:#0f2a4a;line-height:1.3;">${lake.name}</div>
              ${locationLine ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px;">📍 ${locationLine}</div>` : ""}
              ${fishLine}
              ${priceLine}
              <a href="/lakes/${lake.id}" style="display:inline-block;margin-top:8px;font-size:11px;color:#2563eb;font-weight:600;text-decoration:none;">Відкрити →</a>
            </div>
          </div>`;

        marker.bindTooltip(tooltipHtml, {
          direction: "top",
          offset: [0, -8],
          opacity: 1,
          className: "lake-pin-tooltip",
          sticky: false,
        });

        marker.on("click", () => {
          onMarkerClick?.(lake.id);
        });

        markersRef.current[lake.id] = marker;
      });

      // Auto-fit bounds
      if (lakesWithCoords.length > 0) {
        const bounds = L.latLngBounds(lakesWithCoords.map((l) => [l.lat!, l.lng!]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 12 });
      }

      mapRef.current = map;
    })();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Highlight marker on hover or selection
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const isSelected = id === selectedId;
      const isHovered = id === hoveredId;
      if (isSelected) {
        marker.setStyle({ radius: 13, fillColor: "#2563eb", color: "#fff", weight: 3, fillOpacity: 1 });
      } else if (isHovered) {
        marker.setStyle({ radius: 12, fillColor: "#f5c842", color: "#0f2a4a", weight: 3, fillOpacity: 1 });
      } else {
        marker.setStyle({ radius: 9, fillColor: "#f5c842", color: "#0f2a4a", weight: 2, fillOpacity: 0.9 });
      }
    });
  }, [hoveredId, selectedId]);

  // Swap tile layer
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    (async () => {
      const L = (await import("leaflet")).default;
      const style = TILE_STYLES.find((s) => s.id === activeStyle)!;
      tileLayerRef.current!.remove();
      tileLayerRef.current = L.tileLayer(style.url, {
        attribution: style.attribution,
        maxZoom: 18,
      }).addTo(mapRef.current!);
    })();
  }, [activeStyle]);

  if (lakesWithCoords.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 text-slate-400 gap-2">
        <span className="text-4xl">🗺️</span>
        <span className="text-sm">Координати озер ще не додані</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {/* Style switcher */}
      <div className="absolute bottom-8 left-2 z-[1000] flex flex-col gap-1">
        {TILE_STYLES.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveStyle(s.id)}
            className={`px-2 py-1 text-xs rounded-lg border shadow-sm transition-all ${
              activeStyle === s.id
                ? "bg-[#f5c842] border-[#f5c842] text-[#0f2a4a] font-semibold"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
