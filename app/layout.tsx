import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const GA_ID = "G-YKNYXFLN04";
import Footer from "./components/Footer";
import AppLaunchModal from "./components/AppLaunchModal";
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
    default: "Де порибалити в Україні — 39+ платних озер з цінами | OZERA",
    template: "%s | OZERA",
  },
  description:
    "Каталог платних озер і водойм України для риболовлі. Ціни, види риб, графік роботи, контакти та навігація до 39+ озер по всій Україні.",

  authors: [{ name: "OZERA", url: BASE_URL }],
  creator: "OZERA",

  icons: {
    icon: [
      { url: "/icon.png", type: "image/png", sizes: "any" },
    ],
    apple: [
      { url: "/icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icon.png",
  },

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
      <body className="min-h-full flex flex-col">
        <AppLaunchModal />
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');`}
        </Script>
      </body>
    </html>
  );
}
