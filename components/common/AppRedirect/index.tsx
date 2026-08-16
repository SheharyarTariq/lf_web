"use client";

import Button from "@/components/common/Button";
import { useCallback, useEffect, useState } from "react";

import {
  ANDROID_PACKAGE,
  APP_SCHEME,
  APP_STORE_URL,
  PLAY_STORE_URL,
} from "@/config";
import { reportAppDownloadConversion } from "@/utils/gtag";

type Platform = "ios" | "android";

// How long to wait for the app to take over before giving up and sending the
// user to the store. Long enough for an installed app to foreground itself
// (which backgrounds this page and cancels the fallback), short enough that a
// user without the app isn't left watching a spinner.
const APP_OPEN_TIMEOUT_MS = 1200;

// A beat after the auto-attempt has had its chance, reveal the manual buttons.
const MANUAL_REVEAL_MS = APP_OPEN_TIMEOUT_MS + 400;

/**
 * The client half of the deep-link fallback (see components/DeepLinkFallback.tsx).
 *
 * This only ever runs when iOS Universal Links / Android App Links did NOT
 * intercept the URL — when the association works, the OS opens the app and this
 * page is never fetched. So by the time we're here, one of these is true: the
 * app isn't installed, the link was opened inside an in-app webview (Gmail,
 * Outlook) that ignores app links, or Android link verification is failing.
 * All three are handled: try to open the app, otherwise go to the store.
 */
export default function AppRedirect({ platform }: { platform: Platform }) {
  const [showManual, setShowManual] = useState(false);

  const openApp = useCallback(() => {
    // Derive the target from the live URL so one component serves every route
    // without params being threaded through the server:
    // "/verify-email?token=abc" -> "verify-email?token=abc" -> "laundryfree://verify-email?token=abc".
    // The path+query shapes match lf-app's linking config (app/app.tsx).
    const target =
      window.location.pathname.replace(/^\/+/, "") + window.location.search;

    if (platform === "android") {
      // Chrome resolves intent:// itself: opens the app when installed, else
      // navigates to browser_fallback_url — no timer needed. Naming the package
      // also forces the app open even when App Link verification is broken
      // (e.g. an assetlinks.json fingerprint that doesn't match Play signing).
      const intentUrl =
        `intent://${target}#Intent;scheme=${APP_SCHEME};package=${ANDROID_PACKAGE};` +
        `S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;
      window.location.replace(intentUrl);
      return;
    }

    // iOS has no intent:// equivalent, so we race: fire the custom scheme, and
    // if the page is still in the foreground after the timeout the app clearly
    // didn't open — send them to the App Store instead.
    let handedOff = false;
    const markHandedOff = () => {
      handedOff = true;
    };
    document.addEventListener("visibilitychange", markHandedOff);
    window.addEventListener("pagehide", markHandedOff);

    window.location.href = `${APP_SCHEME}://${target}`;

    window.setTimeout(() => {
      document.removeEventListener("visibilitychange", markHandedOff);
      window.removeEventListener("pagehide", markHandedOff);
      if (!handedOff && document.visibilityState === "visible") {
        reportAppDownloadConversion();
        window.location.replace(APP_STORE_URL);
      }
    }, APP_OPEN_TIMEOUT_MS);
  }, [platform]);

  useEffect(() => {
    openApp();

    // Inside in-app webviews both the scheme navigation and visibilitychange
    // are unreliable, so the tap-to-open buttons are the only dependable path.
    // They're always rendered (no hydration branch) and just faded in here.
    const timer = window.setTimeout(() => setShowManual(true), MANUAL_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [openApp]);

  const storeUrl = platform === "ios" ? APP_STORE_URL : PLAY_STORE_URL;

  return (
    <main className="flex-1 w-full flex flex-col items-center justify-center px-6 py-20 text-center">
      <div className="w-full max-w-[380px] flex flex-col items-center">
        <div
          className="mb-7 h-10 w-10 animate-spin rounded-full border-[3px] border-lf-border border-t-dark"
          aria-hidden="true"
        />

        <h1 className="text-[22px] font-semibold text-dark" aria-live="polite">
          Opening the Laundry Free app…
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          If nothing happens, the app may not be installed on this device.
        </p>

        <div
          className={`mt-8 flex w-full flex-col gap-3 transition-opacity duration-300 ${
            showManual ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <Button variant="bare"
            onClick={openApp}
            className="w-full rounded-full bg-lime px-6 py-3.5 text-[15px] font-semibold text-dark"
          >
            Open the app
          </Button>
          <a
            href={storeUrl}
            onClick={() => reportAppDownloadConversion()}
            className="w-full rounded-full border border-lf-border bg-white px-6 py-3.5 text-[15px] font-semibold text-dark"
          >
            Download the app
          </a>
        </div>
      </div>
    </main>
  );
}
