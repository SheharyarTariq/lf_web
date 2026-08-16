"use client";

/* ══════════════════════════════════════════════════════════════════
   Stripe
   ══════════════════════════════════════════════════════════════════

   Card fields, Apple Pay, Google Pay, Link and the mandate wording all
   come from Stripe. Nothing card-shaped is rebuilt here — the details
   never touch our DOM, which is the whole point of the Element.

   Stripe.js is loaded from js.stripe.com rather than bundled: Stripe
   require it to be served from their domain, and bundling it voids PCI
   SAQ-A eligibility. It is fetched lazily on this screen instead of on
   every page, which costs a little fraud signal for a much lighter
   landing page — move it into the root layout if that trade is wrong.

   The Element mounts in deferred mode, so it renders before any server
   call exists. The single outstanding piece is a client secret:

   THE ONE THING THE BACKEND STILL OWES.
   POST /api/payment/setup-intent → { clientSecret }
   created with usage: "off_session", because the card is charged after
   the items are counted rather than now. Until it exists the Element
   renders and validates normally; only confirmation is unavailable.
   ══════════════════════════════════════════════════════════════════ */

import { cn } from "@/utils/cn";
import { useEffect, useRef, useState } from "react";
import { Icon, P } from "@/components/booking/icons";

/* Publishable, and safe in the repo — it can only create tokens, never
   read or move money. The secret key stays on the server. */
const STRIPE_PUBLISHABLE_KEY =
  "pk_test_51T8W3QKPvTKFbr4oTot03xLhxNwb6V34VpzXSgLL82lF9NJS57Y946diAZ5dtzcXyXWjNDIVr5ZwuffTvk9KGBe7006kEwSsMT";

const STRIPE_CURRENCY = "gbp";

/* The slice of Stripe.js this screen uses. Typed here rather than pulled
   from @stripe/stripe-js, which would be a dependency for four call
   signatures on a script we are required to load from their domain
   anyway. */
interface StripeChange {
  complete?: boolean;
  error?: { message?: string };
}
interface StripeElement {
  on: (event: string, handler: (e: StripeChange) => void) => void;
  mount: (node: HTMLElement | null) => void;
  destroy?: () => void;
}
interface StripeElements {
  create: (type: string, options: Record<string, unknown>) => StripeElement;
}
interface StripeInstance {
  elements: (options: Record<string, unknown>) => StripeElements;
}
type StripeCtor = (key: string) => StripeInstance;

declare global {
  interface Window {
    Stripe?: StripeCtor;
  }
}

let stripeJsPromise: Promise<StripeCtor | null> | null = null;

export function loadStripeJs(): Promise<StripeCtor | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.Stripe) return Promise.resolve(window.Stripe);
  if (stripeJsPromise) return stripeJsPromise;
  stripeJsPromise = new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = "https://js.stripe.com/v3/";
    el.async = true;
    el.onload = () => resolve(window.Stripe ?? null);
    el.onerror = () => reject(new Error("stripe-js-failed"));
    document.head.appendChild(el);
  });
  return stripeJsPromise;
}

/* Stripe's Appearance API takes our own tokens, so the Element does not
   look like a bolted-on iframe. Read from the live custom properties
   rather than hardcoded, so retheming the site rethemes the Element.
   The design read them off `.lfb`; here they are `@theme` tokens and
   live on :root under their `--color-bk-*` names. */
function stripeAppearance() {
  const css = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) =>
    (css.getPropertyValue(name) || fallback).trim();
  const ink = v("--color-bk-ink", "#1F1F1F");
  const line2 = v("--color-bk-line-2", "#DCDCDC");
  return {
    theme: "stripe",
    variables: {
      fontFamily: "'Poppins', sans-serif",
      colorPrimary: ink,
      colorText: ink,
      colorTextSecondary: v("--color-bk-ink-2", "#5A5A5A"),
      colorTextPlaceholder: v("--color-bk-ink-3", "#6D6D6D"),
      colorBackground: "#FFFFFF",
      colorDanger: v("--color-danger", "#B3261E"),
      borderRadius: "16px",
      spacingUnit: "4px",
      fontSizeBase: "15px",
    },
    rules: {
      ".Input": {
        border: `1.5px solid ${line2}`,
        boxShadow: "none",
        padding: "13px 15px",
      },
      ".Input:focus": {
        border: `1.5px solid ${ink}`,
        boxShadow: "0 0 0 3px rgba(20,20,15,.08)",
      },
      ".Label": { fontWeight: "600", fontSize: "14px", marginBottom: "7px" },
      ".Tab": { border: `1.5px solid ${line2}`, boxShadow: "none" },
      ".Tab--selected": { borderColor: ink, boxShadow: "none" },
    },
  };
}

/* Stripe's own frame sits inside this — matched to our field styling so
   the seam is not obvious, but nothing inside it is ours. No border of
   our own: Stripe draws its own fields, and wrapping them in a second
   box reads as a form inside a form. */
const STATE = "flex items-start gap-[9px] py-4 text-[14px]";

export default function StripePayment({
  onCompleteChange,
}: {
  onCompleteChange: (complete: boolean) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    /* StrictMode mounts effects twice in development; without this the
       Element is created and mounted twice into the same node. */
    if (mounted.current) return undefined;
    mounted.current = true;
    let element: StripeElement | null = null;
    let cancelled = false;

    loadStripeJs()
      .then((Stripe) => {
        if (cancelled || !Stripe) return;
        const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
        /* Deferred mode: no client secret needed to render. The intent is
           created at confirmation time instead. */
        const elements = stripe.elements({
          mode: "setup",
          currency: STRIPE_CURRENCY,
          setupFutureUsage: "off_session",
          appearance: stripeAppearance(),
        });
        element = elements.create("payment", {
          layout: {
            type: "accordion",
            defaultCollapsed: false,
            radios: false,
            spacedAccordionItems: true,
          },
          /* Billing details come from the details step, so Stripe does not
             ask for them again. */
          fields: { billingDetails: { email: "never", phone: "never", name: "never" } },
        });
        element.on("ready", () => !cancelled && setStatus("ready"));
        element.on("change", (e) => !cancelled && onCompleteChange(Boolean(e.complete)));
        element.on("loaderror", (e) => {
          if (cancelled) return;
          setStatus("failed");
          setMessage(e?.error?.message || "");
        });
        element.mount(box.current);
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("failed");
      });

    return () => {
      cancelled = true;
      element?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[60px]">
      {status === "loading" && <p className={cn(STATE, "text-bk-ink-3")}>Loading secure payment…</p>}
      {status === "failed" && (
        <p className={cn(STATE, "text-danger")}>
          <Icon icon={P.alert} size={17} className="mt-0.5 flex-none" />
          <span>
            Secure payment could not load{message ? `: ${message}` : ""}. Check your connection or
            any ad blocker, then try again.
          </span>
        </p>
      )}
      <div ref={box} />
    </div>
  );
}
