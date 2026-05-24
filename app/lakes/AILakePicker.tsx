"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Lake } from "@/lib/supabase";
import { getLakeRouteSlug } from "@/lib/lake-slug";

type Flow = "location" | "fish";
type Stage = "intro" | "region" | "fish" | "loading" | "result";

interface Recommendation {
  lake: Lake;
  score: number;
  explanation: string;
}

type FishGroup = {
  label: string;
  aliases: string[];
};

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

const FISH_GROUPS: FishGroup[] = [
  { label: "Короп", aliases: ["короп", "карп", "сазан"] },
  { label: "Карась", aliases: ["карась"] },
  { label: "Щука", aliases: ["щука"] },
  { label: "Судак", aliases: ["судак"] },
  { label: "Окунь", aliases: ["окунь"] },
  { label: "Лящ", aliases: ["лящ", "лещ"] },
  { label: "Сом", aliases: ["сом", "сом канальний"] },
  { label: "Білий амур", aliases: ["амур", "білий амур", "амур білий", "чорний амур"] },
  { label: "Товстолоб", aliases: ["товстолоб", "товстолобик", "товстолоб білий", "білий товстолоб"] },
  { label: "Форель", aliases: ["форель"] },
  { label: "Осетр", aliases: ["осетр", "осетер"] },
];

const FISH_ORDER = FISH_GROUPS.map((group) => group.label).concat("Інша риба");
const PREDATORY_LABELS = new Set(["Щука", "Окунь", "Судак", "Сом"]);
const REGION_COORDS: Record<string, [number, number]> = {
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
  Київ: [50.45, 30.52],
};

function normalizeFishValue(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?()[\]{}"'`]/g, "");
}

function getCanonicalFishLabel(raw: string): string | null {
  const normalized = normalizeFishValue(raw);
  if (!normalized) return null;

  for (const group of FISH_GROUPS) {
    if (group.aliases.some((alias) => normalizeFishValue(alias) === normalized)) {
      return group.label;
    }
  }

  return null;
}

function getNormalizedFishLabels(fishSpecies: string[] | null | undefined): string[] {
  const found = new Set<string>();
  let hasOther = false;

  for (const raw of fishSpecies ?? []) {
    const canonical = getCanonicalFishLabel(raw);
    if (canonical) {
      found.add(canonical);
    } else if (normalizeFishValue(raw)) {
      hasOther = true;
    }
  }

  const ordered = FISH_ORDER.filter((label) => label === "Інша риба" || found.has(label));
  return hasOther ? ordered : ordered.filter((label) => label !== "Інша риба");
}

function lakeMatchesSelectedFish(fishSpecies: string[] | null | undefined, selectedFish: string[]) {
  if (selectedFish.length === 0) return true;
  const normalizedFish = new Set(getNormalizedFishLabels(fishSpecies));
  return selectedFish.some((fish) => normalizedFish.has(fish));
}

async function fetchWeather(lat: number, lng: number) {
  const res = await fetch(`/api/weather?lat=${lat}&lng=${lng}&days=1`, { cache: "no-store" });
  const json = await res.json();
  const { hourly } = json;
  const now = new Date().getHours();
  const idx = (hourly.time as string[]).findIndex((t: string) => new Date(t).getHours() >= now);
  const i = idx >= 0 ? idx : 0;
  const wind = (hourly.windspeed_10m[i] ?? 0) / 3.6;
  const temp = Math.round(hourly.temperature_2m[i] ?? 10);
  const rain = hourly.precipitation[i] ?? 0;
  const cloudCode = hourly.weathercode[i] ?? 0;
  const pressure = hourly.surface_pressure[i] ?? 1013;
  const prevPres = i > 0 ? (hourly.surface_pressure[i - 1] ?? pressure) : pressure;
  const pDelta = pressure - prevPres;
  const pressureTrend = pDelta > 1.5 ? "rising" : pDelta < -1.5 ? "falling" : "stable";
  return { temp, wind: Math.round(wind * 10) / 10, rain, cloudCode, pressureTrend };
}

function quickScore(
  temp: number,
  wind: number,
  rain: number,
  pressureTrend: string,
  cloudCode: number,
  type: "peaceful" | "predatory",
) {
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

function toShortRegion(region: string) {
  return region.replace(" область", "");
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2.3" fill="none" stroke="currentColor" strokeWidth="1.9" />
    </svg>
  );
}

function FishIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3.5 12c1.5-2.7 4.4-4.5 7.5-4.5 3 0 5.6 1.2 7.4 3.1l2.1-1.4.9 2.1-1 1.7 1 1.7-.9 2.1-2.1-1.4c-1.8 1.9-4.4 3.1-7.4 3.1-3.1 0-6-1.8-7.5-4.5l2.7-1.2L3.5 12Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="16.5" cy="10.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

function ServicesIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4.5 14.5h15M6.5 14.5V10a5.5 5.5 0 0 1 11 0v4.5M9 14.5v2.8a1.7 1.7 0 0 0 3.4 0v-1.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 17.5h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 12h12M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 6 9 12l6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 10.5v5M12 7.5h.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 15c1.4 0 2.1-.7 3.2-1.6C8.3 12.5 9.3 12 11 12c1.7 0 2.7.5 3.8 1.4 1.1.9 1.8 1.6 3.2 1.6 1.4 0 2.1-.7 3.2-1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 19c1.4 0 2.1-.7 3.2-1.6C8.3 16.5 9.3 16 11 16c1.7 0 2.7.5 3.8 1.4 1.1.9 1.8 1.6 3.2 1.6 1.4 0 2.1-.7 3.2-1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ResultCardFishChip({ label }: { label: string }) {
  return <span className="dk-ai-assistant__result-chip">{label}</span>;
}

export default function AILakePicker({ lakes }: { lakes: Lake[] }) {
  const [flow, setFlow] = useState<Flow | null>(null);
  const [stage, setStage] = useState<Stage>("intro");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedFish, setSelectedFish] = useState<string[]>([]);
  const [results, setResults] = useState<Recommendation[]>([]);
  const [weatherInfo, setWeatherInfo] = useState<{ temp: number } | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const regionOptions = useMemo(
    () => REGIONS.filter((region) => lakes.some((lake) => lake.city === region)),
    [lakes],
  );

  const fishPool = useMemo(
    () =>
      flow === "location" && selectedRegion
        ? lakes.filter((lake) => lake.city === selectedRegion)
        : lakes,
    [flow, lakes, selectedRegion],
  );

  const fishOptions = useMemo(
    () => getNormalizedFishLabels(fishPool.flatMap((lake) => lake.fish_species ?? [])),
    [fishPool],
  );

  const introCards = [
    {
      key: "location",
      title: "Де рибалити?",
      description: "Підбір за областю, погодою та рибою.",
      icon: <MapPinIcon />,
      flow: "location" as const,
      disabled: false,
    },
    {
      key: "fish",
      title: "На яку рибу?",
      description: "Знайдемо водойми під конкретну рибу.",
      icon: <FishIcon />,
      flow: "fish" as const,
      disabled: false,
    },
    {
      key: "services",
      title: "Зручності",
      description: "Альтанки, парковка, ночівля та інші умови.",
      icon: <ServicesIcon />,
      disabled: true,
    },
  ] as const;

  const resetAll = () => {
    setFlow(null);
    setStage("intro");
    setSelectedRegion("");
    setSelectedFish([]);
    setResults([]);
    setWeatherInfo(null);
    setFailedImages({});
  };

  const startFlow = (nextFlow: Flow) => {
    setFlow(nextFlow);
    setSelectedRegion("");
    setSelectedFish([]);
    setResults([]);
    setWeatherInfo(null);
    setStage(nextFlow === "location" ? "region" : "fish");
  };

  const back = () => {
    if (flow === "location") {
      if (stage === "fish") {
        setStage("region");
        return;
      }
      resetAll();
      return;
    }

    if (flow === "fish") {
      if (stage === "region") {
        setStage("fish");
        return;
      }
      resetAll();
      return;
    }

    resetAll();
  };

  const canContinue =
    stage === "region"
      ? Boolean(selectedRegion)
      : stage === "fish"
        ? fishOptions.length === 0 || selectedFish.length > 0
        : true;

  const stepMeta = (() => {
    if (stage === "region" && flow === "location") {
      return {
        step: "Крок 1 з 2",
        title: "Оберіть область",
        subtitle: "Підберемо до 3 водойм з каталогу.",
      };
    }

    if (stage === "fish" && flow === "location") {
      return {
        step: "Крок 2 з 2",
        title: "Яку рибу хочете ловити?",
        subtitle: "Оберіть одну або кілька риб.",
      };
    }

    if (stage === "fish" && flow === "fish") {
      return {
        step: "Крок 1 з 2",
        title: "Яку рибу хочете ловити?",
        subtitle: "Оберіть рибу, яку плануєте ловити.",
      };
    }

    if (stage === "region" && flow === "fish") {
      return {
        step: "Крок 2 з 2",
        title: "У якій області шукати озеро?",
        subtitle: "Потім підберемо до 3 водойм.",
      };
    }

    return null;
  })();

  const explanation =
    flow === "location"
      ? "Підходить за вибраною областю, видами риби та погодними умовами."
      : "У цьому озері є вибрана риба. Перед поїздкою радимо уточнити актуальні умови.";

  const resultTitle = "Ось що підійшло";
  const resultSubtitle = "Знайшли до 3 варіантів за вашими критеріями.";
  const primaryLabel =
    stage === "region"
      ? flow === "location"
        ? "Далі"
        : "Показати результат"
      : stage === "fish"
        ? flow === "location"
          ? "Показати результат"
          : "Далі"
        : "Далі";

  const selectRegion = (region: string) => setSelectedRegion(region);

  const toggleFish = (fish: string) => {
    setSelectedFish((prev) => (prev.includes(fish) ? prev.filter((item) => item !== fish) : [...prev, fish]));
  };

  const imageSrcForLake = (lake: Lake) => {
    const url = lake.image_url?.trim();
    return url && !failedImages[lake.id] ? url : null;
  };

  const markImageFailed = (lakeId: string) => {
    setFailedImages((prev) => (prev[lakeId] ? prev : { ...prev, [lakeId]: true }));
  };

  const run = async () => {
    if (!selectedRegion || (fishOptions.length > 0 && selectedFish.length === 0)) return;

    setStage("loading");

    const filtered = lakes.filter((lake) => {
      if (selectedRegion && lake.city !== selectedRegion) return false;
      return lakeMatchesSelectedFish(lake.fish_species, selectedFish);
    });

    const type = selectedFish.some((item) => PREDATORY_LABELS.has(item)) ? "predatory" : "peaceful";
    const coords = REGION_COORDS[selectedRegion] ?? [49.5, 31.5];

    try {
      const w = await fetchWeather(coords[0], coords[1]);
      setWeatherInfo({ temp: w.temp });
      const scored: Recommendation[] = filtered.map((lake) => ({
        lake,
        score: quickScore(w.temp, w.wind, w.rain, w.pressureTrend, w.cloudCode, type),
        explanation,
      }));
      scored.sort((a, b) => b.score - a.score || a.lake.name.localeCompare(b.lake.name, "uk"));
      setResults(scored.slice(0, 3));
    } catch {
      setResults([]);
    }

    setStage("result");
  };

  return (
    <section className="dk-ai-assistant" aria-label="AI-помічник з підбору озера">
      <div className="dk-ai-assistant__decor" aria-hidden="true" />

      <div className="dk-ai-assistant__shell">
        {stage === "intro" ? (
          <div className="dk-ai-assistant__intro-panel">
            <div className="dk-ai-assistant__intro-copy">
              <div className="dk-ai-assistant__label-row">
                <p className="dk-ai-assistant__label">AI-помічник</p>
                <span className="dk-ai-assistant__beta-badge">Beta</span>
              </div>
              <h2 className="dk-ai-assistant__title">Підібрати озеро</h2>
              <p className="dk-ai-assistant__subtitle">
                Оберіть сценарій — ми знайдемо до 3 водойм з каталогу.
              </p>
              <p className="dk-ai-assistant__small-note">
                Працює на основі області, риби та погодних даних.
              </p>
            </div>

            <div className="dk-ai-assistant__scenario-strip" role="list" aria-label="Сценарії підбору">
              {introCards.map((card) =>
                card.disabled ? (
                  <div
                    key={card.key}
                    className="dk-ai-assistant__scenario-card dk-ai-assistant__scenario-card--disabled"
                    aria-disabled="true"
                  >
                    <div className="dk-ai-assistant__scenario-card-icon" aria-hidden="true">
                      {card.icon}
                    </div>
                    <div className="dk-ai-assistant__scenario-card-body">
                      <div className="dk-ai-assistant__scenario-card-topline">
                        <h3 className="dk-ai-assistant__scenario-card-title">{card.title}</h3>
                        <span className="dk-ai-assistant__soon-badge">Скоро</span>
                      </div>
                      <p className="dk-ai-assistant__scenario-card-description">{card.description}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    key={card.key}
                    type="button"
                    className="dk-ai-assistant__scenario-card"
                    onClick={() => startFlow(card.flow)}
                  >
                    <div className="dk-ai-assistant__scenario-card-icon" aria-hidden="true">
                      {card.icon}
                    </div>
                    <div className="dk-ai-assistant__scenario-card-body">
                      <h3 className="dk-ai-assistant__scenario-card-title">{card.title}</h3>
                      <p className="dk-ai-assistant__scenario-card-description">{card.description}</p>
                    </div>
                    <span className="dk-ai-assistant__scenario-card-arrow" aria-hidden="true">
                      <ArrowRightIcon />
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>
        ) : (
          <div className="dk-ai-assistant__flow">
              <div className="dk-ai-assistant__flow-head">
                <div className="dk-ai-assistant__flow-copy">
                <span className="dk-ai-assistant__flow-badge">
                  {flow === "location" ? "Де рибалити?" : "На яку рибу?"}
                </span>
                {stepMeta && (
                  <>
                    <p className="dk-ai-assistant__step-meta">{stepMeta.step}</p>
                    <h3 className="dk-ai-assistant__step-title">{stepMeta.title}</h3>
                    <p className="dk-ai-assistant__step-subtitle">{stepMeta.subtitle}</p>
                  </>
                )}
                </div>

                {stage !== "result" && (
                  <div className="dk-ai-assistant__header-actions">
                    <button type="button" className="dk-ai-assistant__secondary" onClick={resetAll}>
                      Почати заново
                    </button>
                  </div>
                )}
              </div>

            {stage === "region" && (
              <div className="dk-ai-assistant__step-block">
                <div className="dk-ai-assistant__chips" role="list" aria-label="Вибір області">
                  {regionOptions.map((region) => {
                    const active = selectedRegion === region;
                    return (
                      <button
                        key={region}
                        type="button"
                        className="dk-ai-assistant__chip"
                        aria-pressed={active}
                        onClick={() => selectRegion(region)}
                      >
                        {toShortRegion(region)}
                      </button>
                    );
                  })}
                </div>

                <div className="dk-ai-assistant__controls">
                  <button type="button" className="dk-ai-assistant__secondary" onClick={back}>
                    <span className="dk-ai-assistant__button-icon" aria-hidden="true">
                      <ChevronLeftIcon />
                    </span>
                    Назад
                  </button>
                  <button
                    type="button"
                    className="dk-ai-assistant__primary"
                    onClick={() => (flow === "location" ? setStage("fish") : run())}
                    disabled={!canContinue}
                  >
                    {primaryLabel}
                  </button>
                </div>
              </div>
            )}

            {stage === "fish" && (
              <div className="dk-ai-assistant__step-block">
                <div className="dk-ai-assistant__chips" role="list" aria-label="Вибір риби">
                  {fishOptions.map((fish) => {
                    const active = selectedFish.includes(fish);
                    return (
                      <button
                        key={fish}
                        type="button"
                        className="dk-ai-assistant__chip"
                        aria-pressed={active}
                        onClick={() => toggleFish(fish)}
                      >
                        {fish}
                      </button>
                    );
                  })}
                </div>

                <div className="dk-ai-assistant__controls">
                  <button type="button" className="dk-ai-assistant__secondary" onClick={back}>
                    <span className="dk-ai-assistant__button-icon" aria-hidden="true">
                      <ChevronLeftIcon />
                    </span>
                    Назад
                  </button>
                  <button
                    type="button"
                    className="dk-ai-assistant__primary"
                    onClick={() => (flow === "fish" ? setStage("region") : run())}
                    disabled={!canContinue}
                  >
                    {primaryLabel}
                  </button>
                </div>
              </div>
            )}

            {stage === "loading" && (
              <div className="dk-ai-assistant__loading" aria-live="polite">
                <div className="dk-ai-assistant__loading-spinner" aria-hidden="true" />
                <div>
                  <p className="dk-ai-assistant__loading-title">Підбираємо озера...</p>
                  <p className="dk-ai-assistant__loading-subtitle">Аналізуємо каталог, рибу та погоду.</p>
                </div>
              </div>
            )}

            {stage === "result" && (
              <div className="dk-ai-assistant__results" aria-live="polite">
                <div className="dk-ai-assistant__results-head">
                  <div>
                    <p className="dk-ai-assistant__results-title">{resultTitle}</p>
                    <p className="dk-ai-assistant__results-subtitle">{resultSubtitle}</p>
                    <p className="dk-ai-assistant__results-meta">
                      {selectedRegion && (
                        <span>
                          Область: <strong>{selectedRegion}</strong>
                        </span>
                      )}
                      {selectedFish.length > 0 && (
                        <span>
                          Риба: <strong>{selectedFish.join(", ")}</strong>
                        </span>
                      )}
                      {weatherInfo && (
                        <span>
                          Погода: <strong>{weatherInfo.temp}°C</strong>
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="dk-ai-assistant__results-actions">
                    <button type="button" className="dk-ai-assistant__secondary" onClick={back}>
                      <span className="dk-ai-assistant__button-icon" aria-hidden="true">
                        <ChevronLeftIcon />
                      </span>
                      Змінити вибір
                    </button>
                    <button type="button" className="dk-ai-assistant__secondary" onClick={resetAll}>
                      Почати заново
                    </button>
                  </div>
                </div>

                {results.length === 0 ? (
                  <div className="dk-ai-assistant__empty">
                    <p className="dk-ai-assistant__empty-title">Нічого не знайшли</p>
                    <p className="dk-ai-assistant__empty-subtitle">
                      Спробуйте змінити область або вибрати іншу рибу.
                    </p>
                    <div className="dk-ai-assistant__empty-actions">
                      <button type="button" className="dk-ai-assistant__primary" onClick={back}>
                        Змінити вибір
                      </button>
                      <Link href="/lakes" className="dk-ai-assistant__secondary-link">
                        Переглянути всі озера
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="dk-ai-assistant__result-list">
                    {results.map(({ lake, score, explanation: resultExplanation }, index) => {
                      const normalizedFish = getNormalizedFishLabels(lake.fish_species);
                      const fishChips = normalizedFish.slice(0, 3);
                      const moreFish = Math.max(normalizedFish.length - fishChips.length, 0);
                      const lakeImage = imageSrcForLake(lake);

                      return (
                        <article key={lake.id} className="dk-ai-assistant__result-card">
                          <div className="dk-ai-assistant__result-thumb" aria-hidden="true">
                            {lakeImage ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={lakeImage}
                                alt=""
                                className="dk-ai-assistant__result-thumb-image"
                                loading="lazy"
                                decoding="async"
                                onError={() => markImageFailed(lake.id)}
                              />
                            ) : (
                              <div className="dk-ai-assistant__result-thumb-placeholder">
                                <span className="dk-ai-assistant__result-thumb-icon">
                                  <WaveIcon />
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="dk-ai-assistant__result-body">
                            <div className="dk-ai-assistant__result-top">
                              <div>
                                <p className="dk-ai-assistant__result-rank">#{index + 1}</p>
                                <h4 className="dk-ai-assistant__result-name">{lake.name}</h4>
                                <p className="dk-ai-assistant__result-location">
                                  {lake.city}
                                  {lake.location_text ? ` · ${lake.location_text}` : ""}
                                </p>
                              </div>
                              <span className="dk-ai-assistant__result-score">{score}/10</span>
                            </div>

                            <p className="dk-ai-assistant__result-explanation">{resultExplanation}</p>

                            <div className="dk-ai-assistant__result-fish" aria-label="Види риби">
                              {fishChips.map((fish) => (
                                <ResultCardFishChip key={`${lake.id}-${fish}`} label={fish} />
                              ))}
                              {moreFish > 0 && <ResultCardFishChip label={`+${moreFish}`} />}
                            </div>
                          </div>

                          <Link href={`/lakes/${getLakeRouteSlug(lake)}`} className="dk-ai-assistant__result-button">
                            Відкрити
                            <span className="dk-ai-assistant__button-icon" aria-hidden="true">
                              <ArrowRightIcon />
                            </span>
                          </Link>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="dk-ai-assistant__footer">
          <p className="dk-ai-assistant__disclaimer">
            <span className="dk-ai-assistant__disclaimer-icon" aria-hidden="true">
              <InfoIcon />
            </span>
            AI-помічник працює в beta-режимі й може помилятися. Перед поїздкою перевіряйте
            актуальні ціни, правила та графік роботи озера.
          </p>
        </div>
      </div>
    </section>
  );
}
