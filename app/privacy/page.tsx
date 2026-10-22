import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import "../lakes/lakes.css";

export const metadata: Metadata = {
  title: "Політика конфіденційності | OZERA",
  description: "Як OZERA збирає, використовує та захищає ваші персональні дані.",
  alternates: { canonical: "https://www.ozera.in.ua/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <div className="dk-page">
      {/* ── NAV ── */}
      <nav className="dk-nav">
        <div className="dk-nav-inner">
          <Link href="/" className="dk-logo">
            <Image src="/icon.png" alt="OZERA" width={36} height={36} className="dk-logo-img" />
            <span>OZERA</span>
          </Link>
          <span className="dk-nav-label">Конфіденційність</span>
        </div>
      </nav>

      {/* ── HERO ── */}
      <div className="dk-lake-hero">
        <div className="dk-container">
          <div className="dk-breadcrumb">
            <Link href="/">Головна</Link>
            <span className="dk-breadcrumb-sep">/</span>
            <span className="dk-breadcrumb-cur">Конфіденційність</span>
          </div>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, margin: "0 0 8px" }}>
            Політика конфіденційності
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
            Остання редакція: 22 жовтня 2026 року
          </p>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ padding: "48px 0 80px" }}>
        <div className="dk-container">
          <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 36 }}>

            <LegalSection title="1. Загальні положення">
              <p>
                OZERA (ozera.in.ua) — безкоштовний онлайн-каталог платних рибальських водойм та баз відпочинку
                України. Ми поважаємо вашу приватність і зобов’язуємось захищати персональні дані відповідно до
                Закону України «Про захист персональних даних» та, коли він застосовується, Загального регламенту
                ЄС про захист даних (GDPR).
              </p>
              <p>
                Політика пояснює, які дані обробляються під час використання сайту та мобільного додатка і для чого.
              </p>
            </LegalSection>

            <LegalSection title="2. Які дані ми збираємо">
              <SubTitle>Дані сайту та аналітика</SubTitle>
              <ul>
                <li>
                  Сайт використовує Google Analytics, Vercel Analytics і Speed Insights. Вони можуть обробляти
                  відвідані сторінки, технічні характеристики браузера та пристрою, час відвідування, джерело
                  переходу й приблизне місцезнаходження. Google Analytics використовує cookie та подібні технології.
                </li>
                <li>
                  У версіях мобільного додатка, де ввімкнено аналітику натискань, можуть передаватися назва
                  екрана/маршруту, підпис або тип натиснутої кнопки, випадковий ідентифікатор сесії та час події.
                  Ці події не містять ідентифікатора облікового запису чи вмісту введених форм.
                  Сирі події зберігаються до 90 днів, після чого мають автоматично видалятися. Цей строк
                  починає діяти після застосування відповідної міграції до Supabase.
                </li>
              </ul>
              <SubTitle>Дані облікового запису та додатка</SubTitle>
              <ul>
                <li>
                  Якщо ви створюєте обліковий запис через Google або Apple, обробляються надані провайдером
                  дані профілю, зокрема ім’я та адреса електронної пошти.
                </li>
                <li>Збережені водойми, налаштування, створені вами поїздки та пов’язані з ними дані.</li>
                <li>Технічні дані пристрою та push-токен — якщо ви вмикаєте push-сповіщення.</li>
                <li>
                  <strong>Геолокація</strong> — після надання дозволу в браузері або операційній системі.
                  Вона використовується для пошуку найближчих водойм і погоди. Додаток зберігає останні координати
                  на пристрої, а для авторизованого користувача — також у профілі разом із точністю та часом
                  визначення. Дозвіл можна відкликати в налаштуваннях пристрою або браузера.
                </li>
              </ul>
              <SubTitle>Від власників водойм (партнерів)</SubTitle>
              <ul>
                <li>Назва й опис водойми, фотографії, ціни та контактні дані; ця інформація публічна в каталозі.</li>
              </ul>
            </LegalSection>

            <LegalSection title="3. Навіщо ми використовуємо дані">
              <ul>
                <li>Робота каталогу, облікового запису, збережених водойм і функцій поїздок</li>
                <li>Показ погоди та порад для риболовлі; для прогнозу передаються координати обраної водойми або місця</li>
                <li>Персоналізований підбір озер за регіоном, видом риби та умовами кльову</li>
                <li>Розуміння використання функцій і покращення сайту та додатка за допомогою аналітики</li>
                <li>Попередження зловживань та забезпечення безпеки платформи</li>
              </ul>
              <p>
                Ми не продаємо персональні дані та не передаємо їх третім особам для їхнього власного маркетингу.
                Постачальники, зазначені нижче, можуть обробляти дані для роботи своїх сервісів.
              </p>
            </LegalSection>

            <LegalSection title="4. Файли cookie">
              <p>
                Сайт використовує cookie та подібні технології для роботи сервісу й аналітики. Зокрема,
                Google Analytics завантажується на сайті та може використовувати аналітичні cookie. Наразі
                сайт не показує окремий банер керування згодою на ці cookie.
              </p>
              <ul>
                <li>
                  Ви можете видалити або заблокувати cookie в налаштуваннях браузера. Це може вплинути на роботу
                  окремих функцій сайту. Строк зберігання залежить від конкретного cookie та налаштувань сервісу.
                </li>
              </ul>
            </LegalSection>

            <LegalSection title="5. Треті сторони та зовнішні сервіси">
              <p>Для роботи платформи ми використовуємо перевірені зовнішні сервіси:</p>
              <ul>
                <li>
                  <strong>Open-Meteo та MET Norway (Yr.no)</strong> — постачальники прогнозу погоди. Їм передаються
                  координати місця, для якого запитується прогноз.
                </li>
                <li>
                  <strong>OpenStreetMap і CARTO</strong> — картографічні дані та тайли мапи. Якщо ви відкриваєте
                  зовнішнє посилання для навігації, відповідний сервіс (наприклад, Google Maps або Waze) обробляє
                  дані згідно зі своєю політикою. На Google Maps поширюється{" "}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--blue-accent)" }}>
                    Політика конфіденційності Google
                  </a>.
                </li>
                <li>
                  <strong>Vercel</strong> — хостинг сайту, аналітика та показники швидкодії.
                </li>
                <li>
                  <strong>Supabase</strong> — база даних, автентифікація та зберігання даних облікового запису.
                </li>
                <li><strong>Google та Apple</strong> — вхід до облікового запису, якщо ви обираєте цей спосіб.</li>
              </ul>
            </LegalSection>

            <LegalSection title="6. Зберігання та захист даних">
              <ul>
                <li>Дані зберігаються стільки, скільки потрібно для цілей їх обробки та виконання вимог закону.</li>
                <li>Сирі події аналітики натискань у мобільному додатку зберігаються до 90 днів після застосування відповідної міграції до Supabase.</li>
                <li>Після видалення облікового запису пов’язані з ним дані видаляються або знеособлюються, крім тих, які потрібно зберігати за законом.</li>
                <li>Строки зберігання технічних і аналітичних даних також залежать від налаштувань відповідних постачальників.</li>
                <li>Передавання даних між пристроєм і сервісами відбувається через HTTPS.</li>
              </ul>
            </LegalSection>

            <LegalSection title="7. Ваші права">
              <p>Ви можете звернутися до нас, щоб:</p>
              <ul>
                <li>Дізнатися, які ваші персональні дані обробляються, та отримати доступ до них</li>
                <li>Виправити або видалити дані, а також відкликати згоду там, де обробка ґрунтується на згоді</li>
                <li>Подати скаргу Уповноваженому Верховної Ради України з прав людини</li>
              </ul>
              <p>
                Для реалізації ваших прав зверніться до нас: <Email />
              </p>
            </LegalSection>

            <LegalSection title="8. Діти">
              <p>
                Сервіс не призначений для дітей. Якщо ви вважаєте, що дитина надала нам персональні дані,
                зверніться до нас за адресою нижче — ми розглянемо запит і вживемо належних заходів.
              </p>
            </LegalSection>

            <LegalSection title="9. Зміни до Політики">
              <p>
                Ми можемо оновлювати цю Політику. Актуальна редакція та дата її оновлення публікуються на цій
                сторінці. Якщо зміни цього потребують, повідомимо про них у сервісі.
              </p>
            </LegalSection>

            <LegalSection title="10. Контакти">
              <p>
                Якщо у вас є питання щодо конфіденційності або обробки персональних даних, зв’яжіться з нами:
              </p>
              <p><Email /></p>
            </LegalSection>

            {/* Footer links */}
            <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 24, flexWrap: "wrap" }}>
              <Link href="/terms" style={{ color: "var(--blue-accent)", fontSize: 14, textDecoration: "none" }}>
                Умови використання →
              </Link>
              <Link href="/" style={{ color: "var(--text-muted)", fontSize: 14, textDecoration: "none" }}>
                ← Повернутись на головну
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{
        fontSize: 18, fontWeight: 700, color: "var(--text-primary)",
        margin: "0 0 14px", paddingBottom: 10, borderBottom: "1px solid var(--border)"
      }}>
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.75, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </section>
  );
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontWeight: 600, color: "var(--text-primary)", margin: "8px 0 4px" }}>
      {children}
    </p>
  );
}

function Email() {
  return (
    <a href="mailto:ozeraapp@gmail.com" style={{ color: "var(--blue-accent)" }}>
      ozeraapp@gmail.com
    </a>
  );
}
