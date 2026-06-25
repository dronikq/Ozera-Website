import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

import "../lakes/lakes.css";

export const metadata: Metadata = {
  title: "Видалення акаунта OZERA",
  description: "Інструкція щодо видалення акаунта OZERA та пов’язаних користувацьких даних.",
  alternates: { canonical: "https://www.ozera.in.ua/account-deletion" },
  robots: { index: true, follow: true },
};

export default function AccountDeletionPage() {
  return (
    <div className="dk-page">
      <nav className="dk-nav">
        <div className="dk-nav-inner">
          <Link href="/" className="dk-logo">
            <Image src="/icon.png" alt="OZERA" width={36} height={36} className="dk-logo-img" />
            <span>OZERA</span>
          </Link>
          <span className="dk-nav-label">Видалення акаунта</span>
        </div>
      </nav>

      <div className="dk-lake-hero">
        <div className="dk-container">
          <div className="dk-breadcrumb">
            <Link href="/">Головна</Link>
            <span className="dk-breadcrumb-sep">/</span>
            <span className="dk-breadcrumb-cur">Видалення акаунта</span>
          </div>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, margin: "0 0 8px" }}>
            Видалення акаунта OZERA
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 18, lineHeight: 1.6, margin: 0, maxWidth: 760 }}>
            Користувачі OZERA можуть видалити свій акаунт і пов’язані з ним дані у застосунку або
            надіслати запит на видалення без доступу до застосунку.
          </p>
        </div>
      </div>

      <div style={{ padding: "48px 0 80px" }}>
        <div className="dk-container">
          <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 36 }}>
            <LegalSection title="Як видалити акаунт у застосунку">
              <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10 }}>
                <li>Відкрийте застосунок OZERA.</li>
                <li>Перейдіть у Кабінет / Профіль.</li>
                <li>Оберіть «Видалити акаунт».</li>
                <li>Підтвердьте видалення акаунта.</li>
                <li>Після підтвердження акаунт і пов’язані з ним дані будуть видалені або анонімізовані.</li>
              </ol>
            </LegalSection>

            <LegalSection title="Як запросити видалення без доступу до застосунку">
              <p>
                Якщо ви не маєте доступу до застосунку, надішліть запит на email:
              </p>
              <p>
                <a href="mailto:ozeraapp@gmail.com" style={{ color: "var(--blue-accent)" }}>
                  ozeraapp@gmail.com
                </a>
              </p>
              <p>У листі вкажіть:</p>
              <ul>
                <li>тему: «Видалення акаунта OZERA»;</li>
                <li>email, який використовувався для входу через Google або Apple;</li>
                <li>коротке підтвердження, що ви хочете видалити акаунт OZERA.</li>
              </ul>
              <p>
                <a
                  href="mailto:ozeraapp@gmail.com?subject=%D0%92%D0%B8%D0%B4%D0%B0%D0%BB%D0%B5%D0%BD%D0%BD%D1%8F%20%D0%B0%D0%BA%D0%B0%D1%83%D0%BD%D1%82%D0%B0%20OZERA"
                  className="oz-btn-primary"
                  style={{ width: "fit-content", marginTop: 4 }}
                >
                  Написати запит на видалення
                </a>
              </p>
            </LegalSection>

            <LegalSection title="Які дані видаляються">
              <p>
                Після підтвердження запиту ми видаляємо або анонімізуємо дані, пов’язані з акаунтом
                користувача, зокрема:
              </p>
              <ul>
                <li>профіль користувача;</li>
                <li>обрані озера;</li>
                <li>поїздки;</li>
                <li>учасників поїздок;</li>
                <li>витрати в поїздках;</li>
                <li>сповіщення;</li>
                <li>інші дані, пов’язані з акаунтом у сервісі OZERA.</li>
              </ul>
            </LegalSection>

            <LegalSection title="Які дані можуть тимчасово зберігатися">
              <p>
                Деякі технічні дані можуть зберігатися обмежений час, якщо це необхідно для безпеки
                сервісу, запобігання зловживанням, виконання юридичних вимог або роботи резервних копій.
                Такі дані не використовуються для активної роботи акаунта користувача.
              </p>
            </LegalSection>

            <LegalSection title="Строк обробки запиту">
              <p>
                Запити на видалення акаунта обробляються протягом розумного строку після підтвердження
                власника акаунта.
              </p>
            </LegalSection>

            <div
              style={{
                paddingTop: 16,
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: 24,
                flexWrap: "wrap",
              }}
            >
              <Link href="/privacy" style={{ color: "var(--blue-accent)", fontSize: 14, textDecoration: "none" }}>
                Політика конфіденційності →
              </Link>
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
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: "var(--text-primary)",
          margin: "0 0 14px",
          paddingBottom: 10,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {title}
      </h2>
      <div
        style={{
          fontSize: 15,
          lineHeight: 1.75,
          color: "var(--text-secondary)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {children}
      </div>
    </section>
  );
}
