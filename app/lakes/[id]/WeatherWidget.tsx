"use client";

import { useEffect, useMemo, useState } from "react";

type HourData = {
  hour: number;
  temp: number;
  icon: string;
  desc: string;
  wind: number;
  humidity: number;
  rain: number;
  pressure: number;
  biteScore: number;
  biteClass: "g" | "o" | "b";
  solType: "major" | "minor" | null;
};

type DayData = {
  shortLabel: string;
  dateStr: string;
  hours: HourData[];
  biteClass: "g" | "o" | "b";
};

type WeatherData = {
  days: DayData[];
};

function weatherInfo(code: number, hour: number) {
  const night = hour < 6 || hour >= 21;
  if (code === 0) return { icon: night ? "🌙" : "☀️", desc: "Ясно" };
  if (code <= 2) return { icon: night ? "🌙" : "🌤️", desc: "Малохмарно" };
  if (code === 3) return { icon: "☁️", desc: "Хмарно" };
  if (code <= 49) return { icon: "🌫", desc: "Туман" };
  if (code <= 55) return { icon: "🌦", desc: "Мряка" };
  if (code <= 65) return { icon: "🌧", desc: "Дощ" };
  if (code <= 77) return { icon: "🌨", desc: "Сніг" };
  if (code <= 82) return { icon: "🌦", desc: "Злива" };
  if (code <= 99) return { icon: "⛈", desc: "Гроза" };
  return { icon: "🌤️", desc: "Ясно" };
}

function moonPhase(date: Date): number {
  const known = new Date(2000, 0, 6);
  const diff = (date.getTime() - known.getTime()) / (1000 * 60 * 60 * 24);
  return (((diff % 29.53) + 29.53) % 29.53) / 29.53;
}

function moonIcon(phase: number): string {
  if (phase < 0.0625 || phase >= 0.9375) return "🌑";
  if (phase < 0.1875) return "🌒";
  if (phase < 0.3125) return "🌓";
  if (phase < 0.4375) return "🌔";
  if (phase < 0.5625) return "🌕";
  if (phase < 0.6875) return "🌖";
  if (phase < 0.8125) return "🌗";
  return "🌘";
}

function moonLabel(phase: number): string {
  if (phase < 0.05 || phase > 0.95) return "Новий місяць";
  if (phase < 0.25) return "Зростаючий";
  if (phase < 0.55) return "Повний місяць";
  if (phase < 0.75) return "Спадаючий";
  return "Старий місяць";
}

function getSolunarPeaks(date: Date): { major: number[]; minor: number[] } {
  const phase = moonPhase(date);
  const moonTransit = (phase * 24 + date.getDate() * 0.8) % 24;
  const major1 = Math.round(moonTransit) % 24;
  const major2 = (major1 + 12) % 24;
  const minor1 = (major1 + 6) % 24;
  const minor2 = (major1 + 18) % 24;
  return { major: [major1, major2], minor: [minor1, minor2] };
}

function calcBiteScore(temp: number, wind: number, rain: number, pressure: number, moonPh: number, solType: "major" | "minor" | null): number {
  let score = 5;
  if (temp >= 10 && temp <= 20) score += 1.5;
  else if (temp >= 5 && temp < 10) score += 0.5;
  else if (temp > 20 && temp <= 28) score += 0.8;
  else score -= 1;

  if (wind <= 2) score += 1;
  else if (wind <= 4) score += 0.5;
  else if (wind >= 7) score -= 2;
  else score -= 1;

  if (rain === 0) score += 0.5;
  else if (rain <= 2) score += 0.2;
  else if (rain > 5) score -= 1.5;

  const pressDiff = Math.abs(pressure - 1013);
  if (pressDiff < 5) score += 1;
  else if (pressDiff < 10) score += 0.3;
  else score -= 1;

  if (moonPh < 0.1 || moonPh > 0.9 || (moonPh > 0.45 && moonPh < 0.55)) score += 1;
  if (solType === "major") score += 1.5;
  if (solType === "minor") score += 0.8;

  return Math.max(0, Math.min(10, score));
}

function biteClass(score: number): "g" | "o" | "b" {
  if (score >= 7) return "g";
  if (score >= 4.5) return "o";
  return "b";
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}&days=5`);
  const json = await res.json();
  const hourly = json.hourly;

  const dayMap = new Map<string, HourData[]>();
  const times: string[] = hourly.time ?? [];

  times.forEach((t, i) => {
    const d = new Date(t);
    const dateKey = t.slice(0, 10);
    if (!dayMap.has(dateKey)) dayMap.set(dateKey, []);

    const phase = moonPhase(d);
    const peaks = getSolunarPeaks(d);
    const hour = d.getHours();
    let solType: "major" | "minor" | null = null;
    if (peaks.major.includes(hour)) solType = "major";
    else if (peaks.minor.includes(hour)) solType = "minor";

    const pressure = hourly.surface_pressure?.[i] ?? 1013;
    const wind = hourly.windspeed_10m?.[i] ?? 0;
    const rain = hourly.precipitation?.[i] ?? 0;
    const temp = Math.round(hourly.temperature_2m?.[i] ?? 10);
    const code = hourly.weathercode?.[i] ?? 0;
    const { icon, desc } = weatherInfo(code, hour);
    const score = calcBiteScore(temp, wind / 3.6, rain, pressure, phase, solType);

    dayMap.get(dateKey)!.push({
      hour,
      temp,
      icon,
      desc,
      wind: Math.round((wind / 3.6) * 10) / 10,
      humidity: hourly.relativehumidity_2m?.[i] ?? 0,
      rain,
      pressure: Math.round(pressure),
      biteScore: Math.round(score * 10) / 10,
      biteClass: biteClass(score),
      solType,
    });
  });

  const days: DayData[] = [];
  const ukDays = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const ukMonths = ["січ", "лют", "бер", "квіт", "трав", "чер", "лип", "серп", "вер", "жовт", "лист", "груд"];

  dayMap.forEach((hours, dateKey) => {
    const d = new Date(`${dateKey}T12:00:00`);
    const isToday = d.toDateString() === new Date().toDateString();
    const isTomorrow = d.toDateString() === new Date(Date.now() + 86400000).toDateString();
    const shortLabel = isToday ? "Сьогодні" : isTomorrow ? "Завтра" : `${ukDays[d.getDay()]} ${d.getDate()} ${ukMonths[d.getMonth()]}`;
    const avg = hours.reduce((sum, item) => sum + item.biteScore, 0) / hours.length;

    days.push({
      shortLabel,
      dateStr: dateKey,
      hours,
      biteClass: biteClass(avg),
    });
  });

  return { days: days.slice(0, 5) };
}

export default function WeatherWidget({ lat, lng }: { lat: number; lng: number }) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [activeHour, setActiveHour] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(false);
      try {
        const next = await fetchWeather(lat, lng);
        if (cancelled) return;
        setData(next);
        const nowHour = new Date().getHours();
        const firstDay = next.days[0]?.hours ?? [];
        const idx = firstDay.findIndex((h) => h.hour >= nowHour);
        setActiveHour(idx >= 0 ? idx : 0);
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  const next = useMemo(() => data?.days[activeDay] ?? data?.days[0] ?? null, [activeDay, data]);

  if (loading) {
    return (
      <div className="rounded-2xl p-6 animate-pulse" style={{ background: "#132F57", border: "1px solid #1E3A5F" }}>
        <div className="h-4 rounded w-40 mb-4" style={{ background: "#0F2A4D" }} />
        <div className="h-20 rounded" style={{ background: "#0F2A4D" }} />
      </div>
    );
  }

  if (error || !data || data.days.length === 0 || !next) {
    return (
      <div className="rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: "#132F57", border: "1px solid #1E3A5F" }}>
        <p className="text-sm" style={{ color: "#6F85A8" }}>Не вдалося завантажити погоду</p>
        <button onClick={() => setIsOpen(true)} className="text-sm font-semibold transition-colors shrink-0" style={{ color: "#4DA3FF" }}>
          Спробувати ще раз
        </button>
      </div>
    );
  }

  const hour = next.hours[activeHour] ?? next.hours[0];
  const phase = moonPhase(new Date(`${next.dateStr}T12:00:00`));
  const peaks = getSolunarPeaks(new Date(`${next.dateStr}T12:00:00`));
  const peakWindows = [
    ...peaks.major.map((h) => ({ type: "major" as const, start: h, end: (h + 2) % 24 })),
    ...peaks.minor.map((h) => ({ type: "minor" as const, start: h, end: (h + 1) % 24 })),
  ].sort((a, b) => a.start - b.start);

  const biteColors: Record<"g" | "o" | "b", string> = { g: "#4ade80", o: "#fbbf24", b: "#f87171" };
  const scoreColor: Record<"g" | "o" | "b", string> = { g: "#16a34a", o: "#d97706", b: "#dc2626" };
  const tabDotColors: Record<"g" | "o" | "b", string> = { g: "#4ade80", o: "#fbbf24", b: "#f87171" };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#132F57", border: "1px solid #1E3A5F" }}>
      <div className="px-5 pt-5">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="mb-3 flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={isOpen}
        >
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6F85A8" }}>
            Погода та умови кльову
          </p>
          <span className="text-xs font-bold" style={{ color: "#6F85A8" }}>
            {isOpen ? "▾" : "▸"}
          </span>
        </button>

        {isOpen && (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {data.days.map((day, index) => (
                <button
                  key={day.dateStr}
                  onClick={() => {
                    setActiveDay(index);
                    setActiveHour(0);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-all ${
                    activeDay === index
                      ? "bg-[#0f2a4a] border-[#0f2a4a] text-white"
                      : "bg-[#0F2A4D] border-[#1E3A5F] text-[#A9B8D4] hover:border-[#2A4D78]"
                  }`}
                >
                  {day.shortLabel}
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tabDotColors[day.biteClass] }} />
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{hour.icon}</span>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-white">+{hour.temp}°</span>
                  </div>
                  <div className="text-sm" style={{ color: "#A9B8D4" }}>
                    {hour.desc} · {String(hour.hour).padStart(2, "0")}:00
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 flex-1 justify-center">
                <Badge color={hour.biteClass === "g" ? "green" : hour.biteClass === "o" ? "yellow" : "red"}>
                  🐟 {hour.biteClass === "g" ? "Добрий кльов" : hour.biteClass === "o" ? "Середній кльов" : "Слабкий кльов"}
                </Badge>
                <Badge color="purple">
                  {moonIcon(phase)} {moonLabel(phase)}
                </Badge>
                {peakWindows[0] && (
                  <Badge color={peakWindows[0].type === "major" ? "yellow" : "blue"}>
                    {peakWindows[0].type === "major" ? "⭐" : "☆"} Пік {String(peakWindows[0].start).padStart(2, "0")}:00–{String(peakWindows[0].end).padStart(2, "0")}:00
                  </Badge>
                )}
                <Badge color="gray">💨 {hour.wind} м/с</Badge>
                <Badge color="gray">💧 {hour.humidity}%</Badge>
              </div>

              <div className="relative w-16 h-16 shrink-0">
                <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="32" cy="32" r="27" fill="none" stroke="#e2e8f0" strokeWidth="7" />
                  <circle
                    cx="32"
                    cy="32"
                    r="27"
                    fill="none"
                    stroke={biteColors[hour.biteClass]}
                    strokeWidth="7"
                    strokeDasharray="169.6"
                    strokeDashoffset={169.6 - (hour.biteScore / 10) * 169.6}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-black" style={{ color: scoreColor[hour.biteClass], lineHeight: 1 }}>
                    {hour.biteScore.toFixed(1)}
                  </span>
                  <span className="text-[8px] text-slate-400 font-semibold uppercase">кльов</span>
                </div>
              </div>
            </div>

            {peakWindows.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#6F85A8" }}>
                  Піки активності:
                </span>
                {peakWindows.map((peak, index) => (
                  <span
                    key={index}
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                      peak.type === "major"
                        ? "bg-[#fef9ec] border-[#fde68a] text-[#b45309]"
                        : "bg-[#dbeafe] border-[#bfdbfe] text-[#1d4ed8]"
                    }`}
                  >
                    {peak.type === "major" ? "⭐" : "☆"} {String(peak.start).padStart(2, "0")}:00–{String(peak.end).padStart(2, "0")}:00
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto px-5 pb-5 pt-1" style={{ scrollSnapType: "x mandatory" }}>
        {next.hours.map((h, index) => {
          const borderColor = h.biteClass === "g" ? "#4ade80" : h.biteClass === "o" ? "#fbbf24" : "#1E3A5F";
          const isActive = index === activeHour;

          return (
            <button
              key={h.hour}
              type="button"
              onClick={() => setActiveHour(index)}
              className="shrink-0"
              style={{
                minWidth: 58,
                background: isActive ? "#0f2a4a" : "#0F2A4D",
                border: `1.5px solid ${isActive ? "#0f2a4a" : borderColor}`,
                borderRadius: 14,
                padding: "10px 6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                cursor: "pointer",
                scrollSnapAlign: "start",
                transition: "all .15s",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? "rgba(255,255,255,0.5)" : "#6F85A8" }}>
                {String(h.hour).padStart(2, "0")}:00
              </span>
              <span style={{ fontSize: 17 }}>{h.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>+{h.temp}°</span>
              <span style={{ fontSize: 9, color: isActive ? "rgba(255,255,255,0.5)" : "#6F85A8" }}>{h.wind} м/с</span>
              <div
                style={{
                  width: 6,
                  height: 20,
                  background: isActive ? "rgba(255,255,255,0.2)" : "#1E3A5F",
                  borderRadius: 3,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "flex-end",
                }}
              >
                <div style={{ width: "100%", height: `${Math.min(100, h.rain * 20)}%`, background: "#60a5fa", borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: isActive ? biteColors[h.biteClass] : scoreColor[h.biteClass] }}>
                {h.biteScore.toFixed(1)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    green: "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]",
    yellow: "bg-[#fef9c3] text-[#854d0e] border-[#fde68a]",
    red: "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
    blue: "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
    purple: "bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]",
    gray: "bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]",
  };

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border ${styles[color] ?? styles.gray}`}>
      {children}
    </span>
  );
}
