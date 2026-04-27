import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { supabase, type Lake } from "@/lib/supabase";
import CatalogView from "./CatalogView";
import AILakePicker from "./AILakePicker";
import DarkFiltersBar from "./DarkFiltersBar";
import "./lakes.css";

export const metadata: Metadata = {
  title: "Каталог озер — Платна риболовля в Україні",
  description:
    "Знайди платне озеро для риболовлі поруч. Фільтри по регіону, виду риби та ціні. Актуальні ціни, графік роботи та навігація до кожного озера.",
  alternates: { canonical: "https://www.ozera.in.ua/lakes" },
  openGraph: {
    title: "Каталог платних озер України | OZERA",
    description: "39+ озер для риболовлі: ціни, риба, карта. Фільтруй по регіону та виду риби.",
    url: "https://www.ozera.in.ua/lakes",
  },
};

async function getLakes(
  search: string,
  sort: string,
  region: string,
  fish: string,
  price: string,
): Promise<Lake[]> {
  let query = supabase.from("lakes").select("*");

  if (search) query = query.ilike("name", `%${search}%`);
  if (region) query = query.eq("city", region);
  if (fish)   query = query.contains("fish_species", [fish]);

  if (sort === "name_asc" || sort === "" || !sort) {
    query = query.order("name", { ascending: true });
  } else if (sort === "newest") {
    query = query.order("updated_at", { ascending: false });
  } else {
    query = query.order("name", { ascending: true });
  }

  const { data, error } = await query.limit(200);
  if (error) console.error("getLakes error:", error.message);
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

  if (price === "200")  lakes = lakes.filter((l) => l.price_uah != null && l.price_uah <= 200);
  else if (price === "500")  lakes = lakes.filter((l) => l.price_uah != null && l.price_uah <= 500);
  else if (price === "500+") lakes = lakes.filter((l) => l.price_uah != null && l.price_uah > 500);

  return lakes;
}

export default async function LakesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; region?: string; fish?: string; price?: string }>;
}) {
  const { q = "", sort = "name_asc", region = "", fish = "", price = "" } = await searchParams;
  const lakes = await getLakes(q, sort, region, fish, price);

  return (
    <div className="dk-page">
      {/* ── NAV ── */}
      <nav className="dk-nav">
        <div className="dk-nav-inner">
          <Link href="/" className="dk-logo">
            <Image src="/icon.png" alt="OZERA" width={36} height={36} className="dk-logo-img" />
            <span>OZERA</span>
          </Link>
          <span className="dk-nav-label">Каталог озер</span>
        </div>
      </nav>

      {/* ── PAGE HEADER ── */}
      <div className="dk-page-header">
        <div className="dk-container">
          <div className="dk-page-header-top">
            <div>
              <h1>Каталог озер</h1>
              <p className="dk-page-subtitle">Знайди своє місце для риболовлі</p>
            </div>
            <span className="dk-results-count">{lakes.length} озер знайдено</span>
          </div>

          {/* Filters: search + region + fish */}
          <Suspense>
            <DarkFiltersBar currentQ={q} currentRegion={region} currentFish={fish} />
          </Suspense>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="dk-content-area">
        <div className="dk-container">

          {/* AI Picker */}
          <div style={{ marginBottom: 32 }}>
            <AILakePicker lakes={lakes} />
          </div>

          {/* Grid + Map */}
          <CatalogView lakes={lakes} total={lakes.length} />
        </div>
      </div>
    </div>
  );
}
