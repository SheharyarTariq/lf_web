// Google Ads conversion helpers. The base gtag.js tag is loaded once in app/layout.tsx.

/**
 * Google Ads "App Download Click" conversion — the send_to value from the event
 * snippet provided for this account (AW-<account>/<conversion label>).
 */
const APP_DOWNLOAD_CONVERSION = "AW-18237111465/iMuvCOvJkcocEKn5kPhD";

/**
 * Fire the Google Ads "App Download Click" conversion.
 *
 * Call this from an onClick handler on any button/link that leads to an app
 * download. gtag sends the hit via navigator.sendBeacon, so it survives the
 * navigation that follows the click — unlike the raw Google snippet, we don't
 * need to delay the redirect with an event_callback (that pattern also breaks
 * cmd/ctrl-click and target="_blank"). No-ops safely if gtag isn't available
 * (server render, ad-blocker, or before the tag has loaded).
 */
export function reportAppDownloadConversion() {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", "conversion", { send_to: APP_DOWNLOAD_CONVERSION });
}
