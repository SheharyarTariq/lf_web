import { APP_STORE_URL, PLAY_STORE_URL } from "@/config";

/**
 * Map a user-agent string to the store that device should be sent to, or null
 * for "not a device we ship an app for" — i.e. desktop, which gets the QR code
 * instead.
 *
 * Deliberately UA-only and free of browser globals so the /download-app server
 * route (which reads the UA from the request header) and the client-side
 * GetAppButton (which reads navigator.userAgent) share one source of truth. If
 * these regexes ever disagree, the QR path and the button path silently diverge.
 *
 * Known blind spot: iPadOS 13+ Safari reports a Macintosh UA and is
 * indistinguishable from a real Mac by UA alone. navigator.maxTouchPoints is the
 * only tell, and it doesn't exist on the server — so callers running in the
 * browser layer that check on top. See components/GetAppButton.tsx.
 */
export function storeUrlForUserAgent(ua: string): string | null {
  if (/iPhone|iPad|iPod/i.test(ua)) return APP_STORE_URL;
  if (/Android/i.test(ua)) return PLAY_STORE_URL;
  return null;
}
