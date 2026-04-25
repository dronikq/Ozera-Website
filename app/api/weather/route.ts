import { NextRequest, NextResponse } from "next/server";

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
  const { searchParams } = new URL(req.url);
  const lat  = searchParams.get("lat");
  const lng  = searchParams.get("lng");
  const days = searchParams.get("days") ?? "1";

  if (!lat || !lng) {
    return NextResponse.json({ error: "lat and lng required" }, { status: 400 });
  }

  // Try Open-Meteo first
  try {
    const data = await fetchOpenMeteo(lat, lng, days);
    return NextResponse.json(data);
  } catch { /* fallthrough */ }

  // Fallback to Yr.no
  try {
    const data = await fetchYrNo(lat, lng);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "all weather sources unavailable" }, { status: 502 });
  }
}
