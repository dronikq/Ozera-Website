import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { supabase, type Lake, type LakeUpdate, type LakeImage } from "@/lib/supabase";
import type { Metadata } from "next";
import ImageGallery from "./ImageGallery";
import WeatherWidget from "./WeatherWidget";
import AIAdvisor from "./AIAdvisor";
import LakeDetailTabs from "./LakeDetailTabs";
import "../lakes.css";

async function getLake(id: string): Promise<Lake | null> {
  const { data } = await supabase.from("lakes").select("*").eq("id", id).single();
  return data;
}
async function getLakeImages(id: string): Promise<LakeImage[]> {
  const { data } = await supabase.from("lake_images").select("*").eq("lake_id", id).order("sort_order", { ascending: true });
  return data ?? [];
}
async function getLakeUpdates(id: string): Promise<LakeUpdate[]> {
  const { data } = await supabase.from("lake_updates").select("*").eq("lake_id", id).order("created_at", { ascending: false }).limit(10);
  return data ?? [];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const lake = await getLake(id);
  if (!lake) return { title: "Озеро не знайдено" };

  const BASE_URL = "https://www.ozera.in.ua";
  const url = `${BASE_URL}/lakes/${id}`;
  const locationPart = lake.city ? `, ${lake.city}` : "";
  const title = `${lake.name} — Платна риболовля${locationPart}`;
  const fishPart = lake.fish_species?.length ? `Риба: ${lake.fish_species.slice(0, 4).join(", ")}.` : "";
  const schedulePart = lake.work_schedule_summary ? `Графік: ${lake.work_schedule_summary}.` : "";
  const description = lake.description
    ? `${lake.description.slice(0, 120)} ${fishPart} ${schedulePart}`.trim()
    : `Платна рибалка на ${lake.name}${locationPart}. ${fishPart} ${schedulePart}`.trim();
  const image = lake.image_url ?? `${BASE_URL}/og-image.png`;

  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", locale: "uk_UA", siteName: "OZERA", images: [{ url: image, width: 1200, height: 630, alt: lake.name }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function LakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lake, updates, lakeImages] = await Promise.all([getLake(id), getLakeUpdates(id), getLakeImages(id)]);
  if (!lake) notFound();

  const BASE_URL = "https://www.ozera.in.ua";
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["TouristAttraction", "LocalBusiness"],
    name: lake.name,
    description: lake.description ?? `Платна рибалка на ${lake.name}`,
    url: `${BASE_URL}/lakes/${lake.id}`,
    image: lake.image_url ?? `${BASE_URL}/og-image.png`,
    ...(lake.lat && lake.lng && { geo: { "@type": "GeoCoordinates", latitude: lake.lat, longitude: lake.lng } }),
    ...(lake.city && { address: { "@type": "PostalAddress", addressLocality: lake.city, addressCountry: "UA" } }),
    ...(lake.contacts?.phone?.length && { telephone: lake.contacts.phone[0] }),
    ...(lake.base_open_time && lake.base_close_time && { openingHours: `Mo-Su ${lake.base_open_time}-${lake.base_close_time}` }),
    inLanguage: "uk-UA",
    isAccessibleForFree: false,
  };

  const allImages = lakeImages.length > 0 ? lakeImages.map((i) => i.url) : lake.image_url ? [lake.image_url] : [];

  // Build Google Maps URL
  const mapsUrl = lake.location_google_url
    ?? (lake.lat && lake.lng ? `https://maps.google.com/?q=${lake.lat},${lake.lng}` : null);

  const primaryPhone = lake.contacts_enabled && lake.contacts?.phone?.[0];

  return (
    <div className="dk-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── NAV with breadcrumb ── */}
      <nav className="dk-nav">
        <div className="dk-nav-inner">
          <Link href="/" className="dk-logo">
            <Image src="/icon.png" alt="OZERA" width={36} height={36} className="dk-logo-img" />
            <span>до Ozera</span>
          </Link>
          <div className="dk-nav-breadcrumb">
            <Link href="/lakes">Каталог</Link>
            <span className="dk-nav-breadcrumb-sep">/</span>
            <span className="dk-nav-breadcrumb-cur" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {lake.name}
            </span>
          </div>
        </div>
      </nav>

      {/* ── LAKE HERO ── */}
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

      {/* ── DETAIL BODY ── */}
      <div className="dk-detail-body">
        <div className="dk-container">

          {/* Two-column grid: gallery + info card */}
          <div className="dk-detail-grid">

            {/* LEFT: Gallery + weather widgets */}
            <div>
              <ImageGallery images={allImages} name={lake.name} />

              {/* Weather + AI below gallery */}
              {lake.lat && lake.lng && (
                <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                  <WeatherWidget lat={lake.lat} lng={lake.lng} />
                  <AIAdvisor lat={lake.lat} lng={lake.lng} fishSpecies={lake.fish_species ?? []} />
                </div>
              )}
            </div>

            {/* RIGHT: Sticky info card */}
            <div className="dk-info-card">

              {/* Quick stats rows */}
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
                  <span className="dk-info-label">🕐 Графік</span>
                  <span className="dk-info-value">{lake.base_open_time}–{lake.base_close_time}</span>
                </div>
              )}
              {lake.work_schedule_summary && !lake.base_open_time && (
                <div className="dk-info-row">
                  <span className="dk-info-label">🕐 Графік</span>
                  <span className="dk-info-value" style={{ fontSize: 13 }}>{lake.work_schedule_summary}</span>
                </div>
              )}
              {lake.city && (
                <div className="dk-info-row">
                  <span className="dk-info-label">📍 Регіон</span>
                  <span className="dk-info-value" style={{ fontSize: 13 }}>{lake.city}</span>
                </div>
              )}
              {lake.location_text && (
                <div className="dk-info-row">
                  <span className="dk-info-label">🗺 Район</span>
                  <span className="dk-info-value" style={{ fontSize: 13, textAlign: "right", maxWidth: 160 }}>{lake.location_text}</span>
                </div>
              )}

              {/* Navigation buttons */}
              {mapsUrl && (
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="dk-btn-maps">
                  🗺️ Прокласти маршрут
                </a>
              )}
              {lake.location_waze_url && (
                <a href={lake.location_waze_url} target="_blank" rel="noopener noreferrer" className="dk-btn-call" style={{ marginTop: 8 }}>
                  🚗 Прокласти у Waze
                </a>
              )}
              {lake.contacts_enabled && lake.contacts && (
                <a href="#lake-contacts" className="dk-btn-call">
                  📞 Показати контакти
                </a>
              )}
            </div>
          </div>

          {/* ── TABS: Опис / Риби / Ціни / Правила ── */}
          <LakeDetailTabs
            description={lake.description ?? null}
            fishSpecies={lake.fish_species ?? null}
            priceText={lake.price_details_text ?? null}
            priceEnabled={lake.price_details_enabled ?? false}
            rulesText={lake.lake_rules_text ?? null}
            catchQuotaText={lake.catch_quota_text ?? null}
          />

          {/* ── EXTRA SECTIONS ── */}

          {/* Додаткові послуги */}
          {lake.additional_services_enabled && lake.additional_services_text && (
            <div className="dk-section">
              <h2 className="dk-section-title">🏕️ Додаткові послуги</h2>
              <div className="dk-services-grid">
                {lake.additional_services_text.split("\n").filter(l => l.trim()).map((s, i) => (
                  <div key={i} className="dk-service-item">
                    <span style={{ fontSize: 20, flexShrink: 0 }}>✅</span>
                    <span>{s.replace(/^[-•*]\s*/, "").trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Зручності */}
          {lake.amenities_enabled && lake.amenities && lake.amenities.length > 0 && (
            <div className="dk-section">
              <h2 className="dk-section-title">✅ Зручності</h2>
              <div className="dk-amenities">
                {lake.amenities.map((a) => (
                  <span key={a.key} className="dk-amenity">{a.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Зариблення */}
          {lake.stocking_enabled && lake.stocking_text && (
            <div className="dk-section">
              <h2 className="dk-section-title">🐠 Зариблення</h2>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", whiteSpace: "pre-line", margin: 0 }}>{lake.stocking_text}</p>
            </div>
          )}

          {/* FAQ */}
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

          {/* Контакти */}
          {lake.contacts_enabled && lake.contacts && (
            <div id="lake-contacts" className="dk-section">
              <h2 className="dk-section-title">📞 Контакти</h2>
              {lake.contacts.phone?.map((p) => (
                <a key={p} href={`tel:${p}`} className="dk-contact-link">📱 {p}</a>
              ))}
              {lake.contacts.email && (
                <a href={`mailto:${lake.contacts.email}`} className="dk-contact-link">✉️ {lake.contacts.email}</a>
              )}
            </div>
          )}

          {/* Схема озера */}
          {lake.scheme_enabled && lake.scheme_image_url && (
            <div className="dk-section">
              <h2 className="dk-section-title">🗺️ Схема озера</h2>
              <div style={{ borderRadius: 12, overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lake.scheme_image_url} alt="Схема озера" style={{ width: "100%", display: "block" }} />
              </div>
            </div>
          )}

          {/* Оновлення */}
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

      {/* ── APP CTA BANNER ── */}
      <div className="dk-app-cta">
        <div className="dk-container">
          <div className="dk-app-cta-inner">
            <div>
              <p className="dk-app-cta-title">Скачай додаток до і лови більше!</p>
              <p className="dk-app-cta-sub">Обрані озера, push-сповіщення та офлайн-режим</p>
            </div>
            <div className="dk-store-btns">
              <a href="#" className="dk-btn-store">
                <span className="dk-btn-store-icon">🍎</span>
                <span>
                  <span className="dk-btn-store-top">Завантажити в</span>
                  <span className="dk-btn-store-main">App Store</span>
                </span>
              </a>
              <a href="/ozera-release.apk" className="dk-btn-store">
                <span className="dk-btn-store-icon">▶</span>
                <span>
                  <span className="dk-btn-store-top">Завантажити в</span>
                  <span className="dk-btn-store-main">Google Play</span>
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
