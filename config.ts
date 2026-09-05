export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  /* Publishable, so it is safe in the browser — it can only create tokens,
     never read or move money. It is read from the environment all the same,
     because it is the one line that decides whether the checkout takes real
     cards or test ones, and that must not be a code change. Unset, the
     Payment Element does not mount and the payment step says so. */
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
};

/**
 * Whether this build is the staging deployment (staging.laundryfree.co.uk).
 *
 * Only the staging Vercel project sets NEXT_PUBLIC_SITE_ENV, so an unset value
 * means production. The default is deliberately that way round: a variable
 * forgotten on staging costs an indexed test site, while the reverse — a
 * variable forgotten in production — would deindex the live site and stop
 * every Google Ads conversion. The cheap failure is the one that can happen.
 *
 * NEXT_PUBLIC_ rather than a server-only name because config.ts is imported by
 * client components for stripePublishableKey; a bare process.env.SITE_ENV
 * would read as undefined in the browser bundle and this would silently be
 * false there. Inlined at build time like the two values above, so the Vercel
 * variable must exist before the build runs — it is not a runtime switch.
 */
export const isStaging = process.env.NEXT_PUBLIC_SITE_ENV === "staging";

/**
 * Whether the auth modal offers Apple and Google sign-in. Off until real OAuth
 * is wired.
 *
 * A plain constant rather than an environment variable, deliberately, and it is
 * the one flag here that is not: `isStaging` is env-driven because ops must be
 * able to set it per deployment, whereas what this one reveals is a **mock**.
 * `signInWith` in the auth modal fabricates a name and an email and returns no
 * token, so anything flipping this on hands somebody a signed-in header whose
 * every subsequent call answers 401. That must take a code change and a review,
 * not a variable in a dashboard.
 *
 * Flipping it to true is therefore not integration. The provider endpoints do
 * exist — the mobile app already posts to `/login/google` and `/login/apple`
 * (lf-app/app/services/api/index.ts:276, :306) — so what is missing is the
 * frontend half. Wire those two, replace the mock, then flip this.
 */
export const SOCIAL_AUTH_ENABLED = false;

// App store links — IDs sourced from the lf-app mobile project
// (ascAppId in eas.json, android package in app.json).
export const APP_STORE_URL = "https://apps.apple.com/app/id6763839907";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=uk.co.laundryfree.app";

// Deep-link identity of the mobile app, mirrored from lf-app/app.json
// (`scheme` and `android.package`). Used by the smart app-redirect fallback
// (components/AppRedirect.tsx) to build `laundryfree://…` URLs and the Android
// `intent://…` URL. Keep in sync with app.json.
export const APP_SCHEME = "laundryfree";
export const ANDROID_PACKAGE = "uk.co.laundryfree.app";
