"use client";

import { useEffect, useRef, useState } from "react";
import type { Lake } from "@/lib/supabase";

const TILE_STYLES = [
  {
    id: "osm",
    label: "Стандарт",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "© OpenStreetMap contributors",
  },
  {
    id: "positron",
    label: "Світла",
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap contributors © CARTO",
  },
  {
    id: "dark",
    label: "Темна",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap contributors © CARTO",
  },
  {
    id: "voyager",
    label: "Voyager",
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution: "© OpenStreetMap contributors © CARTO",
  },
];

interface Props {
  lakes: Pick<Lake, "id" | "name" | "lat" | "lng" | "city" | "location_text">[];
  hoveredId: string | null;
}

export default function LakesMap({ lakes, hoveredId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Record<string, import("leaflet").CircleMarker>>({});
  const tileLayerRef = useRef<import("leaflet").TileLayer | null>(null);
  const [activeStyle, setActiveStyle] = useState("osm");

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

      const style = TILE_STYLES[0];
      tileLayerRef.current = L.tileLayer(style.url, {
        attribution: style.attribution,
        maxZoom: 18,
      }).addTo(map);

      lakesWithCoords.forEach((lake) => {
        const marker = L.circleMarker([lake.lat!, lake.lng!], {
          radius: 8,
          fillColor: "#f5c842",
          color: "#0f2a4a",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        }).addTo(map);

        const location = lake.location_text || lake.city || "";
        marker.bindPopup(
          `<div style="min-width:140px">
            <strong style="color:#0f2a4a;font-size:13px">${lake.name}</strong>
            ${location ? `<br/><span style="color:#666;font-size:11px">📍 ${location}</span>` : ""}
            <br/><a href="/lakes/${lake.id}" target="_blank" rel="noopener noreferrer" style="color:#1d6ee6;font-size:12px;text-decoration:none;display:inline-block;margin-top:4px">Відкрити →</a>
          </div>`,
          { maxWidth: 200, autoPan: false }
        );

        markersRef.current[lake.id] = marker;
      });

      mapRef.current = map;
    })();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Highlight marker on hover
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      if (id === hoveredId) {
        marker.setStyle({ radius: 12, fillColor: "#f5c842", color: "#0f2a4a", weight: 3, fillOpacity: 1 });
        marker.openPopup();
      } else {
        marker.setStyle({ radius: 8, fillColor: "#f5c842", color: "#0f2a4a", weight: 2, fillOpacity: 0.85 });
      }
    });
  }, [hoveredId]);

  // Swap tile layer when style changes
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
      <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 rounded-2xl text-slate-400 gap-2">
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
