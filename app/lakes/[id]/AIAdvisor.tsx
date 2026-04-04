"use client";

import { useEffect, useState } from "react";

interface HourData {
  hour: number;
  temp: number;
  wind: number;
  rain: number;
  pressure: number;
  biteScore: number;
  biteClass: "g" | "o" | "b";
  solType: "major" | "minor" | null;
}

interface LureColor { hex: string; name: string; best?: boolean; }
interface Lure { icon: string; name: string; tip: string; top: boolean; colors: LureColor[]; }

interface AdviceSet {
  bait:       { text: string; tags: string[]; lures?: Lure[] };
  cast:       { text: string; tags: string[] };
  groundbait: { text: string; tags: string[] } | null;
  location:   { text: string; tags: string[] };
  timing:     { text: string; tags: string[] };
}

interface Advice {
  peaceful: AdviceSet | null;
  predatory: AdviceSet | null;
  summary: string;
  updatedAt: string;
}

// ── Fish classification ──
const PREDATORY = ["щука", "окунь", "судак", "сом", "жерех", "берш", "головень"];
const PEACEFUL  = ["короп", "карась", "амур", "товстолоб", "лящ", "лин", "плітка", "краснопірка", "карп", "сазан", "білий амур"];

function classifyFish(species: string[]): { peaceful: string[]; predatory: string[] } {
  const lc = species.map(s => s.toLowerCase());
  return {
    peaceful:  species.filter((_, i) => PEACEFUL.some(p  => lc[i].includes(p))),
    predatory: species.filter((_, i) => PREDATORY.some(p => lc[i].includes(p))),
  };
}

// ── Moon phase ──
function moonPhase(date: Date): number {
  const known = new Date(2000, 0, 6);
  const diff = (date.getTime() - known.getTime()) / (1000 * 60 * 60 * 24);
  return ((diff % 29.53) + 29.53) % 29.53 / 29.53;
}

function moonLabel(phase: number): string {
  if (phase < 0.05 || phase > 0.95) return "Новий місяць";
  if (phase < 0.25) return "Зростаючий";
  if (phase < 0.55) return "Повний місяць";
  if (phase < 0.75) return "Спадаючий";
  return "Старий місяць";
}

function getSolunarPeaks(date: Date) {
  const phase = moonPhase(date);
  const mt = (phase * 24 + date.getDate() * 0.8) % 24;
  const m1 = Math.round(mt) % 24;
  const m2 = (m1 + 12) % 24;
  const n1 = (m1 + 6) % 24;
  const n2 = (m1 + 18) % 24;
  const pad = (n: number) => String(n).padStart(2, "0");
  return [
    { label: `${pad(m1)}:00–${pad((m1 + 2) % 24)}:00`, start: m1, isMajor: true },
    { label: `${pad(n1)}:00–${pad((n1 + 1) % 24)}:00`, start: n1, isMajor: false },
    { label: `${pad(m2)}:00–${pad((m2 + 2) % 24)}:00`, start: m2, isMajor: true },
    { label: `${pad(n2)}:00–${pad((n2 + 1) % 24)}:00`, start: n2, isMajor: false },
  ].sort((a, b) => a.start - b.start);
}

// ── Fetch current weather hour ──
async function fetchCurrentHour(lat: number, lng: number): Promise<{ hour: HourData; dateStr: string } | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m,precipitation,surface_pressure&forecast_days=1&timezone=Europe%2FKiev`;
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();
    const { hourly } = json;
    const now = new Date().getHours();
    const idx = (hourly.time as string[]).findIndex((t) => new Date(t).getHours() >= now);
    const i = idx >= 0 ? idx : 0;
    const wind = (hourly.windspeed_10m[i] ?? 0) / 3.6;
    const temp = Math.round(hourly.temperature_2m[i] ?? 10);
    const rain = hourly.precipitation[i] ?? 0;
    const pressure = Math.round(hourly.surface_pressure[i] ?? 1013);
    const dateStr = (hourly.time[i] as string).slice(0, 10);
    const phase = moonPhase(new Date());
    const peaks = getSolunarPeaks(new Date());
    let solType: "major" | "minor" | null = null;
    if (peaks.some(p => p.isMajor && p.start === now)) solType = "major";
    else if (peaks.some(p => !p.isMajor && p.start === now)) solType = "minor";
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
    const pd = Math.abs(pressure - 1013);
    if (pd < 5) score += 1;
    else if (pd < 10) score += 0.3;
    else score -= 1;
    if (phase < 0.1 || phase > 0.9 || (phase > 0.45 && phase < 0.55)) score += 1;
    if (solType === "major") score += 1.5;
    if (solType === "minor") score += 0.8;
    score = Math.max(0, Math.min(10, score));
    return {
      dateStr,
      hour: {
        hour: now, temp, wind: Math.round(wind * 10) / 10, rain, pressure,
        biteScore: Math.round(score * 10) / 10,
        biteClass: score >= 7 ? "g" : score >= 4.5 ? "o" : "b",
        solType,
      },
    };
  } catch { return null; }
}

// ── Peaceful fish advice ──
function peacefulAdvice(h: HourData, fish: string[], peaks: ReturnType<typeof getSolunarPeaks>): AdviceSet {
  const baitTags: string[] = [];
  let baitText = "";
  const lc = fish.map(f => f.toLowerCase());
  const hasCarp    = lc.some(f => f.includes("короп") || f.includes("карп") || f.includes("сазан"));
  const hasCrucian = lc.some(f => f.includes("карась"));
  const hasGrass   = lc.some(f => f.includes("амур") || f.includes("товстолоб"));

  if (h.temp >= 15) {
    if (hasCarp)    baitTags.push("🔴 Бойли", "🌽 Кукурудза", "🍢 Пелети");
    if (hasCrucian) baitTags.push("🍞 Хліб", "🌽 Кукурудза");
    if (hasGrass)   baitTags.push("🌿 Зелень", "🌽 Кукурудза");
    if (baitTags.length === 0) baitTags.push("🌽 Кукурудза", "🔴 Бойли");
    baitText = h.temp >= 22
      ? "Тепла вода — риба активна. Бойли, кукурудза та пелети дадуть кращий результат."
      : "Комфортна температура. Бойли та кукурудза — оптимальний вибір для мирної риби.";
  } else if (h.temp >= 8) {
    baitTags.push("🪱 Черв'як", "🐛 Опариш");
    if (hasCarp) baitTags.push("🌾 Перловка");
    baitText = "Прохолодна вода — риба пасивніша. Тваринні наживки спрацюють краще за рослинні.";
  } else {
    baitTags.push("🌾 Перловка", "🪱 Черв'як (дрібний)");
    baitText = "Холодна вода — обмін речовин сповільнений. Дрібна наживка біля дна — єдиний варіант.";
  }

  const castTags: string[] = [];
  let castText = "";
  if (h.wind <= 2 && Math.abs(h.pressure - 1013) < 8) {
    castTags.push("📏 20–40 м", "🌊 Середній горизонт");
    castText = "Тихо, тиск стабільний — мирна риба розподілена рівномірно. Середня дистанція, 1–2 м від дна.";
  } else if (h.wind <= 4) {
    castTags.push("📏 40–60 м", "⬇️ Придонний шар");
    castText = "Помірний вітер — риба тримається глибше. Закидай на 40–60 м, придонний шар.";
  } else {
    castTags.push("📏 60–80 м", "⬇️ Дно", "🕳️ Ями");
    castText = "Сильний вітер — мирна риба відійшла на глибину в ями. Максимальна дистанція, монтаж на дно.";
  }
  if (h.temp < 10) { castText += " При холодній воді короп стоїть у ямах."; castTags.push("🕳️ Ями"); }

  const timingTags: string[] = [];
  const bestPeaks = peaks.filter(p => p.isMajor).slice(0, 2);
  bestPeaks.forEach(p => timingTags.push(`⭐⭐ ${p.label}`));
  const next = peaks.find(p => p.start >= h.hour) ?? peaks[0];
  const timingText = h.biteClass === "g"
    ? `Зараз сприятливий момент (${h.biteScore}/10). ${next ? `Наступний пік: ${next.label}.` : ""}`
    : h.biteClass === "o"
    ? `Середня активність (${h.biteScore}/10). ${next ? `Чекай піку о ${next.label}.` : ""}`
    : `Слабка активність (${h.biteScore}/10). ${next ? `Краще зачекати піку о ${next.label}.` : ""}`;
  timingTags.push(h.biteClass === "g" ? "✅ Зараз — добрий" : h.biteClass === "o" ? "🟡 Зараз — середній" : "🔴 Зараз — слабкий");

  // ── Прикормка (тільки мирна) ──
  let groundbaitText = "";
  const groundbaitTags: string[] = [];
  if (h.temp >= 15) {
    groundbaitText = "Волога суміш середньої фракції. Стартовий закорм — 8–10 куль, потім підгодовуй кожні 30 хв.";
    groundbaitTags.push("💧 Волога суміш", "🔶 Середня фракція");
  } else if (h.temp >= 8) {
    groundbaitText = "Суха дрібна суміш. У прохолодній воді риба їсть менше — не перегодовуй точку.";
    groundbaitTags.push("☀️ Суха суміш", "🔸 Дрібна фракція");
  } else {
    groundbaitText = "Мінімальна прикормка або взагалі без неї. Холодна вода — риба майже не рухається.";
    groundbaitTags.push("🚫 Мінімум", "🔸 Дрібна фракція");
  }

  // ── Де шукати (мирна) ──
  let locationText = "";
  const locationTags: string[] = [];
  if (h.temp < 10) {
    locationText = "Короп стоїть у ямах і на глибоких бровках. Шукай перепади глибини.";
    locationTags.push("🕳️ Ями", "📐 Бровки");
  } else if (h.wind > 3) {
    locationText = "Вітер — риба на підвітряному березі та біля очерету. Уникай відкритої води.";
    locationTags.push("🌿 Підвітряний берег", "🌾 Очерет");
  } else {
    locationText = "Тихо — риба розподілена рівномірно. Шукай очерет, корчі, межу рослинності.";
    locationTags.push("🌿 Очерет", "🪵 Корчі", "🌿 Межа рослинності");
  }

  return {
    bait:       { text: baitText,       tags: baitTags },
    cast:       { text: castText,       tags: castTags },
    groundbait: { text: groundbaitText, tags: groundbaitTags },
    location:   { text: locationText,   tags: locationTags },
    timing:     { text: timingText,     tags: timingTags },
  };
}

// ── Predatory fish advice ──
function predatoryAdvice(h: HourData, fish: string[], peaks: ReturnType<typeof getSolunarPeaks>): AdviceSet {
  const baitTags: string[] = [];
  let baitText = "";
  const lc = fish.map(f => f.toLowerCase());
  const hasPike   = lc.some(f => f.includes("щука"));
  const hasPerch  = lc.some(f => f.includes("окунь"));
  const hasPikePerch = lc.some(f => f.includes("судак"));
  const hasCatfish = lc.some(f => f.includes("сом"));

  if (h.temp >= 12) {
    if (hasPike)      baitTags.push("🐟 Живець", "🪝 Воблер", "🌀 Блешня-вертушка");
    if (hasPerch)     baitTags.push("🪱 Черв'як", "🪝 Твістер", "🌀 Мікроблешня");
    if (hasPikePerch) baitTags.push("🐟 Живець", "🪝 Джиг", "🌀 Віброхвіст");
    if (hasCatfish)   baitTags.push("🪱 Пучок черв'яків", "🐟 Живець великий");
    if (baitTags.length === 0) baitTags.push("🐟 Живець", "🪝 Воблер");
    baitText = h.temp >= 18
      ? "Тепла вода — хижак активний. Активні приманки (воблери, блешні) дадуть кращий результат."
      : "Добра температура для хижої риби. Живець або джиг залежно від глибини.";
  } else {
    if (hasPike || hasPikePerch) baitTags.push("🐟 Живець (повільний)");
    if (hasPerch)  baitTags.push("🪱 Черв'як", "🪝 Мікроджиг");
    if (hasCatfish) baitTags.push("🪱 Пучок черв'яків");
    if (baitTags.length === 0) baitTags.push("🐟 Живець (повільний)");
    baitText = "Холодна вода — хижак млявий. Повільна проводка, живець з місця.";
  }

  const castTags: string[] = [];
  let castText = "";
  if (h.temp >= 15 && h.wind <= 3) {
    castTags.push("📏 Береговий стояк", "🌿 Межа рослинності");
    castText = "Тепло і тихо — щука і окунь стоять біля берегової рослинності. Кидай вздовж очерету та ліліям.";
  } else if (h.wind <= 4) {
    castTags.push("📏 30–50 м", "⬇️ Середній горизонт", "🕳️ Ями");
    castText = "Хижак тримається на середній глибині. Джиг або живець на 30–50 м, горизонт 1–3 м від дна.";
  } else {
    castTags.push("📏 50–70 м", "⬇️ Глибокі ями");
    castText = "Сильний вітер — хижак відійшов на глибину. Глибокі ями, повільна проводка по дну.";
  }

  const timingTags: string[] = [];
  const bestPeaks = peaks.filter(p => p.isMajor).slice(0, 2);
  bestPeaks.forEach(p => timingTags.push(`⭐⭐ ${p.label}`));
  const dawn  = peaks.find(p => p.start >= 5 && p.start <= 8);
  const dusk  = peaks.find(p => p.start >= 17 && p.start <= 20);
  let timingText = "Хижак активний на сутінках — ранній ранок та вечір найкращі вікна.";
  if (dawn)  timingText += ` Ранкова атака о ${dawn.label}.`;
  if (dusk)  timingText += ` Вечірня атака о ${dusk.label}.`;
  if (!dawn && !dusk) {
    const next = peaks.find(p => p.start >= h.hour) ?? peaks[0];
    timingText = `Хижак активний на сутінках. ${next ? `Найближчий пік: ${next.label}.` : ""}`;
  }
  timingTags.push("🌅 Ранній ранок", "🌆 Вечір");

  // ── Де шукати (хижа) ──
  let locationText = "";
  const locationTags: string[] = [];
  if (h.temp >= 15 && h.wind <= 3) {
    locationText = "Тепло і тихо — хижак біля берегової рослинності. Кидай вздовж очерету та лілій.";
    locationTags.push("🌿 Очерет", "🌸 Лілії", "🏖️ Береговий стояк");
  } else {
    locationText = "Ями, перепади глибини, межа підводної рослинності — улюблені місця хижака в холоді.";
    locationTags.push("🕳️ Ями", "📐 Перепади", "🌿 Межа рослинності");
  }

  // ── Lure grid (залежить від температури) ──
  const warm = h.temp >= 12;
  const lures: Lure[] = [
    {
      icon: "🐛", name: "Силікон", top: true,
      tip: warm ? "Твістер 3–5″, джиг 10–18 г, ступінчаста проводка" : "Великий твістер, повільна ступінчаста проводка по дну",
      colors: [
        { hex: "#ffffff", name: "Білий", best: true },
        { hex: "#f97316", name: "Оранж", best: true },
        { hex: "#16a34a", name: "Зелений" },
        { hex: "#7c3aed", name: "Фіолет" },
      ],
    },
    {
      icon: "🪝", name: "Воблер", top: warm,
      tip: warm ? "Кренк або мінноу 7–12 см, активна рівномірна проводка" : "Суспендер 7–10 см, стоп-енд-гоу, пауза 2–3 с",
      colors: [
        { hex: "#c0c0c0", name: "Срібний", best: true },
        { hex: "#f5c842", name: "Жовтий", best: warm },
        { hex: "#0ea5e9", name: "Синій" },
      ],
    },
    {
      icon: "🌀", name: "Вертушка", top: warm,
      tip: warm ? "№2–4, рівномірна швидка проводка, щука та окунь" : "№2–3, повільна рівномірна проводка, окунь",
      colors: [
        { hex: "#c0c0c0", name: "Срібний", best: true },
        { hex: "#f5c842", name: "Золотий" },
        { hex: "#dc2626", name: "Червоний" },
      ],
    },
    {
      icon: "🔩", name: "Коливалка", top: !warm,
      tip: warm ? "10–20 г, активна проводка, щука та судак" : "7–14 г, паузи 2–3 с, судак на глибоких ямах",
      colors: [
        { hex: "#c0c0c0", name: "Срібний", best: true },
        { hex: "#f5c842", name: "Золотий", best: !warm },
      ],
    },
  ];

  return {
    bait:       { text: baitText, tags: baitTags, lures },
    cast:       { text: castText,    tags: castTags },
    groundbait: null,
    location:   { text: locationText, tags: locationTags },
    timing:     { text: timingText,  tags: timingTags },
  };
}

// ── Main generator ──
function generateAdvice(h: HourData, fishSpecies: string[], dateStr: string): Advice {
  const phase = moonPhase(new Date(dateStr + "T12:00:00"));
  const peaks = getSolunarPeaks(new Date(dateStr + "T12:00:00"));
  const { peaceful, predatory } = classifyFish(fishSpecies);

  const moonStr   = moonLabel(phase);
  const pressStr  = Math.abs(h.pressure - 1013) < 8 ? "тиск стабільний" : h.pressure > 1013 ? "тиск підвищений" : "тиск знижений";
  const windStr   = h.wind <= 2 ? "вітер слабкий" : h.wind <= 4 ? "вітер помірний" : "вітер сильний";
  const tempStr   = h.temp >= 15 ? "тепла вода" : h.temp >= 8 ? "прохолодна вода" : "холодна вода";
  const summary   = `${tempStr.charAt(0).toUpperCase() + tempStr.slice(1)}, ${windStr}, ${pressStr}. ${moonStr} — ${
    phase < 0.1 || phase > 0.9 || (phase > 0.45 && phase < 0.55)
      ? "сприятлива фаза для кльову"
      : "нейтральна фаза місяця"
  }. ${
    h.biteClass === "g" ? "Умови загалом добрі — варто скористатися моментом."
    : h.biteClass === "o" ? "Умови середні — з правильною тактикою буде результат."
    : "Складні умови, але при терпінні результат можливий."
  }`;

  const now2 = new Date();
  return {
    peaceful:  peaceful.length  > 0 ? peacefulAdvice(h, peaceful, peaks)   : null,
    predatory: predatory.length > 0 ? predatoryAdvice(h, predatory, peaks) : null,
    summary,
    updatedAt: `${String(now2.getHours()).padStart(2,"0")}:${String(now2.getMinutes()).padStart(2,"0")}`,
  };
}

// ── Component ──
export default function AIAdvisor({ lat, lng, fishSpecies }: { lat: number; lng: number; fishSpecies: string[] }) {
  const [advice, setAdvice]     = useState<Advice | null>(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState<"peaceful" | "predatory">("peaceful");

  const load = async () => {
    setLoading(true);
    const result = await fetchCurrentHour(lat, lng);
    if (result) {
      const a = generateAdvice(result.hour, fishSpecies, result.dateStr);
      setAdvice(a);
      // default tab = whichever exists
      if (!a.peaceful && a.predatory) setTab("predatory");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="rounded-2xl overflow-hidden shadow-sm animate-pulse">
        <div className="h-16 bg-[#0f2a4a]" />
        <div className="bg-white p-5 flex flex-col gap-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 shrink-0" />
              <div className="flex-1 flex flex-col gap-2 pt-1">
                <div className="h-3 bg-blue-50 rounded w-24" />
                <div className="h-4 bg-blue-50 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!advice || (!advice.peaceful && !advice.predatory)) return null;

  const hasBoth = !!advice.peaceful && !!advice.predatory;
  const current = tab === "peaceful" ? advice.peaceful : advice.predatory;

  const timelineItems = current ? [
    { emoji: tab === "peaceful" ? "🪱" : "🐟", label: "Наживка",             dot: tab === "peaceful" ? "yellow" : "red",    ...current.bait },
    { emoji: "🎣",                              label: "Дистанція та горизонт", dot: "blue",                                    ...current.cast },
    ...(current.groundbait ? [{ emoji: "🌿", label: "Прикормка", dot: "orange", ...current.groundbait }] : []),
    { emoji: "📍",                              label: "Де шукати",            dot: "purple",                                  ...current.location },
    { emoji: "⏰",                              label: "Найкращий час",         dot: "green",                                   ...current.timing },
  ] : [];

  const dotStyle: Record<string, string> = {
    yellow: "bg-[#fefce8] border-[#fde68a]",
    red:    "bg-[#fff1f2] border-[#fecdd3]",
    blue:   "bg-[#eff6ff] border-[#bfdbfe]",
    orange: "bg-[#fff7ed] border-[#fed7aa]",
    purple: "bg-[#faf5ff] border-[#e9d5ff]",
    green:  "bg-[#f0fdf4] border-[#bbf7d0]",
  };
  const labelStyle: Record<string, string> = {
    yellow: "text-[#b45309]", red: "text-[#be123c]", blue: "text-[#1d4ed8]",
    orange: "text-[#c2410c]", purple: "text-[#7e22ce]", green: "text-[#15803d]",
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f2a4a] to-[#1e3f6e] px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-white font-bold text-[15px]">🤖 Що робити сьогодні</p>
          <p className="text-white/45 text-xs mt-0.5">AI-порадник на основі погоди та озера</p>
        </div>
      </div>

      {/* Fish tabs */}
      {hasBoth && (
        <div className="bg-white border-b border-slate-100 px-4 pt-2 pb-0 flex gap-1">
          {(["peaceful", "predatory"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-bold border-b-2 transition-all ${
                tab === t
                  ? "border-[#0f2a4a] text-[#0f2a4a]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {t === "peaceful" ? "🐟 Мирна риба" : "🦈 Хижа риба"}
            </button>
          ))}
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white px-5 pt-5 pb-2">
        <div className="flex flex-col">
          {timelineItems.map((item, i) => (
            <div key={item.label} className="flex gap-4 relative pb-5">
              {/* Vertical line */}
              {i < timelineItems.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 to-slate-50" />
              )}
              {/* Dot */}
              <div className={`w-10 h-10 rounded-[13px] border-2 flex items-center justify-center text-lg shrink-0 z-10 ${dotStyle[item.dot]}`}>
                {item.emoji}
              </div>
              {/* Content */}
              <div className="pt-1.5 flex-1 min-w-0">
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${labelStyle[item.dot]}`}>
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-[#0f2a4a] leading-relaxed">{item.text}</p>
                {"lures" in item && item.lures ? (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {item.lures.map((lure) => (
                      <div key={lure.name} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[17px]">{lure.icon}</span>
                          <span className="text-xs font-bold text-[#0f2a4a] flex-1">{lure.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${lure.top ? "bg-[#fef9c3] text-[#854d0e]" : "bg-slate-100 text-slate-500"}`}>
                            {lure.top ? "⭐ Топ" : "Норм"}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-snug mb-2">{lure.tip}</p>
                        <div className="flex flex-wrap gap-1">
                          {lure.colors.map((c) => (
                            <div key={c.name} className="flex items-center gap-1">
                              <div
                                className="w-3 h-3 rounded-[3px] flex-shrink-0"
                                style={{
                                  background: c.hex,
                                  border: c.hex === "#ffffff" ? "1px solid #e2e8f0" : "1px solid rgba(0,0,0,.1)",
                                  boxShadow: c.best ? "0 0 0 1.5px #f5c842" : undefined,
                                }}
                              />
                              <span className={`text-[10px] font-semibold ${c.best ? "text-[#92400e]" : "text-slate-500"}`}>
                                {c.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : item.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.tags.map((tag) => (
                      <span key={tag} className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary + footer */}
      <div className="bg-[#f8fafc] border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-4">
        <p className="text-xs text-slate-500 italic leading-relaxed flex-1 border-l-2 border-[#f5c842] pl-3">
          {advice.summary}
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-slate-400">о {advice.updatedAt}</span>
          <button
            onClick={load}
            className="text-xs font-bold text-[#0f2a4a] bg-white border border-slate-200 hover:bg-slate-50 transition-colors px-3 py-1.5 rounded-lg"
          >
            🔄 Оновити
          </button>
        </div>
      </div>
    </div>
  );
}
