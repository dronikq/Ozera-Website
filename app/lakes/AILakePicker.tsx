"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lake } from "@/lib/supabase";

const REGIONS = [
  "Київська область","Вінницька область","Волинська область",
  "Дніпропетровська область","Житомирська область","Закарпатська область",
  "Запорізька область","Івано-Франківська область","Кіровоградська область",
  "Львівська область","Миколаївська область","Одеська область",
  "Полтавська область","Рівненська область","Сумська область",
  "Тернопільська область","Харківська область","Херсонська область",
  "Хмельницька область","Черкаська область","Чернівецька область",
  "Чернігівська область","Київ",
];

const REGION_COORDS: Record<string, [number, number]> = {
  "Київ":[50.45,30.52],"Київська область":[50.45,30.52],"Вінницька область":[49.23,28.47],
  "Волинська область":[50.75,25.33],"Дніпропетровська область":[48.46,35.04],
  "Житомирська область":[50.25,28.67],"Закарпатська область":[48.62,22.29],
  "Запорізька область":[47.84,35.14],"Івано-Франківська область":[48.92,24.71],
  "Кіровоградська область":[48.51,32.27],"Львівська область":[49.84,24.03],
  "Миколаївська область":[46.97,31.99],"Одеська область":[46.48,30.73],
  "Полтавська область":[49.59,34.55],"Рівненська область":[50.62,26.25],
  "Сумська область":[50.91,34.80],"Тернопільська область":[49.55,25.59],
  "Харківська область":[49.99,36.23],"Херсонська область":[46.64,32.61],
  "Хмельницька область":[49.42,26.99],"Черкаська область":[49.44,32.06],
  "Чернівецька область":[48.29,25.94],"Чернігівська область":[51.50,31.30],
};

const PREDATORY = ["щука","окунь","судак","сом","жерех","берш","головень"];
function fishType(name: string): "peaceful" | "predatory" {
  return PREDATORY.some(p => name.toLowerCase().includes(p)) ? "predatory" : "peaceful";
}

async function fetchWeather(lat: number, lng: number) {
  const res  = await fetch(`/api/weather?lat=${lat}&lng=${lng}&days=1`, { cache: "no-store" });
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
  const prevPres  = i > 0 ? (hourly.surface_pressure[i-1] ?? pressure) : pressure;
  const pDelta    = pressure - prevPres;
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
  const [step, setStep]           = useState<Step>("intro");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedFish, setSelectedFish]     = useState<string[]>([]);
  const [results, setResults]     = useState<Result[]>([]);
  const [weatherInfo, setWeatherInfo] = useState<{ temp: number } | null>(null);

  const regionLakes = selectedRegion ? lakes.filter(l => l.city === selectedRegion) : lakes;
  const allFish = Array.from(new Set(regionLakes.flatMap(l => l.fish_species ?? []))).sort();
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
      setWeatherInfo({ temp: w.temp });
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
    s >= 7   ? { bg: "rgba(61,220,151,0.15)", color: "#3DDC97", border: "rgba(61,220,151,0.3)" }
    : s >= 4.5 ? { bg: "rgba(255,200,87,0.15)",  color: "#FFC857", border: "rgba(255,200,87,0.3)" }
    : { bg: "rgba(255,92,92,0.15)", color: "#FF5C5C", border: "rgba(255,92,92,0.3)" };

  /* ── Shared chip button style ── */
  const chipStyle = (active: boolean) => ({
    padding: "4px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    border: `1.5px solid ${active ? "#FFC857" : "#1E3A5F"}`,
    background: active ? "#FFC857" : "#0F2A4D",
    color: active ? "#0B1F3A" : "#A9B8D4",
    cursor: "pointer",
    transition: "all 0.15s",
    fontFamily: "inherit",
  } as React.CSSProperties);

  return (
    <div style={{
      background: "#0F2A4D",
      border: "1px solid #1E3A5F",
      borderRadius: 16,
      overflow: "hidden",
      width: "100%",
    }}>

      {/* ── INTRO ── */}
      {step === "intro" && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 14, margin: "0 0 2px" }}>
              🤖 AI-підбір озера
            </p>
            <p style={{ color: "#6F85A8", fontSize: 12, margin: 0 }}>
              2 питання — отримаєш топ озер з найкращим кльовом
            </p>
          </div>
          <button
            onClick={() => setStep("region")}
            style={{ background: "#FFC857", color: "#0B1F3A", fontWeight: 700, fontSize: 13, padding: "8px 18px", borderRadius: 10, border: "none", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "inherit", flexShrink: 0 }}
          >
            Почати →
          </button>
        </div>
      )}

      {/* ── REGION ── */}
      {step === "region" && (
        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 13, margin: 0 }}>📍 Де хочеш порибачити?</p>
            <span style={{ color: "#6F85A8", fontSize: 11 }}>Крок 1 з 2</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {REGIONS.filter(r => lakes.some(l => l.city === r)).map(r => (
              <button key={r} onClick={() => setSelectedRegion(r)} style={chipStyle(selectedRegion === r)}>
                {r.replace(" область", "")}
              </button>
            ))}
          </div>
          <button
            disabled={!selectedRegion}
            onClick={() => setStep("fish")}
            style={{
              background: selectedRegion ? "#FFC857" : "#1E3A5F",
              color: selectedRegion ? "#0B1F3A" : "#6F85A8",
              fontWeight: 700, fontSize: 13, padding: "9px", borderRadius: 10,
              border: "none", cursor: selectedRegion ? "pointer" : "not-allowed",
              width: "100%", fontFamily: "inherit",
            }}
          >
            Далі →
          </button>
        </div>
      )}

      {/* ── FISH ── */}
      {step === "fish" && (
        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 13, margin: 0 }}>🎣 Яку рибу плануєш?</p>
            <button onClick={() => setStep("region")} style={{ background: "none", border: "none", color: "#6F85A8", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← назад</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {allFish.map(f => (
              <button key={f} onClick={() => toggleFish(f)} style={chipStyle(selectedFish.includes(f))}>
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={run}
            style={{ background: "#FFC857", color: "#0B1F3A", fontWeight: 700, fontSize: 13, padding: "9px", borderRadius: 10, border: "none", cursor: "pointer", width: "100%", fontFamily: "inherit" }}
          >
            Показати озера →
          </button>
        </div>
      )}

      {/* ── LOADING ── */}
      {step === "loading" && (
        <div style={{ padding: "20px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", border: "2px solid #FFC857", borderTopColor: "transparent", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
          <p style={{ color: "#A9B8D4", fontSize: 13, margin: 0 }}>Аналізую погоду та кльов...</p>
        </div>
      )}

      {/* ── RESULT ── */}
      {step === "result" && (
        <div style={{ padding: "14px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <div>
              <p style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 13, margin: "0 0 2px" }}>
                📍 {selectedRegion.replace(" область", "")}
                {weatherInfo && <span style={{ color: "#6F85A8", fontWeight: 400 }}> · {weatherInfo.temp}°C</span>}
              </p>
              {selectedFish.length > 0 && (
                <p style={{ color: "#6F85A8", fontSize: 11, margin: 0 }}>
                  🎣 {selectedFish.slice(0, 3).join(", ")}{selectedFish.length > 3 ? ` +${selectedFish.length - 3}` : ""}
                </p>
              )}
            </div>
            <button onClick={reset} style={{ background: "none", border: "none", color: "#6F85A8", fontSize: 12, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
              ← знову
            </button>
          </div>

          {results.length === 0 ? (
            <p style={{ color: "#6F85A8", fontSize: 13 }}>Озер не знайдено — спробуй інші параметри</p>
          ) : results.map(({ lake, score }, idx) => {
            const sc = scoreColor(score);
            return (
              <Link
                key={lake.id}
                href={`/lakes/${lake.id}`}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 10,
                  background: "#132F57", border: "1px solid #1E3A5F",
                  textDecoration: "none", transition: "border-color 0.2s",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: "#6F85A8", width: 16, flexShrink: 0 }}>
                  #{idx + 1}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {lake.name}
                  </p>
                  {lake.location_text && (
                    <p style={{ fontSize: 11, color: "#6F85A8", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {lake.location_text}
                    </p>
                  )}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                  background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                  flexShrink: 0,
                }}>
                  {score}/10
                </span>
              </Link>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
