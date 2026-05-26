import type { Metadata } from "next";
import { Suspense } from "react";
import { supabase, type Lake } from "@/lib/supabase";
import { PUBLIC_LAKE_IMAGE_SELECT } from "@/lib/lake-image-resolver";
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

async function getInitialLakes(): Promise<Lake[]> {
  const { data, error } = await supabase
    .from("lakes")
    .select(`*, lake_images(${PUBLIC_LAKE_IMAGE_SELECT})`)
    .order("name", { ascending: true })
    .limit(200);
  if (error) console.error("getInitialLakes error:", error.message);
  return (data ?? []) as unknown as Lake[];
}

export default async function LakesPage() {
  const initialLakes = await getInitialLakes();
  return (
    <Suspense fallback={null}>
      <LakesCatalogClient initialLakes={initialLakes} />
    </Suspense>
  );
}
