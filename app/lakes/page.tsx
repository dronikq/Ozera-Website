import type { Metadata } from "next";
import { Suspense } from "react";
import { supabase, type Lake } from "@/lib/supabase";
import { PUBLIC_LAKE_IMAGE_SELECT } from "@/lib/lake-image-resolver";
import LakesCatalogClient from "./LakesCatalogClient";
import "./lakes.css";

export const metadata: Metadata = {
  title: "Каталог озер — платна риболовля в Україні",
  description:
    "Знайди платне озеро для риболовлі поруч. Фільтри по регіону, виду риби та ціні. Актуальні ціни, графік роботи та навігація до кожного озера.",
  alternates: { canonical: "https://www.ozera.in.ua/lakes" },
  openGraph: {
    title: "Каталог платних озер України | OZERA",
    description:
      "40+ озер для риболовлі: ціни, риба, карта. Фільтруй по регіону та виду риби.",
    url: "https://www.ozera.in.ua/lakes",
  },
};

async function getInitialLakes(): Promise<Lake[]> {
  const { data, error } = await supabase
    .from("lakes")
    .select(`*, lake_images(${PUBLIC_LAKE_IMAGE_SELECT})`)
    .order("name", { ascending: true })
    .limit(200);
  if (error) console.error("getInitialLakes error:", error.message);
  return (data ?? []) as unknown as Lake[];
}

type LakesSearchParams = {
  q?: string;
  sort?: string;
  region?: string;
  fish?: string;
  price?: string;
};

function normalizeSearchParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

async function getFilteredLakes(searchParams: LakesSearchParams): Promise<Lake[]> {
  const q = normalizeSearchParam(searchParams.q);
  const sort = normalizeSearchParam(searchParams.sort);
  const region = normalizeSearchParam(searchParams.region);
  const fish = normalizeSearchParam(searchParams.fish);
  const price = normalizeSearchParam(searchParams.price);

  let query = supabase
    .from("lakes")
    .select(`*, lake_images(${PUBLIC_LAKE_IMAGE_SELECT})`);

  if (q) query = query.ilike("name", `%${q}%`);
  if (region) query = query.eq("city", region);
  if (fish) query = query.contains("fish_species", [fish]);

  if (sort === "newest") {
    query = query.order("updated_at", { ascending: false });
  } else {
    query = query.order("name", { ascending: true });
  }

  const { data, error } = await query.limit(200);
  if (error) console.error("getFilteredLakes error:", error.message);

  let lakes = (data ?? []) as unknown as Lake[];

  if (sort === "price_asc") {
    lakes = lakes.sort((a, b) => {
      if (a.price_uah == null && b.price_uah == null) return 0;
      if (a.price_uah == null) return 1;
      if (b.price_uah == null) return -1;
      return a.price_uah - b.price_uah;
    });
  } else if (sort === "price_desc") {
    lakes = lakes.sort((a, b) => {
      if (a.price_uah == null && b.price_uah == null) return 0;
      if (a.price_uah == null) return 1;
      if (b.price_uah == null) return -1;
      return b.price_uah - a.price_uah;
    });
  }

  if (price === "200") lakes = lakes.filter((l) => l.price_uah != null && l.price_uah <= 200);
  else if (price === "500") lakes = lakes.filter((l) => l.price_uah != null && l.price_uah <= 500);
  else if (price === "500+") lakes = lakes.filter((l) => l.price_uah != null && l.price_uah > 500);

  return lakes;
}

export default async function LakesPage({
  searchParams,
}: {
  searchParams?: LakesSearchParams | Promise<LakesSearchParams>;
}) {
  const params = (await searchParams) ?? {};
  const hasFilters = Boolean(
    normalizeSearchParam(params.q) ||
      normalizeSearchParam(params.sort) ||
      normalizeSearchParam(params.region) ||
      normalizeSearchParam(params.fish) ||
      normalizeSearchParam(params.price),
  );
  const initialLakes = hasFilters ? await getFilteredLakes(params) : await getInitialLakes();
  return (
    <Suspense fallback={null}>
      <LakesCatalogClient initialLakes={initialLakes} />
    </Suspense>
  );
}
