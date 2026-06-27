"use client";

import { useEffect, useState } from "react";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config";

const ANDROID_PACKAGE = "uk.co.laundryfree.app";

type Platform = "android" | "ios" | null;

function detectMobilePlatform(): Platform {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  // iOS Safari is handled natively via the apple-itunes-app meta tag — skip it here
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua);
  if (isIOS && !isSafari) return "ios";
  return null;
}

export default function SmartBanner() {
  const [platform, setPlatform] = useState<Platform>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("lf-banner-dismissed")) return;
    const p = detectMobilePlatform();
    if (p) {
      setPlatform(p);
      setVisible(true);
    }
  }, []);

  function dismiss() {
    sessionStorage.setItem("lf-banner-dismissed", "1");
    setVisible(false);
  }

  if (!visible) return null;

  // intent:// opens the app if installed on Android, else falls back to Play Store
  const androidHref = `intent://#Intent;package=${ANDROID_PACKAGE};action=android.intent.action.MAIN;category=android.intent.category.LAUNCHER;S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`;
  const href = platform === "android" ? androidHref : APP_STORE_URL;
  const label = platform === "android" ? "Open App" : "Get";

  return (
    <div className="flex items-center gap-3 bg-white border-b border-lf-border px-4 py-2.5 z-[100]">
      <button
        onClick={dismiss}
        aria-label="Dismiss app banner"
        className="text-[22px] leading-none text-muted shrink-0 p-1 -ml-1"
      >
        ×
      </button>
      <img
        src="/favicon.svg"
        alt=""
        aria-hidden
        width={40}
        height={40}
        className="rounded-[10px] shrink-0 border border-lf-border"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-dark leading-snug">Laundry Free</p>
        <p className="text-[11px] text-muted leading-snug">Free collection &amp; delivery</p>
      </div>
      <a
        href={href}
        className="shrink-0 bg-dark text-lime font-bold text-[12px] py-[6px] px-4 rounded-full no-underline"
        aria-label={`${label} — Laundry Free app`}
      >
        {label}
      </a>
    </div>
  );
}
