import { NextRequest, NextResponse } from "next/server";

const SUCCESS_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
};

const ERROR_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

function jsonResponse(
  body: Record<string, unknown>,
  init: { status?: number; headers?: Record<string, string> } = {},
) {
  return NextResponse.json(body, {
    status: init.status,
    headers: { ...(init.headers ?? {}), ...(init.status && init.status >= 400 ? ERROR_CACHE_HEADERS : SUCCESS_CACHE_HEADERS) },
  });
}

function parseLatLng(searchParams: URLSearchParams) {
  const latRaw = searchParams.get("lat");
  const lngRaw = searchParams.get("lng");

  if (!latRaw || !lngRaw) {
    return { error: "lat and lng required" as const };
  }

  const lat = Number(latRaw);
  const lng = Number(lngRaw);

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { error: "invalid lat or lng" as const };
  }

  return { lat: lat.toString(), lng: lng.toString() };
}

function parseDays(searchParams: URLSearchParams) {
  const raw = searchParams.get("days") ?? "1";
  const days = Number(raw);

  if (!Number.isInteger(days) || days < 1 || days > 16) {
    return { error: "invalid days" as const };
  }

  return { days: String(days) };
}

// ── Source 1: Open-Meteo ──
async function fetchOpenMeteo(lat: string, lng: string, days: string) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m,precipitation,surface_pressure&forecast_days=${days}&timezone=Europe%2FKiev`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`open-meteo ${res.status}`);
  return res.json();
}

// ── Source 2: Yr.no (MET Norway) — fallback ──
function symbolToWmo(symbol: string): number {
  if (symbol.includes("clearsky"))      return 0;
  if (symbol.includes("fair"))          return 1;
  if (symbol.includes("partlycloudy")) return 2;
  if (symbol.includes("cloudy"))        return 3;
  if (symbol.includes("fog"))           return 45;
  if (symbol.includes("heavyrain"))     return 65;
  if (symbol.includes("rain"))          return 61;
  if (symbol.includes("sleet"))         return 68;
  if (symbol.includes("heavysnow"))     return 73;
  if (symbol.includes("snow"))          return 71;
  if (symbol.includes("thunder"))       return 95;
  return 3;
}

async function fetchYrNo(lat: string, lng: string) {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lng}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ozera-web/1.0 ozera@ozera.com.ua" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`yr.no ${res.status}`);
  const json = await res.json();

  // Normalize Yr.no → Open-Meteo format so components don't need changes
  const times: string[]  = [];
  const temperature_2m: number[]      = [];
  const weathercode: number[]         = [];
  const windspeed_10m: number[]       = [];
  const relativehumidity_2m: number[] = [];
  const precipitation: number[]       = [];
  const surface_pressure: number[]    = [];

  for (const entry of json.properties.timeseries) {
    times.push(entry.time); // ISO UTC — Date() handles it correctly
    const d = entry.data.instant.details;
    temperature_2m.push(d.air_temperature ?? 10);
    windspeed_10m.push((d.wind_speed ?? 0) * 3.6); // m/s → km/h
    relativehumidity_2m.push(d.relative_humidity ?? 70);
    surface_pressure.push(d.air_pressure_at_sea_level ?? 1013);
    const next1h = entry.data.next_1_hours;
    precipitation.push(next1h?.details?.precipitation_amount ?? 0);
    weathercode.push(symbolToWmo(next1h?.summary?.symbol_code ?? "cloudy"));
  }

  return {
    hourly: { time: times, temperature_2m, weathercode, windspeed_10m, relativehumidity_2m, precipitation, surface_pressure },
  };
}

// ── Handler ──
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latLng = parseLatLng(searchParams);
    if ("error" in latLng) {
      return jsonResponse({ error: latLng.error }, { status: 400 });
    }

    const daysValue = parseDays(searchParams);
    if ("error" in daysValue) {
      return jsonResponse({ error: daysValue.error }, { status: 400 });
    }

    // Try Open-Meteo first
    try {
      const data = await fetchOpenMeteo(latLng.lat, latLng.lng, daysValue.days);
      return jsonResponse(data);
    } catch {
      // fallthrough
    }

    // Fallback to Yr.no
    try {
      const data = await fetchYrNo(latLng.lat, latLng.lng);
      return jsonResponse(data);
    } catch {
      return jsonResponse({ error: "all weather sources unavailable" }, { status: 502 });
    }
  } catch {
    return jsonResponse({ error: "unexpected weather handler error" }, { status: 500 });
  }
}
