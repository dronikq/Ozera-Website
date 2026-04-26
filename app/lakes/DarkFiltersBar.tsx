"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

const REGIONS = [
  "Київ","Київська область","Вінницька область","Волинська область",
  "Дніпропетровська область","Донецька область","Житомирська область",
  "Закарпатська область","Запорізька область","Івано-Франківська область",
  "Кіровоградська область","Луганська область","Львівська область",
  "Миколаївська область","Одеська область","Полтавська область",
  "Рівненська область","Сумська область","Тернопільська область",
  "Харківська область","Херсонська область","Хмельницька область",
  "Черкаська область","Чернівецька область","Чернігівська область",
];

const FISH_OPTIONS = [
  "Короп","Щука","Судак","Карась","Лящ","Окунь","Амур","Сом","Форель","Товстолоб",
];

interface Props {
  currentQ: string;
  currentRegion: string;
  currentFish: string;
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update("q", inputRef.current?.value ?? "");
  };

  const hasFilters = currentQ || currentRegion || currentFish;

  return (
    <div className="dk-filters-bar">
      <form onSubmit={handleSearchSubmit} style={{ display: "contents" }}>
        <input
          ref={inputRef}
          type="text"
          defaultValue={currentQ}
          placeholder="🔍 Пошук за назвою..."
          className="dk-search-input"
          onBlur={(e) => update("q", e.target.value)}
        />
      </form>

      <select
        value={currentRegion}
        onChange={(e) => update("region", e.target.value)}
        className="dk-filter-select"
      >
        <option value="">🌍 Область</option>
        {REGIONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      <select
        value={currentFish}
        onChange={(e) => update("fish", e.target.value)}
        className="dk-filter-select"
      >
        <option value="">🐟 Риба</option>
        {FISH_OPTIONS.map((f) => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => router.push("/lakes")}
          className="dk-btn-reset"
          type="button"
        >
          ✕ Скинути
        </button>
      )}
    </div>
  );
}
