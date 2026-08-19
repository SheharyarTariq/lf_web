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

   The Element mounts in **deferred mode**: it renders before any server call
   exists, and the SetupIntent is created at confirmation time instead. That is
   why `confirm()` below runs `elements.submit()` first — in deferred mode
   Stripe requires the form to be validated before the intent is fetched, so
   nobody's card is set up against an intent they were never going to use.

   ── Why redirect: "if_required" ──
   This Element lives inside a checkout step, and the whole booking lives in
   React state above it. A full redirect would leave /book/payment, lose that
   state, and land back on a flow guard that sends them to /book/address with
   the booking gone. `if_required` keeps 3DS in Stripe's own modal and the page
   underneath intact. A return_url is passed anyway, because Stripe wants one
   for the redirect-based methods this Element does not offer.
   ══════════════════════════════════════════════════════════════════ */

import { cn } from "@/utils/cn";
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { config } from "@/config";
import { Icon, P } from "@/components/booking/icons";
import { createSetupIntent } from "@/utils/booking/api";

const STRIPE_CURRENCY = "gbp";

/* The slice of Stripe.js this screen uses. Typed here rather than pulled
   from @stripe/stripe-js, which would be a dependency for a handful of call
   signatures on a script we are required to load from their domain
   anyway. */
interface StripeChange {
  complete?: boolean;
  error?: { message?: string };
}
/** Stripe's own error shape. `type` matters: `card_error` and
 *  `validation_error` carry wording written for the cardholder, everything
 *  else carries wording written for us. */
interface StripeError {
  type?: string;
  message?: string;
}
interface StripeElement {
  on: (event: string, handler: (e: StripeChange) => void) => void;
  mount: (node: HTMLElement | null) => void;
  destroy?: () => void;
}
interface StripeElements {
  create: (type: string, options: Record<string, unknown>) => StripeElement;
  /** Deferred mode only: validates and collects before an intent exists. */
  submit: () => Promise<{ error?: StripeError }>;
}
interface StripeInstance {
  elements: (options: Record<string, unknown>) => StripeElements;
  confirmSetup: (options: Record<string, unknown>) => Promise<{
    error?: StripeError;
    setupIntent?: { id?: string; status?: string };
  }>;
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

const GENERIC_FAILURE = "We could not save that card. Please check the details and try again.";

/** Only the two kinds Stripe writes for the cardholder. Anything else —
 *  `api_error`, `invalid_request_error` — is addressed to us and reads as
 *  gibberish under a card field, the same reasoning as `readHumanMessage`
 *  in utils/api. */
function cardholderMessage(error: StripeError | undefined): string {
  const shown = error?.type === "card_error" || error?.type === "validation_error";
  return (shown && error?.message) || GENERIC_FAILURE;
}

/** The billing object Stripe wants, with absent values left out rather than
 *  sent as empty strings — which it rejects. */
function billingFor(b: BillingDetails): Record<string, string> {
  const out: Record<string, string> = { name: b.name.trim(), email: b.email.trim() };
  const phone = b.phone?.trim();
  if (phone) out.phone = phone;
  return out;
}

/** Only opt out of a field we can supply at confirm time. Claiming `never` for
 *  a phone number the account does not have would leave Stripe with no way to
 *  obtain one and no way for us to give it one. */
function skippableFields(b: BillingDetails): Record<string, string> {
  return {
    name: "never",
    email: "never",
    phone: b.phone?.trim() ? "never" : "auto",
  };
}

export type ConfirmCardResult =
  | { ok: true; setupIntentId: string }
  | { ok: false; message: string };

export interface StripePaymentHandle {
  /** Runs the whole capture: validate → SetupIntent → confirm. Resolves with
   *  the id the caller polls `check-status` against. It deliberately does not
   *  poll itself — whether an order follows is the checkout's decision. */
  confirm: () => Promise<ConfirmCardResult>;
}

/** What the details step already collected. The Element is told not to ask for
 *  these again, and Stripe then *requires* them at confirmation — opting out of
 *  collecting a field is a promise to supply it, not permission to omit it. */
export interface BillingDetails {
  name: string;
  email: string;
  /** Optional, because an account can have no number on it. When it is absent
   *  the Element collects one itself rather than being told to skip a field
   *  nobody can then fill in. */
  phone?: string;
}

export default function StripePayment({
  billing,
  onCompleteChange,
  ref,
}: {
  billing: BillingDetails;
  onCompleteChange: (complete: boolean) => void;
  ref?: Ref<StripePaymentHandle>;
}) {
  const box = useRef<HTMLDivElement>(null);
  const stripe = useRef<StripeInstance | null>(null);
  const elements = useRef<StripeElements | null>(null);
  /* Read at confirm time rather than captured when the Element is built, so an
     edit made after mounting still reaches Stripe. Synced in an effect, not
     written during render — `confirm()` only ever runs from a click, long
     after the effect has caught up. */
  const billingRef = useRef(billing);
  useEffect(() => {
    billingRef.current = billing;
  }, [billing]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "failed">("loading");
  const [message, setMessage] = useState("");

  /* An unset key is a deploy mistake, not a runtime event, and it is knowable
     during render — so it is decided here rather than reported from the effect
     below. Left to be discovered at confirm time it would surface as a card
     failure, which is the one reading of it that sends somebody off to find a
     different card. */
  const configured = Boolean(config.stripePublishableKey);
  const status = configured ? loadState : "failed";

  useImperativeHandle(
    ref,
    () => ({
      async confirm() {
        if (!stripe.current || !elements.current) {
          return { ok: false, message: "Secure payment is not ready yet. Please try again." };
        }

        /* 1 · Validate first. In deferred mode Stripe requires this before a
           client secret exists, and it means a mistyped card never costs a
           SetupIntent on the account. */
        const submitted = await elements.current.submit();
        if (submitted?.error) {
          return { ok: false, message: cardholderMessage(submitted.error) };
        }

        /* 2 · Now ask our server for the intent. */
        const intent = await createSetupIntent();
        if (!intent.ok) return { ok: false, message: intent.message };

        /* 3 · The card leaves the browser. It never touches our DOM or ours. */
        const result = await stripe.current.confirmSetup({
          elements: elements.current,
          clientSecret: intent.clientSecret,
          confirmParams: {
            /* Reached only if a redirect-requiring method is ever added. It
               lands back on this step rather than /payment-callback, which is
               a native-app deep link the Android association files claim. */
            return_url: `${window.location.origin}/book/payment`,
            /* Required, not optional. Every field the Element was told not to
               collect has to arrive here instead, or Stripe rejects the call
               with an IntegrationError before it reaches the network. */
            payment_method_data: { billing_details: billingFor(billingRef.current) },
          },
          redirect: "if_required",
        });

        if (result.error) return { ok: false, message: cardholderMessage(result.error) };

        const id = result.setupIntent?.id;
        /* No error and no intent should not happen, but the caller must never
           be handed an empty id to poll — that would read as "still pending"
           for ever. */
        if (!id) return { ok: false, message: GENERIC_FAILURE };
        return { ok: true, setupIntentId: id };
      },
    }),
    [],
  );

  useEffect(() => {
    /* StrictMode double-invokes this in development, and the obvious guard —
       a ref that makes the second run a no-op — is wrong here, because the
       *first* run's cleanup has already set its own `cancelled` flag by then.
       Stripe.js is fetched asynchronously, so that flag is still false at
       mount time only for the run that was not cleaned up: skipping the second
       run leaves the first to resolve into `cancelled === true` and never
       mount at all. The Element then sits on "Loading secure payment…" for
       ever, in development only.

       So there is no guard. Each run creates its own Element and destroys it
       on cleanup, which is what stops two being mounted into the same node.
       `loadStripeJs` is memoised, so the script is still fetched once. */
    let element: StripeElement | null = null;
    let cancelled = false;

    const key = config.stripePublishableKey;
    /* Nothing to mount and nothing to report from in here — an unset key is
       known at render time, so it is answered there. */
    if (!key) return undefined;

    loadStripeJs()
      .then((Stripe) => {
        if (cancelled || !Stripe) return;
        stripe.current = Stripe(key);
        /* Deferred mode: no client secret needed to render. The intent is
           created at confirmation time instead. */
        elements.current = stripe.current.elements({
          mode: "setup",
          currency: STRIPE_CURRENCY,
          setupFutureUsage: "off_session",
          appearance: stripeAppearance(),
        });
        element = elements.current.create("payment", {
          layout: {
            type: "accordion",
            defaultCollapsed: false,
            radios: false,
            spacedAccordionItems: true,
          },
          /* Billing details come from the details step, so Stripe does not
             ask for them again — which obliges us to pass them to
             confirmSetup. `never` is only claimed for fields we hold. */
          fields: { billingDetails: skippableFields(billingRef.current) },
        });
        element.on("ready", () => !cancelled && setLoadState("ready"));
        element.on("change", (e) => !cancelled && onCompleteChange(Boolean(e.complete)));
        element.on("loaderror", (e) => {
          if (cancelled) return;
          setLoadState("failed");
          setMessage(e?.error?.message || "");
        });
        element.mount(box.current);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadState("failed");
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
          {/* Two failures, and only one of them is worth asking the reader to
              act on. A missing key is ours: telling somebody to check their ad
              blocker for it sends them off to fix a machine that is working. */}
          {configured ? (
            <span>
              Secure payment could not load{message ? `: ${message}` : ""}. Check your connection or
              any ad blocker, then try again.
            </span>
          ) : (
            <span>Card payments are unavailable right now. Please try again shortly.</span>
          )}
        </p>
      )}
      <div ref={box} />
    </div>
  );
}
