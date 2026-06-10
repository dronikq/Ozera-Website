const AASA = {
  applinks: {
    details: [
      {
        appIDs: ["Y7J6X64KGQ.com.ozera.app"],
        components: [
          {
            "/": "/trips/invite/*",
            comment: "Trip invite links",
          },
        ],
      },
    ],
  },
};

export const dynamic = "force-static";

export async function GET() {
  return new Response(JSON.stringify(AASA, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
