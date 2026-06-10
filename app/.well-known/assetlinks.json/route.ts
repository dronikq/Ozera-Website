export const dynamic = "force-static";

export async function GET() {
  // Placeholder until the release SHA-256 fingerprint is confirmed.
  return new Response("[]", {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
