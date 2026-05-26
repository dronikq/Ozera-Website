"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Lake } from "@/lib/supabase";
import CatalogView from "./CatalogView";
import DarkFiltersBar from "./DarkFiltersBar";
import SiteHeader from "@/app/components/SiteHeader";

const AILakePicker = dynamic(() => import("./AILakePicker"), {
  ssr: true,
  loading: () => (
    <section className="dk-ai-assistant" aria-label="Підбір озер">
      <div className="dk-ai-assistant__loading" aria-live="polite">
        <div className="dk-ai-assistant__loading-spinner" aria-hidden="true" />
        <div>
          <p className="dk-ai-assistant__loading-title">Підбір озер...</p>
          <p className="dk-ai-assistant__loading-subtitle">Завантажуємо рекомендації.</p>
        </div>
      </div>
    </section>
  ),
});

export default function LakesCatalogClient({ initialLakes }: { initialLakes: Lake[] }) {
  const [lakes, setLakes] = useState<Lake[]>(initialLakes);
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const region = searchParams.get("region") ?? "";
  const fish = searchParams.get("fish") ?? "";

  useEffect(() => {
    setLakes(initialLakes);
  }, [initialLakes]);

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
            <span className="dk-results-count">{`${lakes.length} озер знайдено`}</span>
          </div>
        </div>
      </div>

      <div className="dk-content-area">
        <div className="dk-container">
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
        </div>
      </div>
    </div>
  );
}
