import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://www.ozera.in.ua";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Статичні сторінки
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/lakes`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Якщо env vars не налаштовані (наприклад, Preview-deploy без секретів) —
  // повертаємо лише статичні сторінки, щоб білд не падав.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return staticPages;
  }

  // Динамічні сторінки озер
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: lakes } = await supabase
      .from("lakes")
      .select("id, slug, updated_at")
      .order("created_at", { ascending: true });

    const lakePages: MetadataRoute.Sitemap = (lakes ?? []).map((lake) => ({
      url: `${BASE_URL}/lakes/${lake.slug ?? lake.id}`,
      lastModified: lake.updated_at ? new Date(lake.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...lakePages];
  } catch {
    return staticPages;
  }
}
