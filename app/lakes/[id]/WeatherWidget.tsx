"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

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

const CP1251_BYTES = new Uint8Array(256);
for (let i = 0; i < 256; i += 1) CP1251_BYTES[i] = i;
const CP1251_CHARS = new TextDecoder("windows-1251").decode(CP1251_BYTES);
const CP1251_REVERSE = new Map(Array.from(CP1251_CHARS, (ch, index) => [ch, index]));

function repairCp1251Mojibake(value: string) {
  if (!value) return value;
  if (!/Рџ|С‚|Р°|в|в›|�|пїЅ/.test(value)) return value;

  const bytes: number[] = [];
  for (const ch of value) {
    const byte = CP1251_REVERSE.get(ch);
    if (byte === undefined) return value;
    bytes.push(byte);
  }

  try {
    const decoded = new TextDecoder("utf-8").decode(new Uint8Array(bytes));
    if (!decoded || decoded.includes("пїЅ")) return value;
    return decoded;
  } catch {
    return value;
  }
}

function cleanUiText(value: string) {
  return repairCp1251Mojibake(value)
    .replace(/^[^\p{L}\p{N}]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function weatherInfo(code: number, hour: number) {
  const night = hour < 6 || hour >= 21;
  if (code === 0) return { icon: night ? "moon" : "sun", desc: "Ясно" };
  if (code <= 2) return { icon: night ? "moon" : "cloudSun", desc: "Малохмарно" };
  if (code === 3) return { icon: "cloud", desc: "Хмарно" };
  if (code <= 49) return { icon: "mist", desc: "Туман" };
  if (code <= 55) return { icon: "drizzle", desc: "Мряка" };
  if (code <= 65) return { icon: "rain", desc: "Дощ" };
  if (code <= 77) return { icon: "snow", desc: "Сніг" };
  if (code <= 82) return { icon: "rain", desc: "Злива" };
  if (code <= 99) return { icon: "storm", desc: "Гроза" };
  return { icon: "cloudSun", desc: "Ясно" };
}

function moonPhase(date: Date): number {
  const known = new Date(2000, 0, 6);
  const diff = (date.getTime() - known.getTime()) / (1000 * 60 * 60 * 24);
  return (((diff % 29.53) + 29.53) % 29.53) / 29.53;
}

function moonLabel(phase: number): string {
  if (phase < 0.05 || phase > 0.95) return "Новий місяць";
  if (phase < 0.25) return "Зростаючий";
  if (phase < 0.55) return "Повний місяць";
  if (phase < 0.75) return "Спадаючий";
  return "Старий місяць";
}

function formatWeatherDayLabel(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00`);
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();
  if (isToday) return "Сьогодні";
  if (isTomorrow) return "Завтра";

  const label = new Intl.DateTimeFormat("uk-UA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(date);

  return label
    .replace(/[.,]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(\p{Ll})/u, (match) => match.toUpperCase());
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function findCurrentDayIndex(days: DayData[]) {
  if (days.length === 0) return 0;

  const today = localDateKey();
  const todayIndex = days.findIndex((day) => day.dateStr === today);
  if (todayIndex >= 0) return todayIndex;

  const nextFutureIndex = days.findIndex((day) => day.dateStr > today);
  return nextFutureIndex >= 0 ? nextFutureIndex : 0;
}

function findCurrentHourIndex(hours: HourData[]) {
  if (hours.length === 0) return 0;

  const nowHour = new Date().getHours();
  const idx = hours.findIndex((h) => h.hour >= nowHour);
  return idx >= 0 ? idx : 0;
}

function WeatherGlyph({ kind }: { kind: "sun" | "cloudSun" | "cloud" | "mist" | "drizzle" | "rain" | "snow" | "storm" | "moon" }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (kind === "sun") {
    return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2v2.5M12 19.5V22M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M2 12h2.5M19.5 12H22M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8" /></svg>;
  }
  if (kind === "moon") {
    return <svg {...common}><path d="M18 15.6A7.5 7.5 0 1 1 8.4 6a6.5 6.5 0 0 0 9.6 9.6Z" /></svg>;
  }
  if (kind === "cloudSun") {
    return <svg {...common}><circle cx="8.5" cy="8.5" r="3" /><path d="M5 15.5h10.5a3 3 0 0 0 0-6 4.5 4.5 0 0 0-8.4 1.8A2.8 2.8 0 0 0 5 15.5Z" /></svg>;
  }
  if (kind === "cloud") {
    return <svg {...common}><path d="M6 17h10.5a3.5 3.5 0 0 0 .2-7A5 5 0 0 0 7 8.5 3.4 3.4 0 0 0 6 17Z" /></svg>;
  }
  if (kind === "mist") {
    return <svg {...common}><path d="M4 8h16M6 12h12M5 16h14" /></svg>;
  }
  if (kind === "snow") {
    return <svg {...common}><path d="M12 3v18M4.5 7l15 10M19.5 7l-15 10M7.5 4.5 12 12l4.5-7.5" /></svg>;
  }
  if (kind === "storm") {
    return <svg {...common}><path d="M6 16h9.5a3.5 3.5 0 0 0 .3-7A5 5 0 0 0 7 7.8 3.4 3.4 0 0 0 6 16Z" /><path d="M11 12.5l-2 4h2l-1 3.5 4-5h-2l1-2.5" /></svg>;
  }
  return <svg {...common}><path d="M6 17h10.5a3.5 3.5 0 0 0 .2-7A5 5 0 0 0 7 8.5 3.4 3.4 0 0 0 6 17Z" /><path d="M8.5 18.5c.4 1.5 1.7 2.5 3.5 2.5s3.1-1 3.5-2.5" /></svg>;
}

function MoonGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 15.6A7.5 7.5 0 1 1 8.4 6a6.5 6.5 0 0 0 9.6 9.6Z" />
    </svg>
  );
}
function WindGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8h10a2.5 2.5 0 1 0-2.4-3.2" />
      <path d="M4 13h13a2 2 0 1 1-1.8 2.8" />
      <path d="M4 18h8" />
    </svg>
  );
}

function DropletGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3s5 5 5 9a5 5 0 0 1-10 0c0-4 5-9 5-9Z" />
    </svg>
  );
}

function GaugeGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 14a8 8 0 1 1 16 0" />
      <path d="M12 14l3-4" />
      <circle cx="12" cy="14" r="1.25" />
    </svg>
  );
}

function weatherKindFromEmoji(icon: string): Parameters<typeof WeatherGlyph>[0]["kind"] {
  if (icon === "sun" || icon === "moon" || icon === "cloudSun" || icon === "cloud" || icon === "mist" || icon === "drizzle" || icon === "rain" || icon === "snow" || icon === "storm") return icon;
  if (icon.includes("☀")) return "sun";
  if (icon.includes("🌙")) return "moon";
  if (icon.includes("☁")) return "cloud";
  if (icon.includes("🌫")) return "mist";
  if (icon.includes("🌦")) return "drizzle";
  if (icon.includes("🌧")) return "rain";
  if (icon.includes("🌨")) return "snow";
  if (icon.includes("⛈")) return "storm";
  return "cloudSun";
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
  const ukDays = ["\u041d\u0434", "\u041f\u043d", "\u0412\u0442", "\u0421\u0440", "\u0427\u0442", "\u041f\u0442", "\u0421\u0431"];
  const ukMonths = ["\u0441\u0456\u0447", "\u043b\u044e\u0442", "\u0431\u0435\u0440", "\u043a\u0432\u0456\u0442", "\u0442\u0440\u0430\u0432", "\u0447\u0435\u0440", "\u043b\u0438\u043f", "\u0441\u0435\u0440\u043f", "\u0432\u0435\u0440", "\u0436\u043e\u0432\u0442", "\u043b\u0438\u0441\u0442", "\u0433\u0440\u0443\u0434"];

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

  const today = localDateKey();
  const upcomingDays = days.filter((day) => day.dateStr >= today);
  return { days: (upcomingDays.length > 0 ? upcomingDays : days).slice(0, 5) };
}

export default function WeatherWidget({ lat, lng }: { lat: number; lng: number }) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [activeHour, setActiveHour] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  const loadData = useCallback(async (shouldAbort?: () => boolean) => {
    setLoading(true);
    setError(false);
    try {
      const next = await fetchWeather(lat, lng);
      if (shouldAbort?.()) return;
      setData(next);
      const currentDayIndex = findCurrentDayIndex(next.days);
      setActiveDay(currentDayIndex);
      setActiveHour(findCurrentHourIndex(next.days[currentDayIndex]?.hours ?? []));
    } catch {
      if (!shouldAbort?.()) setError(true);
    } finally {
      if (!shouldAbort?.()) setLoading(false);
    }
  }, [lat, lng]);

  useEffect(() => {
    let cancelled = false;
    void loadData(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [lat, lng, loadData]);

  const next = useMemo(() => data?.days[activeDay] ?? data?.days[0] ?? null, [activeDay, data]);

  if (loading) {
    return (
      <section className="dk-weather-panel dk-weather-panel--loading" aria-busy="true">
        <div className="dk-weather-panel__loading-line dk-weather-panel__loading-line--sm" />
        <div className="dk-weather-panel__loading-line dk-weather-panel__loading-line--lg" />
        <div className="dk-weather-panel__loading-row">
          <div className="dk-weather-panel__loading-pill" />
          <div className="dk-weather-panel__loading-pill dk-weather-panel__loading-pill--wide" />
          <div className="dk-weather-panel__loading-pill" />
        </div>
      </section>
    );
  }

  if (error || !data || data.days.length === 0 || !next) {
    return (
      <section className="dk-weather-panel dk-weather-panel--error">
        <div className="dk-weather-panel__error-copy">
          <p className="dk-weather-panel__eyebrow">Погода та умови кльову</p>
          <p className="dk-weather-panel__subtitle">Не вдалося завантажити прогноз. Спробуйте ще раз через мить.</p>
        </div>
        <button type="button" className="dk-weather-panel__primary" onClick={() => void loadData()}>Спробувати ще раз</button>
      </section>
    );
  }

  const hour = next.hours[activeHour] ?? next.hours[0];
  const phase = moonPhase(new Date(`${next.dateStr}T12:00:00`));
  const peaks = getSolunarPeaks(new Date(`${next.dateStr}T12:00:00`));
  const peakWindows = [
    ...peaks.major.map((h) => ({ type: "major" as const, start: h, end: (h + 2) % 24 })),
    ...peaks.minor.map((h) => ({ type: "minor" as const, start: h, end: (h + 1) % 24 })),
  ].sort((a, b) => a.start - b.start);

  const scoreTone = hour.biteClass === "g" ? "good" : hour.biteClass === "o" ? "warn" : "bad";
  const weatherKind = weatherKindFromEmoji(hour.icon);
  const bestPeak = peakWindows.find((peak) => peak.type === "major") ?? peakWindows[0] ?? null;
  const metricItems = [
    { label: "\u0412\u0456\u0442\u0435\u0440", value: `${hour.wind} \u043c/\u0441`, icon: <WindGlyph /> },
    { label: "\u0412\u043e\u043b\u043e\u0433\u0456\u0441\u0442\u044c", value: `${hour.humidity}%`, icon: <DropletGlyph /> },
    { label: "\u0422\u0438\u0441\u043a", value: `${hour.pressure} \u0433\u041f\u0430`, icon: <GaugeGlyph /> },
    { label: "\u041e\u043f\u0430\u0434\u0438", value: `${hour.rain} \u043c\u043c`, icon: <WeatherGlyph kind="drizzle" /> },
  ];

  return (
    <section className={`dk-weather-panel ${isOpen ? "dk-weather-panel--open" : ""}`}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="dk-weather-panel__toggle"
        aria-expanded={isOpen}
        aria-controls="weather-widget-content"
      >
        <div className="dk-weather-panel__copy">
          <h2 className="dk-weather-panel__title">Погода та умови кльову</h2>
          <p className="dk-weather-panel__subtitle">Оновлено о {hour.hour.toString().padStart(2, "0")}:00 • {formatWeatherDayLabel(next.dateStr)}</p>
        </div>

        <div className="dk-weather-panel__score">
          <div className="dk-weather-panel__score-ring">
            <span className="dk-weather-panel__score-value">{hour.biteScore.toFixed(1)}</span>
            <span className="dk-weather-panel__score-label">/10</span>
          </div>
          <div className="dk-weather-panel__score-copy">
            <span className={`dk-weather-panel__score-badge dk-weather-panel__score-badge--${scoreTone}`}>
              {hour.biteClass === "g" ? "Добрий кльов" : hour.biteClass === "o" ? "Середній кльов" : "Слабкий кльов"}
            </span>
            <span className="dk-weather-panel__score-time">Поточний час • {String(hour.hour).padStart(2, "0")}:00</span>
          </div>
          <span className="dk-weather-panel__chevron" aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
        </div>
      </button>

      <div
        id="weather-widget-content"
        className="dk-weather-panel__content"
        aria-hidden={!isOpen}
        style={{
          maxHeight: isOpen ? 1800 : 0,
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
          transform: isOpen ? "translateY(0)" : "translateY(-4px)",
          transition: "max-height 320ms ease, opacity 220ms ease, transform 220ms ease",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        <div className="dk-weather-panel__tabs" role="tablist" aria-label="Погодні дні">
          {data.days.map((day, index) => (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => {
                setActiveDay(index);
                setActiveHour(day.dateStr === localDateKey() ? findCurrentHourIndex(day.hours) : 0);
              }}
              className={`dk-weather-panel__tab ${activeDay === index ? "dk-weather-panel__tab--active" : ""}`}
              aria-pressed={activeDay === index}
            >
              <span className="dk-weather-panel__tab-label">{formatWeatherDayLabel(day.dateStr)}</span>
              <span className={`dk-weather-panel__tab-dot dk-weather-panel__tab-dot--${day.biteClass}`} />
            </button>
          ))}
        </div>

        <div className="dk-weather-panel__summary">
          <div className="dk-weather-panel__summary-main">
            <div className="dk-weather-panel__weather-icon">
              <WeatherGlyph kind={weatherKind} />
            </div>
            <div className="dk-weather-panel__summary-copy">
              <div className="dk-weather-panel__temp">+{hour.temp}°</div>
              <p className="dk-weather-panel__condition">{cleanUiText(hour.desc)} • {String(hour.hour).padStart(2, "0")}:00</p>
              <div className="dk-weather-panel__summary-chips">
                <span className={`dk-weather-pill dk-weather-pill--${scoreTone}`}>
                  {hour.biteClass === "g" ? "Добрий кльов" : hour.biteClass === "o" ? "Середній кльов" : "Слабкий кльов"}
                </span>
                <span className="dk-weather-pill dk-weather-pill--neutral">
                  <MoonGlyph />
                  {cleanUiText(moonLabel(phase))}
                </span>
                {bestPeak && (
                  <span className="dk-weather-pill dk-weather-pill--accent">
                    Пік {String(bestPeak.start).padStart(2, "0")}:00–{String(bestPeak.end).padStart(2, "0")}:00
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="dk-weather-panel__metrics">
            {metricItems.map((metric) => (
              <div key={cleanUiText(metric.label)} className="dk-weather-panel__metric">
                <span className="dk-weather-panel__metric-icon">{metric.icon}</span>
                <div>
                  <p className="dk-weather-panel__metric-label">{cleanUiText(metric.label)}</p>
                  <p className="dk-weather-panel__metric-value">{cleanUiText(metric.value)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {peakWindows.length > 0 && (
          <div className="dk-weather-panel__peaks">
            <span className="dk-weather-panel__section-label">Піки активності</span>
            <div className="dk-weather-panel__peak-row">
              {peakWindows.map((peak, index) => {
                const major = peak.type === "major";
                return (
                  <span
                    key={`${peak.type}-${peak.start}-${index}`}
                    className={`dk-weather-pill dk-weather-pill--${major ? "gold" : "blue"} dk-weather-panel__peak-chip`}
                  >
                    {String(peak.start).padStart(2, "0")}:00–{String(peak.end).padStart(2, "0")}:00
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="dk-weather-panel__hours" role="list" aria-label="Погодинний прогноз">
          {next.hours.map((h, index) => {
            const borderColor = h.biteClass === "g" ? "#4ade80" : h.biteClass === "o" ? "#fbbf24" : "rgba(255,255,255,0.14)";
            const isActive = index === activeHour;
            return (
              <button
                key={h.hour}
                type="button"
                onClick={() => setActiveHour(index)}
                className={`dk-weather-hour ${isActive ? "dk-weather-hour--active" : ""}`}
                style={{ borderColor: isActive ? "rgba(217,182,111,0.45)" : borderColor }}
                aria-pressed={isActive}
              >
                <span className="dk-weather-hour__time">{String(h.hour).padStart(2, "0")}:00</span>
                <span className="dk-weather-hour__main">
                  <span className="dk-weather-hour__icon">
                    <WeatherGlyph kind={weatherKindFromEmoji(h.icon)} />
                  </span>
                  <span className="dk-weather-hour__temp">+{h.temp}°</span>
                </span>
                <span className="dk-weather-hour__meta">
                  <span className="dk-weather-hour__wind">
                    <WindGlyph />
                    {h.wind}
                  </span>
                  <span className="dk-weather-hour__rain">
                    <DropletGlyph />
                    {h.rain}
                  </span>
                </span>
                <span className="dk-weather-hour__score">{h.biteScore.toFixed(1)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
