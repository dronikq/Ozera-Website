"use client";

import { useEffect, useState } from "react";

interface HourData {
  hour: number;
  temp: number;
  wind: number;
  rain: number;
  pressure: number;
  pressureTrend: "rising" | "falling" | "stable";
  cloudCode: number;   // Open-Meteo weathercode: 0=ясно, 1-2=мінлива, 3=похмуро, 45+=опади/гроза
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
  dont:       { text: string; tags: string[] };
}

interface Advice {
  peaceful: AdviceSet | null;
  predatory: AdviceSet | null;
  peacefulScore: number;
  predatoryScore: number;
  summary: string;
  updatedAt: string;
}

type GlyphName =
  | "assistant"
  | "fish"
  | "hook"
  | "map"
  | "clock"
  | "x"
  | "ruler"
  | "leaf"
  | "rod"
  | "scale"
  | "thermos"
  | "shirt"
  | "glove"
  | "sun"
  | "rain"
  | "boot"
  | "net"
  | "sparkles"
  | "refresh"
  | "chevronDown"
  | "chevronRight"
  | "check"
  | "backpack";

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
    const url = `/api/weather?lat=${lat}&lng=${lng}&days=1`;
    const res = await fetch(url, { cache: "no-store" });
    const json = await res.json();
    const { hourly } = json;
    const now = new Date().getHours();
    const idx = (hourly.time as string[]).findIndex((t) => new Date(t).getHours() >= now);
    const i = idx >= 0 ? idx : 0;
    const wind      = (hourly.windspeed_10m[i] ?? 0) / 3.6;
    const temp      = Math.round(hourly.temperature_2m[i] ?? 10);
    const rain      = hourly.precipitation[i] ?? 0;
    const pressure  = Math.round(hourly.surface_pressure[i] ?? 1013);
    const cloudCode = hourly.weathercode[i] ?? 0;
    const dateStr = (hourly.time[i] as string).slice(0, 10);

    // ── Pressure trend: compare with previous hour ──
    const prevPressure = i > 0 ? (hourly.surface_pressure[i - 1] ?? pressure) : pressure;
    const pDelta = pressure - prevPressure;
    const pressureTrend: HourData["pressureTrend"] =
      pDelta > 1.5 ? "rising" : pDelta < -1.5 ? "falling" : "stable";

    const peaks = getSolunarPeaks(new Date());
    let solType: "major" | "minor" | null = null;
    const hDiff = (a: number, b: number) => Math.min(Math.abs(a - b), 24 - Math.abs(a - b));
    if (peaks.some(p =>  p.isMajor && hDiff(p.start, now) <= 1)) solType = "major";
    else if (peaks.some(p => !p.isMajor && hDiff(p.start, now) <= 1)) solType = "minor";

    // General score (for summary text — fish-specific scores computed in generateAdvice)
    let score = 5;
    if (temp >= 10 && temp <= 22)     score += 1.5;
    else if (temp >= 5 && temp < 10)  score += 0.5;
    else if (temp > 22 && temp <= 28) score += 0.5;
    else                              score -= 1;
    if (wind <= 2)      score += 1;
    else if (wind <= 4) score += 0.5;
    else if (wind >= 7) score -= 2;
    else                score -= 1;
    if (rain === 0)      score += 0.5;
    else if (rain <= 2)  score += 0.1;
    else if (rain > 5)   score -= 1.5;
    if (pressureTrend === "stable")       score += 1;
    else if (pressureTrend === "rising")  score += 0.3;
    else                                  score -= 1;
    const phase = moonPhase(new Date());
    if (phase < 0.1 || phase > 0.9 || (phase > 0.45 && phase < 0.55)) score += 1;
    if (solType === "major") score += 1.5;
    if (solType === "minor") score += 0.8;
    score = Math.max(0, Math.min(10, score));

    return {
      dateStr,
      hour: {
        hour: now, temp, wind: Math.round(wind * 10) / 10, rain, pressure, pressureTrend, cloudCode,
        biteScore: Math.round(score * 10) / 10,
        biteClass: score >= 7 ? "g" : score >= 4.5 ? "o" : "b",
        solType,
      },
    };
  } catch { return null; }
}

// ── Per-fish bite score ──
function computeScore(h: HourData, fishType: "peaceful" | "predatory", month: number): number {
  let score = 5;

  // 1. Temperature — fish-type specific optimal ranges
  if (fishType === "peaceful") {
    if      (h.temp >= 18 && h.temp <= 24) score += 2;
    else if (h.temp >= 12 && h.temp < 18)  score += 1;
    else if (h.temp >= 8  && h.temp < 12)  score -= 0.5;
    else if (h.temp > 24  && h.temp <= 28) score += 0.5;
    else                                    score -= 1.5; // <8 або >28
  } else {
    if      (h.temp >= 10 && h.temp <= 18) score += 2;
    else if (h.temp >= 6  && h.temp < 10)  score += 1;
    else if (h.temp > 18  && h.temp <= 22) score += 0.5;
    else if (h.temp < 6)                   score -= 0.5;
    else                                    score -= 1; // >22
  }

  // 2. Wind
  if      (h.wind <= 2) score += 1;
  else if (h.wind <= 4) score += 0.5;
  else if (h.wind >= 7) score -= 2;
  else                  score -= 1;

  // 3. Rain
  if      (h.rain === 0) score += 0.5;
  else if (h.rain <= 2)  score += 0.1;
  else if (h.rain <= 5)  score -= 0.5;
  else                   score -= 1.5;

  // 4. Cloud cover / weathercode
  // Хижа: любить похмуро (засада), не любить яскраве сонце
  // Мирна: менш чутлива, але ясно+тепло трохи краще
  const isClear    = h.cloudCode <= 1;                          // 0=ясно, 1=переважно ясно
  const isPartly   = h.cloudCode === 2;                         // мінлива хмарність
  const isOvercast = h.cloudCode === 3;                         // похмуро
  const isRainy    = h.cloudCode >= 51 && h.cloudCode <= 67;    // дрібний/помірний дощ
  const isHeavy    = h.cloudCode >= 80;                         // зливи, гроза
  if (fishType === "predatory") {
    if      (isOvercast) score += 1.0;  // щука активна під хмарами — засада в розсіяному світлі
    else if (isPartly)   score += 0.3;
    else if (isClear)    score -= 1.5;  // яскраве сонце — щука йде на глибину, майже пасивна
    else if (isRainy)    score += 0.4;  // легкий дощ — добре для хижака
    else if (isHeavy)    score -= 1.0;  // зливи/гроза — погано
  } else {
    if      (isClear && h.temp >= 15) score += 0.4; // ясно + тепло — мирна активна
    else if (isOvercast)              score += 0.2;
    else if (isHeavy)                 score -= 0.5;
  }

  // 5. Pressure trend
  if      (h.pressureTrend === "stable")  score += 1;
  else if (h.pressureTrend === "rising")  score += 0.3;
  else                                    score -= 1.2; // falling
  if (Math.abs(h.pressure - 1013) >= 15) score -= 0.5; // екстремальне відхилення

  // 5. Moon phase
  const phase = moonPhase(new Date());
  if (phase < 0.1 || phase > 0.9 || (phase > 0.45 && phase < 0.55)) score += 1;

  // 5b. Solunar ±1hr window (виправлення: раніше була точна рівність)
  const peaks = getSolunarPeaks(new Date());
  const hd = (a: number, b: number) => Math.min(Math.abs(a - b), 24 - Math.abs(a - b));
  if      (peaks.some(p =>  p.isMajor && hd(p.start, h.hour) <= 1)) score += 1.5;
  else if (peaks.some(p => !p.isMajor && hd(p.start, h.hour) <= 1)) score += 0.8;

  // 6. Seasonal coefficient
  if ((month === 3 || month === 4) && fishType === "peaceful") score -= 0.5; // квітень-травень: нерест
  if (month === 11 || month === 0 || month === 1)              score -= 1;   // грудень-лютий: зима
  if (month >= 5 && month <= 7 && h.temp < 25)                score += 0.3; // червень-серпень: літо

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

// ── Peaceful fish advice ──
function peacefulAdvice(h: HourData, fish: string[], peaks: ReturnType<typeof getSolunarPeaks>, score: number): AdviceSet {
  const lc = fish.map(f => f.toLowerCase());
  const hasCarp    = lc.some(f => f.includes("короп") || f.includes("карп") || f.includes("сазан"));
  const hasCrucian = lc.some(f => f.includes("карась"));
  const hasGrass   = lc.some(f => f.includes("амур") || f.includes("товстолоб"));
  const hasBream   = lc.some(f => f.includes("лящ") || f.includes("лин"));

  const month     = new Date().getMonth();
  const isDawn    = h.hour >= 5  && h.hour <= 8;
  const isMidday  = h.hour >= 12 && h.hour <= 15;
  const isEvening = h.hour >= 16 && h.hour <= 20;
  const isFalling = h.pressureTrend === "falling";
  const isRising  = h.pressureTrend === "rising";
  const isSpring  = month >= 2 && month <= 4;
  const isSummer  = month >= 5 && month <= 8;
  const isAutumn  = month >= 9 && month <= 10;
  const isWinter  = month === 11 || month <= 1;

  // ── Наживка ──
  const baitTags: string[] = [];
  let baitText = "";
  if (isFalling) {
    baitTags.push("🪱 Черв'як", "🐛 Опариш");
    baitText = "Тиск падає — риба тривожна, відмовляється від рослинних. Лише тваринна наживка дрібного розміру.";
  } else if (h.temp >= 18) {
    if (hasCarp)    baitTags.push("🔴 Бойли", "🌽 Кукурудза", "🍢 Пелети");
    if (hasCrucian) baitTags.push("🍞 Хліб", "🌽 Кукурудза", "🐛 Опариш");
    if (hasGrass)   baitTags.push("🌿 Трава/зелень", "🌽 Кукурудза");
    if (hasBream)   baitTags.push("🪱 Черв'як", "🐛 Опариш", "🌾 Перловка");
    if (baitTags.length === 0) baitTags.push("🌽 Кукурудза", "🔴 Бойли");
    baitText = h.temp >= 24
      ? "Спека — риба активна вранці та ввечері, вдень пасивна. Ароматизовані бойли та кукурудза зранку, тваринна наживка вдень."
      : "Комфортна температура. Бойли та кукурудза для коропа, хліб чи опариш для карася.";
  } else if (h.temp >= 10) {
    baitTags.push("🪱 Черв'як", "🐛 Опариш");
    if (hasCarp)    baitTags.push("🌾 Перловка", "🍢 Пелети (дрібні)");
    if (hasCrucian) baitTags.push("🍞 Хліб (маленький шматок)");
    baitText = "Прохолодна вода — тваринні наживки ефективніші. Черв'як та опариш на першому місці.";
    if (isSpring) baitText += " Весна: карась активніший за коропа — орієнтуйся на нього.";
  } else {
    baitTags.push("🪱 Черв'як (дрібний)", "🐛 Опариш");
    baitText = isWinter
      ? "Зима — мирна риба в глибоких ямах, майже не їсть. Лише дрібний черв'як впритул до дна, без різких рухів."
      : "Холодна вода (<10°C) — обмін речовин сповільнений. Короп майже не клює. Дрібна наживка біля дна — єдиний шанс.";
  }

  // ── Дистанція ──
  const castTags: string[] = [];
  let castText = "";
  if (isDawn || isEvening) {
    castTags.push("📏 10–30 м", "🌊 Мілина 0.5–1.5 м");
    castText = `${isDawn ? "Світанок" : "Вечір"} — мирна риба виходить на мілину годуватись. Коротка дистанція, рослинна зона, 0.5–1.5 м від дна.`;
  } else if (isMidday && h.temp >= 20) {
    castTags.push("📏 60–80 м", "⬇️ Глибина 3–5 м");
    castText = "Полудень + спека — риба пішла на глибину. Довгий закид, придонний горизонт 3–5 м.";
  } else if (h.wind <= 2) {
    castTags.push("📏 20–40 м", "🌊 Середній горизонт");
    castText = "Тихо — риба рівномірно розподілена. Середня дистанція, 1–2 м від дна.";
  } else if (h.wind <= 4) {
    castTags.push("📏 40–60 м", "⬇️ Придонний шар");
    castText = "Помірний вітер — риба тримається глибше та далі від берега.";
  } else {
    castTags.push("📏 60–80 м", "⬇️ Дно", "🕳️ Ями");
    castText = "Сильний вітер — мирна риба в ямах. Максимальна дистанція, монтаж на дно.";
  }
  if (h.temp < 10 && !castTags.includes("🕳️ Ями")) {
    castText += " Холодна вода: короп стоїть у ямах, мало рухається.";
    castTags.push("🕳️ Ями");
  }

  // ── Прикормка ──
  const groundbaitTags: string[] = [];
  let groundbaitText = "";
  if (isFalling) {
    groundbaitText = "Тиск падає — мінімальна прикормка. Велика кількість корму відлякає насторожену рибу.";
    groundbaitTags.push("🚫 Мінімум", "🔸 Дрібна фракція");
  } else if (h.temp >= 15) {
    const balls = isDawn ? "8–10 куль на старт, потім кожні 30 хв" : isMidday ? "3–4 кулі для підтримки" : "6–8 куль";
    groundbaitText = `Волога суміш середньої фракції. ${balls}.`;
    groundbaitTags.push("💧 Волога суміш", "🔶 Середня фракція");
    if (isSummer && h.temp >= 22) groundbaitTags.push("🍓 Фруктовий ароматизатор");
    if (isAutumn) { groundbaitText += " Осінь: додай протеїн (конопля, кориця)."; groundbaitTags.push("🌰 Протеїн"); }
  } else if (h.temp >= 8) {
    groundbaitText = "Суха дрібна суміш — у прохолодній воді риба їсть менше. 3–4 кулі на старт, далі тільки по кльову.";
    groundbaitTags.push("☀️ Суха суміш", "🔸 Дрібна фракція");
  } else {
    groundbaitText = "Без прикормки або 2–3 мінімальні кулі. Холодна вода — зайвий корм відпуде рибу.";
    groundbaitTags.push("🚫 Мінімум або без");
  }

  // ── Де шукати ──
  const locationTags: string[] = [];
  let locationText = "";
  if (isDawn) {
    locationText = "Світанок — риба на мілині (0.5–1.5 м) біля берегової рослинності. Перший свал від берега, кут очерету.";
    locationTags.push("🌿 Берегова зона", "📐 Перший свал", "🌾 Очерет");
  } else if (isMidday && h.temp >= 20) {
    locationText = "Полудень + тепло — риба відійшла на глибину (2.5–5 м). Дальній свал, ямки, тінь від дерев.";
    locationTags.push("🕳️ Глибокі ями", "📐 Дальній свал", "🌳 Тінь");
  } else if (h.temp < 10) {
    locationText = "Холодна вода — короп стоїть у глибоких ямах та на бровках від 3 м. Шукай перепади глибини.";
    locationTags.push("🕳️ Ями 3м+", "📐 Бровки");
  } else if (h.wind > 3) {
    locationText = "Вітер гонить корм до підвітряного берега — риба там. Кидай у напрямку вітру до берегу.";
    locationTags.push("🌿 Підвітряний берег", "🌾 Очерет");
  } else if (isAutumn) {
    locationText = "Осінь — короп активно жирує перед зимою. Ямки з мулом, закутки від вітру, глибокі бровки.";
    locationTags.push("🕳️ Ями з мулом", "📐 Бровки", "🌿 Закуток");
  } else {
    locationText = "Тихо — риба рівномірно розподілена. Перший свал від берега, кут очерету де збирається корм, корчі.";
    locationTags.push("🌿 Очерет", "📐 Перший свал", "🪵 Корчі");
  }

  // ── Найкращий час ──
  const biteClass = score >= 7 ? "g" : score >= 4.5 ? "o" : "b";
  const timingTags: string[] = [];
  peaks.filter(p => p.isMajor).slice(0, 2).forEach((p) => timingTags.push(p.label));
  const next = peaks.find(p => p.start >= h.hour) ?? peaks[0];
  const trendHint = isFalling ? " Тиск падає — активність знижується." : isRising ? " Тиск зростає — активність покращується." : "";
  const timingText = biteClass === "g"
    ? `Зараз сприятливий момент (${score}/10).${trendHint} ${next ? `Наступний пік: ${next.label}.` : ""}`
    : biteClass === "o"
    ? `Середня активність (${score}/10).${trendHint} ${next ? `Чекай піку о ${next.label}.` : ""}`
    : `Слабка активність (${score}/10).${trendHint} ${next ? `Краще зачекати піку о ${next.label}.` : ""}`;
  timingTags.push(biteClass === "g" ? "✅ Зараз — добрий" : biteClass === "o" ? "🟡 Зараз — середній" : "🔴 Зараз — слабкий");

  // ── Що не робити ──
  const dontTags: string[] = [];
  let dontText = "";
  if (isFalling) {
    dontText = "Тиск падає — не використовуй рослинні наживки та важку прикормку. Риба у стресі, відреагує лише на дрібну тваринну наживку.";
    dontTags.push("🚫 Бойли", "🚫 Кукурудза", "🚫 Важка прикормка");
  } else if (h.wind > 5) {
    dontText = "Сильний вітер — не кидай у відкриту воду, марна трата часу. Риба пішла за підвітряний берег або в ями.";
    dontTags.push("🚫 Відкрита вода");
  } else if (isMidday && h.temp >= 22) {
    dontText = "Спека в полудень — не чекай активного клювання на мілині. Риба відійшла на глибину і пасивна до вечора.";
    dontTags.push("🚫 Мілина вдень", "🚫 Поверхневий шар");
  } else if (h.temp < 8) {
    dontText = "Холодна вода — не закидай важку прикормку і не міняй точку часто. Риба байдужа до корму, потрібен час.";
    dontTags.push("🚫 Важка прикормка", "🚫 Часта зміна точки");
  } else if (isDawn) {
    dontText = "Світанок — не шуми і не ходи важко по берегу. Риба на мілині дуже чутлива до вібрацій.";
    dontTags.push("🚫 Шум", "🚫 Гучні кроки");
  } else {
    dontText = "Не міняй точку частіше ніж раз на годину — дай рибі звикнути до прикормки та освоїтись.";
    dontTags.push("🚫 Часта зміна точки");
  }

  return {
    bait:       { text: baitText,       tags: baitTags },
    cast:       { text: castText,       tags: castTags },
    groundbait: { text: groundbaitText, tags: groundbaitTags },
    location:   { text: locationText,   tags: locationTags },
    timing:     { text: timingText,     tags: timingTags },
    dont:       { text: dontText,       tags: dontTags },
  };
}

// ── Predatory fish advice ──
function predatoryAdvice(h: HourData, fish: string[], peaks: ReturnType<typeof getSolunarPeaks>, score: number): AdviceSet {
  const lc = fish.map(f => f.toLowerCase());
  const hasPike      = lc.some(f => f.includes("щука"));
  const hasPerch     = lc.some(f => f.includes("окунь"));
  const hasPikePerch = lc.some(f => f.includes("судак"));
  const hasCatfish   = lc.some(f => f.includes("сом"));

  const month      = new Date().getMonth();
  const isDawn     = h.hour >= 5  && h.hour <= 8;
  const isMidday   = h.hour >= 12 && h.hour <= 15;
  const isEvening  = h.hour >= 16 && h.hour <= 20;
  const isFalling  = h.pressureTrend === "falling";
  const isRising   = h.pressureTrend === "rising";
  const isSpring   = month >= 2 && month <= 4;
  const isSummer   = month >= 5 && month <= 8;
  const isAutumn   = month >= 9 && month <= 10;
  const isWinter   = month === 11 || month <= 1;
  const warm       = h.temp >= 12;
  const isClear    = h.cloudCode <= 1;
  const isOvercast = h.cloudCode === 3;

  // ── Наживка / приманки ──
  let baitText = "";
  if (isFalling) {
    baitText = "Тиск падає — хижак пасивний і не переслідує. Лише повільна ступінчаста проводка по дну, паузи 3–5 с. Пасивні приманки краще активних.";
    if (hasPikePerch) baitText += " Судак: мікроджиг 5–8 г при дні.";
  } else if (isDawn) {
    baitText = hasPike
      ? "Світанок — щуча атака у берегової рослинності. Поверхневий воблер або великий твістер вздовж очерету."
      : hasPerch
      ? "Ранній ранок — окунь активно полює на мілині. Вертушка №2–3 або мінноу 5–7 см."
      : "Досвітня активність: джиг вздовж берегових свалів, воблер по рослинності.";
    if (hasPikePerch) baitText += " Судак активний на свалах та ямах до 9:00.";
  } else if (isEvening) {
    baitText = hasPike
      ? "Вечір — друга хвиля щучої атаки. Кренк або поппер в берегову зону, активна проводка."
      : hasPikePerch
      ? "Сутінки — судак виходить на бровки. Джиг 12–18 г, горизонт 0.5–1 м від дна."
      : "Вечірній жор — воблер або джиг вздовж рослинної межі.";
  } else if (isMidday && isClear && h.temp >= 18) {
    baitText = "Яскраве сонце в полудень — хижак пішов на глибину. Глибоководний воблер або джиг на 4–7 м, повільна проводка.";
  } else if (warm) {
    baitText = h.temp >= 18
      ? "Тепла вода — активний жир. Воблери та вертушки дають кращий результат у активній проводці."
      : "Добра температура. Джиг або воблер залежно від горизонту — пробуй 1–3 м від дна.";
    if (hasCatfish) baitText += " Для сома — великий живець або пучок черв'яків, дно.";
  } else {
    baitText = "Прохолодна вода — хижак млявий. Повільна ступінчаста проводка по дну, паузи 2–4 с.";
    if (hasPikePerch) baitText += " Судак: дрібний силікон 2–3″ на легкому джигу.";
    if (isWinter) baitText = "Зима — хижак майже не рухається. Дуже повільний джиг або живець у ямі, паузи до 10 с.";
  }
  if (isSpring && !isFalling) baitText += " Квітень: щука після нересту слабка — великі приманки не реагує, бери 5–7 см.";
  if (isAutumn && warm) baitText += " Осінь: хижак активно жирує — великі приманки працюють краще.";

  // ── Дистанція / проводка ──
  const castTags: string[] = [];
  let castText = "";
  if (isDawn || isEvening) {
    castTags.push("📏 10–30 м", "🌿 Береговий стояк", "🌊 Мілина 0.5–1 м");
    castText = `${isDawn ? "Світанок" : "Вечір"} — хижак вийшов на мілину. Береговий стояк вздовж рослинності, дистанція 10–30 м.`;
  } else if (isMidday && isClear && h.temp >= 18) {
    castTags.push("📏 50–80 м", "⬇️ Глибина 4–7 м", "🕳️ Ями");
    castText = "Сонячний полудень — хижак на глибині. Далекий закид у ями, горизонт 4–7 м.";
  } else if (h.wind <= 3) {
    castTags.push("📏 20–50 м", "⬇️ 1–3 м від дна", "📐 Бровка");
    castText = "Тихо — хижак вздовж першого свалу та бровок. Джиг по рельєфу 1–3 м від дна.";
  } else if (h.wind <= 5) {
    castTags.push("📏 40–60 м", "⬇️ Середній горизонт", "🕳️ Ями");
    castText = "Помірний вітер — хижак відійшов від берега. Ями та свали, горизонт 1–3 м від дна.";
  } else {
    castTags.push("📏 60–80 м", "⬇️ Глибокі ями");
    castText = "Сильний вітер — хижак у глибоких ямах. Максимальна дистанція, проводка строго по дну.";
  }

  // ── Де шукати ──
  let locationText = "";
  const locationTags: string[] = [];
  if (isDawn || isEvening) {
    locationText = hasPike
      ? `${isDawn ? "Світанок" : "Вечір"} — щука стоїть у засідці в очереті та між лілій. Перший свал від берегу (0.5–1.5 м).`
      : hasPikePerch
      ? `${isDawn ? "Вранці" : "Ввечері"} судак виходить на бровки та свали (2–4 м). Перехід піску в мул — найкраще місце.`
      : `${isDawn ? "Ранковий" : "Вечірній"} вихід — хижак у берегової рослинності та на першому свалі.`;
    locationTags.push("🌿 Очерет/лілії", "📐 Перший свал", "🏖️ Берег");
  } else if (isMidday && isClear) {
    locationText = hasPikePerch
      ? "Полудень — судак відійшов у глибокі ями (5–8 м), стоїть нерухомо біля дна. Потрібна повільна подача."
      : "Яскраве сонце — хижак у тіні від рослинності, корчів, або в глибоких ямах. Шукай перепади глибини.";
    locationTags.push("🕳️ Глибокі ями", "🪵 Корчі/тінь", "📐 Перепади");
  } else if (isOvercast) {
    locationText = "Похмуро — хижак активний по всій акваторії. Засідки по рослинності, бровки, перепади — обшукуй всі горизонти.";
    locationTags.push("🌿 Рослинність", "📐 Бровки", "🕳️ Ями");
  } else if (h.temp < 10) {
    locationText = hasPikePerch
      ? "Холод — судак концентрується в глибоких ямах (5–10 м). Без руху, треба буквально покласти приманку на дно."
      : "Холодна вода — хижак у глибоких ямах та на перепадах. Щука тримається біля підводних коряг.";
    locationTags.push("🕳️ Ями 5м+", "📐 Перепади", "🪵 Корчі");
  } else {
    locationText = "Шукай хижака на бровках та перепадах глибини, межі підводної рослинності та очерет — класичні засідки.";
    locationTags.push("📐 Бровки", "🌿 Межа рослинності", "🕳️ Ями");
  }

  // ── Час / активність ──
  const biteClassP = score >= 7 ? "g" : score >= 4.5 ? "o" : "b";
  const trendHintP = isFalling
    ? " Тиск падає — хижак пасивний, не переслідує активні приманки."
    : isRising
    ? " Тиск зростає — активність відновлюється."
    : "";
  const timingTags: string[] = [];
  const bestPeaks = peaks.filter(p => p.isMajor).slice(0, 2);
  bestPeaks.forEach((p) => timingTags.push(p.label));
  const dawnPeak = peaks.find(p => p.start >= 5 && p.start <= 8);
  const duskPeak = peaks.find(p => p.start >= 17 && p.start <= 20);
  let timingText = `Хижак (${score}/10) — ранній ранок та вечір найкращі вікна.${trendHintP}`;
  if (dawnPeak) timingText += ` Ранкова атака: ${dawnPeak.label}.`;
  if (duskPeak) timingText += ` Вечірня атака: ${duskPeak.label}.`;
  if (!dawnPeak && !duskPeak) {
    const next = peaks.find(p => p.start >= h.hour) ?? peaks[0];
    timingText = `Хижак (${score}/10).${trendHintP} ${next ? `Найближчий пік: ${next.label}.` : ""}`;
  }
  if (isSpring) timingText += " Квітень: нерест щуки — активніший окунь та судак.";
  if (isSummer && h.temp >= 22) timingText += " Спека: клює лише на зорях.";
  if (isAutumn) timingText += " Осінь: жор хижака перед зимою, день активніший ніж влітку.";
  timingTags.push(biteClassP === "g" ? "✅ Зараз — добрий" : biteClassP === "o" ? "🟡 Зараз — середній" : "🔴 Зараз — слабкий");
  timingTags.push("🌅 Ранній ранок", "🌆 Вечір");

  // ── Що не робити ──
  const dontTags: string[] = [];
  let dontText = "";
  if (isFalling) {
    dontText = "Тиск падає — не застосовуй активну швидку проводку. Хижак не реагує на агресивні приманки, тільки пасивні.";
    dontTags.push("🚫 Швидка проводка", "🚫 Поппер/топвотер");
  } else if (isClear && isMidday && h.temp >= 18) {
    dontText = "Сонячний полудень — не трать час на мілину. Хижак пішов на глибину, береговий стояк порожній до вечора.";
    dontTags.push("🚫 Мілина вдень", "🚫 Береговий стояк");
  } else if (h.wind > 5) {
    dontText = "Сильний вітер — не кидай у відкриту воду та на вітряний берег. Хижак тільки в закритих ямах та за берегами.";
    dontTags.push("🚫 Відкрита вода", "🚫 Вітряний берег");
  } else if (h.temp < 8) {
    dontText = "Холодна вода — не міняй точку часто та не форсуй проводку. Хижак стоїть нерухомо, потрібна дуже повільна подача.";
    dontTags.push("🚫 Швидка проводка", "🚫 Часта зміна точки");
  } else if (isDawn) {
    dontText = "Світанок — не шуми на берегу, не плескай веслами. Хижак на мілині дуже чутливий до вібрацій і одразу іде.";
    dontTags.push("🚫 Шум", "🚫 Вібрація");
  } else if (isSpring) {
    dontText = "Квітень: щука після нересту — не використовуй великі приманки (12+ см), вона їх ігнорує. Середній розмір 5–8 см.";
    dontTags.push("🚫 Великі приманки 12+ см");
  } else {
    dontText = "Не тримайся одного місця довше 20 хв без поклівки — хижак або є, або його немає. Обшукуй нові точки.";
    dontTags.push("🚫 Довго на одній точці");
  }

  // ── Lure grid ──
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
    bait:       { text: baitText, tags: [], lures },
    cast:       { text: castText,     tags: castTags },
    groundbait: null,
    location:   { text: locationText, tags: locationTags },
    timing:     { text: timingText,   tags: timingTags },
    dont:       { text: dontText,     tags: dontTags },
  };
}

// ── Main generator ──
function generateAdvice(h: HourData, fishSpecies: string[], dateStr: string): Advice {
  const phase  = moonPhase(new Date(dateStr + "T12:00:00"));
  const peaks  = getSolunarPeaks(new Date(dateStr + "T12:00:00"));
  const month  = new Date(dateStr + "T12:00:00").getMonth(); // 0=Jan
  const { peaceful, predatory } = classifyFish(fishSpecies);

  const pScore = peaceful.length  > 0 ? computeScore(h, "peaceful",  month) : 0;
  const dScore = predatory.length > 0 ? computeScore(h, "predatory", month) : 0;
  const bestScore = Math.max(pScore, dScore);
  const bestClass = bestScore >= 7 ? "g" : bestScore >= 4.5 ? "o" : "b";

  const moonStr  = moonLabel(phase);
  const trendStr = h.pressureTrend === "rising" ? "тиск зростає" : h.pressureTrend === "falling" ? "тиск падає" : "тиск стабільний";
  const windStr  = h.wind <= 2 ? "вітер слабкий" : h.wind <= 4 ? "вітер помірний" : "вітер сильний";
  const tempStr  = h.temp >= 15 ? "тепла вода" : h.temp >= 8 ? "прохолодна вода" : "холодна вода";
  const summary  = `${tempStr.charAt(0).toUpperCase() + tempStr.slice(1)}, ${windStr}, ${trendStr}. ${moonStr} — ${
    phase < 0.1 || phase > 0.9 || (phase > 0.45 && phase < 0.55)
      ? "сприятлива фаза для кльову"
      : "нейтральна фаза місяця"
  }. ${
    bestClass === "g" ? "Умови загалом добрі — варто скористатися моментом."
    : bestClass === "o" ? "Умови середні — з правильною тактикою буде результат."
    : "Складні умови, але при терпінні результат можливий."
  }`;

  const now2 = new Date();
  return {
    peaceful:      peaceful.length  > 0 ? peacefulAdvice(h, peaceful, peaks, pScore)   : null,
    predatory:     predatory.length > 0 ? predatoryAdvice(h, predatory, peaks, dScore) : null,
    peacefulScore:  pScore,
    predatoryScore: dScore,
    summary,
    updatedAt: `${String(now2.getHours()).padStart(2,"0")}:${String(now2.getMinutes()).padStart(2,"0")}`,
  };
}

// ── Component ──
function Glyph({ name, size = 20 }: { name: GlyphName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "assistant":
      return <svg {...common}><path d="M12 3.5l1.6 4.1L18 9.2l-4.4 1.6L12 15l-1.6-4.2L6 9.2l4.4-1.6L12 3.5Z" /><path d="M4.8 16.8l.9 2.4L8 20l-2.3.8-.9 2.4-.9-2.4L2 20l2.3-.8.5-1.4" /></svg>;
    case "fish":
      return <svg {...common}><path d="M4 12c2.2-3.1 5-4.7 8-4.7 3.2 0 6 1.6 8 4.7-2 3.1-4.8 4.7-8 4.7-3 0-5.8-1.6-8-4.7Z" /><path d="M4 12h-2M18.2 9.8l2.8-2.2M18.2 14.2l2.8 2.2" /><circle cx="10" cy="11.5" r="0.9" fill="currentColor" stroke="none" /></svg>;
    case "hook":
      return <svg {...common}><path d="M6.5 6.5a4.5 4.5 0 0 1 9 0v5.2a4.5 4.5 0 0 1-9 0" /><path d="M9.2 17.2 6.5 19.8" /></svg>;
    case "map":
      return <svg {...common}><path d="M4 8l5-2 6 2 5-2v12l-5 2-6-2-5 2V8Z" /><path d="M9 6v12M15 8v12" /><circle cx="12" cy="11" r="1.6" /></svg>;
    case "clock":
      return <svg {...common}><circle cx="12" cy="12" r="8.2" /><path d="M12 7.8v4.7l3.2 1.9" /></svg>;
    case "x":
      return <svg {...common}><path d="M7 7l10 10M17 7 7 17" /></svg>;
    case "ruler":
      return <svg {...common}><path d="M5 16 16 5l3 3L8 19l-3-3Z" /><path d="M9 8l2 2M12 5l2 2M15 8l2 2" /></svg>;
    case "leaf":
      return <svg {...common}><path d="M19 5c-5.8 0-11 3.8-11 9.2 0 2.9 1.9 4.8 4.8 4.8C18 19 19 10.8 19 5Z" /><path d="M8.2 15.2C10 13.6 12.2 11.7 16 9.5" /></svg>;
    case "rod":
      return <svg {...common}><path d="M5 19 19 5" /><path d="M14.5 6.5 17.5 9.5" /><path d="M3.5 20.5 6 18" /></svg>;
    case "scale":
      return <svg {...common}><path d="M6 8h12" /><path d="M8 8v8m8-8v8" /><path d="M4 16h16" /><path d="M9 16a3 3 0 0 0 6 0" /></svg>;
    case "thermos":
      return <svg {...common}><path d="M9 3h6l-.5 2h-5L9 3Z" /><path d="M10 5h4l1 11a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2l1-11Z" /><path d="M10 10h4" /></svg>;
    case "shirt":
      return <svg {...common}><path d="M8 5 12 7l4-2 3 3-2 2v9H7V10L5 8l3-3Z" /></svg>;
    case "glove":
      return <svg {...common}><path d="M8 13V6.8a1.8 1.8 0 0 1 3.6 0V13" /><path d="M11.6 13V5.8a1.8 1.8 0 0 1 3.6 0V13" /><path d="M15.2 13V7.5a1.8 1.8 0 0 1 3.6 0V16a4 4 0 0 1-4 4H10a5 5 0 0 1-5-5v-2.5" /></svg>;
    case "sun":
      return <svg {...common}><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M4.5 4.5 6.3 6.3M17.7 17.7l1.8 1.8M2.5 12H5M19 12h2.5M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8" /></svg>;
    case "rain":
      return <svg {...common}><path d="M5 14.5h11.2a3.2 3.2 0 0 0 .2-6.4 4.6 4.6 0 0 0-8.6 1.7A2.8 2.8 0 0 0 5 14.5Z" /><path d="M8 18.5l-.7 1.5M12 18.5l-.7 1.5M16 18.5l-.7 1.5" /></svg>;
    case "boot":
      return <svg {...common}><path d="M6 5h4v9h4.5l1.5 3H6a2 2 0 0 1-2-2V9l2-4Z" /><path d="M6 14c1.5 0 3-.8 4-2" /></svg>;
    case "net":
      return <svg {...common}><circle cx="10.5" cy="10.5" r="4.5" /><path d="M14 14l5 5" /><path d="M8.3 8.3 12.7 12.7M12.8 8.1 8.1 12.8" /></svg>;
    case "sparkles":
      return <svg {...common}><path d="M12 3.5l1.6 4.1L18 9.2l-4.4 1.6L12 15l-1.6-4.2L6 9.2l4.4-1.6L12 3.5Z" /><path d="M18 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" /></svg>;
    case "refresh":
      return <svg {...common}><path d="M20 12a8 8 0 0 1-13.7 5.7M4 12a8 8 0 0 1 13.7-5.7" /><path d="M4 7.5V4H0.5M20 16.5V20H23.5" /></svg>;
    case "chevronDown":
      return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>;
    case "chevronRight":
      return <svg {...common}><path d="m9 6 6 6-6 6" /></svg>;
    case "check":
      return <svg {...common}><path d="M20 6 9 17l-5-5" /></svg>;
    case "backpack":
      return <svg {...common}><path d="M9 5.5h6A4 4 0 0 1 19 9.5V19H5V9.5a4 4 0 0 1 4-4Z" /><path d="M9 5.5V4.2A1.2 1.2 0 0 1 10.2 3h3.6A1.2 1.2 0 0 1 15 4.2v1.3" /><path d="M8 12h8" /></svg>;
    default:
      return <svg {...common}><path d="M12 3.5l1.6 4.1L18 9.2l-4.4 1.6L12 15l-1.6-4.2L6 9.2l4.4-1.6L12 3.5Z" /></svg>;
  }
}

const CP1251_BYTES = new Uint8Array(256);
for (let i = 0; i < 256; i += 1) CP1251_BYTES[i] = i;
const CP1251_CHARS = new TextDecoder("windows-1251").decode(CP1251_BYTES);
const CP1251_REVERSE = new Map(Array.from(CP1251_CHARS, (ch, index) => [ch, index]));

function repairCp1251Mojibake(value) {
  if (!value) return value;
  if (!/Рџ|С‚|Р°|в|в›|�|пїЅ/.test(value)) return value;

  const bytes = [];
  for (const ch of value) {
    const byte = CP1251_REVERSE.get(ch);
    if (byte === undefined) return value;
    bytes.push(byte);
  }

  try {
    const decoded = new TextDecoder("utf-8").decode(new Uint8Array(bytes));
    if (!decoded || decoded.includes("�")) return value;
    return decoded;
  } catch {
    return value;
  }
}

function cleanUiText(value) {
  return repairCp1251Mojibake(value)
    .replace(/^[^\p{L}\p{N}]+/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function adviceIconFor(key: string, tab: "peaceful" | "predatory"): GlyphName {
  if (key === "bait") return tab === "peaceful" ? "hook" : "fish";
  if (key === "cast") return "ruler";
  if (key === "groundbait") return "leaf";
  if (key === "location") return "map";
  if (key === "timing") return "clock";
  if (key === "dont") return "x";
  return "sparkles";
}

function adviceLureIconFor(name: string): GlyphName {
  const lc = name.toLowerCase();
  if (lc.includes("силікон") || lc.includes("silicon")) return "hook";
  if (lc.includes("воблер")) return "fish";
  if (lc.includes("вертуш")) return "sparkles";
  if (lc.includes("колива")) return "sparkles";
  if (lc.includes("живець")) return "fish";
  return "sparkles";
}

export default function AIAdvisor({ lat, lng, fishSpecies }: { lat: number; lng: number; fishSpecies: string[] }) {
  const [advice, setAdvice] = useState<Advice | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"peaceful" | "predatory">("peaceful");
  const [adviceOpen, setAdviceOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await fetchCurrentHour(lat, lng);
      if (result) {
        const a = generateAdvice(result.hour, fishSpecies, result.dateStr);
        setAdvice(a);
        if (!a.peaceful && a.predatory) setTab("predatory");
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [lat, lng]);

  if (loading) {
    return (
      <div className="dk-ai-stack" aria-busy="true">
        <section className="dk-panel dk-panel--loading">
          <div className="dk-panel__loading-line dk-panel__loading-line--wide" />
          <div className="dk-panel__loading-grid">
            <div className="dk-panel__loading-card" />
            <div className="dk-panel__loading-card" />
            <div className="dk-panel__loading-card" />
          </div>
        </section>
        <section className="dk-panel dk-panel--loading">
          <div className="dk-panel__loading-line dk-panel__loading-line--wide" />
          <div className="dk-panel__loading-line dk-panel__loading-line--mid" />
          <div className="dk-panel__loading-line dk-panel__loading-line--small" />
        </section>
      </div>
    );
  }

  if (!advice || (!advice.peaceful && !advice.predatory)) {
    return (
      <div className="dk-ai-stack">
        <section className="dk-panel dk-panel--error">
          <div className="dk-panel__error-copy">
            <p className="dk-panel__eyebrow">AI-помічник з підбору озера</p>
            <p className="dk-panel__subtitle">{cleanUiText("Не вдалося завантажити поради. Спробуйте ще раз за мить.")}</p>
          </div>
          <button type="button" onClick={load} className="dk-btn dk-btn--accent">
            <span className="dk-btn__icon"><Glyph name="refresh" size={16} /></span>
            Спробувати ще раз
          </button>
        </section>
      </div>
    );
  }

  const hasBoth = !!advice.peaceful && !!advice.predatory;
  const current = tab === "peaceful" ? advice.peaceful : advice.predatory;
  const activeTabScore = tab === "peaceful" ? advice.peacefulScore : advice.predatoryScore;

  const adviceCards = current
    ? [
        { key: "bait", label: "Наживка", icon: adviceIconFor("bait", tab), tone: "accent" as const, text: current.bait.text, tags: current.bait.tags, lures: current.bait.lures ?? [] },
        { key: "cast", label: "Дистанція та горизонт", icon: adviceIconFor("cast", tab), tone: "info" as const, text: current.cast.text, tags: current.cast.tags },
        ...(current.groundbait ? [{ key: "groundbait", label: "Прикормка", icon: adviceIconFor("groundbait", tab), tone: "positive" as const, text: current.groundbait.text, tags: current.groundbait.tags }] : []),
        { key: "location", label: "Де шукати", icon: adviceIconFor("location", tab), tone: "info" as const, text: current.location.text, tags: current.location.tags },
        { key: "timing", label: "Найкращий час", icon: adviceIconFor("timing", tab), tone: "accent" as const, text: current.timing.text, tags: current.timing.tags },
        { key: "dont", label: "Що не робити", icon: adviceIconFor("dont", tab), tone: "danger" as const, text: current.dont.text, tags: current.dont.tags },
      ]
    : [];

  return (
    <div className="dk-ai-stack">
      <section className="dk-panel dk-advice-panel">
        <button
          type="button"
          onClick={() => setAdviceOpen((prev) => !prev)}
          className="dk-panel__header"
          aria-expanded={adviceOpen}
          aria-controls="ai-advice-content"
        >
          <div className="dk-panel__header-copy">
            <div className="dk-label-row">
              <span className="dk-label-row__icon"><Glyph name="assistant" size={16} /></span>
              <span className="dk-label-row__label">{cleanUiText("Що робити сьогодні")}</span>
            </div>
            <p className="dk-panel__subtitle">{cleanUiText("AI-порадник на основі погоди та умов озера")}</p>
          </div>
          <span className="dk-panel__chevron" aria-hidden="true">{adviceOpen ? "▾" : "▸"}</span>
        </button>

        <div
          id="ai-advice-content"
          className="dk-panel__content"
          aria-hidden={!adviceOpen}
          style={{
            maxHeight: adviceOpen ? 2800 : 0,
            opacity: adviceOpen ? 1 : 0,
            overflow: "hidden",
            transform: adviceOpen ? "translateY(0)" : "translateY(-4px)",
            transition: "max-height 340ms ease, opacity 240ms ease, transform 240ms ease",
            pointerEvents: adviceOpen ? "auto" : "none",
          }}
        >
          {hasBoth && (
            <div className="dk-tabs">
              {(["peaceful", "predatory"] as const).map((t) => {
                const score = t === "peaceful" ? advice.peacefulScore : advice.predatoryScore;
                const active = tab === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`dk-tab ${active ? "dk-tab--active" : ""}`}
                    aria-pressed={active}
                  >
                    <span className="dk-tab__label">{cleanUiText(t === "peaceful" ? "Мирна риба" : "Хижа риба")}</span>
                    <span className="dk-tab__score">{score.toFixed(1)}/10</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="dk-advice-grid">
            {adviceCards.map((card) => (
              <article key={card.key} className={`dk-advice-card dk-advice-card--${card.tone}`}>
                <div className="dk-advice-card__icon"><Glyph name={card.icon} size={20} /></div>
                <div className="dk-advice-card__body">
                  <div className="dk-advice-card__top">
                    <p className="dk-advice-card__label">{cleanUiText(card.label)}</p>
                    {card.key === "timing" && activeTabScore >= 7 && <span className="dk-mini-score">{activeTabScore.toFixed(1)}/10</span>}
                  </div>
                  <p className="dk-advice-card__text">{cleanUiText(card.text)}</p>
                  {card.tags.length > 0 && (
                    <div className="dk-tag-row">
                      {card.tags.map((tag) => (
                        <span key={tag} className="dk-tag-row__tag">
                          {cleanUiText(tag)}
                        </span>
                      ))}
                    </div>
                  )}
                  {card.lures && card.lures.length > 0 && (
                    <div className="dk-lure-grid">
                      {card.lures.slice(0, 4).map((lure) => (
                        <div key={lure.name} className="dk-lure-card">
                          <span className="dk-lure-card__icon" aria-hidden="true">
                            <Glyph name={adviceLureIconFor(lure.name)} size={16} />
                          </span>
                          <div className="dk-lure-card__body">
                            <div className="dk-lure-card__head">
                              <span className="dk-lure-card__name">{cleanUiText(lure.name)}</span>
                            </div>
                            <p className="dk-lure-card__tip">{cleanUiText(lure.tip)}</p>
                          </div>
                          <div className="dk-lure-card__meta">
                            <span className={`dk-lure-card__badge ${lure.top ? "dk-lure-card__badge--top" : ""}`}>
                              {lure.top ? "Top" : "Норм"}
                            </span>
                            {lure.colors.length > 0 && (
                              <div className="dk-lure-card__colors" aria-label={`Рекомендовані кольори для ${cleanUiText(lure.name)}`}>
                                {lure.colors.map((color) => (
                                  <span
                                    key={`${lure.name}-${color.name}`}
                                    className={`dk-lure-card__color${color.best ? " dk-lure-card__color--best" : ""}`}
                                    title={cleanUiText(color.name)}
                                    aria-label={cleanUiText(color.name)}
                                  >
                                    <span
                                      className="dk-lure-card__color-dot"
                                      aria-hidden="true"
                                      style={{ backgroundColor: color.hex }}
                                    />
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {card.lures.length > 4 && <span className="dk-lure-grid__more">+{card.lures.length - 4}</span>}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="dk-panel__footer">
            <p className="dk-panel__note">{cleanUiText(advice.summary)}</p>
            <div className="dk-panel__footer-meta">
              <span className="dk-panel__updated">{cleanUiText(advice.updatedAt)}</span>
              <button type="button" onClick={load} className="dk-btn dk-btn--secondary">
                <span className="dk-btn__icon"><Glyph name="refresh" size={16} /></span>
                Оновити
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="dk-panel dk-checklist-panel dk-checklist-panel--soon" aria-label="Що взяти сьогодні — скоро">
        <div className="dk-soon-preview">
          <div className="dk-soon-preview__icon"><Glyph name="backpack" size={24} /></div>
          <div className="dk-soon-preview__body">
            <div className="dk-soon-preview__head">
              <div>
                <div className="dk-label-row">
                  <span className="dk-label-row__label">{cleanUiText("Що взяти сьогодні")}</span>
                  <span className="dk-soon-badge">Скоро</span>
                </div>
                <p className="dk-soon-preview__subtitle">{cleanUiText("AI-асистент для збору на риболовлю")}</p>
              </div>
            </div>
            <p className="dk-soon-preview__text">
              {cleanUiText("Допоможе скласти чекліст під погоду, озеро, рибу та формат виїзду.")}
            </p>
            <div className="dk-soon-chip-row" aria-label="Що враховуватиме AI-асистент">
              {["Погода", "Риба", "Снасті", "Наживка", "Одяг"].map((item) => (
                <span key={item} className="dk-soon-chip">{item}</span>
              ))}
            </div>
            <div className="dk-soon-status">
              <span className="dk-soon-status__icon"><Glyph name="sparkles" size={15} /></span>
              <span>{cleanUiText("Скоро в OZERA")}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
