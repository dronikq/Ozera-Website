import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import { supabase, type Lake, type LakeImage, type LakeUpdate } from "@/lib/supabase";
import { getLakeRouteSlug } from "@/lib/lake-slug";
import { buildLakeDetailData } from "@/lib/lake-detail-data";
import ImageGallery from "../[id]/ImageGallery";
import WeatherWidget from "../[id]/WeatherWidget";
import AIAdvisor from "../[id]/AIAdvisor";
import LakeContactsPanel from "../[id]/LakeContactsPanel";
import LakeSchemeViewer from "../[id]/LakeSchemeViewer";
import LakeDetailTabs from "../[id]/LakeDetailTabs";
import SiteHeader from "@/app/components/SiteHeader";
import "../lakes.css";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function getLakeBySlug(slug: string): Promise<Lake | null> {
  const { data } = await supabase.from("lakes").select("*").eq("slug", slug).maybeSingle();
  return data;
}

async function getLakeById(id: string): Promise<Lake | null> {
  const { data } = await supabase.from("lakes").select("*").eq("id", id).maybeSingle();
  return data;
}

async function resolveLake(slugOrId: string): Promise<Lake | null> {
  return (await getLakeBySlug(slugOrId)) ?? (UUID_RE.test(slugOrId) ? await getLakeById(slugOrId) : null);
}

async function getLakeImages(id: string): Promise<LakeImage[]> {
  const { data } = await supabase.from("lake_images").select("*").eq("lake_id", id).order("sort_order", { ascending: true });
  return data ?? [];
}

async function getLakeUpdates(id: string): Promise<LakeUpdate[]> {
  const { data } = await supabase.from("lake_updates").select("*").eq("lake_id", id).order("created_at", { ascending: false }).limit(10);
  return data ?? [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const lake = await resolveLake(slug);
  if (!lake) return { title: "Озеро не знайдено" };

  const baseUrl = "https://www.ozera.in.ua";
  const canonicalSlug = getLakeRouteSlug(lake);
  const url = `${baseUrl}/lakes/${canonicalSlug}`;
  const detail = buildLakeDetailData(lake);
  const fishNames = detail.fishSpecies;
  const fishPart = fishNames.length ? `Риба: ${fishNames.slice(0, 4).join(", ")}.` : "";
  const schedulePart = lake.work_schedule_summary ? `Графік: ${lake.work_schedule_summary}.` : "";
  const locationPart = lake.city ? `, ${lake.city}` : "";
  const priceForTitle = lake.price_uah ? ` від ${lake.price_uah}₴` : "";
  const regionForTitle = lake.city || "Україна";
  const title = `${lake.name} — Платна риболовля${priceForTitle} | ${regionForTitle} | OZERA`;
  const pricePart = lake.price_uah ? `Ціна від ${lake.price_uah} грн.` : "";
  const description = lake.description
    ? `${lake.description.slice(0, 110)} ${pricePart} ${fishPart}`.trim()
    : `Платна рибалка ${lake.name}${locationPart}. ${pricePart} ${fishPart} ${schedulePart}`.trim();
  const image = lake.image_url ?? `${baseUrl}/og-image.png`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "uk_UA",
      siteName: "OZERA",
      images: [{ url: image, width: 1200, height: 630, alt: lake.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function LakePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab } = await searchParams;
  let lake = await getLakeBySlug(slug);
  const query = tab ? `?tab=${encodeURIComponent(tab)}` : "";

  if (!lake && UUID_RE.test(slug)) {
    lake = await getLakeById(slug);
  }

  if (!lake) notFound();

  const canonicalSlug = getLakeRouteSlug(lake);
  if (canonicalSlug !== slug) {
    permanentRedirect(`/lakes/${canonicalSlug}${query}`);
  }

  const [updates, lakeImages] = await Promise.all([getLakeUpdates(lake.id), getLakeImages(lake.id)]);

  const baseUrl = "https://www.ozera.in.ua";
  const detail = buildLakeDetailData(lake);
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["TouristAttraction", "LocalBusiness"],
    name: lake.name,
    description: lake.description ?? `Платна рибалка на ${lake.name}`,
    url: `${baseUrl}/lakes/${canonicalSlug}`,
    image: lake.image_url ?? `${baseUrl}/og-image.png`,
    ...(lake.lat && lake.lng && { geo: { "@type": "GeoCoordinates", latitude: lake.lat, longitude: lake.lng } }),
    ...(lake.city && { address: { "@type": "PostalAddress", addressLocality: lake.city, addressCountry: "UA" } }),
    ...(lake.contacts?.phone?.length && { telephone: lake.contacts.phone[0] }),
    ...(lake.base_open_time && lake.base_close_time && { openingHours: `Mo-Su ${lake.base_open_time}-${lake.base_close_time}` }),
    ...(lake.price_uah && { priceRange: `від ${lake.price_uah} грн` }),
    ...(detail.fishSpecies.length && {
      amenityFeature: detail.fishSpecies.map((f) => ({ "@type": "LocationFeatureSpecification", name: f, value: true })),
    }),
    inLanguage: "uk-UA",
    isAccessibleForFree: false,
  };

  const allImages = lakeImages.length > 0 ? lakeImages.map((img) => img.url) : lake.image_url ? [lake.image_url] : [];
  const mapsUrl = detail.mapsUrl;
  const wazeUrl = detail.wazeUrl;

  return (
    <div className="dk-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Головна", item: baseUrl },
              { "@type": "ListItem", position: 2, name: "Каталог озер", item: `${baseUrl}/lakes` },
              { "@type": "ListItem", position: 3, name: lake.name, item: `${baseUrl}/lakes/${canonicalSlug}` },
            ],
          }),
        }}
      />
      {lake.faq_enabled && lake.faq_items && lake.faq_items.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: lake.faq_items.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            }),
          }}
        />
      )}

      <SiteHeader breadcrumbs={[
        { label: "Каталог", href: "/lakes" },
        { label: lake.name },
      ]} />

      <div className="dk-lake-hero">
        <div className="dk-container">
          <div className="dk-breadcrumb">
            <Link href="/">Головна</Link>
            <span className="dk-breadcrumb-sep">/</span>
            <Link href="/lakes">Каталог</Link>
            <span className="dk-breadcrumb-sep">/</span>
            <span className="dk-breadcrumb-cur">{lake.name}</span>
          </div>
          <h1>{lake.name}</h1>
          {(lake.city || lake.location_text) && (
            <p className="dk-lake-address">
              <span>📍</span> {lake.location_text ?? lake.city}
            </p>
          )}
        </div>
      </div>

      <div className="dk-detail-body">
        <div className="dk-container">
          <div className="dk-detail-grid">
            <div>
              <ImageGallery images={allImages} name={lake.name} />

              {lake.lat && lake.lng && (
                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                  <WeatherWidget lat={lake.lat} lng={lake.lng} />
                  <AIAdvisor lat={lake.lat} lng={lake.lng} fishSpecies={detail.fishSpecies} />
                </div>
              )}
            </div>

            <div className="dk-info-card">
              {lake.area_ha && (
                <div className="dk-info-row">
                  <span className="dk-info-label">📐 Площа</span>
                  <span className="dk-info-value">{lake.area_ha} га</span>
                </div>
              )}
              {lake.max_depth_m && (
                <div className="dk-info-row">
                  <span className="dk-info-label">🌊 Глибина</span>
                  <span className="dk-info-value">{lake.max_depth_m} м</span>
                </div>
              )}
              {lake.show_work_schedule && lake.base_open_time && lake.base_close_time && (
                <div className="dk-info-row">
                  <span className="dk-info-label">🕒 Графік</span>
                  <span className="dk-info-value">
                    {lake.base_open_time}–{lake.base_close_time}
                  </span>
                </div>
              )}
              {lake.work_schedule_summary && !lake.base_open_time && (
                <div className="dk-info-row">
                  <span className="dk-info-label">🕒 Графік</span>
                  <span className="dk-info-value" style={{ fontSize: 13 }}>
                    {lake.work_schedule_summary}
                  </span>
                </div>
              )}
              {lake.city && (
                <div className="dk-info-row">
                  <span className="dk-info-label">📍 Регіон</span>
                  <span className="dk-info-value" style={{ fontSize: 13 }}>
                    {lake.city}
                  </span>
                </div>
              )}
              {lake.location_text && (
                <div className="dk-info-row">
                  <span className="dk-info-label">🗺 Район</span>
                  <span className="dk-info-value" style={{ fontSize: 13, textAlign: "right", maxWidth: 160 }}>
                    {lake.location_text}
                  </span>
                </div>
              )}

              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="dk-btn-maps">
                  🗺️ Прокласти маршрут
                </a>
              )}
              {wazeUrl && (
                <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className="dk-btn-call" style={{ marginTop: 8 }}>
                  🚗 Прокласти у Waze
                </a>
              )}
              <LakeContactsPanel
                lakeId={lake.id}
                contactsEnabled={lake.contacts_enabled ?? false}
                contacts={lake.contacts}
                initiallyOpen={tab === "contacts"}
              />

              {lake.scheme_enabled && lake.scheme_image_url && (
                <div className="dk-section">
                  <h2 className="dk-section-title">🗺️ Схема озера</h2>
                  <div style={{ borderRadius: 12, overflow: "hidden" }}>
                    <LakeSchemeViewer src={lake.scheme_image_url} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <LakeDetailTabs
            description={lake.description ?? null}
            fishSpecies={detail.fishSpecies}
            priceText={detail.priceText}
            priceEnabled={detail.priceEnabled}
            rulesText={detail.rulesText}
            rulesEnabled={detail.rulesEnabled}
            catchQuotaText={detail.catchQuotaText}
            catchQuotaEnabled={detail.catchQuotaEnabled}
            workScheduleSummary={detail.workScheduleSummary}
            showWorkSchedule={detail.showWorkSchedule}
            additionalServicesText={detail.additionalServicesText}
            additionalServicesEnabled={detail.additionalServicesEnabled}
            stockingText={detail.stockingText}
            stockingEnabled={detail.stockingEnabled}
            amenitiesEnabled={detail.amenitiesEnabled}
            amenityNames={detail.amenityNames}
            amenityItems={detail.amenityItems}
            structured={detail.structured}
          />

          {lake.faq_enabled && lake.faq_items && lake.faq_items.length > 0 && (
            <div className="dk-section">
              <h2 className="dk-section-title">❓ FAQ</h2>
              {lake.faq_items.map((item, i) => (
                <div key={i} className="dk-faq-item">
                  <p className="dk-faq-q">{item.question}</p>
                  <p className="dk-faq-a">{item.answer}</p>
                </div>
              ))}
            </div>
          )}

          {updates.length > 0 && (
            <div className="dk-section">
              <h2 className="dk-section-title">🔔 Оновлення</h2>
              {updates.map((u) => (
                <div key={u.id} className="dk-update-item">
                  <div className="dk-update-header">
                    <p className="dk-update-title">{u.title}</p>
                    <span className="dk-update-date">{new Date(u.created_at).toLocaleDateString("uk-UA")}</span>
                  </div>
                  {u.body && <p className="dk-update-body">{u.body}</p>}
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      <section className="lake-app-promo">
        <div className="lake-app-promo__card">
          <div className="lake-app-promo__left">
            <div className="lake-app-promo__visual" aria-hidden="true">
              <div className="lake-app-promo__visual-badge">O</div>
            </div>

            <div className="lake-app-promo__content">
              <div className="lake-app-promo__badge">● Скоро</div>

              <h2 className="lake-app-promo__title">
                Застосунок OZERA скоро{" "}
                <span className="accent">на iOS та Android</span>
              </h2>

              <p className="lake-app-promo__description">
                Обрані озера, push-сповіщення та навігація в одному місці.
              </p>

              <div className="lake-app-promo__chips">
                <div className="lake-app-promo__chip">
                  <span className="lake-app-promo__chip-icon">⭐</span>
                  Обрані озера
                </div>
                <div className="lake-app-promo__chip">
                  <span className="lake-app-promo__chip-icon">🔔</span>
                  Push-сповіщення
                </div>
                <div className="lake-app-promo__chip">
                  <span className="lake-app-promo__chip-icon">🧭</span>
                  Навігація
                </div>
              </div>
            </div>
          </div>

          <div className="lake-app-promo__right">
            <button
              type="button"
              className="lake-app-promo__button"
              data-app-launch-trigger
              data-app-launch-source="lake-detail"
            >
              Повідомити про запуск
            </button>

            <div className="lake-app-promo__platforms">
              <div className="lake-app-promo__platform">
                <div className="lake-app-promo__platform-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.38-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.38C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.905-.09 1.85-.57 2.93-.81 1.32-.41 2.52-.29 3.41 1.48-3.2 1.92-2.48 5.97.48 7.13-.57 1.5-1.31 2.28-2.9 2.97l-.54.07z" fill="currentColor"/>
                    <path d="M12.03 7.25C12.11 5.31 13.75 3.8 15.73 3.65c.29 2.58-1.88 4.6-3.7 4.6z" fill="currentColor"/>
                  </svg>
                </div>
                <div className="lake-app-promo__platform-text">
                  <div className="lake-app-promo__platform-name">iOS</div>
                  <div className="lake-app-promo__platform-status">готується</div>
                </div>
              </div>
              <div className="lake-app-promo__platform">
                <div className="lake-app-promo__platform-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 9.5l1.414-1.414a2 2 0 112.828 0L9 9.586l6.586-6.586a2 2 0 112.828 2.828l-8 8a2 2 0 01-2.828 0l-5-5a2 2 0 010-2.828z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 9h6v6H3z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div className="lake-app-promo__platform-text">
                  <div className="lake-app-promo__platform-name">Android</div>
                  <div className="lake-app-promo__platform-status">готується</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
