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
            Остання редакція: квітень 2025
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
                Закону України «Про захист персональних даних» (№ 2297-VI від 01.06.2011) та вимог GDPR.
              </p>
              <p>
                Використовуючи наш сайт або мобільний додаток, ви погоджуєтесь з умовами цієї Політики.
              </p>
            </LegalSection>

            <LegalSection title="2. Які дані ми збираємо">
              <SubTitle>Автоматично (технічні дані)</SubTitle>
              <ul>
                <li>IP-адреса та приблизне географічне розташування</li>
                <li>Тип браузера, операційна система, тип пристрою</li>
                <li>Сторінки, які ви відвідуєте, час та тривалість перегляду</li>
                <li>Джерело переходу (пошуковик, посилання, соцмережі)</li>
              </ul>
              <SubTitle>За вашим запитом</SubTitle>
              <ul>
                <li>
                  <strong>Геолокація</strong> — лише якщо ви явно дозволили доступ у браузері.
                  Використовується виключно для відображення найближчих озер та погодних умов на місці.
                  Ми не зберігаємо координати постійно.
                </li>
              </ul>
              <SubTitle>Від власників водойм (партнерів)</SubTitle>
              <ul>
                <li>Назва та опис водойми, фотографії, ціни, контакти</li>
                <li>Ця інформація публічна і відображається у каталозі</li>
              </ul>
            </LegalSection>

            <LegalSection title="3. Навіщо ми використовуємо дані">
              <ul>
                <li>Відображення актуальних погодних умов та AI-порад для рибалки (через Open-Meteo API)</li>
                <li>Персоналізований підбір озер за регіоном, видом риби та умовами кльову</li>
                <li>Покращення функціональності сайту та мобільного додатку</li>
                <li>Агрегована (знеособлена) аналітика відвідуваності для розвитку сервісу</li>
                <li>Попередження зловживань та забезпечення безпеки платформи</li>
              </ul>
              <p>
                Ми <strong>не продаємо</strong> та <strong>не передаємо</strong> ваші персональні дані третім
                особам у маркетингових цілях.
              </p>
            </LegalSection>

            <LegalSection title="4. Файли cookie">
              <p>
                OZERA використовує файли cookie для забезпечення коректної роботи сервісу:
              </p>
              <ul>
                <li>
                  <strong>Технічні cookie</strong> — необхідні для роботи сайту (сесія, налаштування фільтрів).
                  Видаляються після закриття браузера або через 30 днів.
                </li>
                <li>
                  <strong>Аналітичні cookie</strong> — використовуються лише за вашою згодою для розуміння
                  поведінки користувачів (без ідентифікації особи).
                </li>
              </ul>
              <p>
                Ви можете відключити або видалити cookie в налаштуваннях будь-якого браузера (Chrome, Safari,
                Firefox, Edge тощо). Деякі функції сайту можуть працювати некоректно без cookie.
              </p>
            </LegalSection>

            <LegalSection title="5. Треті сторони та зовнішні сервіси">
              <p>Для роботи платформи ми використовуємо перевірені зовнішні сервіси:</p>
              <ul>
                <li>
                  <strong>Open-Meteo</strong> (open-meteo.com) — прогноз погоди. Передаються лише координати
                  точки (широта / довгота), без особистих даних.
                </li>
                <li>
                  <strong>Google Maps</strong> — відображення карт, маршрутів та місцезнаходження озер.
                  На використання Google Maps поширюється{" "}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--blue-accent)" }}>
                    Політика конфіденційності Google
                  </a>.
                </li>
                <li>
                  <strong>Vercel</strong> — хостинг сайту. Дотримується стандартів ISO 27001 та GDPR.
                </li>
                <li>
                  <strong>Supabase</strong> — хмарна база даних (сервери в ЄС). Дотримується GDPR.
                </li>
              </ul>
            </LegalSection>

            <LegalSection title="6. Зберігання та захист даних">
              <ul>
                <li>Технічні логи зберігаються не довше 30 днів</li>
                <li>Дані передаються через захищені з’єднання HTTPS</li>
                <li>Доступ до даних мають лише уповноважені члени команди OZERA</li>
                <li>
                  Інформація про водойми (публічний контент) зберігається на весь час дії партнерської угоди
                </li>
              </ul>
            </LegalSection>

            <LegalSection title="7. Ваші права">
              <p>Відповідно до законодавства України ви маєте право:</p>
              <ul>
                <li>Отримати інформацію про те, які ваші дані ми зберігаємо</li>
                <li>Вимагати виправлення або видалення ваших даних</li>
                <li>Відкликати згоду на обробку персональних даних</li>
                <li>Подати скаргу до Уповноваженого Верховної Ради України з прав людини</li>
              </ul>
              <p>
                Для реалізації ваших прав зверніться до нас: <Email />
              </p>
            </LegalSection>

            <LegalSection title="8. Діти">
              <p>
                OZERA не призначена для дітей молодше 13 років. Ми свідомо не збираємо персональні дані
                неповнолітніх. Якщо ви вважаєте, що дитина надала нам свої дані — зверніться до нас, і ми
                видалимо їх якнайшвидше.
              </p>
            </LegalSection>

            <LegalSection title="9. Зміни до Політики">
              <p>
                Ми можемо оновлювати цю Політику. Про суттєві зміни повідомляємо через сайт або push-сповіщення
                (якщо ввімкнено). Дата останньої редакції вказана на початку документу.
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
