import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import SmartBanner from "@/components/SmartBanner";

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://laundryfree.co.uk"),
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
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "48x48" },
    ],
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://laundryfree.co.uk",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.className}>
      <body>
        <SmartBanner />
        {children}
      </body>
    </html>
  );
}
