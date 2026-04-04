"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "name_asc",   label: "Назва А→Я" },
  { value: "price_asc",  label: "Ціна ↑" },
  { value: "price_desc", label: "Ціна ↓" },
  { value: "newest",     label: "Нові спочатку" },
];

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
  "Крим",
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

export default function FiltersBar({ vertical = false }: { vertical?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort   = searchParams.get("sort")   ?? "name_asc";
  const currentRegion = searchParams.get("region") ?? "";

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/lakes?${params.toString()}`);
  };

  const hasFilters = currentRegion !== "" || currentSort !== "name_asc";

  if (vertical) {
    return (
      <div className="flex flex-col gap-4">
        {/* Сортування */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Сортування</p>
          <div className="flex flex-col gap-1.5">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => update("sort", opt.value)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                  currentSort === opt.value
                    ? "bg-[#f5c842] border-[#f5c842] text-[#0f2a4a]"
                    : "bg-white border-blue-100 text-slate-500 hover:border-blue-300 hover:text-[#0f2a4a]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Регіон */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Регіон</p>
          <select
            value={currentRegion}
            onChange={(e) => update("region", e.target.value)}
            className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-blue-500 transition-colors ${
              currentRegion
                ? "bg-[#f5c842]/10 border-[#f5c842] text-[#0f2a4a] font-medium"
                : "bg-white border-blue-200 text-slate-500"
            }`}
          >
            <option value="">🌍 Всі регіони</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={() => router.push("/lakes")}
            className="w-full px-3 py-2 rounded-xl text-sm border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 bg-white transition-all"
          >
            ✕ Скинути фільтри
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Сортування */}
      <div className="flex gap-1.5 flex-wrap">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update("sort", opt.value)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all border ${
              currentSort === opt.value
                ? "bg-[#f5c842] border-[#f5c842] text-[#0f2a4a]"
                : "bg-white border-blue-200 text-slate-500 hover:border-blue-400 hover:text-[#0f2a4a]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Регіон */}
      <select
        value={currentRegion}
        onChange={(e) => update("region", e.target.value)}
        className={`px-3 py-1.5 rounded-xl text-sm border focus:outline-none focus:border-blue-500 transition-colors ${
          currentRegion
            ? "bg-[#f5c842]/10 border-[#f5c842] text-[#0f2a4a] font-medium"
            : "bg-white border-blue-200 text-slate-500"
        }`}
      >
        <option value="">🌍 Всі регіони</option>
        {REGIONS.map((r) => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={() => router.push("/lakes")}
          className="px-3 py-1.5 rounded-xl text-sm border border-red-200 text-red-400 hover:border-red-400 hover:text-red-600 bg-white transition-all"
        >
          ✕ Скинути
        </button>
      )}
    </div>
  );
}
