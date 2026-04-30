import type { Lake } from "@/lib/supabase";

const TRANSLITERATION: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "h",
  ґ: "g",
  д: "d",
  е: "e",
  є: "ie",
  ж: "zh",
  з: "z",
  и: "y",
  і: "i",
  ї: "i",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ь: "",
  ю: "iu",
  я: "ia",
  ы: "y",
  э: "e",
  ё: "yo",
  ъ: "",
};

export function slugifyLakeName(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  const transliterated = Array.from(normalized, (char) => TRANSLITERATION[char] ?? char).join("");

  return transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "lake";
}

export function getLakeRouteSlug(lake: Pick<Lake, "id" | "name" | "slug">) {
  return lake.slug?.trim() || slugifyLakeName(lake.name);
}
