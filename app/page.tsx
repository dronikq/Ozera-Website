import Link from "next/link";
import Image from "next/image";
import { supabase, type Lake } from "@/lib/supabase";
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
    <main className="flex flex-col min-h-screen bg-[#0a1f38]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-[#0a1f38]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <Image src="/icon.png" alt="до Ozera" width={36} height={36} className="rounded-xl" />
            <span className="font-bold text-white">до Ozera</span>
          </Link>
          <div className="flex items-center gap-6">
            <a href="#about" className="text-sm text-white/50 hover:text-white font-medium transition-colors">
              Про нас
            </a>
            <Link href="/lakes" className="text-sm text-[#f5c842] hover:text-yellow-300 font-semibold transition-colors">
              Каталог озер
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-[600px] h-[400px] rounded-full bg-blue-500/10 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] rounded-full bg-[#f5c842]/5 blur-[100px]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-14 flex flex-col md:flex-row items-center gap-10 w-full">

          {/* Left: text */}
          <SlideLeft className="flex flex-col gap-5 flex-1 text-center md:text-left">
            <FadeUp delay={0.1}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium w-fit mx-auto md:mx-0 border border-white/10">
                <span className="relative flex h-2 w-2">
                  <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
                </span>
                {count} озер у базі
              </div>
            </FadeUp>

            <FadeUp delay={0.2}>
              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
                Знайди своє ідеальне місце для риболовлі
              </h1>
            </FadeUp>

            <FadeUp delay={0.3}>
              <p className="text-white/60 text-lg leading-relaxed">
                Актуальна інформація про озера України — ціни, риба, розклад та контакти.
              </p>
            </FadeUp>

            <FadeUp delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link
                  href="/lakes"
                  className="group px-7 py-3.5 rounded-2xl bg-[#f5c842] hover:bg-yellow-300 text-[#0a1f38] font-bold text-base transition-all duration-200 shadow-lg shadow-[#f5c842]/20 hover:shadow-[#f5c842]/40 hover:-translate-y-0.5"
                >
                  Переглянути озера <span className="group-hover:translate-x-1 inline-block transition-transform">→</span>
                </Link>
                <a
                  href="#download"
                  className="px-7 py-3.5 rounded-2xl border border-white/20 text-white/80 hover:border-white/40 hover:text-white font-semibold transition-all duration-200 hover:-translate-y-0.5"
                >
                  Скачати застосунок
                </a>
              </div>
            </FadeUp>

            <FadeUp delay={0.5}>
              <div className="flex flex-wrap gap-5 justify-center md:justify-start pt-2">
                {[
                  { icon: "📍", text: "Усі озера в одному місці з цінами та контактами" },
                  { icon: "📷", text: "Фото, види риб та умови лову" },
                  { icon: "🧭", text: "Навігація до озера в 1 натиск" },
                ].map((f) => (
                  <div key={f.icon} className="flex items-start gap-2 max-w-[160px] text-left">
                    <span className="text-lg mt-0.5 shrink-0">{f.icon}</span>
                    <span className="text-white/50 text-xs leading-relaxed">{f.text}</span>
                  </div>
                ))}
              </div>
            </FadeUp>
          </SlideLeft>

          {/* Right: Phone */}
          <SlideRight delay={0.3} className="flex-1 flex justify-center items-center select-none">
            <div className="relative phone-float">
              <div className="absolute inset-0 -m-12 rounded-[80px] bg-blue-500/20 blur-3xl" />
              <div className="absolute inset-0 -m-8 rounded-[60px] bg-[#f5c842]/10 blur-2xl" />

              <div
                className="relative w-[230px] bg-[#0f2a4a] rounded-[40px] shadow-2xl border-4 border-white/10 flex flex-col overflow-hidden"
                style={{ height: 460 }}
              >
                {/* Notch */}
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-16 h-5 bg-black/40 rounded-full flex items-center justify-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    <div className="w-1 h-1 rounded-full bg-white/10" />
                  </div>
                </div>

                {/* Screen */}
                <div className="flex-1 bg-[#f0f7ff] mx-2 mb-2 rounded-[30px] overflow-hidden flex flex-col">
                  {/* App header */}
                  <div className="bg-[#0f2a4a] px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-lg bg-[#f5c842] flex items-center justify-center text-[8px]">🎣</div>
                      <span className="text-[9px] font-bold text-white">до Ozera</span>
                    </div>
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px]">📍</div>
                  </div>

                  {/* Search */}
                  <div className="px-2.5 pt-2 pb-1 bg-white">
                    <div className="bg-[#f0f7ff] rounded-lg px-2 py-1.5 flex items-center gap-1.5 border border-blue-100">
                      <span className="text-[8px]">🔍</span>
                      <span className="text-[8px] text-slate-300">Пошук озера...</span>
                    </div>
                  </div>

                  {/* Lake cards */}
                  <div className="px-2.5 pt-1.5 flex flex-col gap-1.5 pb-2 flex-1 bg-white">
                    {[
                      { name: "Тихий Берег", region: "Київська обл.", fish: "Короп, Амур", price: "від 300 грн", bg: "bg-gradient-to-br from-orange-300 to-orange-500" },
                      { name: "Соснове Озеро", region: "Черкаська обл.", fish: "Щука, Карась, Лящ", price: "від 250 грн", bg: "bg-gradient-to-br from-emerald-400 to-teal-600" },
                      { name: "Дзеркальне", region: "Полтавська обл.", fish: "Короп, Білий амур", price: "від 280 грн", bg: "bg-gradient-to-br from-blue-400 to-blue-600" },
                    ].map((lake) => (
                      <div key={lake.name} className="bg-white rounded-xl overflow-hidden flex border border-blue-50 shadow-sm">
                        <div className={`w-14 ${lake.bg} flex-shrink-0 flex items-center justify-center text-xl`}>🌊</div>
                        <div className="px-2 py-1.5 flex flex-col gap-0.5 min-w-0">
                          <span className="text-[8px] font-bold text-[#0f2a4a] truncate">{lake.name}</span>
                          <span className="text-[7px] text-slate-400 flex items-center gap-0.5">📍 {lake.region}</span>
                          <span className="text-[6px] text-blue-500">🐟 {lake.fish}</span>
                          <span className="text-[7px] font-bold text-[#0a1f38] bg-[#f5c842] px-1.5 rounded w-fit">{lake.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom nav */}
                  <div className="bg-white border-t border-blue-50 px-4 py-2 flex justify-around">
                    {["🏠", "🗺️", "❤️", "👤"].map((icon) => (
                      <span key={icon} className="text-sm">{icon}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="badge-float absolute -bottom-3 -left-10 bg-[#f5c842] text-[#0a1f38] text-xs font-bold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap">
                🐟 {count} озер у базі
              </div>
              <div className="notif-float absolute -top-2 -right-12 bg-[#0f2a4a] border border-white/10 rounded-xl shadow-xl px-2.5 py-1.5 flex items-center gap-1.5">
                <span className="text-xs">🔔</span>
                <span className="text-[10px] font-medium text-white">Нове озеро!</span>
              </div>
            </div>
          </SlideRight>
        </div>
      </section>

      {/* ── ЯК БУЛО РАНІШЕ ── */}
      <section className="px-4 pb-6">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl p-8 md:p-10">
          <FadeUp>
            <h2 className="text-2xl font-bold text-[#0a1f38] mb-6">
              Як було раніше 🤕
            </h2>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {[
              "Годинами гуглити озера по районах",
              "Телефонувати щоб дізнатися ціну та рибу",
              "Їхати і дізнаватися що озеро закрите",
              "Збирати контакти по групах у Viber і Telegram",
              "Питати знайомих — і не отримувати відповіді",
            ].map((item, i) => (
              <FadeUp key={i} delay={i * 0.07}>
                <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4 flex flex-col gap-3">
                  <span className="text-red-400 text-lg font-bold">✗</span>
                  <p className="text-sm text-slate-600 leading-relaxed">{item}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── ЯК СТАЛО З OZERA ── */}
      <section className="px-4 pb-6">
        <div className="max-w-6xl mx-auto">
          <FadeUp>
            <h2 className="text-2xl font-bold text-white mb-6">
              Як стало з <span className="text-[#f5c842]">OZERA</span> ✨
            </h2>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { icon: "📍", title: "Всі озера в одному місці", sub: "одразу з цінами" },
              { icon: "🐟", title: "Фото, види риб", sub: "та графік роботи" },
              { icon: "🧭", title: "Навігація одним натиском —", sub: "Google Maps або Waze" },
              { icon: "🔔", title: "Push-сповіщення", sub: "від улюблених озер" },
              { icon: "🔄", title: "Постійно оновлювана", sub: "база по всій Україні" },
            ].map((item, i) => (
              <FadeUp key={i} delay={i * 0.07}>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col gap-3 hover:bg-white/10 transition-colors">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-white text-sm font-semibold leading-snug">{item.title}</p>
                    <p className="text-white/50 text-xs mt-0.5">{item.sub}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── ПОПУЛЯРНІ ОЗЕРА ── */}
      {popularLakes.length > 0 && (
        <section id="about" className="px-4 pb-6">
          <div className="max-w-6xl mx-auto">
            <FadeUp>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold text-white">Популярні озера</h2>
                <Link href="/lakes" className="text-sm text-[#f5c842] hover:text-yellow-300 font-medium transition-colors">
                  Переглянути всі озера →
                </Link>
              </div>
            </FadeUp>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {popularLakes.map((lake, i) => (
                <FadeUp key={lake.id} delay={i * 0.08}>
                  <Link
                    href={`/lakes/${lake.id}`}
                    className="group rounded-2xl overflow-hidden border border-white/10 bg-white/5 hover:border-[#f5c842]/40 hover:bg-white/10 transition-all duration-200"
                  >
                    <div className="h-40 overflow-hidden relative">
                      {lake.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={lake.image_url}
                          alt={lake.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-white/5">🌊</div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-1.5">
                      <p className="font-bold text-white text-sm group-hover:text-[#f5c842] transition-colors truncate">{lake.name}</p>
                      {lake.city && (
                        <p className="text-xs text-white/40 flex items-center gap-1">
                          <span>📍</span> {lake.city}
                        </p>
                      )}
                      {lake.fish_species && lake.fish_species.length > 0 && (
                        <p className="text-xs text-white/40 truncate">
                          🐟 {lake.fish_species.slice(0, 2).join(", ")}
                          {lake.fish_species.length > 2 ? ` +${lake.fish_species.length - 2}` : ""}
                        </p>
                      )}
                      {lake.price_uah && (
                        <span className="mt-1 inline-block bg-[#f5c842] text-[#0a1f38] text-[11px] font-bold px-2 py-0.5 rounded-lg w-fit">
                          від {lake.price_uah} грн
                        </span>
                      )}
                    </div>
                  </Link>
                </FadeUp>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── DOWNLOAD CTA ── */}
      <section id="download" className="px-4 pb-8 pt-2">
        <div className="max-w-6xl mx-auto">
          <FadeUp>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
              {/* Phone mini mockup */}
              <div className="shrink-0 relative">
                <div className="absolute inset-0 -m-4 rounded-full bg-[#f5c842]/10 blur-2xl" />
                <div className="relative w-[90px] h-[160px] bg-[#0f2a4a] rounded-[22px] border-2 border-white/10 flex flex-col overflow-hidden shadow-2xl">
                  <div className="flex justify-center pt-1.5">
                    <div className="w-8 h-2.5 bg-black/30 rounded-full" />
                  </div>
                  <div className="flex-1 bg-[#f0f7ff] mx-1 mb-1 rounded-[14px] overflow-hidden flex items-center justify-center">
                    <Image src="/icon.png" alt="OZERA" width={40} height={40} className="rounded-xl" />
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="flex flex-col gap-3 text-center md:text-left flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-white leading-snug">
                  Скачай додаток до<br />
                  <span className="text-[#f5c842]">і лови більше риби!</span>
                </h2>
                <p className="text-white/50 text-sm">
                  Обрані озера, push-сповіщення, офлайн-доступ та зручний пошук.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col gap-3 shrink-0">
                <a
                  href="/ozera-release.apk"
                  className="flex items-center gap-3 bg-white text-[#0a1f38] font-semibold px-5 py-3 rounded-2xl hover:bg-slate-100 transition-colors shadow-lg min-w-[180px]"
                >
                  <span className="text-2xl">🤖</span>
                  <div className="text-left">
                    <div className="text-[10px] text-slate-500 leading-none">Завантажити в</div>
                    <div className="text-sm font-bold">Google Play</div>
                  </div>
                </a>
                <span className="flex items-center gap-3 bg-white/10 border border-white/10 text-white/40 px-5 py-3 rounded-2xl cursor-not-allowed min-w-[180px]">
                  <span className="text-2xl">🍎</span>
                  <div className="text-left">
                    <div className="text-[10px] leading-none opacity-60">Незабаром в</div>
                    <div className="text-sm font-bold">App Store</div>
                  </div>
                </span>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-5 text-center text-white/30 text-sm">
        © {new Date().getFullYear()} до Ozera
      </footer>
    </main>
  );
}
