import { NextRequest, NextResponse } from "next/server";
import { slugifyLakeName } from "@/lib/lake-slug";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // Apex → www redirect (only when host is exactly ozera.in.ua, no www)
  if (host === "ozera.in.ua") {
    const wwwUrl = `https://www.ozera.in.ua${pathname}${request.nextUrl.search}`;
    return NextResponse.redirect(wwwUrl, { status: 308 });
  }

  const match = pathname.match(/^\/lakes\/([^/]+)$/);

  if (!match) {
    return NextResponse.next();
  }

  const segment = match[1];
  if (!UUID_RE.test(segment) || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.next();
  }

  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/lakes`);
    url.searchParams.set("select", "slug,name");
    url.searchParams.set("id", `eq.${segment}`);

    const response = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.next();
    }

    const lakes = (await response.json()) as Array<{ slug: string | null; name: string }>;
    const lake = lakes[0];
    if (!lake) {
      return NextResponse.next();
    }

    const canonicalSlug = lake.slug?.trim() || slugifyLakeName(lake.name);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = `/lakes/${canonicalSlug}`;
    return NextResponse.redirect(redirectUrl, 301);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|og-image.png).*)"],
};
