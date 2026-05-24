import type { Metadata } from "next";
import { Suspense } from "react";
import LakesCatalogClient from "./LakesCatalogClient";
import "./lakes.css";

export const metadata: Metadata = {
  title: "Каталог озер — платна риболовля в Україні",
  description:
    "Знайди платне озеро для риболовлі поруч. Фільтри по регіону, виду риби та ціні. Актуальні ціни, графік роботи та навігація до кожного озера.",
  alternates: { canonical: "https://www.ozera.in.ua/lakes" },
  openGraph: {
    title: "Каталог платних озер України | OZERA",
    description:
      "40+ озер для риболовлі: ціни, риба, карта. Фільтруй по регіону та виду риби.",
    url: "https://www.ozera.in.ua/lakes",
  },
};

export default function LakesPage() {
  return (
    <Suspense fallback={null}>
      <LakesCatalogClient />
    </Suspense>
  );
}
