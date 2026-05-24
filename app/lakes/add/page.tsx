import type { Metadata } from "next";
import AddLakePageClient from "./AddLakePageClient";
import "../lakes.css";

export const metadata: Metadata = {
  title: "Запропонувати озеро",
  description:
    "Поділіться інформацією про платне озеро, якого ще немає в каталозі OZERA. Ми перевіримо дані перед публікацією.",
  alternates: { canonical: "https://www.ozera.in.ua/lakes/add" },
  robots: { index: true, follow: true },
};

export default function AddLakePage() {
  return <AddLakePageClient />;
}
