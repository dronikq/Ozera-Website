"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, type Lake } from "@/lib/supabase";
import { PUBLIC_LAKE_IMAGE_SELECT } from "@/lib/lake-image-resolver";
import CatalogView from "./CatalogView";
import AILakePicker from "./AILakePicker";
import DarkFiltersBar from "./DarkFiltersBar";
import SiteHeader from "@/app/components/SiteHeader";

const DEFAULT_SORT = "name_asc";

async function fetchLakes(
  search: string,
  sort: string,
  region: string,
  fish: string,
  price: string,
): Promise<Lake[]> {
  let query = supabase
    .from("lakes")
    .select(`*, lake_images(${PUBLIC_LAKE_IMAGE_SELECT})`);

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
  if (error) throw error;

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

export default function LakesCatalogClient({ initialLakes }: { initialLakes: Lake[] }) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? DEFAULT_SORT;
  const region = searchParams.get("region") ?? "";
  const fish = searchParams.get("fish") ?? "";
  const price = searchParams.get("price") ?? "";

  const [lakes, setLakes] = useState<Lake[]>(initialLakes);
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadedOnceRef = useRef(true);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // On first mount with no active filters, server data is already correct — skip fetch.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (!q && sort === DEFAULT_SORT && !region && !fish && !price) return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await fetchLakes(q, sort, region, fish, price);
        if (cancelled) return;
        setLakes(result);
        loadedOnceRef.current = true;
        setLoadedOnce(true);
      } catch (err: unknown) {
        if (cancelled) return;
        console.error("lakes fetch failed:", err);
        setError("Не вдалося завантажити озера.");
        if (!loadedOnceRef.current) setLakes([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [q, sort, region, fish, price]);

  const showInitialLoader = loading && !loadedOnce && !error;

  return (
    <div className="dk-page">
      <SiteHeader />

      <div className="dk-page-header">
        <div className="dk-container">
          <div className="dk-page-header-top">
            <div>
              <h1>Каталог озер</h1>
              <p className="dk-page-subtitle">Знайди своє місце для риболовлі</p>
            </div>
            <span className="dk-results-count">
              {showInitialLoader ? "Завантажуємо озера..." : `${lakes.length} озер знайдено`}
            </span>
          </div>
        </div>
      </div>

      <div className="dk-content-area">
        <div className="dk-container">
          {showInitialLoader ? (
            <div className="dk-lakes-loading">
              <div className="dk-lakes-loading__spinner" aria-hidden="true" />
              <div>
                <p className="dk-lakes-loading__title">Підтягуємо каталог озер...</p>
                <p className="dk-lakes-loading__subtitle">Ще мить, і озера зʼявляться тут.</p>
              </div>
            </div>
          ) : error && !loadedOnce ? (
            <div className="dk-lakes-loading dk-lakes-loading--error">
              <div>
                <p className="dk-lakes-loading__title">{error}</p>
                <p className="dk-lakes-loading__subtitle">
                  Спробуй оновити сторінку або повернутися трохи пізніше.
                </p>
              </div>
            </div>
          ) : (
            <>
              <AILakePicker lakes={lakes} />

              <div className="dk-lakes-filters-wrap">
                <Suspense>
                  <DarkFiltersBar currentQ={q} currentRegion={region} currentFish={fish} />
                </Suspense>
              </div>

              <CatalogView lakes={lakes} />

              <section className="dk-lakes-cta" aria-label="Не знайшли своє озеро?">
                <div className="dk-lakes-cta__card">
                  <div className="dk-lakes-cta__media">
                    <Image
                      src="/fishing-hero.webp"
                      alt="Рибалка на озері"
                      fill
                      sizes="(max-width: 900px) 100vw, 320px"
                      className="dk-lakes-cta__media-image"
                    />
                    <div className="dk-lakes-cta__media-overlay" />
                  </div>

                  <div className="dk-lakes-cta__content">
                    <p className="dk-lakes-cta__eyebrow">Не знайшли своє озеро?</p>
                    <h3 className="dk-lakes-cta__title">
                      Запропонуйте водойму, якої ще немає в каталозі
                    </h3>
                    <p className="dk-lakes-cta__description">
                      Ми перевіримо інформацію та додамо її на карту, щоб інші рибалки могли швидко знайти це місце.
                    </p>
                  </div>

                  <div className="dk-lakes-cta__action">
                    <Link href="/lakes/add" className="dk-lakes-cta__button">
                      <span className="dk-lakes-cta__button-icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path
                            d="M12 5v14M5 12h14"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                      <span>Додати озеро</span>
                    </Link>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
