import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { APP_STORE_URL, PLAY_STORE_URL } from "@/config";

// Reached by scanning the QR code on the homepage (which is desktop-only and
// therefore scanned *from* a phone). We sniff the user-agent and forward to the
// correct store. Reading headers() opts this route into dynamic rendering, which
// is exactly what we want — it must never be statically cached.
export default async function DownloadApp() {
  const ua = (await headers()).get("user-agent") ?? "";

  if (/iPhone|iPad|iPod/i.test(ua)) {
    redirect(APP_STORE_URL);
  }

  if (/Android/i.test(ua)) {
    redirect(PLAY_STORE_URL);
  }

  // Desktop / unrecognized device (incl. iPadOS Safari reporting a Macintosh UA)
  // → homepage, where both store badges and the QR code are shown.
  redirect("/");
}
