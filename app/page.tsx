import Link from "next/link";
import Image from "next/image";
import { supabase, type Lake } from "@/lib/supabase";
import { getLakeRouteSlug } from "@/lib/lake-slug";
import LandingClient from "./components/LandingClient";
import SiteHeader from "./components/SiteHeader";
import AppComingSoonForm from "./components/AppComingSoonForm";
import { FadeUp, SlideLeft, SlideRight } from "./components/AnimatedSection";
import "./landing.css";

async function getLakesCount() {
  const { count } = await supabase
    .from("lakes")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

async function getPopularLakes(): Promise<Lake[]> {
  const { data } = await supabase
    .from("lakes")
    .select("*")
    .not("image_url", "is", null)
    .not("price_uah", "is", null)
    .order("updated_at", { ascending: false })
    .limit(4);
  return (data ?? []) as unknown as Lake[];
}

// Phone mockup card data — real fishing lake photos from Unsplash
const PHONE_CARDS = [
  { name: "Тихий Берег",   region: "Київська обл.",  fish: "Короп, Амур",       img: "https://plus.unsplash.com/premium_photo-1668203985517-99c47113e5e6?w=120&h=90&fit=crop&auto=format&q=80" },
  { name: "Соснове Озеро", region: "Черкаська обл.", fish: "Щука, Карась",      img: "https://plus.unsplash.com/premium_photo-1663091623349-3dc639c79363?w=120&h=90&fit=crop&auto=format&q=80" },
  { name: "Дзеркальне",    region: "Полтавська обл.", fish: "Короп, Білий амур", img: "https://plus.unsplash.com/premium_photo-1727538367105-13590ea2fec1?w=120&h=90&fit=crop&auto=format&q=80" },
];

export default async function HomePage() {
  const [count, popularLakes] = await Promise.all([getLakesCount(), getPopularLakes()]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OZERA — Платна риболовля в Україні",
    url: "https://www.ozera.in.ua",
    description: `Каталог ${count}+ платних озер України для риболовлі з цінами, рибою та навігацією.`,
    inLanguage: "uk-UA",
  };

  return (
    <div className="lp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LandingClient count={count} />
      <SiteHeader />

      {/* ══════════════════════════════════════
          2. HERO
      ══════════════════════════════════════ */}
      <section className="l-hero">
        <div className="l-container">
          <div className="l-hero-grid">

            {/* Left: text */}
            <SlideLeft className="l-hero-content">
              {/* Badge */}
              <div className="l-hero-badge">
                <span className="l-badge-dot" />
                {count} озер у базі
              </div>

              {/* H1 */}
              <h1>Знайди своє ідеальне місце для риболовлі</h1>

              {/* Subtitle */}
              <p className="l-hero-subtitle">
                Актуальна інформація про озера України — ціни, види риб, розклад та контакти.
              </p>

              {/* CTA buttons */}
              <div className="l-hero-cta">
                <Link href="/lakes" className="l-btn-primary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  Знайти озеро
                </Link>
                <button type="button" className="l-btn-outline" data-app-launch-trigger data-app-launch-source="hero">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                  </svg>
                  Повідомити про запуск
                </button>
              </div>

            </SlideLeft>

            {/* Right: Phone mockup */}
            <SlideRight delay={0.2} className="l-hero-phone">
              <div className="l-phone-wrap">
                <div className="l-phone">
                  <div className="l-phone-notch">
                    <div className="l-phone-notch-inner" />
                  </div>
                  <div className="l-phone-screen">
                    {/* Header */}
                    <div className="l-phone-header">
                      <div className="l-phone-logo">
                        <div className="l-phone-logo-icon">O</div>
                        <span className="l-phone-logo-text">OZERA</span>
                      </div>
                      <span className="l-phone-count">{count}</span>
                    </div>
                    {/* Search */}
                    <div className="l-phone-search">
                      <div className="l-phone-search-inner">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" />
                        </svg>
                        Пошук озера...
                      </div>
                    </div>
                    {/* Lake cards */}
                    <div className="l-phone-list">
                      {PHONE_CARDS.map((c) => (
                        <div className="l-phone-card" key={c.name}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="l-phone-card-img" src={c.img} alt={c.name} />
                          <div className="l-phone-card-info">
                            <span className="l-phone-card-name">{c.name}</span>
                            <span className="l-phone-card-loc">{c.region}</span>
                            <span className="l-phone-card-fish">{c.fish}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Bottom nav */}
                    <div className="l-phone-nav">
                      {[
                        { label: "Головна", icon: <path d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /> },
                        { label: "Карта", icon: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z" /><path d="M9 3v15" /><path d="M15 6v15" /></> },
                        { label: "Обране", icon: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" /> },
                      ].map((item) => (
                        <span className="l-phone-nav-icon" key={item.label}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            {item.icon}
                          </svg>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="l-float-badge">{count} озер у базі</div>
                <div className="l-float-notif"><span>🔔</span> Нове озеро!</div>
              </div>
            </SlideRight>

            {/* Feature icons */}
            <div className="l-hero-features">
              {[
                { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, title: "Ціни та контакти", description: "Умови, графік і контакти перед поїздкою." },
                { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>, title: "Риба, фото та правила", description: "Дивись, що ловиться і які діють правила." },
                { icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>, title: "Навігація в один клік", description: "Відкривай маршрут до озера без зайвого пошуку." },
              ].map((f) => (
                <div className="l-feature-item" key={f.title}>
                  <span className="l-feature-icon">{f.icon}</span>
                  <span className="l-feature-copy">
                    <span className="l-feature-title">{f.title}</span>
                    <span className="l-feature-description">{f.description}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          3. ПРО НАС
      ══════════════════════════════════════ */}
      <section className="l-about-section">
        <div className="l-container">
          <SlideLeft>
            <span className="l-about-badge">Про нас</span>
            <h2 className="l-about-title">
              Ми зробили цей сервіс,<br />
              <span className="l-accent">бо самі постійно шукали,</span><br />
              де рибалити.
            </h2>
          </SlideLeft>
        </div>
      </section>

      {/* ══════════════════════════════════════
          4. ЯК БУЛО РАНІШЕ
      ══════════════════════════════════════ */}
      <section className="l-section l-section-bg-secondary" id="about">
        <div className="l-container">
          <FadeUp>
          <div className="l-section-card">
            <h2>Як було раніше 🤯</h2>
            <div className="l-problems-grid">
              {[
                "Годинами гуглити озера по районах",
                "Телефонувати щоб дізнатися ціну та рибу",
                "Їхати і дізнаватися що озеро закрите",
                "Збирати контакти по групах у Viber і Telegram",
                "Питати знайомих — і не отримувати відповіді",
              ].map((text) => (
                <div className="l-problem-card" key={text}>
                  <div className="l-problem-icon">❌</div>
                  <p className="l-problem-text">{text}</p>
                </div>
              ))}
            </div>
          </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════
          4. ЯК СТАЛО З OZERA
      ══════════════════════════════════════ */}
      <section className="l-section l-section-bg-secondary">
        <div className="l-container">
          <FadeUp delay={0.1}>
          <div className="l-section-card">
            <h2>Як стало з <span className="l-accent">OZERA</span> ✨</h2>
            <div className="l-benefits-grid">
              {[
                { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFC857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, text: "Всі озера в одному місці одразу з цінами" },
                { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFC857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>, text: "Фото, види риб та графік роботи" },
                { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFC857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>, text: "Навігація одним натиском — Google Maps або Waze" },
                { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFC857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>, text: "Push-сповіщення від улюблених озер" },
                { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFC857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>, text: "Постійно оновлювана база по всій Україні" },
              ].map((b) => (
                <div className="l-benefit-card" key={b.text}>
                  <div className="l-benefit-icon">{b.icon}</div>
                  <p className="l-benefit-text">{b.text}</p>
                </div>
              ))}
            </div>
          </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════
          5. ПОПУЛЯРНІ ОЗЕРА
      ══════════════════════════════════════ */}
      <section className="l-section" id="catalog">
        <div className="l-container">
          <FadeUp>
          <div className="l-section-header">
            <h2>Популярні озера</h2>
            <Link href="/lakes" className="l-link-accent">Переглянути всі озера →</Link>
          </div>

          <div className="l-lakes-grid">
            {popularLakes.length > 0
              ? popularLakes.map((lake) => (
                  <Link href={`/lakes/${getLakeRouteSlug(lake)}`} className="l-lake-card" key={lake.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="l-lake-img" src={lake.image_url ?? ""} alt={lake.name} />
                    <div className="l-lake-body">
                      <p className="l-lake-name">{lake.name}</p>
                      {lake.city && <p className="l-lake-loc">📍 {lake.city}</p>}
                      {lake.fish_species && lake.fish_species.length > 0 && (
                        <p className="l-lake-fish">
                          🐟 {lake.fish_species.slice(0, 3).join(", ")}
                          {lake.fish_species.length > 3 ? ` +${lake.fish_species.length - 3}` : ""}
                        </p>
                      )}
                    </div>
                  </Link>
                ))
              : /* Fallback static cards — real fishing lake photos */
                [
                  { name: "Тихий Берег",   city: "Київська обл.",   fish: "Короп, Амур, Карась",  img: "https://plus.unsplash.com/premium_photo-1668203985517-99c47113e5e6?w=600&h=400&fit=crop&auto=format&q=80" },
                  { name: "Соснове Озеро", city: "Черкаська обл.",  fish: "Щука, Карась, Лящ",   img: "https://plus.unsplash.com/premium_photo-1663091623349-3dc639c79363?w=600&h=400&fit=crop&auto=format&q=80" },
                  { name: "Дзеркальне",    city: "Полтавська обл.", fish: "Короп, Білий амур",    img: "https://plus.unsplash.com/premium_photo-1727538367105-13590ea2fec1?w=600&h=400&fit=crop&auto=format&q=80" },
                  { name: "Кленове",       city: "Вінницька обл.",  fish: "Щука, Окунь, Карась",  img: "https://plus.unsplash.com/premium_photo-1727538055174-92526593a254?w=600&h=400&fit=crop&auto=format&q=80" },
                ].map((l) => (
                  <Link href="/lakes" className="l-lake-card" key={l.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="l-lake-img" src={l.img} alt={l.name} />
                    <div className="l-lake-body">
                      <p className="l-lake-name">{l.name}</p>
                      <p className="l-lake-loc">📍 {l.city}</p>
                      <p className="l-lake-fish">🐟 {l.fish}</p>
                    </div>
                  </Link>
                ))
            }
          </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════
          6. OZERA APP COMING SOON
      ══════════════════════════════════════ */}
      <section className="l-app-coming" id="download">
        <div className="l-container">
          <div className="l-app-coming-grid">
            <SlideLeft className="l-app-phone-stage">
              <div className="l-app-phone-decor" aria-hidden="true" />
              <div className="l-app-phone" aria-label="Попередній вигляд мобільного застосунку OZERA">
                <div className="l-app-phone-notch" />
                <div className="l-app-phone-status">
                  <span>9:41</span>
                  <span>▮▮ ◡</span>
                </div>
                <div className="l-app-phone-screen">
                  <div className="l-app-phone-header">
                    <Image src="/icon.png" alt="" width={28} height={28} className="l-app-phone-logo" />
                    <span>OZERA</span>
                  </div>
                  <div className="l-app-phone-list">
                    {[
                      { name: "Тихий Берег", region: "Київська обл.", img: "https://plus.unsplash.com/premium_photo-1668203985517-99c47113e5e6?w=96&h=72&fit=crop&auto=format&q=80" },
                      { name: "Соснове", region: "Черкаська обл.", img: "https://plus.unsplash.com/premium_photo-1663091623349-3dc639c79363?w=96&h=72&fit=crop&auto=format&q=80" },
                      { name: "Кленове", region: "Полтавська обл.", img: "https://plus.unsplash.com/premium_photo-1727538055174-92526593a254?w=96&h=72&fit=crop&auto=format&q=80" },
                    ].map((lake) => (
                      <div className="l-app-phone-card" key={lake.name}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={lake.img} alt={lake.name} />
                        <div>
                          <strong>{lake.name}</strong>
                          <span>📍 {lake.region}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="l-app-phone-nav" aria-hidden="true">
                    <span>⌂<small>Головна</small></span>
                    <span>◇<small>Карта</small></span>
                    <span>♡<small>Вибране</small></span>
                  </div>
                </div>
              </div>
            </SlideLeft>

            <SlideRight delay={0.1} className="l-app-coming-content">
              <span className="l-app-coming-badge">СКОРО</span>
              <h2 className="l-app-coming-title">
                Застосунок OZERA скоро<br />
                <span>на iOS та Android</span>
              </h2>
              <p className="l-app-coming-description">
                Готуємо мобільний застосунок, щоб озера, ціни, контакти та навігація були під рукою на риболовлі.
              </p>

              <AppComingSoonForm />

              <div className="l-app-benefits">
                {[
                  {
                    title: "Карта платних водойм",
                    text: "Озера на карті, фото та контакти",
                    icon: <><path d="M14 18.5 9 20l-5-1.5v-13L9 7l6-1.5 5 1.5v8" /><path d="M9 7v13" /><path d="M15 5.5v5" /><path d="M18 22s4-3.2 4-7a4 4 0 0 0-8 0c0 3.8 4 7 4 7Z" /><circle cx="18" cy="15" r="1" /></>,
                  },
                  {
                    title: "Умови, ціни та правила",
                    text: "Вся важлива інформація перед поїздкою",
                    icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8" /><path d="M8 17h5" /></>,
                  },
                  {
                    title: "Поради для риболовлі",
                    text: "Корисні поради та рекомендації",
                    icon: <><path d="M19.5 13.5C17 19 11 21 5 19c-2-6 0-12 5.5-14.5C12 8 16 12 19.5 13.5Z" /><path d="M9 15c3.5-1 6-3.5 7.5-7.5" /></>,
                  },
                ].map((benefit) => (
                  <div className="l-app-benefit" key={benefit.title}>
                    <span className="l-app-benefit-icon" aria-hidden="true">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {benefit.icon}
                      </svg>
                    </span>
                    <strong>{benefit.title}</strong>
                    <p>{benefit.text}</p>
                  </div>
                ))}
              </div>
            </SlideRight>
          </div>
        </div>
      </section>

    </div>
  );
}
