import Link from "next/link";
import Image from "next/image";
import { supabase, type Lake } from "@/lib/supabase";
import CatalogView from "./CatalogView";

async function getLakes(search: string, sort: string, region: string): Promise<Lake[]> {
  let query = supabase
    .from("lakes")
    .select("*");

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  if (region) {
    query = query.eq("city", region);
  }

  // Server-side ordering where possible
  if (sort === "name_asc" || sort === "" || !sort) {
    query = query.order("name", { ascending: true });
  } else if (sort === "newest") {
    query = query.order("updated_at", { ascending: false });
  } else {
    query = query.order("name", { ascending: true });
  }

  const { data, error } = await query.limit(200);
  if (error) console.error("getLakes error:", error.message);
  let lakes = (data ?? []) as unknown as Lake[];

  // Client-side price sort (nulls last)
  if (sort === "price_asc") {
    lakes = lakes.sort((a, b) => {
      if (a.price_uah == null && b.price_uah == null) return 0;
      if (a.price_uah == null) return 1;
      if (b.price_uah == null) return -1;
      return a.price_uah - b.price_uah;
    });
  } else if (sort === "price_desc") {
    lakes = lakes.sort((a, b) => {
      if (a.price_uah == null && b.price_uah == null) return 0;
      if (a.price_uah == null) return 1;
      if (b.price_uah == null) return -1;
      return b.price_uah - a.price_uah;
    });
  }

  return lakes;
}

export default async function LakesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; region?: string }>;
}) {
  const { q = "", sort = "name_asc", region = "" } = await searchParams;
  const lakes = await getLakes(q, sort, region);

  return (
    <main className="min-h-screen bg-[#f0f7ff]">
      {/* Nav */}
      <nav className="border-b border-blue-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icon.png" alt="до Ozera" width={36} height={36} className="rounded-xl" />
            <span className="font-bold text-[#0f2a4a]">до Ozera</span>
          </Link>
          <span className="text-sm text-slate-400">Каталог озер</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-1 mb-6">
          <h1 className="text-3xl font-bold text-[#0f2a4a]">Каталог озер</h1>
          <p className="text-slate-400">{lakes.length} озер знайдено</p>
        </div>

        {/* Search */}
        <form className="mb-6">
          <input
            name="q"
            defaultValue={q}
            placeholder="Пошук за назвою..."
            className="w-full max-w-md px-4 py-2.5 rounded-xl bg-white border border-blue-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-colors shadow-sm"
          />
        </form>

        <CatalogView lakes={lakes} total={lakes.length} />
      </div>
    </main>
  );
}

