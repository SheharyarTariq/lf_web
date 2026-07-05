import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import PromoBar from "@/components/PromoBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.laundryfree.co.uk"),
  title: {
    default:
      "Laundry Free — Laundry Collection & Delivery in Epsom, Leatherhead & Ashtead | Free Pickup & Delivery",
    template: "%s | Laundry Free",
  },
  description:
    "Professional laundry service with FREE collection & delivery in Epsom, Leatherhead, Ashtead, Ewell & Fetcham, Surrey. Book through our app — we pick up, professionally clean & deliver your clothes back to your door. No hidden fees.",
  applicationName: "Laundry Free",
  keywords: [
    "laundry service",
    "laundry collection and delivery",
    "laundry Epsom",
    "laundry Leatherhead",
    "laundry Ashtead",
    "laundry Ewell",
    "laundry Fetcham",
    "laundry service Epsom",
    "laundry service Leatherhead",
    "laundry service Ashtead",
    "laundry service Ewell",
    "laundry service Fetcham",
    "laundry service Surrey",
    "Laundry Free",
    "free laundry collection",
    "free laundry delivery",
    "laundry pickup service",
    "wash and fold Epsom",
    "wash and fold Leatherhead",
    "professional laundry cleaning",
    "laundry near me",
    "laundry app UK",
    "laundry service KT17",
    "laundry service KT18",
    "laundry service KT21",
    "laundry service KT22",
    "laundrette Epsom",
    "laundrette Leatherhead",
    "clothes cleaning service Surrey",
    "door to door laundry service",
  ],
  authors: [{ name: "HQR LTD" }],
  creator: "HQR LTD",
  publisher: "HQR LTD",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon_io/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon_io/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/favicon_io/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://www.laundryfree.co.uk",
    siteName: "Laundry Free",
    title:
      "Laundry Free — Professional Laundry Collection & Delivery in Epsom, Leatherhead & Surrey",
    description:
      "Book a laundry pickup in Epsom, Leatherhead, Ashtead, Ewell or Fetcham. We professionally clean your clothes and deliver them back — collection & delivery always free. Download the app today.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Laundry Free — Free Laundry Collection & Delivery Service in Surrey, UK",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Laundry Free — Laundry Collection & Delivery in Epsom & Surrey",
    description:
      "Professional laundry service with FREE collection & delivery in Epsom, Leatherhead, Ashtead, Ewell & Fetcham. Book through our app.",
    images: ["/og-image.png"],
  },
  other: {
    "geo.region": "GB-SRY",
    "geo.placename": "Epsom, Surrey",
    "geo.position": "51.3360;-0.2680",
    ICBM: "51.3360, -0.2680",
    // iOS Safari reads this and renders a native "Open"/"Get" banner automatically
    "apple-itunes-app": "app-id=6763839907",
  },
};

// Explicit theme-color so iOS Safari doesn't sample the page to tint its chrome.
// Matches the dark header (--color-dark: #1A1A1A) so the status-bar strip blends
// into the nav instead of showing a light gap above it when scrolled.
export const viewport: Viewport = {
  themeColor: "#1A1A1A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.className}>
      {/* Flex column so the shared footer sticks to the bottom on short pages.
          The shell (PromoBar / Header / Footer) lives here and persists across
          client navigation — only {children} swaps, giving an SPA feel. */}
      <body className="min-h-screen flex flex-col">
        <PromoBar />
        <Header />
        {children}
        <Footer />
      </body>

      {/* Google Ads global site tag (gtag.js) — traffic attribution for Google Ads.
          Placed after </body> per the Next.js App Router pattern so it loads once
          and persists across client navigation. */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-18237111465"
        strategy="afterInteractive"
      />
      <Script id="google-ads-gtag" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'AW-18237111465');`}
      </Script>
    </html>
  );
}
