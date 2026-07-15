import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PLAY_STORE_URL } from "@/config";
import { storeUrlForUserAgent } from "@/lib/device";

// Reached by scanning the QR code on the homepage (which is desktop-only and
// therefore scanned *from* a phone). We sniff the user-agent and forward to the
// correct store. Reading headers() opts this route into dynamic rendering, which
// is exactly what we want — it must never be statically cached.
//
// The UA → store mapping is shared with components/GetAppButton.tsx so the QR
// path and the button path can't drift apart.
export default async function DownloadApp() {
  const ua = (await headers()).get("user-agent") ?? "";

  // Desktop / unrecognized device (incl. iPadOS Safari reporting a Macintosh UA)
  // → Google Play listing, which renders fine in a desktop browser (matches the
  // Android Play badge).
  redirect(storeUrlForUserAgent(ua) ?? PLAY_STORE_URL);
}
