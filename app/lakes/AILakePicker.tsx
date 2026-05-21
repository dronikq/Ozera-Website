"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lake } from "@/lib/supabase";
import { getLakeRouteSlug } from "@/lib/lake-slug";

const REGIONS = [
  "Київ",
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
];

const PREDATORY = ["щука", "окунь", "судак", "сом", "жерех", "берш", "головень"];

function fishType(name: string): "peaceful" | "predatory" {
  return PREDATORY.some((needle) => name.toLowerCase().includes(needle)) ? "predatory" : "peaceful";
}

async function fetchWeather(lat: number, lng: number) {
  const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}&days=1`, { cache: "no-store" });
  const json = await res.json();
  const { hourly } = json;
  const now = new Date().getHours();
  const idx = (hourly.time as string[]).findIndex((time: string) => new Date(time).getHours() >= now);
  const i = idx >= 0 ? idx : 0;
  const wind = (hourly.windspeed_10m[i] ?? 0) / 3.6;
  const temp = Math.round(hourly.temperature_2m[i] ?? 10);
  const rain = hourly.precipitation[i] ?? 0;
  const cloudCode = hourly.weathercode[i] ?? 0;
  const pressure = hourly.surface_pressure[i] ?? 1013;
  const prevPressure = i > 0 ? (hourly.surface_pressure[i - 1] ?? pressure) : pressure;
  const delta = pressure - prevPressure;
  const pressureTrend = delta > 1.5 ? "rising" : delta < -1.5 ? "falling" : "stable";
  return { temp, wind: Math.round(wind * 10) / 10, rain, cloudCode, pressureTrend };
}

function quickScore(
  temp: number,
  wind: number,
  rain: number,
  pressureTrend: string,
  cloudCode: number,
  type: "peaceful" | "predatory",
): number {
  let score = 5;

  if (type === "peaceful") {
    if (temp >= 18 && temp <= 24) score += 2;
    else if (temp >= 12 && temp < 18) score += 1;
    else if (temp >= 8 && temp < 12) score -= 0.5;
    else score -= 1.5;
  } else {
    if (temp >= 10 && temp <= 18) score += 2;
    else if (temp >= 6 && temp < 10) score += 1;
    else if (temp < 6) score -= 0.5;
    else score -= 1;
  }

  if (wind <= 2) score += 1;
  else if (wind <= 4) score += 0.5;
  else if (wind >= 7) score -= 2;
  else score -= 1;

  if (rain === 0) score += 0.5;
  else if (rain <= 2) score += 0.1;
  else if (rain > 5) score -= 1.5;
  else score -= 0.5;

  if (type === "predatory") {
    if (cloudCode === 3) score += 1;
    else if (cloudCode === 2) score += 0.3;
    else if (cloudCode <= 1) score -= 1.5;
    else if (cloudCode >= 51 && cloudCode <= 67) score += 0.4;
    else if (cloudCode >= 80) score -= 1;
  } else {
    if (cloudCode <= 1 && temp >= 15) score += 0.4;
    else if (cloudCode >= 80) score -= 0.5;
  }

  if (pressureTrend === "stable") score += 1;
  else if (pressureTrend === "rising") score += 0.3;
  else score -= 1.2;

  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

const REGION_COORDS: Record<string, [number, number]> = {
  Київ: [50.45, 30.52],
  "Київська область": [50.45, 30.52],
  "Вінницька область": [49.23, 28.47],
  "Волинська область": [50.75, 25.33],
  "Дніпропетровська область": [48.46, 35.04],
  "Житомирська область": [50.25, 28.67],
  "Закарпатська область": [48.62, 22.29],
  "Запорізька область": [47.84, 35.14],
  "Івано-Франківська область": [48.92, 24.71],
  "Кіровоградська область": [48.51, 32.27],
  "Львівська область": [49.84, 24.03],
  "Миколаївська область": [46.97, 31.99],
  "Одеська область": [46.48, 30.73],
  "Полтавська область": [49.59, 34.55],
  "Рівненська область": [50.62, 26.25],
  "Сумська область": [50.91, 34.8],
  "Тернопільська область": [49.55, 25.59],
  "Харківська область": [49.99, 36.23],
  "Херсонська область": [46.64, 32.61],
  "Хмельницька область": [49.42, 26.99],
  "Черкаська область": [49.44, 32.06],
  "Чернівецька область": [48.29, 25.94],
  "Чернігівська область": [51.5, 31.3],
};

interface Result {
  lake: Lake;
  score: number;
}

type Step = "intro" | "region" | "fish" | "loading" | "result";

function SparklesIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M19.5 15l.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8.8-2.4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18 9 12l6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 21s6-4.35 6-11a6 6 0 0 0-12 0c0 6.65 6 11 6 11Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function FishIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12c3.2-4.5 8.8-6.5 14-5.5 1.5.3 2.8 1 4 2-1.2 1-2.5 1.7-4 2-5.2 1-10.8-1-14-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 8.5 22 6v4l-2-1.5Z" fill="currentColor" />
    </svg>
  );
}

export default function AILakePicker({ lakes }: { lakes: Lake[] }) {
  const [step, setStep] = useState<Step>("intro");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedFish, setSelectedFish] = useState<string[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [weatherInfo, setWeatherInfo] = useState<{ temp: number } | null>(null);

  const regionLakes = selectedRegion ? lakes.filter((lake) => lake.city === selectedRegion) : lakes;
  const allFish = Array.from(new Set(regionLakes.flatMap((lake) => lake.fish_species ?? []))).sort();

  const toggleFish = (fishName: string) => {
    setSelectedFish((prev) => (prev.includes(fishName) ? prev.filter((item) => item !== fishName) : [...prev, fishName]));
  };

  const reset = () => {
    setStep("intro");
    setSelectedRegion("");
    setSelectedFish([]);
    setResults([]);
    setWeatherInfo(null);
  };

  const run = async () => {
    setStep("loading");

    const filtered = regionLakes.filter(
      (lake) =>
        selectedFish.length === 0 ||
        (lake.fish_species ?? []).some((fishName) =>
          selectedFish.some(
            (selected) =>
              fishName.toLowerCase().includes(selected.toLowerCase()) ||
              selected.toLowerCase().includes(fishName.toLowerCase()),
          ),
        ),
    );

    const type = selectedFish.some((fishName) => fishType(fishName) === "predatory") ? "predatory" : "peaceful";
    const coords = REGION_COORDS[selectedRegion] ?? [49.5, 31.5];

    try {
      const weather = await fetchWeather(coords[0], coords[1]);
      setWeatherInfo({ temp: weather.temp });
      const scored: Result[] = filtered.map((lake) => ({
        lake,
        score: quickScore(weather.temp, weather.wind, weather.rain, weather.pressureTrend, weather.cloudCode, type),
      }));
      scored.sort((a, b) => b.score - a.score || a.lake.name.localeCompare(b.lake.name));
      setResults(scored.slice(0, 3));
    } catch {
      setResults([]);
    }

    setStep("result");
  };

  const scoreTone = (score: number) =>
    score >= 7
      ? { bg: "var(--color-success-soft)", color: "#3D8F62", border: "rgba(61, 143, 98, 0.22)" }
      : score >= 4.5
        ? { bg: "var(--color-accent-soft)", color: "#7A4E00", border: "rgba(242, 184, 75, 0.24)" }
        : { bg: "var(--color-danger-soft)", color: "#B85A4B", border: "rgba(200, 92, 76, 0.22)" };

  if (step === "intro") {
    return (
      <section className="dk-ai-picker oz-card">
        <div className="dk-ai-picker__glow" aria-hidden="true" />
        <div className="dk-ai-picker__intro dk-ai-picker__intro--clean">
          <div className="dk-ai-picker__copy">
            <span className="dk-ai-picker__badge">
              <SparklesIcon />
              AI-підбір
            </span>
            <h2>Не знаєш, куди поїхати?</h2>
            <p>Відповідай на 2 питання — підберемо озера під твою рибу, локацію і формат відпочинку.</p>
          </div>

          <button
            type="button"
            className="oz-btn-primary dk-ai-picker__button dk-ai-picker__button--clean"
            onClick={() => setStep("region")}
          >
            Підібрати озеро
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="dk-ai-picker dk-ai-picker--wizard oz-card">
      <div className="dk-ai-picker__header">
        <div>
          <span className="dk-ai-picker__badge">
            <SparklesIcon />
            AI-підбір
          </span>
          <h3>Підібрати озеро</h3>
          <p>Відповідай на 2 питання — і ми підкажемо найкращі варіанти під твою поїздку.</p>
        </div>

        <button type="button" className="dk-ai-picker__ghost" onClick={reset}>
          Скинути
        </button>
      </div>

      {step === "region" && (
        <div className="dk-ai-picker__stage">
          <div className="dk-ai-picker__stage-top">
            <p className="dk-ai-picker__stage-title">
              <PinIcon />
              Де хочеш порибалити?
            </p>
            <span className="dk-ai-picker__stage-step">Крок 1 з 2</span>
          </div>

          <div className="dk-chip-row dk-chip-row--compact no-scrollbar">
            {REGIONS.filter((region) => lakes.some((lake) => lake.city === region)).map((region) => (
              <button
                key={region}
                type="button"
                onClick={() => setSelectedRegion(region)}
                className={`dk-ai-chip${selectedRegion === region ? " is-active" : ""}`}
              >
                {region.replace(" область", "")}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setStep("fish")}
            disabled={!selectedRegion}
            className="oz-btn-primary dk-ai-picker__stage-button"
          >
            Далі →
          </button>
        </div>
      )}

      {step === "fish" && (
        <div className="dk-ai-picker__stage">
          <div className="dk-ai-picker__stage-top">
            <p className="dk-ai-picker__stage-title">
              <FishIcon />
              Яку рибу плануєш?
            </p>
            <button type="button" className="dk-ai-picker__ghost dk-ai-picker__ghost--inline" onClick={() => setStep("region")}>
              <ChevronLeftIcon />
              Назад
            </button>
          </div>

          <div className="dk-chip-row dk-chip-row--compact no-scrollbar">
            {allFish.map((fishName) => (
              <button
                key={fishName}
                type="button"
                onClick={() => toggleFish(fishName)}
                className={`dk-ai-chip${selectedFish.includes(fishName) ? " is-active" : ""}`}
              >
                {fishName}
              </button>
            ))}
          </div>

          <button type="button" onClick={run} className="oz-btn-primary dk-ai-picker__stage-button">
            Показати озера →
          </button>
        </div>
      )}

      {step === "loading" && (
        <div className="dk-ai-picker__loading">
          <div className="dk-ai-picker__spinner" aria-hidden="true" />
          <p>Аналізую погоду та водойми...</p>
        </div>
      )}

      {step === "result" && (
        <div className="dk-ai-picker__result">
          <div className="dk-ai-picker__stage-top dk-ai-picker__stage-top--result">
            <div>
              <p className="dk-ai-picker__stage-title">
                <PinIcon />
                {selectedRegion.replace(" область", "")}
                {weatherInfo && <span className="dk-ai-picker__weather"> · {weatherInfo.temp}°C</span>}
              </p>
              {selectedFish.length > 0 && (
                <p className="dk-ai-picker__selected-fish">
                  <FishIcon />
                  {selectedFish.slice(0, 3).join(", ")}
                  {selectedFish.length > 3 ? ` +${selectedFish.length - 3}` : ""}
                </p>
              )}
            </div>

            <button type="button" className="dk-ai-picker__ghost dk-ai-picker__ghost--inline" onClick={reset}>
              Заново
            </button>
          </div>

          {results.length === 0 ? (
            <p className="dk-ai-picker__empty">Озер не знайдено — спробуй інші параметри.</p>
          ) : (
            <div className="dk-ai-picker__results">
              {results.map(({ lake, score }, index) => {
                const tone = scoreTone(score);
                return (
                  <Link key={lake.id} href={`/lakes/${getLakeRouteSlug(lake)}`} className="dk-ai-result">
                    <span className="dk-ai-result__index">#{index + 1}</span>
                    <div className="dk-ai-result__body">
                      <p className="dk-ai-result__name">{lake.name}</p>
                      {lake.location_text && <p className="dk-ai-result__location">{lake.location_text}</p>}
                    </div>
                    <span
                      className="dk-ai-result__score"
                      style={{
                        background: tone.bg,
                        color: tone.color,
                        borderColor: tone.border,
                      }}
                    >
                      {score}/10
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
