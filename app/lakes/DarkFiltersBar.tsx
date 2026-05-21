"use client";

import { useCallback } from "react";
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
  currentRegion: string;
  currentFish: string;
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

export default function DarkFiltersBar({ currentRegion, currentFish }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      const nextUrl = params.toString() ? `/lakes?${params.toString()}` : "/lakes";
      router.push(nextUrl);
    },
    [router, searchParams],
  );

  return (
    <div className="dk-filters-panel oz-card">
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
