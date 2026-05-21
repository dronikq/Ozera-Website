import Link from "next/link";
import Image from "next/image";
import { supabase, type Lake } from "@/lib/supabase";
import { getLakeRouteSlug } from "@/lib/lake-slug";
import LandingClient from "./components/LandingClient";
import SiteHeader from "./components/SiteHeader";
import AppComingSoonForm from "./components/AppComingSoonForm";
import LakeCard, { toLakeCardData } from "./components/LakeCard";
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

const FEATURE_CARDS = [
  {
    title: "Ціни та контакти в одному місці",
    text: "Перевіряй умови, графік і контакти перед поїздкою.",
    icon: "info",
  },
  {
    title: "Риба, фото та правила",
    text: "Дивись, яка риба є в озері та які діють правила лову.",
    icon: "fish",
  },
  {
    title: "Навігація в один клік",
    text: "Відкривай маршрут у Google Maps або Waze без зайвого пошуку.",
    icon: "route",
  },
] as const;

function FeatureIcon({ type }: { type: "info" | "fish" | "route" }) {
  if (type === "fish") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 12c3-4 8-6 13-5 1.6.3 3 1 4 2-1 1-2.4 1.7-4 2-5 1-10-1-13-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 8.5 22 6v4l-2-1.5Z" fill="currentColor" />
      </svg>
    );
  }

  if (type === "route") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 18c2.2 0 3.5-1.8 5.5-4.5S15.3 9 18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M15 6l6 3-3 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="18" r="1.8" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 10v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 7.5h.01" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

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

  const heroPreviewItems = popularLakes.length > 0
    ? popularLakes.slice(0, 3).map((lake) => ({
        name: lake.name,
        city: lake.city ?? "Україна",
        fish: (lake.fish_species ?? []).slice(0, 2),
        image: lake.image_url || "/icon.png",
      }))
    : [
        {
          name: "Тихий Берег",
          city: "Київська обл.",
          fish: ["Короп", "Амур"],
          image: "https://plus.unsplash.com/premium_photo-1668203985517-99c47113e5e6?w=240&h=180&fit=crop&auto=format&q=80",
        },
        {
          name: "Соснове Озеро",
          city: "Черкаська обл.",
          fish: ["Щука", "Карась"],
          image: "https://plus.unsplash.com/premium_photo-1663091623349-3dc639c79363?w=240&h=180&fit=crop&auto=format&q=80",
        },
        {
          name: "Дзеркальне",
          city: "Полтавська обл.",
          fish: ["Короп", "Білий амур"],
          image: "https://plus.unsplash.com/premium_photo-1727538367105-13590ea2fec1?w=240&h=180&fit=crop&auto=format&q=80",
        },
      ];

  const featuredLakeCards = popularLakes.length > 0
    ? popularLakes.slice(0, 4).map((lake) => toLakeCardData({
        href: `/lakes/${getLakeRouteSlug(lake)}`,
        ...lake,
      }))
    : [
        {
          href: "/lakes",
          name: "Тихий Берег",
          imageUrl: "/fishing-hero.jpg.png",
          areaHa: 6,
          city: "Київська обл.",
          locationText: "Київська область",
          fishSpecies: ["Короп", "Амур", "Карась"],
          priceUah: 300,
        },
        {
          href: "/lakes",
          name: "Соснове Озеро",
          imageUrl: "/fishing-hero.jpg.png",
          areaHa: 8,
          city: "Черкаська обл.",
          locationText: "Черкаська область",
          fishSpecies: ["Щука", "Карась", "Лящ"],
          priceUah: 350,
        },
        {
          href: "/lakes",
          name: "Дзеркальне",
          imageUrl: "/fishing-hero.jpg.png",
          areaHa: 5,
          city: "Полтавська обл.",
          locationText: "Полтавська область",
          fishSpecies: ["Короп", "Білий амур"],
          priceUah: 280,
        },
        {
          href: "/lakes",
          name: "Кленове",
          imageUrl: "/fishing-hero.jpg.png",
          areaHa: 7,
          city: "Вінницька обл.",
          locationText: "Вінницька область",
          fishSpecies: ["Щука", "Окунь", "Карась"],
          priceUah: 320,
        },
      ];
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
            <SlideLeft className="l-hero-content">
              <div className="l-hero-badge">
                <span className="l-badge-dot" />
                41 озеро у базі
              </div>

              <h1 className="l-hero-title">Знайди платне озеро для риболовлі поруч</h1>

              <p className="l-hero-subtitle">
                Ціни, риба, правила, контакти та навігація — все в одному місці.
              </p>

              <div className="l-hero-cta">
                <Link href="/lakes" className="l-btn-primary">
                  Знайти озеро
                </Link>
                <button type="button" className="l-btn-outline" data-app-launch-trigger data-app-launch-source="hero">
                  Повідомити про запуск
                </button>
              </div>
            </SlideLeft>

            <SlideRight delay={0.2} className="l-hero-preview-wrap">
              <div className="l-hero-preview-glow" aria-hidden="true" />
              <div className="l-hero-preview">
                <div className="l-hero-preview-inner">
                  <div className="l-hero-preview-head">
                    <div>
                      <p className="l-hero-preview-kicker">Підбір озер</p>
                      <h2 className="l-hero-preview-title">Швидкий пошук поруч</h2>
                    </div>
                    <div className="l-hero-route-badge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 3l7 7-7 7" />
                        <path d="M21 10H3" />
                      </svg>
                      Маршрут в один клік
                    </div>
                  </div>

                  <div className="l-hero-search">
                    <svg className="l-hero-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-3.5-3.5" />
                    </svg>
                    <span>Пошук озера, риби або області</span>
                  </div>

                  <div className="l-hero-lake-list">
                    {heroPreviewItems.map((lake, index) => (
                      <article className="l-hero-lake-card" key={lake.name}>
                        <div className={`l-hero-lake-thumb l-hero-lake-thumb--${index % 3}`} aria-hidden="true">
                          <span>{lake.name.slice(0, 1)}</span>
                        </div>
                        <div className="l-hero-lake-content">
                          <p className="l-hero-lake-name">{lake.name}</p>
                          <p className="l-hero-lake-meta">📍 {lake.city}</p>
                          <div className="l-hero-lake-fish">
                            {lake.fish.map((fish) => (
                              <span className="l-hero-chip" key={fish}>{fish}</span>
                            ))}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="l-hero-preview-note">Google Maps / Waze</div>
                </div>
              </div>
            </SlideRight>
          </div>
        </div>
      </section>

      <section className="l-hero-features-section">
        <div className="l-container">
          <FadeUp>
            <div className="l-benefits-grid">
              {FEATURE_CARDS.map((card) => (
                <article className="l-benefit-card" key={card.title}>
                  <div className="l-benefit-card-inner">
                    <span className="l-benefit-icon" aria-hidden="true">
                      <FeatureIcon type={card.icon} />
                    </span>
                    <div className="l-benefit-body">
                      <strong className="l-benefit-title">{card.title}</strong>
                      <p className="l-benefit-text">{card.text}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      <section className="l-compare-section" id="about">
        <div className="l-container">
          <FadeUp>
            <div className="l-compare-header">
              <h2>Ми зробили OZERA, бо самі постійно шукали, де рибалити</h2>
              <p>Тепер вся важлива інформація про озера зібрана в одному місці.</p>
            </div>

            <div className="l-compare-grid">
              <article className="l-compare-card l-compare-card--before">
                <div className="l-compare-card-head">
                  <span className="l-compare-card-icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 8v4" />
                      <path d="M12 16h.01" />
                    </svg>
                  </span>
                  <strong>Як було раніше</strong>
                </div>
                <ul className="l-compare-list">
                  {[
                    "годинами шукати озера по групах і форумах;",
                    "телефонувати, щоб уточнити ціну та рибу;",
                    "їхати й дізнаватися, що озеро закрите;",
                    "збирати контакти по Viber і Telegram;",
                    "питати знайомих і не отримувати відповіді.",
                  ].map((item) => (
                    <li key={item}>
                      <span className="l-compare-bullet" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="l-compare-card l-compare-card--after">
                <div className="l-compare-card-head">
                  <span className="l-compare-card-icon l-compare-card-icon--check" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <strong>Як стало з OZERA</strong>
                </div>
                <ul className="l-compare-list">
                  {[
                    "озера, ціни та контакти в одному каталозі;",
                    "фото, види риб і графік роботи;",
                    "Google Maps або Waze в один клік;",
                    "збереження улюблених озер у застосунку;",
                    "постійно оновлювана база по Україні.",
                  ].map((item) => (
                    <li key={item}>
                      <span className="l-compare-bullet" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </FadeUp>
        </div>
      </section>
      <section className="l-popular-section" id="catalog">
        <div className="l-container">
          <FadeUp>
            <div className="l-popular-header">
              <h2>Популярні озера</h2>
              <Link href="/lakes" className="l-btn-outline l-popular-all">
                Переглянути всі озера
              </Link>
            </div>

            <div className="l-popular-grid">
              {featuredLakeCards.map((lake) => (
                <LakeCard lake={lake} key={lake.name} />
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ══════════════════════════════════════
          6. OZERA APP LAUNCH
      ══════════════════════════════════════ */}
      <section className="l-app-launch" id="download">
        <div className="l-container">
          <div className="l-app-launch-card">
            <SlideLeft className="l-app-launch-content">
              <span className="l-app-launch-badge">Скоро</span>
              <h2 className="l-app-launch-title">OZERA скоро буде в телефоні</h2>
              <p className="l-app-launch-subtitle">
                Збережені озера, карта, ціни, правила та навігація — навіть перед поїздкою на риболовлю.
              </p>

              <AppComingSoonForm />
            </SlideLeft>

            <SlideRight delay={0.1} className="l-app-launch-preview-wrap">
              <div className="l-app-launch-preview" aria-label="Попередній вигляд мобільного застосунку OZERA">
                <div className="l-app-launch-phone">
                  <div className="l-app-launch-phone-top">
                    <Image src="/icon.png" alt="" width={28} height={28} className="l-app-launch-phone-logo" />
                    <span>OZERA</span>
                  </div>
                  <div className="l-app-launch-phone-search">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M20 20l-3.5-3.5" />
                    </svg>
                    <span>Пошук озера...</span>
                  </div>
                  <div className="l-app-launch-phone-list">
                    {[
                      { name: "Тихий Берег", region: "Київська обл." },
                      { name: "Соснове Озеро", region: "Черкаська обл." },
                    ].map((lake) => (
                      <div className="l-app-launch-phone-card" key={lake.name}>
                        <div className="l-app-launch-phone-thumb" aria-hidden="true">{lake.name.slice(0, 1)}</div>
                        <div className="l-app-launch-phone-copy">
                          <strong>{lake.name}</strong>
                          <span>📍 {lake.region}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="l-app-launch-phone-nav" aria-hidden="true">
                    <span>Головна</span>
                    <span>Карта</span>
                    <span>Вибране</span>
                  </div>
                </div>
              </div>
            </SlideRight>
          </div>
        </div>
      </section>

    </div>
  );
}



