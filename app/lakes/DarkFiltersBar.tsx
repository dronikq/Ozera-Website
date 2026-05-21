"use client";

import { useMemo, useRef, type FormEvent } from "react";
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`dk-filter-chip${active ? " is-active" : ""}`}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export default function DarkFiltersBar({ currentQ, currentRegion, currentFish }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const hasFilters = Boolean(currentQ || currentRegion || currentFish);

  const update = useMemo(
    () => (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      const nextUrl = params.toString() ? `/lakes?${params.toString()}` : "/lakes";
      router.push(nextUrl);
    },
    [router, searchParams],
  );

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    update("q", inputRef.current?.value.trim() ?? "");
  };

  return (
    <div className="dk-filters-panel oz-card">
      <form className="dk-search-shell" onSubmit={submitSearch}>
        <span className="dk-search-shell__icon" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          type="search"
          defaultValue={currentQ}
          placeholder="Пошук за назвою озера, містом або областю"
          className="dk-search-input dk-search-input--catalog"
          onBlur={(e) => update("q", e.target.value.trim())}
        />
        {hasFilters && (
          <button type="button" className="dk-filter-reset" onClick={() => router.push("/lakes")}>
            Скинути фільтри
          </button>
        )}
      </form>

      <div className="dk-chip-group-shell">
        <div className="dk-chip-group-header">
          <span>Область</span>
        </div>
        <div className="dk-chip-row no-scrollbar">
          {REGIONS.map((region) => (
            <Chip
              key={region}
              label={region}
              active={currentRegion === region}
              onClick={() => update("region", currentRegion === region ? "" : region)}
            />
          ))}
        </div>
      </div>

      <div className="dk-chip-group-shell">
        <div className="dk-chip-group-header">
          <span>Риба</span>
        </div>
        <div className="dk-chip-row no-scrollbar">
          {FISH_OPTIONS.map((fish) => (
            <Chip
              key={fish}
              label={fish}
              active={currentFish === fish}
              onClick={() => update("fish", currentFish === fish ? "" : fish)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
