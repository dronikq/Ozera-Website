import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import LakeSubmitForm from "./LakeSubmitForm";
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
      <nav className="dk-nav">
        <div className="dk-nav-inner">
          <Link href="/" className="dk-logo">
            <Image src="/icon.png" alt="OZERA" width={36} height={36} className="dk-logo-img" />
            <span>OZERA</span>
          </Link>
          <div className="dk-nav-breadcrumb">
            <Link href="/lakes">Каталог</Link>
            <span className="dk-nav-breadcrumb-sep">›</span>
            <span className="dk-nav-breadcrumb-cur">Додати озеро</span>
          </div>
        </div>
      </nav>

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
