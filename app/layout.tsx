import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const BASE_URL = "https://www.ozera.in.ua";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default: "OZERA — Платна риболовля в Україні | Каталог озер",
    template: "%s | OZERA",
  },
  description:
    "Каталог платних озер і водойм України для риболовлі. Ціни, види риб, графік роботи, контакти та навігація до 39+ озер по всій Україні.",
  keywords: [
    "платна риболовля Україна",
    "озера для риболовлі",
    "рибальські водойми",
    "платні водойми Київ",
    "де порибалити Україна",
    "каталог озер України",
    "рибалка озеро ціна",
    "платна риболовля Київська область",
  ],

  authors: [{ name: "OZERA", url: BASE_URL }],
  creator: "OZERA",

  openGraph: {
    type: "website",
    locale: "uk_UA",
    url: BASE_URL,
    siteName: "OZERA",
    title: "OZERA — Платна риболовля в Україні",
    description:
      "39+ платних озер України: ціни, риба, навігація. Знайди ідеальне місце для риболовлі за хвилину.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OZERA — Каталог озер України",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "OZERA — Платна риболовля в Україні",
    description: "39+ платних озер: ціни, риба, навігація одним кліком.",
    images: ["/og-image.png"],
  },

  alternates: {
    canonical: BASE_URL,
    languages: { "uk-UA": BASE_URL },
  },

  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },

  verification: {
    google: "zH1XGVT7d-Bt7-d3Dm30nBZctSY17GmJbhp9M3l8aK4",
  },
};

const GA_ID = "G-YKNYXFLN04";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={`${playfair.variable} ${inter.variable} h-full antialiased`}>
      <head>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
