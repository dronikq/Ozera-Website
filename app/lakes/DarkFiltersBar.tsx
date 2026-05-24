"use client";

import { type FormEvent, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const REGIONS = [
  "Київ",
  "Київська область",
  "Вінницька область",
  "Волинська область",
  "Дніпропетровська область",
  "Донецька область",
  "Житомирська область",
  "Закарпатська область",
  "Запорізька область",
  "Івано-Франківська область",
  "Кіровоградська область",
  "Луганська область",
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

const FISH_OPTIONS = [
  "Короп",
  "Щука",
  "Судак",
  "Карась",
  "Лящ",
  "Окунь",
  "Амур",
  "Сом",
  "Форель",
  "Товстолоб",
];

interface Props {
  currentQ: string;
  currentRegion: string;
  currentFish: string;
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M16 16l4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 12h17M12 3.5c2.3 2.4 3.6 5.4 3.6 8.5s-1.3 6.1-3.6 8.5c-2.3-2.4-3.6-5.4-3.6-8.5s1.3-6.1 3.6-8.5Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
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

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M9 3v15M15 6v15" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function DarkFiltersBar({ currentQ, currentRegion, currentFish }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/lakes?${params.toString()}`);
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    update("q", inputRef.current?.value ?? "");
  };

  const hasFilters = Boolean(currentQ || currentRegion || currentFish);

  const openMap = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("dk-open-lakes-map"));
    }
  };

  return (
    <div className="dk-filters-bar">
      <form className="dk-filter-field dk-filter-field--search" onSubmit={handleSearchSubmit}>
        <span className="dk-filter-field-icon" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="text"
          defaultValue={currentQ}
          placeholder="Пошук за назвою озера..."
          className="dk-search-input"
          onBlur={(e) => update("q", e.target.value)}
        />
      </form>

      <label className="dk-filter-field dk-filter-field--select">
        <span className="dk-filter-field-icon" aria-hidden="true">
          <GlobeIcon />
        </span>
        <select
          value={currentRegion}
          onChange={(e) => update("region", e.target.value)}
          className="dk-filter-select"
          aria-label="Область"
        >
          <option value="">Область</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </label>

      <label className="dk-filter-field dk-filter-field--select">
        <span className="dk-filter-field-icon" aria-hidden="true">
          <FishIcon />
        </span>
        <select
          value={currentFish}
          onChange={(e) => update("fish", e.target.value)}
          className="dk-filter-select"
          aria-label="Риба"
        >
          <option value="">Риба</option>
          {FISH_OPTIONS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>

      <div className="dk-filter-actions">
        {hasFilters && (
          <button onClick={() => router.push("/lakes")} className="dk-btn-reset" type="button">
            Скинути
          </button>
        )}

        <button type="button" onClick={openMap} className="dk-btn-map">
          <span className="dk-btn-map__icon" aria-hidden="true">
            <MapIcon />
          </span>
          <span>На карті</span>
        </button>
      </div>
    </div>
  );
}
