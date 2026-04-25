"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "name_asc",   label: "А→Я",      icon: "🔤" },
  { value: "price_asc",  label: "Ціна ↑",   icon: "💰" },
  { value: "price_desc", label: "Ціна ↓",   icon: "💸" },
  { value: "newest",     label: "Нові",      icon: "✨" },
];

const FISH_CHIPS = [
  { value: "Короп",      emoji: "🐟" },
  { value: "Щука",       emoji: "🦈" },
  { value: "Судак",      emoji: "🐡" },
  { value: "Карась",     emoji: "🫧" },
  { value: "Лящ",        emoji: "🐠" },
  { value: "Окунь",      emoji: "🎣" },
  { value: "Амур",       emoji: "🌿" },
  { value: "Сом",        emoji: "🐋" },
  { value: "Форель",     emoji: "🏔️" },
  { value: "Товстолоб",  emoji: "🐟" },
];

const PRICE_OPTIONS = [
  { value: "",      label: "Будь-яка" },
  { value: "200",   label: "до 200 ₴" },
  { value: "500",   label: "до 500 ₴" },
  { value: "500+",  label: "від 500 ₴" },
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
  const currentFish   = searchParams.get("fish")   ?? "";
  const currentPrice  = searchParams.get("price")  ?? "";

  const update = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/lakes?${params.toString()}`);
  };

  const hasFilters =
    currentRegion !== "" ||
    currentSort !== "name_asc" ||
    currentFish !== "" ||
    currentPrice !== "";

  const hasSidebarFilters = currentRegion !== "" || currentFish !== "";

  /* ──────────────────────────── VERTICAL (sidebar) ──────────────────────────── */
  if (vertical) {
    return (
      <div className="flex flex-col gap-5">

        {/* Fish species */}
        <FilterSection title="Вид риби">
          <div className="flex flex-wrap gap-1.5">
            {FISH_CHIPS.map((f) => (
              <button
                key={f.value}
                onClick={() => update("fish", currentFish === f.value ? "" : f.value)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  currentFish === f.value
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white border-blue-100 text-slate-500 hover:border-blue-400 hover:text-[#0f2a4a]"
                }`}
              >
                <span>{f.emoji}</span> {f.value}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Region */}
        <FilterSection title="Регіон">
          <select
            value={currentRegion}
            onChange={(e) => update("region", e.target.value)}
            className={`w-full px-3 py-2 rounded-xl text-sm border focus:outline-none focus:border-blue-500 transition-colors ${
              currentRegion
                ? "bg-blue-50 border-blue-400 text-[#0f2a4a] font-medium"
                : "bg-white border-blue-200 text-slate-500"
            }`}
          >
            <option value="">🌍 Всі регіони</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </FilterSection>

        {hasSidebarFilters && (
          <button
            onClick={() => router.push("/lakes")}
            className="w-full px-3 py-2 rounded-xl text-sm border border-red-200 text-red-400 hover:border-red-400 hover:bg-red-50 hover:text-red-600 bg-white transition-all flex items-center justify-center gap-1.5"
          >
            ✕ Скинути фільтри
          </button>
        )}
      </div>
    );
  }

  /* ──────────────────────────── HORIZONTAL (map top bar) ──────────────────────────── */
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
      <span className="text-xs text-slate-400 font-medium shrink-0">Риба:</span>
      {FISH_CHIPS.map((f) => (
        <button
          key={f.value}
          onClick={() => update("fish", currentFish === f.value ? "" : f.value)}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border shrink-0 ${
            currentFish === f.value
              ? "bg-blue-600 border-blue-600 text-white shadow-sm"
              : "bg-white border-blue-100 text-slate-500 hover:border-blue-400 hover:text-[#0f2a4a]"
          }`}
        >
          <span>{f.emoji}</span> {f.value}
        </button>
      ))}
      {currentFish && (
        <button
          onClick={() => update("fish", "")}
          className="px-2.5 py-1.5 rounded-xl text-xs border border-red-200 text-red-400 hover:border-red-400 hover:bg-red-50 hover:text-red-600 bg-white transition-all shrink-0"
        >
          ✕
        </button>
      )}
    </div>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{title}</p>
      {children}
    </div>
  );
}
