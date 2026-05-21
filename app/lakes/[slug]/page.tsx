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

      <section className="dk-app-cta">
        <div className="dk-container">
          <div className="dk-app-cta-inner">
            <div>
              <h2 className="dk-app-cta-title">
                Застосунок OZERA скоро{" "}<br />
                <span style={{ color: "var(--accent)" }}>на iOS та Android</span>
              </h2>
              <p className="dk-app-cta-sub">Обрані озера, push-сповіщення та навігація в одному місці</p>
            </div>
            <div className="dk-app-actions">
              <button type="button" className="dk-launch-btn" data-app-launch-trigger data-app-launch-source="lake-detail">
                <span className="dk-launch-btn-icon" aria-hidden="true">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </span>
                Повідомити про запуск
              </button>
              <div className="dk-platform-chips" aria-label="Платформи застосунку">
                {["iOS", "Android"].map((platform) => (
                  <span className="dk-platform-chip" key={platform} aria-label={`${platform} готується`}>
                    <span className="dk-platform-icon" aria-hidden="true">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="12" height="20" x="6" y="2" rx="2" ry="2" />
                        <path d="M11 18h2" />
                      </svg>
                    </span>
                    <span>
                      <span className="dk-platform-name">{platform}</span>
                      <span className="dk-platform-status">готується</span>
                    </span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
