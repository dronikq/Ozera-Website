import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OZERA — Платна риболовля в Україні | Каталог озер",
  description: "Знайди ідеальне місце для риболовлі! Понад 40 платних озер України — Київська, Черкаська, Львівська та інші області. Ціни, види риб, графік роботи та GPS-навігація.",
};
import Image from "next/image";
import { supabase, type Lake } from "@/lib/supabase";
import LandingClient from "./components/LandingClient";
import { FadeUp, SlideLeft, SlideRight, ScaleIn } from "./components/AnimatedSection";
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

      {/* ══════════════════════════════════════
          1. HEADER
      ══════════════════════════════════════ */}
      <header className="l-header" id="l-header">
        <nav className="l-nav">
          <Link href="/" className="l-logo">
            <Image src="/icon.png" alt="OZERA" width={36} height={36} className="l-logo-img" />
            <span>до Ozera</span>
          </Link>

          <ul className="l-nav-links" id="l-nav-links">
            <li><a href="#about">Про нас</a></li>
            <li><Link href="/lakes" className="l-nav-accent">Каталог озер</Link></li>
          </ul>

          <button className="l-burger" id="l-burger" aria-label="Меню">
            <span /><span /><span />
          </button>
        </nav>
      </header>

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
                  Переглянути озера →
                </Link>
                <a href="#download" className="l-btn-outline">
                  Скачати застосунок
                </a>
              </div>

              {/* Feature icons */}
              <div className="l-hero-features">
                {[
                  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFC857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, text: "Усі озера в одному місці з цінами та контактами" },
                  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFC857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>, text: "Фото, види риб та умови лову" },
                  { icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFC857" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>, text: "Навігація до озера в 1 натиск" },
                ].map((f) => (
                  <div className="l-feature-item" key={f.text}>
                    <span className="l-feature-icon">{f.icon}</span>
                    <span className="l-feature-text">{f.text}</span>
                  </div>
                ))}
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
                        <div className="l-phone-logo-icon">🎣</div>
                        <span className="l-phone-logo-text">до Ozera</span>
                      </div>
                      <span>📍</span>
                    </div>
                    {/* Search */}
                    <div className="l-phone-search">
                      <div className="l-phone-search-inner">
                        🔍&nbsp; Пошук озера...
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
                            <span className="l-phone-card-loc">📍 {c.region}</span>
                            <span className="l-phone-card-fish">🐟 {c.fish}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Bottom nav */}
                    <div className="l-phone-nav">
                      {["🏠", "🗺️", "❤️", "👤"].map((ic) => (
                        <span className="l-phone-nav-icon" key={ic}>{ic}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="l-float-badge">🐟 {count} озер у базі</div>
                <div className="l-float-notif"><span>🔔</span> Нове озеро!</div>
              </div>
            </SlideRight>

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
                  <Link href={`/lakes/${lake.id}`} className="l-lake-card" key={lake.id}>
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
          6. FOOTER CTA
      ══════════════════════════════════════ */}
      <section className="l-footer-cta" id="download">
        <div className="l-container">
          <ScaleIn>
          <div className="l-cta-content">

            {/* Mini phone */}
            <div className="l-cta-phone">
              <div className="l-cta-phone-notch">
                <div className="l-cta-phone-notch-inner" />
              </div>
              <div className="l-cta-phone-screen">
                <div className="l-cta-phone-header">
                  <div className="l-cta-phone-icon">🎣</div>
                  <span className="l-cta-phone-name">до Ozera</span>
                </div>
                <div className="l-cta-phone-body">
                  {[
                    { name: "Тихий Берег", img: "https://plus.unsplash.com/premium_photo-1668203985517-99c47113e5e6?w=80&h=64&fit=crop&auto=format&q=80" },
                    { name: "Соснове",     img: "https://plus.unsplash.com/premium_photo-1663091623349-3dc639c79363?w=80&h=64&fit=crop&auto=format&q=80" },
                    { name: "Кленове",     img: "https://plus.unsplash.com/premium_photo-1727538055174-92526593a254?w=80&h=64&fit=crop&auto=format&q=80" },
                  ].map((c) => (
                    <div className="l-cta-mini-card" key={c.name}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="l-cta-mini-img" src={c.img} alt={c.name} />
                      <div className="l-cta-mini-info">
                        <span className="l-cta-mini-name">{c.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="l-cta-phone-nav">
                  {["🏠", "🗺️", "❤️"].map((ic) => <span key={ic} style={{ fontSize: 12 }}>{ic}</span>)}
                </div>
              </div>
            </div>

            {/* Text + store buttons */}
            <div className="l-cta-text">
              <h2 className="l-cta-title">
                Скачай додаток до<br />
                <span className="l-accent">і лови більше риби!</span>
              </h2>
              <div className="l-store-buttons">
                <a href="#" className="l-store-btn l-store-apple">
                  <span className="l-store-icon">🍎</span>
                  <span>
                    <span className="l-store-sub">Завантажити в</span>
                    <span className="l-store-name">App Store</span>
                  </span>
                </a>
                <a href="/ozera-release.apk" className="l-store-btn l-store-google">
                  <span className="l-store-icon">▶</span>
                  <span>
                    <span className="l-store-sub">Завантажити в</span>
                    <span className="l-store-name">Google Play</span>
                  </span>
                </a>
              </div>
            </div>

          </div>
          </ScaleIn>
        </div>
      </section>

      {/* ══════════════════════════════════════
          7. FOOTER BOTTOM
      ══════════════════════════════════════ */}
      <footer className="l-footer-bottom">
        <div className="l-container">
          <div className="l-footer-inner">
            <p className="l-footer-copy">© {new Date().getFullYear()} до Ozera. Усі права захищені.</p>
            <nav className="l-footer-nav">
              <Link href="/terms">Умови використання</Link>
              <Link href="/privacy">Конфіденційність</Link>
              <a href="mailto:support@ozera.in.ua">Контакти</a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
