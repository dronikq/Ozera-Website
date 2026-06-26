export const dynamic = "force-static";

const ASSET_LINKS = [
  {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.ozera.app",
      sha256_cert_fingerprints: [
        "AC:D3:E5:54:87:EE:74:21:14:B5:6A:AE:80:DF:FD:25:D3:6A:D7:CE:B7:0E:31:A6:D8:27:22:16:AF:46:1B:7F",
        "8C:8C:43:71:D5:2E:70:E6:26:66:5F:CA:9E:E5:E9:1D:80:4B:F0:D8:42:9D:28:93:E2:B4:CC:20:50:9F:AC:8B",
      ],
    },
  },
];

export async function GET() {
  return new Response(JSON.stringify(ASSET_LINKS, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
