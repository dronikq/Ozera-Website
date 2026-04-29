"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lake } from "@/lib/supabase";

const REGIONS = [
  "Київська область",
  "Вінницька область",
  "Волинська область",
  "Дніпропетровська область",
  "Житомирська область",
  "Закарпатська область",
  "Запорізька область",
  "Івано-Франківська область",
  "Кіровоградська область",
  "Львівська область",
  "Миколаївська область",
  "Одеська область",
  "Полтавська область",
  "Рівненська область",
  "Сумська область",
  "Тернопільська область",
  "Харківська область",
  "Херсонська область",
  "Хмельницька область",
  "Черкаська область",
  "Чернівецька область",
  "Чернігівська область",
  "Київ",
];

const REGION_COORDS: Record<string, [number, number]> = {
  "Київ":                     [50.45, 30.52],
  "Київська область":         [50.45, 30.52],
  "Вінницька область":        [49.23, 28.47],
  "Волинська область":        [50.75, 25.33],
  "Дніпропетровська область": [48.46, 35.04],
  "Житомирська область":      [50.25, 28.67],
  "Закарпатська область":     [48.62, 22.29],
  "Запорізька область":       [47.84, 35.14],
  "Івано-Франківська область":[48.92, 24.71],
  "Кіровоградська область":   [48.51, 32.27],
  "Львівська область":        [49.84, 24.03],
  "Миколаївська область":     [46.97, 31.99],
  "Одеська область":          [46.48, 30.73],
  "Полтавська область":       [49.59, 34.55],
  "Рівненська область":       [50.62, 26.25],
  "Сумська область":          [50.91, 34.80],
  "Тернопільська область":    [49.55, 25.59],
  "Харківська область":       [49.99, 36.23],
  "Херсонська область":       [46.64, 32.61],
  "Хмельницька область":      [49.42, 26.99],
  "Черкаська область":        [49.44, 32.06],
  "Чернівецька область":      [48.29, 25.94],
  "Чернігівська область":     [51.50, 31.30],
};

const PREDATORY = ["щука","окунь","судак","сом","жерех","берш","головень"];

function fishType(name: string): "peaceful" | "predatory" {
  return PREDATORY.some(p => name.toLowerCase().includes(p)) ? "predatory" : "peaceful";
}

async function fetchWeather(lat: number, lng: number) {
  const url = `/api/weather?lat=${lat}&lng=${lng}&days=1`;
  const res  = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  const { hourly } = json;
  const now = new Date().getHours();
  const idx = (hourly.time as string[]).findIndex((t: string) => new Date(t).getHours() >= now);
  const i = idx >= 0 ? idx : 0;
  const wind      = (hourly.windspeed_10m[i] ?? 0) / 3.6;
  const temp      = Math.round(hourly.temperature_2m[i] ?? 10);
  const rain      = hourly.precipitation[i] ?? 0;
  const cloudCode = hourly.weathercode[i] ?? 0;
  const pressure  = hourly.surface_pressure[i] ?? 1013;
  const prevPressure = i > 0 ? (hourly.surface_pressure[i - 1] ?? pressure) : pressure;
  const pDelta    = pressure - prevPressure;
  const pressureTrend = pDelta > 1.5 ? "rising" : pDelta < -1.5 ? "falling" : "stable";
  return { temp, wind: Math.round(wind * 10) / 10, rain, cloudCode, pressureTrend };
}

function quickScore(
  temp: number, wind: number, rain: number,
  pressureTrend: string, cloudCode: number,
  type: "peaceful" | "predatory"
): number {
  let s = 5;
  if (type === "peaceful") {
    if      (temp >= 18 && temp <= 24) s += 2;
    else if (temp >= 12 && temp < 18)  s += 1;
    else if (temp >= 8  && temp < 12)  s -= 0.5;
    else                               s -= 1.5;
  } else {
    if      (temp >= 10 && temp <= 18) s += 2;
    else if (temp >= 6  && temp < 10)  s += 1;
    else if (temp < 6)                 s -= 0.5;
    else                               s -= 1;
  }
  if      (wind <= 2) s += 1;
  else if (wind <= 4) s += 0.5;
  else if (wind >= 7) s -= 2;
  else                s -= 1;
  if      (rain === 0) s += 0.5;
  else if (rain <= 2)  s += 0.1;
  else if (rain > 5)   s -= 1.5;
  else                 s -= 0.5;
  if (type === "predatory") {
    if      (cloudCode === 3)                    s += 1.0;
    else if (cloudCode === 2)                    s += 0.3;
    else if (cloudCode <= 1)                     s -= 1.5;
    else if (cloudCode >= 51 && cloudCode <= 67) s += 0.4;
    else if (cloudCode >= 80)                    s -= 1.0;
  } else {
    if (cloudCode <= 1 && temp >= 15) s += 0.4;
    else if (cloudCode >= 80)         s -= 0.5;
  }
  if      (pressureTrend === "stable")  s += 1;
  else if (pressureTrend === "rising")  s += 0.3;
  else                                  s -= 1.2;
  return Math.max(0, Math.min(10, Math.round(s * 10) / 10));
}

interface Result { lake: Lake; score: number; }

type Step = "intro" | "region" | "fish" | "loading" | "result";

export default function AILakePicker({ lakes }: { lakes: Lake[] }) {
  const [step, setStep]               = useState<Step>("intro");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedFish, setSelectedFish]     = useState<string[]>([]);
  const [results, setResults]         = useState<Result[]>([]);
  const [weatherInfo, setWeatherInfo] = useState<{ temp: number; trend: string } | null>(null);

  // Унікальні риби з озер обраного регіону (або всіх)
  const regionLakes = selectedRegion
    ? lakes.filter(l => l.city === selectedRegion)
    : lakes;

  const allFish = Array.from(
    new Set(regionLakes.flatMap(l => l.fish_species ?? []))
  ).sort();

  const toggleFish = (f: string) =>
    setSelectedFish(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);

  const run = async () => {
    setStep("loading");

    const filtered = regionLakes.filter(lake =>
      selectedFish.length === 0 ||
      (lake.fish_species ?? []).some(f =>
        selectedFish.some(sel =>
          f.toLowerCase().includes(sel.toLowerCase()) ||
          sel.toLowerCase().includes(f.toLowerCase())
        )
      )
    );

    const type = selectedFish.some(f => fishType(f) === "predatory") ? "predatory" : "peaceful";
    const coords = REGION_COORDS[selectedRegion] ?? [49.5, 31.5];

    try {
      const w = await fetchWeather(coords[0], coords[1]);
      setWeatherInfo({ temp: w.temp, trend: w.pressureTrend });

      const scored: Result[] = filtered.map(lake => ({
        lake,
        score: quickScore(w.temp, w.wind, w.rain, w.pressureTrend, w.cloudCode, type),
      }));
      scored.sort((a, b) => b.score - a.score || a.lake.name.localeCompare(b.lake.name));
      setResults(scored.slice(0, 3));
    } catch {
      setResults([]);
    }
    setStep("result");
  };

  const reset = () => {
    setStep("intro");
    setSelectedRegion("");
    setSelectedFish([]);
    setResults([]);
    setWeatherInfo(null);
  };

  const scoreColor = (s: number) =>
    s >= 7   ? "bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]"
    : s >= 4.5 ? "bg-[#fefce8] text-[#92400e] border-[#fde68a]"
    : "bg-[#fff1f2] text-[#be123c] border-[#fecdd3]";

  // Ліва темна панель — однакова для всіх кроків
  const LeftPanel = () => {
    if (step === "intro") return (
      <div className="bg-gradient-to-br from-[#0f2a4a] to-[#1e3f6e] px-4 py-4 flex flex-col justify-center gap-0.5 w-44 shrink-0">
        <p className="text-white font-bold text-[14px] leading-snug">🤖 AI-підбір<br/>озера</p>
        <p className="text-white/50 text-[10px]">Безкоштовно · зараз</p>
      </div>
    );
    if (step === "region") return (
      <div className="bg-gradient-to-br from-[#0f2a4a] to-[#1e3f6e] px-4 py-4 flex flex-col justify-center gap-1 w-44 shrink-0">
        <p className="text-white/50 text-[9px] font-black uppercase tracking-widest">Крок 1 з 2</p>
        <p className="text-white font-bold text-[13px] leading-snug">Де хочеш<br/>порибачити?</p>
      </div>
    );
    if (step === "fish") return (
      <div className="bg-gradient-to-br from-[#0f2a4a] to-[#1e3f6e] px-4 py-4 flex flex-col justify-between w-44 shrink-0">
        <div className="flex flex-col gap-0.5">
          <p className="text-white/50 text-[9px] font-black uppercase tracking-widest">Крок 2 з 2</p>
          <p className="text-white font-bold text-[13px] leading-snug">Яку рибу<br/>плануєш?</p>
          <p className="text-white/40 text-[10px] mt-0.5">Можна кілька</p>
        </div>
        <button onClick={() => setStep("region")} className="text-white/50 hover:text-white text-[11px] font-semibold text-left transition-colors">
          ← назад
        </button>
      </div>
    );
    if (step === "loading") return (
      <div className="bg-gradient-to-br from-[#0f2a4a] to-[#1e3f6e] px-4 py-4 flex flex-col justify-center gap-1 w-44 shrink-0">
        <p className="text-white font-bold text-[13px]">🤖 Аналізую...</p>
        <p className="text-white/40 text-[10px]">Погода та кльов</p>
      </div>
    );
    // result
    return (
      <div className="bg-gradient-to-br from-[#0f2a4a] to-[#1e3f6e] px-4 py-4 flex flex-col justify-between w-44 shrink-0">
        <div className="flex flex-col gap-1">
          <p className="text-white/50 text-[9px] font-black uppercase tracking-widest">Топ озера</p>
          <p className="text-white font-bold text-[13px] leading-snug">📍 {selectedRegion.replace(" область","")}</p>
          {selectedFish.length > 0 && (
            <p className="text-white/60 text-[10px] leading-snug truncate">🎣 {selectedFish.slice(0,2).join(", ")}{selectedFish.length > 2 ? ` +${selectedFish.length-2}` : ""}</p>
          )}
          {weatherInfo && (
            <p className="text-white/50 text-[10px]">🌡 {weatherInfo.temp}°C</p>
          )}
        </div>
        <button onClick={reset} className="text-white/50 hover:text-white text-[11px] font-semibold text-left transition-colors">
          ← знову
        </button>
      </div>
    );
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-blue-100 bg-white flex items-stretch h-[132px]">
      <LeftPanel />

      {/* Права біла частина */}
      <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center px-4 py-3 gap-2">

        {/* ── INTRO ── */}
        {step === "intro" && (
          <div className="flex items-center gap-3">
            <p className="text-slate-600 text-[13px] leading-relaxed flex-1">
              2 питання — отримаєш топ озер з найкращим кльовом прямо зараз.
            </p>
            <button
              onClick={() => setStep("region")}
              className="bg-[#0f2a4a] text-white font-bold text-[13px] px-4 py-2 rounded-xl hover:bg-[#1e3f6e] transition-colors shrink-0"
            >
              Почати →
            </button>
          </div>
        )}

        {/* ── STEP 1: REGION ── */}
        {step === "region" && (
          <>
            <div className="flex flex-wrap gap-1 max-h-[72px] overflow-y-auto pr-1">
              {REGIONS.filter(r => lakes.some(l => l.city === r)).map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRegion(r)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    selectedRegion === r
                      ? "bg-[#0f2a4a] text-white border-[#0f2a4a]"
                      : "bg-[#f8fafc] text-[#1e293b] border-[#e2e8f0] hover:border-[#94a3b8]"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              disabled={!selectedRegion}
              onClick={() => setStep("fish")}
              className={`w-full py-1.5 rounded-xl font-bold text-[12px] transition-all ${
                selectedRegion ? "bg-[#0f2a4a] text-white hover:bg-[#1e3f6e]" : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              Далі →
            </button>
          </>
        )}

        {/* ── STEP 2: FISH ── */}
        {step === "fish" && (
          <>
            <div className="flex flex-wrap gap-1 max-h-[72px] overflow-y-auto pr-1">
              {allFish.map(f => (
                <button
                  key={f}
                  onClick={() => toggleFish(f)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    selectedFish.includes(f)
                      ? "bg-[#0f2a4a] text-white border-[#0f2a4a]"
                      : "bg-[#f8fafc] text-[#1e293b] border-[#e2e8f0] hover:border-[#94a3b8]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={run}
              className="w-full py-1.5 rounded-xl font-bold text-[12px] bg-[#0f2a4a] text-white hover:bg-[#1e3f6e] transition-colors"
            >
              Показати озера →
            </button>
          </>
        )}

        {/* ── LOADING ── */}
        {step === "loading" && (
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-[#0f2a4a] border-t-transparent animate-spin shrink-0" />
            <p className="text-slate-500 text-[13px]">Аналізую погоду та кльов...</p>
          </div>
        )}

        {/* ── RESULT ── */}
        {step === "result" && (
          <div className="flex flex-col gap-1.5 max-h-[110px] overflow-y-auto pr-1">
            {results.length === 0 ? (
              <p className="text-slate-400 text-[12px]">Озер не знайдено — спробуй інші параметри</p>
            ) : results.map(({ lake, score }, idx) => (
              <Link
                key={lake.id}
                href={`/lakes/${lake.slug ?? lake.id}`}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-100 hover:border-[#f5c842] transition-all bg-white group"
              >
                <span className="text-[10px] font-black text-slate-300 w-4 shrink-0">#{idx+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-[#0f2a4a] group-hover:text-[#1e3f6e] leading-tight truncate">{lake.name}</p>
                  {lake.location_text && <p className="text-[10px] text-slate-400 truncate">{lake.location_text}</p>}
                </div>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border shrink-0 ${scoreColor(score)}`}>
                  {score}/10
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
