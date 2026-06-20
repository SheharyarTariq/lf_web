import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Laundry Free",
  description:
    "Book a pickup, we professionally clean your clothes, and deliver them back. Collection & delivery always free.",
  icons: {
    icon: [
      // Square — used by browsers for the tab icon.
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "32x32" },
      // Circle — declared larger so Google prefers it in search results
      // (Google tends to pick the largest icon; best-effort, not guaranteed).
      { url: "/favicon-circle.svg", type: "image/svg+xml", sizes: "192x192" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={poppins.className}>
      <body>{children}</body>
    </html>
  );
}
