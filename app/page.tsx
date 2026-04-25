import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import Navbar from "./components/Navbar";
import { FadeUp, SlideLeft, SlideRight, ScaleIn, FadeIn } from "./components/AnimatedSection";

const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;

const HERO_PHOTO    = "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1920&q=90&fit=crop";
const STORY_PHOTO   = "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200&q=85&fit=crop";
const FEATURE_PHOTO = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=85&fit=crop&crop=center";

const galleryPhotos = [
  { id: "1506905925346-21bda4d32df4", label: "Ранковий туман" },
  { id: "1544551763-46a013bb70d5", label: "Золотий час" },
  { id: "1559128010-7c1ad6e1d6a3", label: "Тиша берега" },
  { id: "1470071459604-3b5ec3a7fe05", label: "Лісова водойма" },
];

const lakeMocks = [
  { name: "Тихий Берег",      region: "Київська обл.",   fish: "Короп, Амур",  price: "від 300 грн", color: "bg-blue-400" },
  { name: "Озеро Синє",       region: "Черкаська обл.",  fish: "Окунь, Карась", price: "від 200 грн", color: "bg-teal-400" },
  { name: "Рибальський Рай",  region: "Львівська обл.",  fish: "Щука, Короп",  price: "від 450 грн", color: "bg-indigo-400" },
];

async function getLakesCount() {
  const { count } = await supabase.from("lakes").select("*", { count: "exact", head: true });
  return count ?? 0;
}

export default async function HomePage() {
  const count = await getLakesCount();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://www.ozera.in.ua/#organization",
        name: "OZERA",
        url: "https://www.ozera.in.ua",
        logo: "https://www.ozera.in.ua/icon.png",
        contactPoint: { "@type": "ContactPoint", email: "info@ozera.app", contactType: "customer service" },
      },
      {
        "@type": "WebSite",
        "@id": "https://www.ozera.in.ua/#website",
        url: "https://www.ozera.in.ua",
        name: "OZERA — Платна риболовля в Україні",
        description: `Каталог ${count}+ платних озер України для риболовлі з цінами, рибою та навігацією.`,
        publisher: { "@id": "https://www.ozera.in.ua/#organization" },
        inLanguage: "uk-UA",
      },
    ],
  };

  return (
    <main className="flex flex-col min-h-screen bg-[#07090d] grain">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-end overflow-hidden">
        {/* Background photo */}
        <div className="absolute inset-0">
          <Image
            src={HERO_PHOTO}
            alt="Рибальське озеро на світанку"
            fill
            className="object-cover object-center"
            priority
            quality={90}
          />
          {/* Multi-layer dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090d] via-[#07090d]/60 to-[#07090d]/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07090d]/80 via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="relative max-w-6xl mx-auto px-6 pb-24 pt-40 w-full">
          <FadeUp delay={0.1}>
            <div className="flex items-center gap-3 mb-8">
              <span className="gold-line" />
              <span className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase font-medium">
                Преміум рибальський клуб
              </span>
              <span className="gold-line" />
            </div>
          </FadeUp>

          <FadeUp delay={0.2}>
            <h1 className="font-serif text-6xl md:text-8xl font-bold leading-[1.02] tracking-tight mb-6 max-w-4xl">
              Мистецтво{" "}
              <span className="gold-shimmer">риболовлі</span>
              <br />в Україні
            </h1>
          </FadeUp>

          <FadeUp delay={0.3}>
            <p className="text-[#7a7060] text-xl leading-relaxed max-w-xl mb-10">
              {count}+ ретельно відібраних водойм. Ціни, риба, координати —
              все що потрібно для ідеального виїзду.
            </p>
          </FadeUp>

          <FadeUp delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/lakes"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-[#c9a84c] hover:bg-[#e8d5a3] text-[#07090d] font-semibold text-sm tracking-widest uppercase transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-[#c9a84c]/20"
              >
                Переглянути каталог
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <a
                href="#story"
                className="inline-flex items-center gap-3 px-8 py-4 border border-[#c9a84c]/30 text-[#c9a84c] hover:border-[#c9a84c] font-medium text-sm tracking-widest uppercase transition-all duration-300 hover:-translate-y-0.5"
              >
                Дізнатись більше
              </a>
            </div>
          </FadeUp>

          {/* Bottom stats */}
          <FadeIn delay={0.6}>
            <div className="flex items-center gap-12 mt-20 pt-8 border-t border-white/5">
              {[
                { num: `${count}+`, label: "водойм" },
                { num: "25",       label: "областей" },
                { num: "5★",       label: "рейтинг" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="font-serif text-3xl text-[#c9a84c] font-bold">{s.num}</div>
                  <div className="text-[#7a7060] text-xs tracking-widest uppercase mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <div className="border-y border-[#c9a84c]/10 bg-[#0d1117] py-4 overflow-hidden">
        <div className="flex gap-16 whitespace-nowrap animate-[marquee_20s_linear_infinite]" style={{
          animation: "marquee 25s linear infinite",
        }}>
          {Array(3).fill(["Преміум водойми", "Актуальні ціни", "GPS навігація", "Склад риби", "Push сповіщення", "Вся Україна"]).flat().map((t, i) => (
            <span key={i} className="text-[#c9a84c]/40 text-xs tracking-[0.3em] uppercase shrink-0">
              ◆ {t}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ GALLERY ═══ */}
      <section className="max-w-6xl mx-auto px-6 py-24 w-full">
        <FadeUp>
          <div className="flex items-center gap-4 mb-3">
            <span className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase">Атмосфера</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#f0ebe0] mb-16">
            Природа, що надихає
          </h2>
        </FadeUp>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {galleryPhotos.map((p, i) => (
            <FadeUp key={p.id} delay={i * 0.1}>
              <div className="group relative aspect-[3/4] overflow-hidden">
                <Image
                  src={`https://images.unsplash.com/photo-${p.id}?w=600&q=80&fit=crop`}
                  alt={p.label}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#07090d]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[#c9a84c] text-xs tracking-widest uppercase">{p.label}</span>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ═══ STORY ═══ */}
      <section id="story" className="bg-[#0d1117] border-y border-[#c9a84c]/10">
        <div className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
          <SlideLeft>
            <span className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase block mb-4">Наша історія</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#f0ebe0] leading-tight mb-8">
              Ми зробили це,{" "}
              <em className="text-[#c9a84c] not-italic">бо самі шукали</em>{" "}
              де рибалити
            </h2>
            <p className="text-[#7a7060] text-lg leading-relaxed mb-6">
              По форумах, чатах, знайомих. Кожен раз це займало більше часу, ніж сама риболовля. Тому ми зібрали всі платні водойми України в одному місці.
            </p>
            <p className="text-[#7a7060] leading-relaxed mb-10">
              Актуальні ціни, склад риби, графік роботи, точні координати — все перевірено особисто.
            </p>
            <div className="inline-block border border-[#c9a84c]/30 px-6 py-4">
              <p className="font-serif text-2xl text-[#c9a84c] italic">
                "Чи варто їхати сюди зараз?"
              </p>
            </div>
          </SlideLeft>

          <SlideRight delay={0.1}>
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src={STORY_PHOTO}
                alt="Рибальське озеро"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c]/10 to-transparent" />
              {/* Corner decoration */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t border-l border-[#c9a84c]/50" />
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b border-r border-[#c9a84c]/50" />
            </div>
          </SlideRight>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="max-w-6xl mx-auto px-6 py-24 w-full">
        <FadeUp className="text-center mb-20">
          <span className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase block mb-4">Можливості</span>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#f0ebe0]">
            Все для ідеальної рибалки
          </h2>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-px bg-[#c9a84c]/10">
          {[
            { icon: "🗺️", title: "Карта та навігація",  desc: "Google Maps і Waze — одним натиском. Ніколи не заблукаєш до озера.", num: "01" },
            { icon: "🐟", title: "Риба та ціни",        desc: "Актуальні прайси, норми вилову, повний склад риби для кожної водойми.", num: "02" },
            { icon: "🔔", title: "Push сповіщення",     desc: "Новини від улюблених озер — акції, зариблення, зміни цін миттєво.", num: "03" },
          ].map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.15}>
              <div className="group bg-[#0d1117] p-10 hover:bg-[#141b24] transition-colors duration-300 cursor-default">
                <div className="font-serif text-6xl text-[#c9a84c]/10 font-bold mb-6 group-hover:text-[#c9a84c]/20 transition-colors">
                  {f.num}
                </div>
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="font-serif text-xl font-bold text-[#f0ebe0] mb-3">{f.title}</h3>
                <p className="text-[#7a7060] leading-relaxed text-sm">{f.desc}</p>
                <div className="mt-6 w-8 h-px bg-[#c9a84c]/40 group-hover:w-16 transition-all duration-300" />
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ═══ FULL-WIDTH PHOTO ═══ */}
      <section className="relative h-[60vh] overflow-hidden">
        <Image
          src={FEATURE_PHOTO}
          alt="Лісова водойма"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#07090d]/70" />
        <ScaleIn className="absolute inset-0 flex items-center justify-center text-center px-6">
          <div>
            <p className="text-[#c9a84c] text-xs tracking-[0.4em] uppercase mb-6">Наш підхід</p>
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-[#f0ebe0] max-w-3xl leading-tight">
              Для нас риболовля — це не точка на карті
            </h2>
            <p className="text-[#7a7060] text-xl mt-6">Це розуміння місця, часу і умов.</p>
          </div>
        </ScaleIn>
      </section>

      {/* ═══ APP MOCKUP ═══ */}
      <section className="max-w-6xl mx-auto px-6 py-24 w-full">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <FadeUp>
            <span className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase block mb-4">Мобільний застосунок</span>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#f0ebe0] leading-tight mb-6">
              Завжди під рукою
            </h2>
            <p className="text-[#7a7060] leading-relaxed mb-10">
              Каталог озер, Push-сповіщення, офлайн-доступ та зручний пошук — все в кишені. Перший в Україні застосунок для платної риболовлі.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/ozera-release.apk"
                className="group inline-flex items-center gap-3 px-8 py-4 bg-[#c9a84c] hover:bg-[#e8d5a3] text-[#07090d] font-semibold text-sm tracking-widest uppercase transition-all duration-300 hover:-translate-y-0.5"
              >
                📱 Android APK
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <span className="inline-flex items-center gap-2 px-8 py-4 border border-[#c9a84c]/10 text-[#7a7060] text-sm tracking-widest uppercase cursor-not-allowed">
                🍎 iOS — незабаром
              </span>
            </div>
          </FadeUp>

          <SlideRight>
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 -m-10 bg-[#c9a84c]/5 rounded-full blur-3xl" />
                <div className="phone-float relative w-[230px] bg-[#0d1117] rounded-[42px] shadow-2xl border border-[#c9a84c]/20 flex flex-col overflow-hidden" style={{ height: 460 }}>
                  <div className="flex justify-center pt-3 pb-1">
                    <div className="w-20 h-5 bg-[#07090d] rounded-full" />
                  </div>
                  <div className="flex-1 bg-[#07090d] mx-2 mb-2 rounded-[32px] overflow-hidden flex flex-col">
                    <div className="bg-[#0d1117] px-3 py-2.5 flex items-center justify-between border-b border-[#c9a84c]/10">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-lg bg-[#c9a84c]/20 flex items-center justify-center text-[9px]">🎣</div>
                        <span className="text-[9px] font-bold text-[#c9a84c]">OZERA</span>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-[#c9a84c]/10 flex items-center justify-center text-[8px]">📍</div>
                    </div>
                    <div className="px-2.5 pt-2 pb-1">
                      <div className="bg-[#0d1117] rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 border border-[#c9a84c]/10">
                        <span className="text-[9px]">🔍</span>
                        <span className="text-[9px] text-[#7a7060]">Пошук озера...</span>
                      </div>
                    </div>
                    <div className="px-2.5 flex flex-col gap-1.5 pb-2 flex-1 overflow-hidden">
                      {lakeMocks.map((lake) => (
                        <div key={lake.name} className="bg-[#0d1117] rounded-xl overflow-hidden flex border border-[#c9a84c]/10">
                          <div className={`w-12 ${lake.color} flex-shrink-0 flex items-center justify-center text-base opacity-80`}>🌊</div>
                          <div className="px-2 py-1.5 flex flex-col gap-0.5 min-w-0">
                            <span className="text-[8px] font-bold text-[#f0ebe0] truncate">{lake.name}</span>
                            <span className="text-[7px] text-[#7a7060] truncate">📍 {lake.region}</span>
                            <span className="text-[7px] text-[#c9a84c]/70 truncate">🐟 {lake.fish}</span>
                            <span className="text-[7px] font-semibold text-[#c9a84c] bg-[#c9a84c]/10 px-1 rounded w-fit">{lake.price}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-[#0d1117] border-t border-[#c9a84c]/10 px-4 py-2 flex justify-around">
                      {["🏠", "🗺️", "❤️", "👤"].map((icon) => (
                        <span key={icon} className="text-sm opacity-60">{icon}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="badge-float absolute -bottom-4 -left-10 bg-[#c9a84c] text-[#07090d] text-xs font-bold px-3.5 py-2 whitespace-nowrap shadow-xl shadow-[#c9a84c]/20">
                  🐟 {count}+ озер
                </div>
                <div className="notif-float absolute -top-3 -right-12 bg-[#0d1117] border border-[#c9a84c]/20 px-3 py-2 flex items-center gap-2 shadow-xl">
                  <span className="text-sm">🔔</span>
                  <div>
                    <div className="text-[10px] font-bold text-[#f0ebe0]">Нове озеро!</div>
                    <div className="text-[9px] text-[#c9a84c]">Київська обл.</div>
                  </div>
                </div>
              </div>
            </div>
          </SlideRight>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section id="download" className="relative overflow-hidden border-t border-[#c9a84c]/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c]/5 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-6 py-24 relative text-center">
          <ScaleIn>
            <p className="text-[#c9a84c] text-xs tracking-[0.4em] uppercase mb-6">Починай зараз</p>
            <h2 className="font-serif text-4xl md:text-6xl font-bold text-[#f0ebe0] mb-6 max-w-2xl mx-auto leading-tight">
              Знайди своє ідеальне місце
            </h2>
            <p className="text-[#7a7060] text-lg mb-12 max-w-md mx-auto">
              Якщо ти був на озері — поділись інформацією. Це допоможе іншим не витрачати час.
            </p>
            <a
              href="mailto:info@ozera.app"
              className="group inline-flex items-center gap-3 px-10 py-5 border border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#07090d] font-semibold text-sm tracking-widest uppercase transition-all duration-300"
            >
              Написати нам
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </ScaleIn>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-[#c9a84c]/10 bg-[#07090d]">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="font-serif text-xl text-[#c9a84c]">OZERA</span>
            <span className="text-[#7a7060] text-xs">© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/lakes" className="text-[#7a7060] hover:text-[#c9a84c] text-sm transition-colors tracking-widest uppercase">Каталог</Link>
            <a href="mailto:info@ozera.app" className="text-[#7a7060] hover:text-[#c9a84c] text-sm transition-colors tracking-widest uppercase">Контакт</a>
          </div>
          <p className="text-[#7a7060]/40 text-xs">Photo: Unsplash</p>
        </div>
      </footer>
    </main>
  );
}
