"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Lake } from "@/lib/supabase";
import { getLakeRouteSlug } from "@/lib/lake-slug";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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

/** Bounds used for "Огляд України" button and initial fit */
const UKRAINE_BOUNDS: [[number, number], [number, number]] = [
  [44.1, 22.1],
  [52.4, 40.3],
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LakePinData = Pick<
  Lake,
  "id" | "slug" | "name" | "lat" | "lng" | "city" | "location_text" | "image_url" | "price_uah" | "fish_species"
>;

interface Props {
  lakes: LakePinData[];
  hoveredId: string | null;
  selectedId?: string | null;
  onMarkerClick?: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function LakesMap({ lakes, hoveredId, selectedId, onMarkerClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Leaflet + map instances stored in refs (never trigger re-render)
  const LRef             = useRef<any>(null);
  const mapRef           = useRef<any>(null);
  const tileLayerRef     = useRef<any>(null);
  const clusterLayerRef  = useRef<any>(null);
  const superclusterRef  = useRef<any>(null);
  const geoMarkerRef     = useRef<any>(null);

  // Latest prop values accessible from stable callbacks without stale closures
  const hoveredIdRef      = useRef<string | null>(hoveredId);
  const selectedIdRef     = useRef<string | null>(selectedId ?? null);
  const onMarkerClickRef  = useRef(onMarkerClick);
  const prevLakesKeyRef   = useRef<string>("");

  const [activeStyle, setActiveStyle] = useState("positron");

  const lakesWithCoords = lakes.filter((l) => l.lat != null && l.lng != null);

  // ---------------------------------------------------------------------------
  // Build tooltip / popup HTML
  // ---------------------------------------------------------------------------

  const buildTooltipHtml = useCallback((lake: LakePinData) => {
    const imgHtml = lake.image_url
      ? `<img src="${lake.image_url}" alt="${lake.name}" style="width:100%;height:110px;object-fit:cover;display:block;" />`
      : `<div style="width:100%;height:110px;background:linear-gradient(135deg,#e0f0ff,#bfdbff);display:flex;align-items:center;justify-content:center;font-size:32px;">🌊</div>`;

    const locationLine = lake.location_text || lake.city || "";
    const canonicalSlug = getLakeRouteSlug(lake);

    const fishLine = lake.fish_species?.length
      ? `<div style="font-size:11px;color:#64748b;margin-top:2px;">🐟 ${lake.fish_species.slice(0, 2).join(", ")}${lake.fish_species.length > 2 ? ` +${lake.fish_species.length - 2}` : ""}</div>`
      : "";

    const priceLine = lake.price_uah
      ? `<div style="margin-top:5px;"><span style="background:#f5c842;color:#0f2a4a;font-size:11px;font-weight:700;padding:2px 7px;border-radius:6px;">від ${lake.price_uah} ₴</span></div>`
      : "";

    return `
      <div class="lake-pin-card">
        ${imgHtml}
        <div style="padding:10px 12px 12px;">
          <div style="font-weight:700;font-size:13px;color:#0f2a4a;line-height:1.3;">${lake.name}</div>
          ${locationLine ? `<div style="font-size:11px;color:#94a3b8;margin-top:2px;">📍 ${locationLine}</div>` : ""}
          ${fishLine}
          ${priceLine}
          <a href="/lakes/${canonicalSlug}" style="display:inline-block;margin-top:8px;font-size:11px;color:#2563eb;font-weight:600;text-decoration:none;">Відкрити →</a>
        </div>
      </div>`;
  }, []);

  // ---------------------------------------------------------------------------
  // Render clusters — reads latest values from refs, no stale-closure issues
  // ---------------------------------------------------------------------------

  const renderClusters = useCallback(() => {
    const L     = LRef.current;
    const map   = mapRef.current;
    const sc    = superclusterRef.current;
    const layer = clusterLayerRef.current;
    if (!L || !map || !sc || !layer) return;

    layer.clearLayers();

    const b      = map.getBounds();
    const zoom   = Math.floor(map.getZoom());
    const items  = sc.getClusters(
      [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
      zoom,
    ) as any[];

    for (const item of items) {
      const [lng, lat] = item.geometry.coordinates as [number, number];

      if (item.properties.cluster) {
        // ── Cluster bubble ──────────────────────────────────────────────────
        const count  = item.properties.point_count as number;
        const size   = count < 10 ? 36 : count < 50 ? 44 : 52;
        const icon   = L.divIcon({
          html: `<div class="map-cluster-icon" style="width:${size}px;height:${size}px;line-height:${size}px;">${count}</div>`,
          className: "",
          iconSize:  [size, size],
          iconAnchor:[size / 2, size / 2],
        });
        L.marker([lat, lng], { icon })
          .on("click", () => {
            const z = sc.getClusterExpansionZoom(item.id);
            map.flyTo([lat, lng], Math.min(z + 0.5, 14), { duration: 0.75 });
          })
          .addTo(layer);
      } else {
        // ── Single lake marker ───────────────────────────────────────────────
        const lake       = item.properties as LakePinData;
        const isSelected = lake.id === selectedIdRef.current;
        const isHovered  = lake.id === hoveredIdRef.current;

        const style = isSelected
          ? { radius: 13, fillColor: "#2563eb", color: "#fff",    weight: 3, fillOpacity: 1   }
          : isHovered
          ? { radius: 12, fillColor: "#f5c842", color: "#0f2a4a", weight: 3, fillOpacity: 1   }
          : { radius: 9,  fillColor: "#f5c842", color: "#0f2a4a", weight: 2, fillOpacity: 0.9 };

        const marker      = L.circleMarker([lat, lng], style);
        const tooltipHtml = buildTooltipHtml(lake);

        marker.bindTooltip(tooltipHtml, {
          direction: "top", offset: [0, -8], opacity: 1,
          className: "lake-pin-tooltip", sticky: false,
        });
        marker.bindPopup(tooltipHtml, {
          maxWidth: 200, minWidth: 200, autoPan: false,
          closeButton: true, className: "lake-pin-popup",
        });
        marker.on("click", () => {
          marker.closeTooltip();
          marker.openPopup();
          onMarkerClickRef.current?.(lake.id);
        });
        marker.addTo(layer);
      }
    }
  }, [buildTooltipHtml]);

  // ---------------------------------------------------------------------------
  // ① ONE-TIME MAP INITIALISATION
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L           = (await import("leaflet")).default;
      const { default: Supercluster } = await import("supercluster");
      await import("leaflet/dist/leaflet.css");
      if (cancelled) return;

      LRef.current = L;

      // ── Map instance ────────────────────────────────────────────────────────
      const map = L.map(containerRef.current!, {
        center: [49.0, 31.5],
        zoom: 6,
        zoomControl: false,
      });
      L.control.zoom({ position: "topright" }).addTo(map);

      // ── Tile layer ──────────────────────────────────────────────────────────
      const initStyle = TILE_STYLES[0];
      tileLayerRef.current = L.tileLayer(initStyle.url, {
        attribution: initStyle.attribution,
        maxZoom: 18,
      }).addTo(map);

      // ── Ukraine border mask (dims area outside Ukraine) ─────────────────────
      try {
        const res      = await fetch("/ukraine-border.json");
        const geoData  = await res.json();
        const rawCoords = geoData.geometry.coordinates[0] as [number, number][];
        // GeoJSON is [lng, lat] → Leaflet needs [lat, lng]
        const ukrLatLngs = rawCoords.map(([lng, lat]) => [lat, lng] as [number, number]);

        // Dark mask outside Ukraine (evenodd = hole-punch)
        const worldRect: [number, number][] = [[-90, -180], [-90, 180], [90, 180], [90, -180]];
        (L.polygon as any)([worldRect, ukrLatLngs], {
          fillRule:    "evenodd",
          fillColor:   "#0B1F3A",
          fillOpacity: 0.42,
          stroke:      false,
          interactive: false,
        }).addTo(map);

        // Blue border line
        L.polygon(ukrLatLngs, {
          fill:        false,
          color:       "#4DA3FF",
          weight:      1.5,
          opacity:     0.55,
          interactive: false,
          dashArray:   undefined,
        }).addTo(map);
      } catch (e) {
        console.warn("Ukraine border failed to load:", e);
      }

      // ── Supercluster ────────────────────────────────────────────────────────
      const sc = new (Supercluster as any)({ radius: 60, maxZoom: 14, minPoints: 2 });
      superclusterRef.current = sc;

      const initialLakes = lakes.filter((l) => l.lat != null && l.lng != null);
      sc.load(
        initialLakes.map((lake) => ({
          type: "Feature" as const,
          properties: lake,
          geometry: { type: "Point" as const, coordinates: [lake.lng!, lake.lat!] },
        })),
      );
      prevLakesKeyRef.current = initialLakes.map((l) => l.id).sort().join(",");

      // ── Cluster layer ───────────────────────────────────────────────────────
      clusterLayerRef.current = L.layerGroup().addTo(map);

      // ── Map events → re-render clusters ────────────────────────────────────
      map.on("moveend zoomend", renderClusters);

      // ── Geolocation button ──────────────────────────────────────────────────
      const GeoCtrl = L.Control.extend({
        onAdd() {
          const btn = L.DomUtil.create("button", "map-ctrl-btn map-ctrl-geo");
          btn.title = "Моє місцезнаходження";
          btn.innerHTML =
            `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2">` +
            `<circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/>` +
            `<line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/>` +
            `<line x1="18" y1="12" x2="22" y2="12"/></svg>`;
          L.DomEvent.on(btn, "click", (e: Event) => {
            L.DomEvent.stopPropagation(e);
            if (!navigator.geolocation) return;
            btn.classList.add("map-ctrl-loading");
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                btn.classList.remove("map-ctrl-loading");
                const { latitude, longitude } = pos.coords;
                if (geoMarkerRef.current) map.removeLayer(geoMarkerRef.current);
                const icon = L.divIcon({
                  html: `<div class="map-geo-dot"></div>`,
                  className: "",
                  iconSize:   [16, 16],
                  iconAnchor: [8, 8],
                });
                geoMarkerRef.current = L.marker([latitude, longitude], { icon }).addTo(map);
                map.flyTo([latitude, longitude], 11, { duration: 1.2 });
              },
              () => { btn.classList.remove("map-ctrl-loading"); },
            );
          });
          return btn;
        },
      });
      new GeoCtrl({ position: "bottomright" }).addTo(map);

      // ── Ukraine overview button ─────────────────────────────────────────────
      const UkrCtrl = L.Control.extend({
        onAdd() {
          const btn = L.DomUtil.create("button", "map-ctrl-btn map-ctrl-ukraine");
          btn.title = "Огляд України";
          btn.innerHTML = "🇺🇦";
          L.DomEvent.on(btn, "click", (e: Event) => {
            L.DomEvent.stopPropagation(e);
            map.flyToBounds(UKRAINE_BOUNDS, { padding: [40, 40], maxZoom: 7, duration: 1.2 });
          });
          return btn;
        },
      });
      new UkrCtrl({ position: "bottomright" }).addTo(map);

      mapRef.current = map;

      // ── Initial fly-to + render ─────────────────────────────────────────────
      if (initialLakes.length > 0) {
        const bounds = L.latLngBounds(initialLakes.map((l) => [l.lat!, l.lng!]));
        map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 12, duration: 1.0 });
      }
      renderClusters();
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      LRef.current = null;
      clusterLayerRef.current = null;
      superclusterRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // ② LAKES CHANGED → reload supercluster + fly to new bounds
  //    (fires when filter / search changes from parent)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const sc  = superclusterRef.current;
    const map = mapRef.current;
    const L   = LRef.current;
    if (!sc || !map || !L) return;

    const newKey = lakesWithCoords.map((l) => l.id).sort().join(",");
    if (newKey === prevLakesKeyRef.current) {
      renderClusters(); // styles may have changed (hover/select)
      return;
    }
    prevLakesKeyRef.current = newKey;

    sc.load(
      lakesWithCoords.map((lake) => ({
        type:       "Feature" as const,
        properties: lake,
        geometry:   { type: "Point" as const, coordinates: [lake.lng!, lake.lat!] },
      })),
    );
    renderClusters();

    // Fly to new filtered results
    if (lakesWithCoords.length > 0) {
      const bounds = L.latLngBounds(lakesWithCoords.map((l) => [l.lat!, l.lng!]));
      map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 12, duration: 1.0 });
    } else {
      // No results → zoom out to Ukraine overview
      map.flyToBounds(UKRAINE_BOUNDS, { padding: [40, 40], maxZoom: 7, duration: 1.0 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lakes, renderClusters]);

  // ---------------------------------------------------------------------------
  // ③ HOVER / SELECTION → update marker styles (re-render clusters in place)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    hoveredIdRef.current  = hoveredId;
    selectedIdRef.current = selectedId ?? null;
    renderClusters();
  }, [hoveredId, selectedId, renderClusters]);

  // ---------------------------------------------------------------------------
  // ④ TILE STYLE SWAP
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const map = mapRef.current;
    const L   = LRef.current;
    if (!map || !L || !tileLayerRef.current) return;
    const style = TILE_STYLES.find((s) => s.id === activeStyle)!;
    tileLayerRef.current.remove();
    tileLayerRef.current = L.tileLayer(style.url, {
      attribution: style.attribution,
      maxZoom: 18,
    }).addTo(map);
  }, [activeStyle]);

  // ── Keep callback ref in sync ────────────────────────────────────────────────
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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

      {/* Tile style switcher */}
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
