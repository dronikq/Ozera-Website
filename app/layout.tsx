import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
