import Link from "next/link";
import Image from "next/image";
import { supabase, type Lake } from "@/lib/supabase";
import Navbar from "./components/Navbar";
import { FadeUp, SlideLeft, SlideRight } from "./components/AnimatedSection";

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

export default async function HomePage() {
  const [count, popularLakes] = await Promise.all([getLakesCount(), getPopularLakes()]);

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
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: "https://www.ozera.in.ua/lakes?search={search_term_string}" },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "MobileApplication",
        name: "OZERA — Рибальські озера",
        operatingSystem: "Android",
        applicationCategory: "SportsApplication",
        offers: { "@type": "Offer", price: "0", priceCurrency: "UAH" },
        description: "Мобільний застосунок для пошуку платних озер України",
        url: "https://www.ozera.in.ua/ozera-release.apk",
      },
    ],
  };

  return (
    <main className="flex flex-col min-h-screen bg-[#f0f7ff]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      {/* Mobile nav */}
      <nav className="border-b border-blue-100 bg-white/80 backdrop-blur sticky top-0 z-50 md:hidden">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Image src="/icon.png" alt="до Ozera" width={36} height={36} className="rounded-xl" />
            <span className="font-bold text-[#0f2a4a]">до Ozera</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#about" className="text-sm text-slate-500 hover:text-[#0f2a4a] font-medium transition-colors">Про нас</a>
            <Link href="/lakes" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">Каталог</Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-14 flex flex-col md:flex-row items-center gap-10 w-full">
        {/* Text */}
        <SlideLeft className="flex flex-col gap-5 flex-1 text-center md:text-left">
          <FadeUp delay={0.1}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-sm font-medium w-fit mx-auto md:mx-0">
              <span className="relative flex h-2 w-2">
                <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              {count} озер у базі
            </div>
          </FadeUp>

          <FadeUp delay={0.2}>
            <h1 className="text-4xl md:text-5xl font-bold text-[#0f2a4a] leading-tight">
              Знайди своє ідеальне місце для риболовлі
            </h1>
          </FadeUp>

          <FadeUp delay={0.3}>
            <p className="text-slate-500 text-lg">
              Актуальна інформація про озера України — ціни, риба, розклад та контакти.
            </p>
            <p className="text-slate-400 text-sm mt-2">
              🐟 Короп, Амур, Щука, Судак &nbsp;•&nbsp; 💰 від 150 грн &nbsp;•&nbsp; 📍 по всій Україні
            </p>
          </FadeUp>

          <FadeUp delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link
                href="/lakes"
                className="group px-7 py-3.5 rounded-2xl bg-[#f5c842] hover:bg-[#e6ba35] text-[#0f2a4a] font-bold text-lg transition-all duration-200 shadow-md hover:shadow-xl hover:-translate-y-0.5"
              >
                Переглянути озера <span className="group-hover:translate-x-1 inline-block transition-transform">→</span>
              </Link>
              <a
                href="#download"
                className="px-7 py-3.5 rounded-2xl border-2 border-blue-200 hover:border-blue-400 text-blue-600 font-semibold transition-all duration-200 hover:-translate-y-0.5"
              >
                Скачати застосунок
              </a>
            </div>
          </FadeUp>

          {/* Quick stats */}
          <FadeUp delay={0.5}>
            <div className="flex gap-6 justify-center md:justify-start pt-1">
              {[
                { value: `${count}+`, label: "озер у базі" },
                { value: "10+", label: "областей" },
                { value: "0 грн", label: "використання" },
              ].map((s) => (
                <div key={s.label} className="text-center md:text-left">
                  <div className="text-xl font-bold text-[#0f2a4a]">{s.value}</div>
                  <div className="text-xs text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </FadeUp>
        </SlideLeft>

        {/* Phone mockup */}
        <SlideRight delay={0.3} className="flex-1 flex justify-center items-center select-none">
          <div className="relative phone-float">
            <div className="absolute inset-0 -m-10 rounded-[60px] bg-gradient-to-br from-blue-300/30 via-[#f5c842]/20 to-blue-200/20 blur-3xl" />
            <div className="relative w-[220px] bg-[#0f2a4a] rounded-[38px] shadow-2xl border-4 border-[#1a3a5c] flex flex-col overflow-hidden" style={{ height: 440 }}>
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-16 h-5 bg-[#0a1f38] rounded-full flex items-center justify-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#1a3a5c]" />
                  <div className="w-1 h-1 rounded-full bg-[#243d56]" />
                </div>
              </div>
              <div className="flex-1 bg-[#f0f7ff] mx-2 mb-2 rounded-[28px] overflow-hidden flex flex-col">
                <div className="bg-white px-3 py-2.5 flex items-center justify-between border-b border-blue-100">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-lg bg-[#0f2a4a] flex items-center justify-center text-[8px]">🎣</div>
                    <span className="text-[9px] font-bold text-[#0f2a4a]">до Ozera</span>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-[8px]">📍</div>
                </div>
                <div className="px-2.5 pt-2 pb-1">
                  <div className="bg-white rounded-lg px-2 py-1.5 flex items-center gap-1.5 border border-blue-100">
                    <span className="text-[8px]">🔍</span>
                    <span className="text-[8px] text-slate-300">Пошук озера...</span>
                  </div>
                </div>
                <div className="px-2.5 flex flex-col gap-1.5 pb-2 flex-1">
                  {[
                    { name: "Тихий Берег", region: "Київська обл.", fish: "Короп, Амур", price: "від 300 грн", color: "bg-blue-400" },
                    { name: "Соснове Озеро", region: "Черкаська обл.", fish: "Щука, Карась", price: "від 250 грн", color: "bg-teal-400" },
                    { name: "Дзеркальне", region: "Полтавська обл.", fish: "Короп, Амур", price: "від 280 грн", color: "bg-indigo-400" },
                  ].map((lake) => (
                    <div key={lake.name} className="bg-white rounded-xl overflow-hidden flex border border-blue-50 shadow-sm">
                      <div className={`w-12 ${lake.color} flex-shrink-0 flex items-center justify-center text-lg`}>🌊</div>
                      <div className="px-2 py-1.5 flex flex-col gap-0.5 min-w-0">
                        <span className="text-[8px] font-bold text-[#0f2a4a] truncate">{lake.name}</span>
                        <span className="text-[7px] text-slate-400 truncate">📍 {lake.region}</span>
                        <span className="text-[6px] text-blue-400">🐟 {lake.fish}</span>
                        <span className="text-[7px] font-semibold text-[#0f2a4a] bg-[#f5c842]/30 px-1 rounded w-fit">{lake.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white border-t border-blue-100 px-4 py-2 flex justify-around">
                  {["🏠", "🗺️", "❤️", "👤"].map((icon) => (
                    <span key={icon} className="text-sm">{icon}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="badge-float absolute -bottom-3 -left-8 bg-[#f5c842] text-[#0f2a4a] text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg whitespace-nowrap">
              🐟 {count} озер у базі
            </div>
            <div className="notif-float absolute -top-2 -right-10 bg-white border border-blue-100 rounded-xl shadow-lg px-2.5 py-1.5 flex items-center gap-1.5">
              <span className="text-xs">🔔</span>
              <span className="text-[10px] font-medium text-[#0f2a4a]">Нове озеро!</span>
            </div>
          </div>
        </SlideRight>
      </section>

      {/* ── FEATURES ── */}
      <section className="max-w-6xl mx-auto px-4 pb-14 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {[
          { icon: "🗺️", title: "Карта та навігація", desc: "Google Maps і Waze — натиснув і поїхав", delay: 0 },
          { icon: "🐟", title: "Риба та ціни",        desc: "Склад риби, ціни і норми вилову одразу", delay: 0.1 },
          { icon: "🔔", title: "Завжди актуально",    desc: "Свіжі новини та оновлення від озер", delay: 0.2 },
        ].map((f) => (
          <FadeUp key={f.title} delay={f.delay}>
            <div className="rounded-2xl border border-blue-100 bg-white p-5 flex flex-col gap-2.5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="font-bold text-[#0f2a4a]">{f.title}</h3>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </div>
          </FadeUp>
        ))}
      </section>

      {/* ── POPULAR LAKES ── */}
      {popularLakes.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pb-14 w-full">
          <FadeUp>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-[#0f2a4a]">Популярні озера</h2>
              <Link href="/lakes" className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors">
                Переглянути всі →
              </Link>
            </div>
          </FadeUp>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {popularLakes.map((lake, i) => (
              <FadeUp key={lake.id} delay={i * 0.08}>
                <Link
                  href={`/lakes/${lake.id}`}
                  className="group rounded-2xl border border-blue-100 bg-white overflow-hidden hover:border-blue-300 hover:shadow-lg transition-all duration-200"
                >
                  <div className="h-36 bg-blue-50 overflow-hidden relative">
                    {lake.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={lake.image_url}
                        alt={lake.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🌊</div>
                    )}
                    {lake.price_uah && (
                      <div className="absolute bottom-2 left-2 bg-[#f5c842] text-[#0f2a4a] text-[11px] font-bold px-2 py-0.5 rounded-lg">
                        від {lake.price_uah} грн
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-bold text-[#0f2a4a] text-sm group-hover:text-blue-600 transition-colors truncate">{lake.name}</p>
                    {lake.city && <p className="text-xs text-blue-500 mt-0.5">{lake.city}</p>}
                    {lake.fish_species && lake.fish_species.length > 0 && (
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        🐟 {lake.fish_species.slice(0, 2).join(", ")}
                        {lake.fish_species.length > 2 ? ` +${lake.fish_species.length - 2}` : ""}
                      </p>
                    )}
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>
        </section>
      )}

      {/* ── ABOUT (dark) ── */}
      <section id="about" className="bg-[#0a1f38] text-white overflow-hidden">

        {/* Hero quote */}
        <div className="relative border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#f5c842] text-xs font-semibold tracking-widest uppercase mb-6 block w-fit">
              Про нас
            </span>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight max-w-3xl">
              Ми зробили цей сервіс,{" "}
              <span className="text-[#f5c842]">бо самі постійно шукали,</span>{" "}
              де рибалити.
            </h2>
            <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[180px] font-black text-white/[0.03] select-none pointer-events-none leading-none" aria-hidden>
              🎣
            </span>
          </div>
        </div>

        {/* Story */}
        <div className="max-w-6xl mx-auto px-4 py-12">

          {/* Row 1 — the problem */}
          <div className="grid md:grid-cols-2 gap-12 items-center border-b border-white/10 pb-12 mb-12">
            <div>
              <p className="text-white/40 text-xs tracking-widest uppercase mb-4 font-semibold">01 — Початок</p>
              <p className="text-white/70 text-xl leading-relaxed">
                По форумах, чатах, знайомих.{" "}
                <span className="text-white font-medium">І кожен раз це займало більше часу, ніж сама риболовля.</span>
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              {["Форуми", "Viber-чати", "Знайомі знайомих", "Дзвінки наосліп", "Поїздка в нікуди"].map((item, i) => (
                <div key={item} className="flex items-center gap-4 text-white/40">
                  <span className="text-xs font-mono text-white/20 w-6">{String(i + 1).padStart(2, "0")}</span>
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-sm">{item}</span>
                  <span className="text-red-400/60 text-xs">×</span>
                </div>
              ))}
            </div>
          </div>

          {/* До / Після */}
          <div className="border-b border-white/10 pb-12 mb-12">
            <p className="text-white/40 text-xs tracking-widest uppercase mb-6 font-semibold">02 — До і після</p>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">😤</span>
                  <h3 className="text-lg font-bold text-white/80">Як було раніше</h3>
                </div>
                <ul className="flex flex-col gap-2.5 text-white/50 text-sm">
                  {[
                    "Годинами гуглити озера по районах",
                    "Телефонувати щоб дізнатися ціну та рибу",
                    "Їхати і дізнаватися що озеро закрите",
                    "Збирати контакти по групах у Viber і Telegram",
                    "Питати знайомих — і не отримувати відповіді",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-red-400 mt-0.5 shrink-0">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-[#f5c842]/30 bg-[#f5c842]/5 p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✨</span>
                  <h3 className="text-lg font-bold text-[#f5c842]">Як стало з OZERA</h3>
                </div>
                <ul className="flex flex-col gap-2.5 text-white/70 text-sm">
                  {[
                    "Всі озера в одному місці — одразу з цінами",
                    "Фото, склад риби та графік роботи",
                    "Навігація одним натиском — Google Maps або Waze",
                    "Push-сповіщення від улюблених озер",
                    "Постійно оновлювана база по всій Україні",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-[#f5c842] mt-0.5 shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Pull quote */}
          <div className="text-center pb-12 mb-12 border-b border-white/10">
            <p className="text-xs tracking-widest uppercase text-white/30 mb-4 font-semibold">03 — Ідея</p>
            <blockquote className="text-3xl md:text-4xl font-bold leading-tight max-w-3xl mx-auto">
              Тут ми зібрали платні озера,{" "}
              <br className="hidden md:block" />
              куди реально можна поїхати.{" "}
              <span className="text-white/30">Але це не просто список.</span>
            </blockquote>
          </div>

          {/* How + CTA */}
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-7 flex flex-col gap-4">
              <p className="text-white/40 text-xs tracking-widest uppercase font-semibold">04 — Як ми працюємо</p>
              {[
                { icon: "🔍", text: "Власний досвід виїздів" },
                { icon: "📡", text: "Перевірені рекомендації" },
                { icon: "🔄", text: "Постійне оновлення даних" },
                { icon: "📍", text: "Точна локація та навігація" },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="text-lg">{icon}</span>
                  <span className="text-white/70 text-sm">{text}</span>
                </div>
              ))}
            </div>
            <div className="bg-[#f5c842]/10 border border-[#f5c842]/30 rounded-2xl p-7 flex flex-col gap-4">
              <p className="text-[#f5c842]/60 text-xs tracking-widest uppercase font-semibold">05 — Допоможи</p>
              <p className="text-xl text-white font-medium leading-relaxed">
                Якщо ти був на озері — поділись інформацією.
              </p>
              <p className="text-white/50 leading-relaxed">
                Це допоможе іншим не витрачати час дарма.
              </p>
              <a
                href="mailto:info@ozera.app"
                className="mt-auto inline-flex items-center gap-2 bg-[#f5c842] text-[#0a1f38] font-bold px-5 py-3 rounded-xl text-sm w-fit hover:bg-yellow-300 transition-colors"
              >
                Написати нам →
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ── DOWNLOAD ── */}
      <section id="download" className="bg-white border-t border-blue-100">
        <div className="max-w-6xl mx-auto px-4 py-14 flex flex-col md:flex-row items-center gap-8">
          <Image src="/icon.png" alt="OZERA app" width={88} height={88} className="rounded-3xl shadow-lg" />
          <div className="flex flex-col gap-3 text-center md:text-left">
            <h2 className="text-2xl font-bold text-[#0f2a4a]">Мобільний застосунок</h2>
            <p className="text-slate-500 max-w-md">
              Обрані озера, push-сповіщення, офлайн-доступ та зручний пошук — все в кишені.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <a
                href="/ozera-release.apk"
                className="px-6 py-3 rounded-2xl bg-[#f5c842] hover:bg-[#e6ba35] text-[#0f2a4a] font-bold transition-colors shadow-md flex items-center gap-2 justify-center"
              >
                <span>📱</span> Android APK
              </a>
              <span className="px-6 py-3 rounded-2xl border-2 border-slate-200 text-slate-400 flex items-center gap-2 justify-center cursor-not-allowed">
                <span>🍎</span> iOS — незабаром
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-blue-100 py-5 text-center text-slate-400 text-sm bg-white">
        © {new Date().getFullYear()} до Ozera
      </footer>
    </main>
  );
}
