import type { Metadata } from "next";
import type { SVGProps } from "react";
import LakeSubmitForm from "./LakeSubmitForm";
import SiteHeader from "@/app/components/SiteHeader";
import "../lakes.css";

export const metadata: Metadata = {
  title: "Додати озеро | OZERA",
  description:
    "Запропонуйте нове озеро для каталогу платної риболовлі України. Ми перевіримо інформацію та додамо водойму в OZERA.",
  alternates: { canonical: "https://www.ozera.in.ua/lakes/add" },
  robots: { index: true, follow: true },
};

function TrustIcon({ type }: { type: "check" | "shield" | "spark" }) {
  const common: SVGProps<SVGSVGElement> = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  if (type === "check") {
    return (
      <svg {...common} aria-hidden="true">
        <path d="m20 6-11 11-5-5" />
      </svg>
    );
  }

  if (type === "shield") {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  }

  return (
    <svg {...common} aria-hidden="true">
      <path d="M12 2l1.6 5.1L19 9l-5.4 1.9L12 16l-1.6-5.1L5 9l5.4-1.9L12 2Z" />
    </svg>
  );
}

const TRUST_ITEMS = [
  {
    icon: "check" as const,
    title: "Перевіряємо перед публікацією",
  },
  {
    icon: "shield" as const,
    title: "Не публікуємо ваш контакт",
  },
  {
    icon: "spark" as const,
    title: "Можна додати неповну інформацію",
  },
];

export default function AddLakePage() {
  return (
    <div className="dk-page dk-add-page">
      <SiteHeader />

      <main className="dk-add-shell">
        <div className="dk-container dk-add-shell__container">
          <section className="dk-add-hero">
            <span className="dk-add-hero__badge">Підкажіть водойму</span>
            <h1>Знаєте платне озеро, якого немає в каталозі?</h1>
            <p>
              Надішліть інформацію — ми перевіримо її та додамо озеро в OZERA.
              Можна залишити навіть неповні дані.
            </p>
          </section>

          <section className="dk-trust-grid" aria-label="Переваги подання озера">
            {TRUST_ITEMS.map((item) => (
              <div key={item.title} className="dk-trust-card oz-card">
                <span className={`dk-trust-card__icon dk-trust-card__icon--${item.icon}`} aria-hidden="true">
                  <TrustIcon type={item.icon} />
                </span>
                <p>{item.title}</p>
              </div>
            ))}
          </section>

          <section className="dk-add-form-card oz-card">
            <LakeSubmitForm />
          </section>
        </div>
      </main>
    </div>
  );
}
