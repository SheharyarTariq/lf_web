"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

import { APP_STORE_URL } from "@/config";
import { storeUrlForUserAgent } from "@/lib/device";
import { reportAppDownloadConversion } from "@/lib/gtag";

// The generic "get the app" CTA — for buttons where the user hasn't picked a
// store. Phones and tablets go straight to their store; desktop lands on the
// homepage hero download card, which shows a scannable QR (deliberately hidden
// under 600px — phones never need it, they go to the store directly).
//
// The store badges are a different thing and keep using ConversionLink: there
// the user has *chosen* a store, and Apple's/Google's badge guidelines require
// a badge to link to that specific store.
//
// Device detection happens at CLICK time, never at render — the markup has to be
// byte-identical on the server and the client or we'd hydration-mismatch. The
// href is always a real, working link, so this stays an <a> (not a <button>) and
// degrades gracefully without JS: a mobile user lands on the hero card, which
// still shows both store badges.
export default function GetAppButton({
  onClick,
  children,
  ...props
}: Omit<ComponentProps<"a">, "href">) {
  const pathname = usePathname();
  const onHome = pathname === "/";

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;

    // Fires on every click, desktop included. This is the same "app download
    // click intent" the header has always reported — dropping the desktop half
    // would put a cliff in the Google Ads conversion feed and degrade Smart
    // Bidding. It also closes a gap: the "25% off" CTA never tracked at all.
    reportAppDownloadConversion();

    // cmd/ctrl/shift-click → let the browser open the href its own way.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const ua = navigator.userAgent;
    // iPadOS 13+ Safari reports a Macintosh UA; maxTouchPoints is the only tell.
    const storeUrl =
      /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1
        ? APP_STORE_URL
        : storeUrlForUserAgent(ua);

    // Desktop → no store → let the anchor scroll to the QR card.
    if (!storeUrl) return;

    e.preventDefault();
    // assign(), not window.open(): a blocked popup returns null and leaves a
    // silently dead button, and _blank strands an orphan tab once the native
    // store app takes over. assign() can't be blocked from a user gesture and
    // leaves the site one back-tap away.
    window.location.assign(storeUrl);
  };

  // On the homepage a plain <a> does a real fragment navigation. next/link would
  // pushState instead, and pushState with an unchanged hash doesn't re-scroll —
  // so clicking a second time after scrolling away would do nothing. Off the
  // homepage there IS a route change, so Link earns its keep (no full reload).
  return onHome ? (
    <a {...props} href="#download" onClick={handleClick}>
      {children}
    </a>
  ) : (
    <Link {...props} href="/#download" onClick={handleClick}>
      {children}
    </Link>
  );
}
