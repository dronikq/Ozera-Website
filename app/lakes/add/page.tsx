import type { Metadata } from "next";
import LakeSubmitForm from "./LakeSubmitForm";
import SiteHeader from "@/app/components/SiteHeader";
import "../lakes.css";

export const metadata: Metadata = {
  title: "Додати озеро — OZERA",
  description: "Запропонуйте нове озеро для каталогу платної риболовлі України.",
  alternates: { canonical: "https://www.ozera.in.ua/lakes/add" },
  robots: { index: true, follow: true },
};

export default function AddLakePage() {
  return (
    <div className="dk-page">
      <SiteHeader />

      <div className="dk-page-header">
        <div className="dk-container">
          <h1>Запропонувати озеро</h1>
          <p className="dk-page-subtitle">
            Знаєте озеро, якого немає в каталозі? Розкажіть нам — ми додамо його.
          </p>
        </div>
      </div>

      <div style={{ padding: "48px 0" }}>
        <div className="dk-container" style={{ maxWidth: 680 }}>
          <LakeSubmitForm />
        </div>
      </div>
    </div>
  );
}
