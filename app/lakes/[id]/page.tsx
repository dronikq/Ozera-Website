import Link from "next/link";
import { notFound } from "next/navigation";
import { supabase, type Lake, type LakeUpdate, type LakeImage } from "@/lib/supabase";
import type { Metadata } from "next";
import ImageGallery from "./ImageGallery";
import WeatherWidget from "./WeatherWidget";
import AIAdvisor from "./AIAdvisor";

async function getLake(id: string): Promise<Lake | null> {
  const { data } = await supabase
    .from("lakes")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

async function getLakeImages(id: string): Promise<LakeImage[]> {
  const { data } = await supabase
    .from("lake_images")
    .select("*")
    .eq("lake_id", id)
    .order("sort_order", { ascending: true });
  return data ?? [];
}

async function getLakeUpdates(lakeId: string): Promise<LakeUpdate[]> {
  const { data } = await supabase
    .from("lake_updates")
    .select("*")
    .eq("lake_id", lakeId)
    .order("created_at", { ascending: false })
    .limit(10);
  return data ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const lake = await getLake(id);
  if (!lake) return { title: "Озеро не знайдено" };
  return {
    title: `${lake.name} — OZERA`,
    description: lake.description ?? `Інформація про озеро ${lake.name}`,
  };
}

export default async function LakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [lake, updates, lakeImages] = await Promise.all([getLake(id), getLakeUpdates(id), getLakeImages(id)]);

  if (!lake) notFound();

  return (
    <main className="min-h-screen bg-[#f0f7ff]">
      {/* Nav */}
      <nav className="border-b border-blue-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ozera_splash.png" alt="до Ozera" className="h-8 object-contain" />
          </Link>
          <span className="text-slate-300">/</span>
          <Link href="/lakes" className="text-sm text-blue-500 hover:text-blue-700 transition-colors">Каталог</Link>
          <span className="text-slate-300">/</span>
          <span className="text-sm text-slate-500 truncate">{lake.name}</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold text-[#0f2a4a]">{lake.name}</h1>
          {(lake.city || lake.location_text) && (
            <p className="text-slate-400 flex items-center gap-1.5">
              <span>📍</span> {lake.location_text ?? lake.city}
            </p>
          )}
        </div>

        {/* Gallery */}
        {(() => {
          // Збираємо всі фото: lake_images + image_url як запасний варіант
          const fromTable = lakeImages.map((img) => img.url);
          const allImages = fromTable.length > 0
            ? fromTable
            : lake.image_url ? [lake.image_url] : [];
          return <ImageGallery images={allImages} name={lake.name} />;
        })()}

        {/* Weather + Bite score */}
        {lake.lat && lake.lng && (
          <WeatherWidget lat={lake.lat} lng={lake.lng} />
        )}

        {/* AI Advisor */}
        {lake.lat && lake.lng && (
          <AIAdvisor lat={lake.lat} lng={lake.lng} fishSpecies={lake.fish_species ?? []} />
        )}

        {/* Quick stats */}
        {(lake.area_ha || lake.max_depth_m || (lake.show_work_schedule && lake.base_open_time)) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {lake.area_ha && <Stat label="Площа" value={`${lake.area_ha} га`} />}
            {lake.max_depth_m && <Stat label="Макс. глибина" value={`${lake.max_depth_m} м`} />}
            {lake.show_work_schedule && lake.base_open_time && lake.base_close_time && (
              <Stat label="Графік" value={`${lake.base_open_time} – ${lake.base_close_time}`} />
            )}
          </div>
        )}

        {/* Navigation links */}
        {(lake.location_google_url || lake.location_waze_url || (lake.lat && lake.lng)) && (
          <div className="flex flex-wrap gap-3">
            {lake.location_google_url && (
              <NavLink href={lake.location_google_url} icon="🗺️" label="Google Maps" />
            )}
            {lake.location_waze_url && (
              <NavLink href={lake.location_waze_url} icon="🚗" label="Waze" />
            )}
            {!lake.location_google_url && lake.lat && lake.lng && (
              <NavLink
                href={`https://maps.google.com/?q=${lake.lat},${lake.lng}`}
                icon="🗺️"
                label="Google Maps"
              />
            )}
          </div>
        )}

        {/* Description */}
        {lake.description && (
          <Section title="Опис">
            <p className="text-slate-400 leading-relaxed whitespace-pre-line">{lake.description}</p>
          </Section>
        )}

        {/* Fish species */}
        {lake.fish_species && lake.fish_species.length > 0 && (
          <Section title="🐟 Види риб">
            <div className="flex flex-wrap gap-2">
              {lake.fish_species.map((f) => (
                <span key={f} className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-sm">
                  {f}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Price */}
        {lake.price_details_enabled && lake.price_details_text && (
          <Section title="💰 Ціни">
            <p className="text-slate-400 leading-relaxed whitespace-pre-line">{lake.price_details_text}</p>
          </Section>
        )}

        {/* Catch quota */}
        {lake.catch_quota_text && (
          <Section title="⚖️ Норма вилову">
            <p className="text-slate-400 leading-relaxed whitespace-pre-line">{lake.catch_quota_text}</p>
          </Section>
        )}

        {/* Work schedule */}
        {lake.work_schedule_summary && (
          <Section title="🕐 Графік роботи">
            <p className="text-slate-400 leading-relaxed">{lake.work_schedule_summary}</p>
          </Section>
        )}

        {/* Additional services */}
        {lake.additional_services_enabled && lake.additional_services_text && (
          <Section title="🏕️ Додаткові послуги">
            <p className="text-slate-400 leading-relaxed whitespace-pre-line">{lake.additional_services_text}</p>
          </Section>
        )}

        {/* Lake rules */}
        {lake.lake_rules_text && (
          <Section title="📋 Правила">
            <p className="text-slate-400 leading-relaxed whitespace-pre-line">{lake.lake_rules_text}</p>
          </Section>
        )}

        {/* Stocking */}
        {lake.stocking_enabled && lake.stocking_text && (
          <Section title="🐠 Зариблення">
            <p className="text-slate-400 leading-relaxed whitespace-pre-line">{lake.stocking_text}</p>
          </Section>
        )}

        {/* Amenities */}
        {lake.amenities_enabled && lake.amenities && lake.amenities.length > 0 && (
          <Section title="✅ Зручності">
            <div className="flex flex-wrap gap-2">
              {lake.amenities.map((a) => (
                <span key={a.key} className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm">
                  {a.name}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* FAQ */}
        {lake.faq_enabled && lake.faq_items && lake.faq_items.length > 0 && (
          <Section title="❓ FAQ">
            <div className="flex flex-col gap-3">
              {lake.faq_items.map((item, i) => (
                <div key={i} className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex flex-col gap-1">
                  <p className="font-semibold text-[#0f2a4a]">{item.question}</p>
                  <p className="text-slate-500 text-sm">{item.answer}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Contacts */}
        {lake.contacts_enabled && lake.contacts && (
          <Section title="📞 Контакти">
            <div className="flex flex-col gap-2">
              {lake.contacts.phone?.map((p) => (
                <a key={p} href={`tel:${p}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                  📱 {p}
                </a>
              ))}
              {lake.contacts.email && (
                <a href={`mailto:${lake.contacts.email}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                  ✉️ {lake.contacts.email}
                </a>
              )}
            </div>
          </Section>
        )}

        {/* Scheme */}
        {lake.scheme_enabled && lake.scheme_image_url && (
          <Section title="🗺️ Схема озера">
            <div className="rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lake.scheme_image_url} alt="Схема озера" className="w-full" />
            </div>
          </Section>
        )}

        {/* Updates */}
        {updates.length > 0 && (
          <Section title="🔔 Оновлення">
            <div className="flex flex-col gap-3">
              {updates.map((u) => (
                <div key={u.id} className="rounded-xl bg-white border border-blue-100 p-4 flex flex-col gap-1 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-white">{u.title}</span>
                    <span className="text-xs text-slate-500 shrink-0">
                      {new Date(u.created_at).toLocaleDateString("uk-UA")}
                    </span>
                  </div>
                  {u.body && <p className="text-slate-400 text-sm">{u.body}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* CTA */}
        <div className="rounded-2xl bg-[#f5c842]/10 border border-[#f5c842]/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-white">Хочете більше?</p>
            <p className="text-slate-400 text-sm">Завантажте застосунок — обрані озера, сповіщення та офлайн-режим</p>
          </div>
          <a href="/#download" className="px-5 py-2.5 rounded-xl bg-[#f5c842] hover:bg-[#e6ba35] text-[#0f2a4a] font-bold transition-colors shrink-0">
            Скачати
          </a>
        </div>

      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border border-blue-100 p-6 flex flex-col gap-3 shadow-sm">
      <h2 className="font-bold text-[#0f2a4a]">{title}</h2>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white border border-blue-100 p-4 flex flex-col gap-1 shadow-sm">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="font-bold text-[#0f2a4a]">{value}</span>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-800 hover:border-blue-600 text-slate-300 hover:text-white transition-colors text-sm"
    >
      <span>{icon}</span> {label}
    </a>
  );
}
