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
  peaks.filter(p => p.isMajor).slice(0, 2).forEach(p => timingTags.push(`⭐⭐ ${p.label}`));
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
  bestPeaks.forEach(p => timingTags.push(`⭐⭐ ${p.label}`));
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

// ── Checklist ──
interface CheckItem { id: string; icon: string; label: string; sub?: string; warn?: boolean; }
interface CheckSection { label: string; color: "bait" | "clothes" | "gear"; items: CheckItem[]; }

function generateChecklist(h: HourData, fishSpecies: string[]): CheckSection[] {
  const lc = fishSpecies.map(s => s.toLowerCase());
  const hasPredatory = PREDATORY.some(p => lc.some(f => f.includes(p)));
  const hasPeaceful  = PEACEFUL.some(p  => lc.some(f => f.includes(p)));
  const hasCarp    = lc.some(f => f.includes("короп") || f.includes("карп") || f.includes("сазан"));
  const hasCrucian = lc.some(f => f.includes("карась"));
  const hasPike    = lc.some(f => f.includes("щука"));
  const hasPerch   = lc.some(f => f.includes("окунь"));
  const warm = h.temp >= 15;
  const cool = h.temp >= 8 && h.temp < 15;
  const cold = h.temp < 8;
  const rainy = h.rain > 1;
  const earlyMorning = h.hour <= 7;

  const bait: CheckItem[] = [];
  if (hasPredatory) {
    bait.push({ id: "silicon",  icon: "🐛", label: "Силікон / джиг" });
    bait.push({ id: "wobbler",  icon: "🪝", label: warm ? "Воблер" : "Воблер-суспендер" });
    if (hasPike || hasPerch) bait.push({ id: "spinner", icon: "🌀", label: "Блешня №2–3" });
    bait.push({ id: "livebait", icon: "🐟", label: "Живець" });
  }
  if (hasCarp) {
    if (warm) {
      bait.push({ id: "boilies",    icon: "🔴", label: "Бойли" });
      bait.push({ id: "corn",       icon: "🌽", label: "Кукурудза" });
      bait.push({ id: "pellet",     icon: "🍢", label: "Пелети" });
    } else {
      bait.push({ id: "worm",  icon: "🪱", label: "Черв'як / опариш" });
      if (cold) bait.push({ id: "pearl", icon: "🌾", label: "Перловка" });
    }
    bait.push({ id: "groundbait", icon: "🌿", label: "Прикормка" });
  }
  if (hasCrucian && !hasCarp) {
    bait.push({ id: "worm",  icon: "🪱", label: "Черв'як / опариш" });
    bait.push({ id: "bread", icon: "🍞", label: "Хліб / тісто" });
  }

  const clothes: CheckItem[] = [];
  if (cold) {
    clothes.push({ id: "jacket",  icon: "🧥", label: "Тепла куртка",   sub: `${h.temp}°C — холодно` });
    clothes.push({ id: "gloves",  icon: "🧤", label: "Рукавички" });
    clothes.push({ id: "thermos", icon: "☕", label: "Термос" });
  } else if (cool) {
    clothes.push({ id: "fleece",  icon: "🧥", label: "Флісова кофта",  sub: `+${h.temp}°C` });
    clothes.push({ id: "thermos", icon: "☕", label: "Термос" });
  } else {
    clothes.push({ id: "light", icon: "👕", label: "Легкий одяг" });
    if (h.temp > 22) clothes.push({ id: "sunscreen", icon: "🧴", label: "Сонцезахист" });
    clothes.push({ id: "cap", icon: "🧢", label: "Кепка" });
  }
  if (rainy) {
    clothes.push({ id: "raincoat", icon: "🌧️", label: "Дощовик",        sub: `⚠️ Дощ ${h.rain} мм`, warn: true });
    clothes.push({ id: "boots",    icon: "👢", label: "Гумові чоботи",  sub: "⚠️ Мокрий берег",     warn: true });
  }

  const gear: CheckItem[] = [];
  gear.push({ id: "net", icon: "🥅", label: "Підсак" });
  if (hasPredatory) gear.push({ id: "spinning", icon: "🎣", label: "Спінінг" });
  if (hasPeaceful)  { gear.push({ id: "feeder", icon: "🎣", label: "Фідер / донка" }); gear.push({ id: "stands", icon: "📐", label: "Підставки" }); }
  if (hasCarp)      gear.push({ id: "scales", icon: "⚖️", label: "Ваги" });
  if (earlyMorning) gear.push({ id: "torch", icon: "🔦", label: "Ліхтарик", sub: "Ще темно" });

  return ([
    { label: "🎣 Приманки",    color: "bait"    as const, items: bait },
    { label: "🧥 Одяг",        color: "clothes" as const, items: clothes },
    { label: "🔧 Спорядження", color: "gear"    as const, items: gear },
  ] as CheckSection[]).filter(s => s.items.length > 0);
}

// ── Component ──
export default function AIAdvisor({ lat, lng, fishSpecies }: { lat: number; lng: number; fishSpecies: string[] }) {
  const [advice, setAdvice]           = useState<Advice | null>(null);
  const [hourData, setHourData]       = useState<HourData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<"peaceful" | "predatory">("peaceful");
  const [checkedItems, setCheckedItems]     = useState<Record<string, boolean>>({});
  const [checklistStep, setChecklistStep]   = useState<"intro" | "question" | "result">("intro");
  const [selectedFish, setSelectedFish]     = useState<string[]>([]);
  const [openAdvisor, setOpenAdvisor]       = useState(false);
  const [openChecklist, setOpenChecklist]   = useState(false);

  const load = async () => {
    setLoading(true);
    setCheckedItems({});
    try {
      const result = await fetchCurrentHour(lat, lng);
      if (result) {
        const a = generateAdvice(result.hour, fishSpecies, result.dateStr);
        setAdvice(a);
        setHourData(result.hour);
        if (!a.peaceful && a.predatory) setTab("predatory");
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [lat, lng]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="rounded-2xl overflow-hidden animate-pulse" style={{ border: "1px solid #1E3A5F" }}>
        <div className="h-16 bg-[#0f2a4a]" />
        <div className="p-5 flex flex-col gap-5" style={{ background: "#132F57" }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl shrink-0" style={{ background: "#0F2A4D" }} />
              <div className="flex-1 flex flex-col gap-2 pt-1">
                <div className="h-3 rounded w-24" style={{ background: "#0F2A4D" }} />
                <div className="h-4 rounded w-full" style={{ background: "#0F2A4D" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (!advice || (!advice.peaceful && !advice.predatory)) {
    return (
      <div className="rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: "#132F57", border: "1px solid #1E3A5F" }}>
        <p className="text-sm" style={{ color: "#6F85A8" }}>⚠️ Не вдалось завантажити AI-порадник</p>
        <button onClick={load} className="text-sm font-semibold transition-colors shrink-0" style={{ color: "#4DA3FF" }}>
          Спробувати ще раз
        </button>
      </div>
    );
  }

  const hasBoth = !!advice.peaceful && !!advice.predatory;
  const current = tab === "peaceful" ? advice.peaceful : advice.predatory;

  const timelineItems = current ? [
    { emoji: tab === "peaceful" ? "🪱" : "🐟", label: "Наживка",             dot: tab === "peaceful" ? "yellow" : "red",    ...current.bait },
    { emoji: "🎣",                              label: "Дистанція та горизонт", dot: "blue",                                    ...current.cast },
    ...(current.groundbait ? [{ emoji: "🌿", label: "Прикормка", dot: "orange", ...current.groundbait }] : []),
    { emoji: "📍",                              label: "Де шукати",            dot: "purple",                                  ...current.location },
    { emoji: "⏰",                              label: "Найкращий час",         dot: "green",                                   ...current.timing },
    { emoji: "❌",                              label: "Що не робити",          dot: "rose",                                    ...current.dont },
  ] : [];

  const dotStyle: Record<string, string> = {
    yellow: "bg-[#fefce8] border-[#fde68a]",
    red:    "bg-[#fff1f2] border-[#fecdd3]",
    blue:   "bg-[#eff6ff] border-[#bfdbfe]",
    orange: "bg-[#fff7ed] border-[#fed7aa]",
    purple: "bg-[#faf5ff] border-[#e9d5ff]",
    green:  "bg-[#f0fdf4] border-[#bbf7d0]",
    rose:   "bg-[#fff1f2] border-[#fda4af]",
  };
  const labelStyle: Record<string, string> = {
    yellow: "text-[#b45309]", red: "text-[#be123c]", blue: "text-[#1d4ed8]",
    orange: "text-[#c2410c]", purple: "text-[#7e22ce]", green: "text-[#15803d]",
    rose:   "text-[#e11d48]",
  };

  return (
    <div className="flex flex-col gap-4">
    <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1E3A5F" }}>
      {/* Header */}
      <button onClick={() => setOpenAdvisor(o => !o)} className="w-full bg-gradient-to-r from-[#0f2a4a] to-[#1e3f6e] px-5 py-4 flex items-center justify-between">
        <div className="text-left">
          <p className="text-white font-bold text-[15px]">🤖 Що робити сьогодні</p>
          <p className="text-white/45 text-xs mt-0.5">AI-порадник на основі погоди та озера</p>
        </div>
        <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, display: "inline-block", transform: openAdvisor ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform .2s" }}>▾</span>
      </button>

      {openAdvisor && <>
      {/* Fish tabs */}
      {hasBoth && (
        <div className="px-4 pt-2 pb-0 flex gap-1" style={{ background: "#132F57", borderBottom: "1px solid #1E3A5F" }}>
          {(["peaceful", "predatory"] as const).map((t) => {
            const s = t === "peaceful" ? advice.peacefulScore : advice.predatoryScore;
            const sc = s >= 7 ? "text-[#15803d] bg-[#f0fdf4]" : s >= 4.5 ? "text-[#92400e] bg-[#fef9c3]" : "text-[#be123c] bg-[#fff1f2]";
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  tab === t
                    ? "border-[#FFC857] text-white"
                    : "border-transparent text-[#6F85A8] hover:text-[#A9B8D4]"
                }`}
              >
                {t === "peaceful" ? "🐟 Мирна риба" : "🦈 Хижа риба"}
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${sc}`}>{s}/10</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      <div className="px-5 pt-5 pb-2" style={{ background: "#132F57" }}>
        <div className="flex flex-col">
          {timelineItems.map((item, i) => (
            <div key={item.label} className="flex gap-4 relative pb-5">
              {/* Vertical line */}
              {i < timelineItems.length - 1 && (
                <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gradient-to-b from-[#1E3A5F] to-[#132F57]" />
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
                <p className="text-sm font-semibold text-white leading-relaxed">{item.text}</p>
                {"lures" in item && item.lures ? (
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {item.lures.map((lure) => (
                      <div key={lure.name} className="rounded-xl p-3" style={{ background: "#0F2A4D", border: "1px solid #1E3A5F" }}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[17px]">{lure.icon}</span>
                          <span className="text-xs font-bold text-white flex-1">{lure.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${lure.top ? "bg-[#fef9c3] text-[#854d0e]" : "text-[#6F85A8]"}`} style={lure.top ? {} : { background: "#132F57" }}>
                            {lure.top ? "⭐ Топ" : "Норм"}
                          </span>
                        </div>
                        <p className="text-[10px] leading-snug mb-2" style={{ color: "#A9B8D4" }}>{lure.tip}</p>
                        <div className="flex flex-wrap gap-1">
                          {lure.colors.map((c) => (
                            <div key={c.name} className="flex items-center gap-1">
                              <div
                                className="w-3 h-3 rounded-[3px] flex-shrink-0"
                                style={{
                                  background: c.hex,
                                  border: c.hex === "#ffffff" ? "1px solid #1E3A5F" : "1px solid rgba(255,255,255,.15)",
                                  boxShadow: c.best ? "0 0 0 1.5px #FFC857" : undefined,
                                }}
                              />
                              <span className={`text-[10px] font-semibold ${c.best ? "text-[#FFC857]" : "text-[#6F85A8]"}`}>
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
                      <span key={tag} className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: "#0F2A4D", border: "1px solid #1E3A5F", color: "#A9B8D4" }}>
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
      <div className="px-5 py-3 flex items-center justify-between gap-4" style={{ background: "#0F2A4D", borderTop: "1px solid #1E3A5F" }}>
        <p className="text-xs italic leading-relaxed flex-1 pl-3" style={{ color: "#A9B8D4", borderLeft: "2px solid #FFC857" }}>
          {advice.summary}
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px]" style={{ color: "#6F85A8" }}>о {advice.updatedAt}</span>
          <button
            onClick={load}
            className="text-xs font-bold transition-colors px-3 py-1.5 rounded-lg"
            style={{ color: "#A9B8D4", background: "#132F57", border: "1px solid #1E3A5F" }}
          >
            🔄 Оновити
          </button>
        </div>
      </div>
      </>}
    </div>

      {/* Checklist wizard — окремий блок */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #1E3A5F", background: "#132F57" }}>
        {/* Header */}
        <button onClick={() => setOpenChecklist(o => !o)} className="w-full bg-gradient-to-r from-[#0f2a4a] to-[#1e3f6e] px-5 py-4 flex items-center justify-between">
          <div className="text-left">
            <p className="text-white font-bold text-[15px]">🎒 Що взяти сьогодні</p>
            <p className="text-white/45 text-xs mt-0.5">ШІ допоможе зібратися і не забути нічого корисного</p>
          </div>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, display: "inline-block", transform: openChecklist ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform .2s" }}>▾</span>
        </button>
        {openChecklist && <>

        {/* ── INTRO ── */}
        {checklistStep === "intro" && (
          <div className="px-5 py-8 flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: "#0F2A4D", border: "1px solid #1E3A5F" }}>
              🤖
            </div>
            <div>
              <p className="font-bold text-[16px] leading-snug text-white">Зберемо тебе на риболовлю</p>
              <p className="text-sm mt-1.5 leading-relaxed max-w-xs" style={{ color: "#A9B8D4" }}>
                Відповідай на 1 коротке питання — і отримаєш персональний список спорядження під сьогоднішні умови.
              </p>
            </div>
            <button
              onClick={() => setChecklistStep("question")}
              className="font-bold text-sm px-6 py-2.5 rounded-xl transition-colors"
              style={{ background: "#FFC857", color: "#0B1F3A" }}
            >
              Почати →
            </button>
          </div>
        )}

        {/* ── QUESTION ── */}
        {checklistStep === "question" && (
          <div className="px-5 py-6 flex flex-col gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#6F85A8" }}>Крок 1 з 1</p>
              <p className="font-bold text-[15px] leading-snug text-white">Яку рибу плануєш ловити сьогодні?</p>
              <p className="text-xs mt-1" style={{ color: "#6F85A8" }}>Можна обрати кілька</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {fishSpecies.map((f) => {
                const active = selectedFish.includes(f);
                return (
                  <button
                    key={f}
                    onClick={() => setSelectedFish(prev =>
                      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
                    )}
                    className="px-3 py-1.5 rounded-xl text-sm font-semibold transition-all"
                    style={{
                      background: active ? "#FFC857" : "#0F2A4D",
                      color: active ? "#0B1F3A" : "#A9B8D4",
                      border: active ? "1.5px solid #FFC857" : "1.5px solid #1E3A5F",
                    }}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
            <button
              disabled={selectedFish.length === 0}
              onClick={() => { setCheckedItems({}); setChecklistStep("result"); }}
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-all"
              style={{
                background: selectedFish.length > 0 ? "#FFC857" : "#1E3A5F",
                color: selectedFish.length > 0 ? "#0B1F3A" : "#6F85A8",
                cursor: selectedFish.length === 0 ? "not-allowed" : "pointer",
              }}
            >
              Показати список →
            </button>
          </div>
        )}

        {/* ── RESULT ── */}
        {checklistStep === "result" && hourData && (() => {
          const checklist = generateChecklist(hourData, selectedFish);
          const allItems  = checklist.flatMap(s => s.items);
          const doneCount = allItems.filter(it => checkedItems[it.id]).length;
          const totalCount = allItems.length;
          const sectionColor: Record<string, string> = {
            bait: "text-[#b45309]", clothes: "text-[#1d4ed8]", gear: "text-[#7e22ce]",
          };
          return (
            <div className="px-5 pt-4 pb-3">
              {/* Selected fish chips */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {selectedFish.map(f => (
                  <span key={f} className="text-[11px] font-semibold px-2 py-0.5 rounded-md" style={{ background: "#0F2A4D", border: "1px solid #1E3A5F", color: "#4DA3FF" }}>
                    🎣 {f}
                  </span>
                ))}
                <button
                  onClick={() => setChecklistStep("question")}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors"
                  style={{ background: "#0F2A4D", border: "1px solid #1E3A5F", color: "#6F85A8" }}
                >
                  ✏️ Змінити
                </button>
              </div>

              {checklist.map((section) => (
                <div key={section.label} className="mb-3">
                  <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${sectionColor[section.color]}`}>
                    {section.label}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {section.items.map((item) => {
                      const checked = !!checkedItems[item.id];
                      return (
                        <button
                          key={item.id}
                          onClick={() => setCheckedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all"
                          style={{
                            background: checked ? "rgba(34,197,94,0.1)" : "#0F2A4D",
                            border: checked ? "1.5px solid #22c55e" : item.warn ? "1.5px solid #f87171" : "1.5px solid #1E3A5F",
                          }}
                        >
                          <div className="w-4 h-4 rounded-[4px] flex-shrink-0 flex items-center justify-center transition-all"
                            style={{
                              background: checked ? "#22c55e" : "#132F57",
                              border: checked ? "1.5px solid #22c55e" : item.warn ? "1.5px solid #f87171" : "1.5px solid #1E3A5F",
                            }}
                          >
                            {checked && (
                              <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                <path d="M1 3.5L3.2 5.7L8 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>
                          <span className="text-[14px] leading-none flex-shrink-0">{item.icon}</span>
                          <div className="min-w-0">
                            <p className={`text-[11px] font-bold leading-tight ${checked ? "line-through" : "text-white"}`} style={checked ? { color: "#6F85A8" } : {}}>
                              {item.label}
                            </p>
                            {item.sub && !checked && (
                              <p className={`text-[10px] mt-0.5 leading-tight ${item.warn ? "text-[#f87171] font-semibold" : "text-slate-400"}`}>
                                {item.sub}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {totalCount > 0 && (
                <div className="flex items-center gap-2 mt-2 mb-1">
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "#1E3A5F" }}>
                    <div
                      className="h-full bg-gradient-to-r from-[#22c55e] to-[#84cc16] rounded-full transition-all duration-300"
                      style={{ width: `${(doneCount / totalCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: "#6F85A8" }}>
                    {doneCount === totalCount ? "✅ Все зібрано!" : `${doneCount} з ${totalCount}`}
                  </span>
                </div>
              )}
            </div>
          );
        })()}
        </>}
      </div>
    </div>
  );
}
