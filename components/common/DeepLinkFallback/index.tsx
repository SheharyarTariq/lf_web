import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AppRedirect from "@/components/common/AppRedirect";
import { APP_STORE_URL } from "@/config";
import { storeUrlForUserAgent } from "@/utils/device";

// Shared by every deep-link fallback route. These interstitials exist only to
// catch app links the OS didn't intercept — there's nothing here for a crawler,
// and /orders/{id} would otherwise invite indexing of per-user URLs.
export const deepLinkMetadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * The one page body behind every app deep-link path — /orders/[orderId],
 * /verify-email, /reset-password, /payment-methods/add and /payment-callback.
 * Those paths are declared in public/.well-known/apple-app-site-association and
 * mirrored in lf-app/app.json, but the association files only *authorise* the OS
 * to open the app; they don't redirect anyone. Without a route here, every link
 * the OS failed to intercept 404s — which is what users hitting the emailed
 * "Review" button without the app were seeing.
 *
 * When the association does work the OS opens the app and this never renders, so
 * this is purely the fallback path. Desktop can't run the app at all, so it gets
 * a server-side redirect (no interstitial flash) to the homepage download
 * section with its QR + store badges. Phones fall through to <AppRedirect/>.
 *
 * Reading headers() opts these routes into dynamic rendering — they must never
 * be cached. The UA → store mapping is shared with /download-app so the two
 * can't drift apart.
 */
export default async function DeepLinkFallback() {
  const ua = (await headers()).get("user-agent") ?? "";
  const storeUrl = storeUrlForUserAgent(ua);

  // Desktop / unrecognised device (incl. iPadOS Safari reporting a Macintosh UA
  // — maxTouchPoints, the only tell, doesn't exist server-side).
  if (!storeUrl) redirect("/#get-the-app");

  return (
    <AppRedirect platform={storeUrl === APP_STORE_URL ? "ios" : "android"} />
  );
}
