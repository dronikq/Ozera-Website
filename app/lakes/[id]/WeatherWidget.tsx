"use client";

import { useEffect, useState } from "react";

interface HourData {
  hour: number;
  temp: number;
  icon: string;
  desc: string;
  wind: number;
  humidity: number;
  rain: number;       // mm
  pressure: number;   // hPa
  biteScore: number;  // 0–10
  biteClass: "g" | "o" | "b";
  solType: "major" | "minor" | null;
}

interface DayData {
  label: string;
  shortLabel: string;
  dateStr: string;
  hours: HourData[];
  avgBite: number;
  biteClass: "g" | "o" | "b";
}

interface WeatherData {
  days: DayData[];
}

// ── Weather code → icon + desc ──
function weatherInfo(code: number, hour: number): { icon: string; desc: string } {
  const night = hour < 6 || hour >= 21;
  if (code === 0)  return { icon: night ? "🌙" : "☀️",  desc: "Ясно" };
  if (code <= 2)   return { icon: night ? "🌙" : "🌤",  desc: "Малохмарно" };
  if (code === 3)  return { icon: "☁️",  desc: "Хмарно" };
  if (code <= 49)  return { icon: "🌫",  desc: "Туман" };
  if (code <= 55)  return { icon: "🌦",  desc: "Мряка" };
  if (code <= 65)  return { icon: "🌧",  desc: "Дощ" };
  if (code <= 77)  return { icon: "🌨",  desc: "Сніг" };
  if (code <= 82)  return { icon: "🌦",  desc: "Злива" };
  if (code <= 99)  return { icon: "⛈",  desc: "Гроза" };
  return { icon: "🌤", desc: "Ясно" };
}

// ── Moon phase (0=new, 0.5=full) ──
function moonPhase(date: Date): number {
  const known = new Date(2000, 0, 6); // known new moon
  const diff = (date.getTime() - known.getTime()) / (1000 * 60 * 60 * 24);
  return ((diff % 29.53) + 29.53) % 29.53 / 29.53;
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

// ── Solunar peaks (simplified) ──
function getSolunarPeaks(date: Date): { major: number[]; minor: number[] } {
  const phase = moonPhase(date);
  const moonTransit = (phase * 24 + date.getDate() * 0.8) % 24;
  const major1 = Math.round(moonTransit) % 24;
  const major2 = (major1 + 12) % 24;
  const minor1 = (major1 + 6) % 24;
  const minor2 = (major1 + 18) % 24;
  return { major: [major1, major2], minor: [minor1, minor2] };
}

// ── Bite score formula ──
function calcBiteScore(temp: number, wind: number, rain: number, pressure: number, moonPh: number, solType: "major" | "minor" | null): number {
  let score = 5;
  // Temperature: optimal 10-20°C
  if (temp >= 10 && temp <= 20) score += 1.5;
  else if (temp >= 5 && temp < 10) score += 0.5;
  else if (temp > 20 && temp <= 28) score += 0.8;
  else score -= 1;
  // Wind: low wind is better
  if (wind <= 2) score += 1;
  else if (wind <= 4) score += 0.5;
  else if (wind >= 7) score -= 2;
  else score -= 1;
  // Rain: light rain can be ok
  if (rain === 0) score += 0.5;
  else if (rain <= 2) score += 0.2;
  else if (rain > 5) score -= 1.5;
  // Pressure: stable ~1013 hPa
  const pressDiff = Math.abs(pressure - 1013);
  if (pressDiff < 5) score += 1;
  else if (pressDiff < 10) score += 0.3;
  else score -= 1;
  // Moon: new/full moon best
  if (moonPh < 0.1 || moonPh > 0.9 || (moonPh > 0.45 && moonPh < 0.55)) score += 1;
  // Solunar bonus
  if (solType === "major") score += 1.5;
  if (solType === "minor") score += 0.8;
  return Math.max(0, Math.min(10, score));
}

function biteClass(score: number): "g" | "o" | "b" {
  if (score >= 7) return "g";
  if (score >= 4.5) return "o";
  return "b";
}

// ── Fetch and parse Open-Meteo ──
async function fetchWeather(lat: number, lng: number): Promise<WeatherData> {
  const url = `/api/weather?lat=${lat}&lng=${lng}&days=5`;
  const res = await fetch(url);
  const json = await res.json();

  const { hourly } = json;
  const times: string[] = hourly.time;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group by day
  const dayMap = new Map<string, HourData[]>();
  times.forEach((t, i) => {
    const d = new Date(t);
    const dateKey = t.slice(0, 10);
    if (!dayMap.has(dateKey)) dayMap.set(dateKey, []);

    const phase = moonPhase(d);
    const peaks = getSolunarPeaks(d);
    const h = d.getHours();
    let solType: "major" | "minor" | null = null;
    if (peaks.major.includes(h)) solType = "major";
    else if (peaks.minor.includes(h)) solType = "minor";

    const pressure = hourly.surface_pressure[i] ?? 1013;
    const wind = hourly.windspeed_10m[i] ?? 0;
    const rain = hourly.precipitation[i] ?? 0;
    const temp = Math.round(hourly.temperature_2m[i] ?? 10);
    const code = hourly.weathercode[i] ?? 0;
    const { icon, desc } = weatherInfo(code, h);
    const score = calcBiteScore(temp, wind / 3.6, rain, pressure, phase, solType);

    dayMap.get(dateKey)!.push({
      hour: h,
      temp,
      icon,
      desc,
      wind: Math.round(wind / 3.6 * 10) / 10,
      humidity: hourly.relativehumidity_2m[i] ?? 0,
      rain,
      pressure: Math.round(pressure),
      biteScore: Math.round(score * 10) / 10,
      biteClass: biteClass(score),
      solType,
    });
  });

  const ukDays = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const ukMonths = ["січ", "лют", "бер", "квіт", "трав", "черв", "лип", "серп", "вер", "жовт", "лист", "груд"];

  const days: DayData[] = [];
  dayMap.forEach((hours, dateKey) => {
    const d = new Date(dateKey + "T12:00:00");
    const isToday = d.toDateString() === new Date().toDateString();
    const isTomorrow = d.toDateString() === new Date(Date.now() + 86400000).toDateString();
    const shortLabel = isToday ? "Сьогодні" : isTomorrow ? "Завтра" : `${ukDays[d.getDay()]} ${d.getDate()} ${ukMonths[d.getMonth()]}`;
    const scores = hours.map(h => h.biteScore);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    days.push({ label: shortLabel, shortLabel: isToday ? "Сьогодні" : `${ukDays[d.getDay()]} ${d.getDate()}`, dateStr: dateKey, hours, avgBite: Math.round(avg * 10) / 10, biteClass: biteClass(avg) });
  });

  return { days: days.slice(0, 5) };
}

// ── Component ──
export default function WeatherWidget({ lat, lng }: { lat: number; lng: number }) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [activeHour, setActiveHour] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  const load = () => {
    setLoading(true);
    setError(false);
    fetchWeather(lat, lng)
      .then(d => {
        setData(d);
        const nowHour = new Date().getHours();
        const todayHours = d.days[0]?.hours ?? [];
        const idx = todayHours.findIndex(h => h.hour >= nowHour);
        setActiveHour(idx >= 0 ? idx : 0);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="rounded-2xl p-6 animate-pulse" style={{ background: "#132F57", border: "1px solid #1E3A5F" }}>
        <div className="h-4 rounded w-40 mb-4" style={{ background: "#0F2A4D" }} />
        <div className="h-20 rounded" style={{ background: "#0F2A4D" }} />
      </div>
    );
  }
  if (error || !data || data.days.length === 0) {
    return (
      <div className="rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: "#132F57", border: "1px solid #1E3A5F" }}>
        <p className="text-sm" style={{ color: "#6F85A8" }}>⚠️ Не вдалось завантажити погоду</p>
        <button onClick={load} className="text-sm font-semibold transition-colors shrink-0" style={{ color: "#4DA3FF" }}>
          Спробувати ще раз
        </button>
      </div>
    );
  }

  const day = data.days[activeDay];
  const hourIdx = activeHour ?? 0;
  const hour = day.hours[hourIdx] ?? day.hours[0];
  if (!hour) return null;

  const phase = moonPhase(new Date(day.dateStr + "T12:00:00"));
  const peaks = getSolunarPeaks(new Date(day.dateStr + "T12:00:00"));

  // Find peak windows
  const peakWindows: { type: "major" | "minor"; start: number; end: number }[] = [
    ...peaks.major.map(h => ({ type: "major" as const, start: h, end: (h + 2) % 24 })),
    ...peaks.minor.map(h => ({ type: "minor" as const, start: h, end: (h + 1) % 24 })),
  ].sort((a, b) => a.start - b.start);

  const biteColors: Record<"g" | "o" | "b", string> = {
    g: "#4ade80",
    o: "#fbbf24",
    b: "#f87171",
  };
  const biteLabels: Record<"g" | "o" | "b", string> = {
    g: "Добрий кльов",
    o: "Середній кльов",
    b: "Слабкий кльов",
  };
  const scoreColor: Record<"g" | "o" | "b", string> = {
    g: "#16a34a",
    o: "#d97706",
    b: "#dc2626",
  };
  const tabDotColors: Record<"g" | "o" | "b", string> = { g: "#4ade80", o: "#fbbf24", b: "#f87171" };

  const ringStroke = (hour.biteScore / 10) * 213.6;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#132F57", border: "1px solid #1E3A5F" }}>
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full px-5 pt-4 pb-3 flex items-center justify-between"
        style={{ cursor: "pointer" }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6F85A8" }}>☁ Погода та умови кльову</p>
        <span style={{ color: "#6F85A8", fontSize: 18, display: "inline-block", transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform .2s" }}>▾</span>
      </button>

      {isOpen && <div className="px-5 pb-0">
        {/* Day tabs */}
        <div className="flex gap-2 flex-wrap mb-4">
          {data.days.map((d, i) => (
            <button
              key={d.dateStr}
              onClick={() => { setActiveDay(i); setActiveHour(0); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-semibold border transition-all ${
                activeDay === i
                  ? "bg-[#0f2a4a] border-[#0f2a4a] text-white"
                  : "bg-[#0F2A4D] border-[#1E3A5F] text-[#A9B8D4] hover:border-[#2A4D78]"
              }`}
            >
              {d.shortLabel}
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tabDotColors[d.biteClass] }} />
            </button>
          ))}
        </div>

        {/* Current hour summary */}
        <div className="flex items-center justify-between gap-4 mb-4">
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

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 flex-1 justify-center">
            <Tag color={hour.biteClass === "g" ? "green" : hour.biteClass === "o" ? "yellow" : "red"}>
              🎣 {biteLabels[hour.biteClass]}
            </Tag>
            <Tag color="purple">{moonIcon(phase)} {moonLabel(phase)}</Tag>
            {peakWindows[0] && (
              <Tag color={peakWindows[0].type === "major" ? "yellow" : "blue"}>
                {peakWindows[0].type === "major" ? "⭐⭐" : "⭐"} Пік {String(peakWindows[0].start).padStart(2,"0")}:00–{String(peakWindows[0].end).padStart(2,"0")}:00
              </Tag>
            )}
            <Tag color="gray">💨 {hour.wind} м/с</Tag>
            <Tag color="gray">💧 {hour.humidity}%</Tag>
          </div>

          {/* Score ring */}
          <div className="relative w-16 h-16 shrink-0">
            <svg width="64" height="64" viewBox="0 0 64 64" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="32" cy="32" r="27" fill="none" stroke="#e2e8f0" strokeWidth="7" />
              <circle cx="32" cy="32" r="27" fill="none"
                stroke={biteColors[hour.biteClass]} strokeWidth="7"
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

        {/* Solunar peaks row */}
        {peakWindows.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#6F85A8" }}>Піки активності:</span>
            {peakWindows.map((p, i) => (
              <span
                key={i}
                className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                  p.type === "major"
                    ? "bg-[#fef9ec] border-[#fde68a] text-[#b45309]"
                    : "bg-[#dbeafe] border-[#bfdbfe] text-[#1d4ed8]"
                }`}
              >
                {p.type === "major" ? "⭐⭐" : "⭐"} {String(p.start).padStart(2,"0")}:00–{String(p.end).padStart(2,"0")}:00
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hour strip */}
      <div className="flex gap-1.5 overflow-x-auto px-5 pb-5 pt-1 scroll-snap-type-x" style={{ scrollSnapType: "x mandatory" }}>

        {day.hours.map((h, i) => {
          const borderColor = h.biteClass === "g" ? "#4ade80" : h.biteClass === "o" ? "#fbbf24" : "#1E3A5F";
          const bg = i === hourIdx ? "#0f2a4a" : "#0F2A4D";
          const textColor = "white";
          const subColor = i === hourIdx ? "rgba(255,255,255,0.5)" : "#6F85A8";
          return (
            <div
              key={h.hour}
              onClick={() => setActiveHour(i)}
              style={{
                minWidth: 58,
                background: bg,
                border: `1.5px solid ${i === hourIdx ? "#0f2a4a" : borderColor}`,
                borderRadius: 14,
                padding: "10px 6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                cursor: "pointer",
                flexShrink: 0,
                scrollSnapAlign: "start",
                transition: "all .15s",
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 700, color: subColor }}>
                {String(h.hour).padStart(2, "0")}:00
              </span>
              <span style={{ fontSize: 17 }}>{h.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: textColor }}>+{h.temp}°</span>
              <span style={{ fontSize: 9, color: subColor }}>{h.wind} м/с</span>
              {/* rain bar */}
              <div style={{ width: 6, height: 20, background: i === hourIdx ? "rgba(255,255,255,0.2)" : "#1E3A5F", borderRadius: 3, overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
                <div style={{ width: "100%", height: `${Math.min(100, h.rain * 20)}%`, background: "#60a5fa", borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: i === hourIdx ? biteColors[h.biteClass] : scoreColor[h.biteClass] }}>
                {h.biteScore.toFixed(1)}
              </span>
              {h.solType && (
                <span style={{ fontSize: 9, fontWeight: 700, color: i === hourIdx ? "#fbbf24" : h.solType === "major" ? "#b45309" : "#1d4ed8" }}>
                  {h.solType === "major" ? "⭐⭐" : "⭐"}
                </span>
              )}
            </div>
          );
        })}
      </div>
      </div>}
    </div>
  );
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  const styles: Record<string, string> = {
    green:  "bg-[#dcfce7] text-[#166534] border-[#bbf7d0]",
    yellow: "bg-[#fef9c3] text-[#854d0e] border-[#fde68a]",
    red:    "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
    blue:   "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
    purple: "bg-[#f3e8ff] text-[#6b21a8] border-[#e9d5ff]",
    gray:   "bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg border ${styles[color] ?? styles.gray}`}>
      {children}
    </span>
  );
}
