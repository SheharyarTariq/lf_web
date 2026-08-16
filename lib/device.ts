import { APP_STORE_URL, PLAY_STORE_URL } from "@/config";

/**
 * Map a user-agent string to the store that device should be sent to, or null
 * for "not a device we ship an app for" — i.e. desktop, which gets the QR code
 * instead.
 *
 * Deliberately UA-only and free of browser globals so both server callers —
 * the /download-app route behind the QR code and DeepLinkFallback — share one
 * source of truth. If these regexes ever disagree the two paths silently
 * diverge.
 *
 * Known blind spot: iPadOS 13+ Safari reports a Macintosh UA and is
 * indistinguishable from a real Mac by UA alone. navigator.maxTouchPoints is
 * the only tell, and it doesn't exist on the server, so both callers treat an
 * iPad as desktop and send it to the Play listing, which renders fine in any
 * browser. The redesigned header no longer sniffs at click time: its "Get the
 * app" control scrolls to the download section, where both store badges are
 * offered directly.
 */
export function storeUrlForUserAgent(ua: string): string | null {
  if (/iPhone|iPad|iPod/i.test(ua)) return APP_STORE_URL;
  if (/Android/i.test(ua)) return PLAY_STORE_URL;
  return null;
}
