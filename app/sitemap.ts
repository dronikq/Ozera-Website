import { MetadataRoute } from "next";
import { supabase } from "@/lib/supabase";
import { getLakeRouteSlug } from "@/lib/lake-slug";

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
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/account-deletion`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // Динамічні сторінки озер
  try {
    const { data: lakes } = await supabase
      .from("lakes")
      .select("id, name, slug, updated_at")
      .order("created_at", { ascending: true });

    const lakePages: MetadataRoute.Sitemap = (lakes ?? []).map((lake) => ({
      url: `${BASE_URL}/lakes/${getLakeRouteSlug(lake)}`,
      lastModified: lake.updated_at ? new Date(lake.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...lakePages];
  } catch {
    return staticPages;
  }
}
