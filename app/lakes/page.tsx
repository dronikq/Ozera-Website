import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { supabase, type Lake } from "@/lib/supabase";
import SiteHeader from "@/app/components/SiteHeader";
import AILakePicker from "./AILakePicker";
import CatalogView from "./CatalogView";
import DarkFiltersBar from "./DarkFiltersBar";
import "./lakes.css";

export const metadata: Metadata = {
  title: "Каталог платних озер | OZERA",
  description:
    "Обери область, рибу або знайди озеро за назвою. Ціни, риба, правила, контакти та навігація — в одному каталозі OZERA.",
  alternates: { canonical: "https://www.ozera.in.ua/lakes" },
  openGraph: {
    title: "Каталог платних озер | OZERA",
    description:
      "Знайди платне озеро для риболовлі поруч. Фільтруй за областю, видом риби та швидко відкривай потрібне озеро.",
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
  if (fish) query = query.contains("fish_species", [fish]);

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

  if (price === "200") lakes = lakes.filter((lake) => lake.price_uah != null && lake.price_uah <= 200);
  else if (price === "500") lakes = lakes.filter((lake) => lake.price_uah != null && lake.price_uah <= 500);
  else if (price === "500+") lakes = lakes.filter((lake) => lake.price_uah != null && lake.price_uah > 500);

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
    <div className="dk-page dk-catalog-page">
      <SiteHeader />

      <main className="dk-catalog-main">
        <section className="dk-catalog-hero">
          <div className="dk-container">
            <div className="dk-catalog-hero__inner">
              <div className="dk-catalog-hero__copy">
                <span className="dk-catalog-stats-badge">{lakes.length} озеро знайдено</span>
                <h1>Каталог платних озер</h1>
                <p>Обери область, рибу або знайди озеро за назвою.</p>
              </div>
              <div className="dk-catalog-hero__aside">
                <p className="dk-catalog-hero__aside-label">Швидкий пошук</p>
                <p className="dk-catalog-hero__aside-text">
                  Відкривай озера з фото, цінами, рибою та маршрутом в один клік.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="dk-catalog-section">
          <div className="dk-container">
            <Suspense fallback={null}>
              <DarkFiltersBar currentQ={q} currentRegion={region} currentFish={fish} />
            </Suspense>
          </div>
        </section>

        <section className="dk-catalog-section dk-catalog-section--promo">
          <div className="dk-container">
            <AILakePicker lakes={lakes} />
          </div>
        </section>

        <section className="dk-catalog-section">
          <div className="dk-container">
            <CatalogView lakes={lakes} total={lakes.length} />
          </div>
        </section>

        <section className="dk-catalog-section dk-catalog-section--bottom">
          <div className="dk-container">
            <div className="dk-bottom-cta oz-card">
              <div className="dk-bottom-cta__copy">
                <span className="dk-bottom-cta__eyebrow">Є вода, якої нема в каталозі?</span>
                <h2>Не знайшли своє озеро?</h2>
                <p>Запропонуйте водойму — ми перевіримо інформацію і додамо її до каталогу.</p>
              </div>
              <Link href="/lakes/add" className="oz-btn-primary dk-bottom-cta__button">
                + Додати озеро
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
