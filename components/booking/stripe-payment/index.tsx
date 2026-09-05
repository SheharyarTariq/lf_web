"use client";

/* ══════════════════════════════════════════════════════════════════
   Stripe
   ══════════════════════════════════════════════════════════════════

   The card fields come from Stripe. Nothing card-shaped is rebuilt here —
   the details never touch our DOM, which is the whole point of the Element.

   What it is *not* asked for is the other half of the design. Link, Apple Pay,
   Google Pay and Stripe's own mandate wording are all switched off explicitly
   below, so this Element renders a card form and nothing else. The reasoning
   sits beside each option; the short version is that everything removed either
   asked again for something the details step already collected, or spoke about
   us in wording and a typeface that were not ours.

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
import { formatPostcode } from "@/utils/booking/model";

const STRIPE_CURRENCY = "gbp";

/* Poppins, for the Element's own document.
   ────────────────────────────────────────
   This is not a duplicate of the site's font and must not be pruned as one.
   `next/font/google` self-hosts Poppins under a hashed family name
   (`__Poppins_<hash>`) — the literal string "Poppins" is never declared in the
   served CSS — and the Element is a cross-origin iframe that cannot see our
   @font-face rules whatever they are called. Passing `fontFamily` alone left
   every Stripe field silently falling back to sans-serif next to a page set in
   Poppins, which is most of why the panel read as bolted on.

   `cssSrc` is the only way in: Stripe fetches the stylesheet from inside the
   frame and takes its @font-face rules. Weights match what the appearance rules
   below actually use — .Label is the heaviest at 600 — rather than the five the
   site loads.

   If a CSP is ever added, this needs `style-src https://fonts.googleapis.com`
   and `font-src https://fonts.gstatic.com`, for the Stripe frame rather than
   for our document. There is no CSP today. */
const STRIPE_FONTS = [
  { cssSrc: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap" },
];

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
  const danger = v("--color-danger", "#B3261E");
  /* `.Tab` and `.Tab--selected` rules used to sit in here. The Element is
     card-only now — see paymentMethodTypes below — so there is no method
     picker left to style, and rules for a component that cannot render are
     the kind of thing a later reader spends an afternoon trying to find on
     screen. */
  return {
    theme: "stripe",
    variables: {
      /* Resolves because STRIPE_FONTS loads the family into the frame. Unquoted:
         the name has no space, and Stripe passes this straight into CSS. */
      fontFamily: "Poppins, sans-serif",
      colorPrimary: ink,
      colorText: ink,
      colorTextSecondary: v("--color-bk-ink-2", "#5A5A5A"),
      colorTextPlaceholder: v("--color-bk-ink-3", "#6D6D6D"),
      colorBackground: "#FFFFFF",
      colorDanger: danger,
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
      /* Matched to ERR and the aria-invalid branch of INPUT in
         utils/booking/styles.ts, so a declined card and a rejected postcode
         are drawn the same way on both sides of the frame boundary. */
      ".Input--invalid": { border: `1.5px solid ${danger}`, boxShadow: "none" },
      ".Error": { fontSize: "13.5px", fontWeight: "500", marginTop: "7px" },
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
 *  obtain one and no way for us to give it one.
 *
 *  `address` is deliberately absent, which leaves it `auto` — Stripe keeps
 *  collecting country and postcode. See `prefillFor` for why those two are
 *  prefilled rather than suppressed. */
function skippableFields(b: BillingDetails): Record<string, string> {
  return {
    name: "never",
    email: "never",
    phone: b.phone?.trim() ? "never" : "auto",
  };
}

/** Country and postcode, filled in from the address the collection is booked
 *  against.
 *
 *  Suppressing the pair outright was the other option and is the wrong one: the
 *  postcode is what the bank's AVS check runs on, and a card registered to a
 *  different address than the one we collect from would start failing with no
 *  field on screen to correct it in. Prefilled, there is nothing to type and
 *  the answer is still the cardholder's to change.
 *
 *  It also stays inside the `never`/supply rule this file is built on: we are
 *  not opting out of collecting these, so `billingFor` owes Stripe nothing at
 *  confirm time. Note the casing — `defaultValues` takes snake_case
 *  `postal_code` where `fields` takes camelCase `postalCode`. */
function prefillFor(b: BillingDetails): Record<string, unknown> {
  const address: Record<string, string> = { country: "GB" };
  const postcode = b.postcode?.trim();
  if (postcode) address.postal_code = formatPostcode(postcode);
  return { billingDetails: { address } };
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
  /** The collection postcode, used to prefill the billing pair the Element
   *  still collects — see `prefillFor`. Unlike the three above this is a
   *  suggestion, not a promise: the field stays on screen and editable, so an
   *  absent value costs nothing but a keystroke. */
  postcode?: string;
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
          /* Card only, and stated rather than left to the account's enabled
             methods. Unset, automatic payment methods decide what appears, and
             this Element has exactly one job. Note it does **not** by itself
             remove Link — that is `wallets.link` below, established by trying
             both against a real key. */
          paymentMethodTypes: ["card"],
          appearance: stripeAppearance(),
          fonts: STRIPE_FONTS,
        });
        element = elements.current.create("payment", {
          /* Tabs, for a form that has no tabs. With one payment method Stripe
             renders no tab bar at all, so the fields start at "Card number" —
             whereas the accordion this used to be drew a single always-open
             "Card" panel: a header naming the only option there was, wrapped
             in a white box, under an h1 that had just said the same thing.
             That box was the "form inside a form" the note above warns about.
             Verified against a real key; `auto` behaves the same today but
             leaves the choice to Stripe. */
          layout: "tabs",
          /* Billing details come from the details step, so Stripe does not
             ask for them again — which obliges us to pass them to
             confirmSetup. `never` is only claimed for fields we hold. */
          fields: { billingDetails: skippableFields(billingRef.current) },
          defaultValues: prefillFor(billingRef.current),
          /* Stripe's mandate is suppressed because the screen states it
             itself, in our own words and our own typeface, next to the terms
             checkbox that is the other half of the same act — see the note
             above the mandate in screens/payment. Stripe allows `never` on
             exactly that condition: the wording has to be displayed
             somewhere, and it is. Deleting it there means putting this back.

             `business: { name }` is deliberately not set alongside it. It
             renders only inside this mandate and the wallet sheets, both of
             which are off, so it would be a setting with nowhere to appear. */
          terms: { card: "never" },
          /* Off, and each said explicitly, because all three survive
             `paymentMethodTypes: ["card"]` — they are card-type methods rather
             than separate ones, so naming card does not exclude them.

             `link` is the one that mattered here and the one that is easy to
             get wrong. It is what rendered the "Secure, fast checkout with
             Link" row and the "Optional · Save my information" block below the
             card fields, asking for the email, mobile and name the details
             step had already collected — three empty boxes for answers we were
             holding. The options that look like they should govern it,
             `link: { display: "never" }` on either the group or the Element,
             are rejected by Stripe.js as unrecognised parameters; this is the
             one that works.

             Apple Pay and Google Pay are off for a different reason: this flow
             stores a card to charge off-session once the items are counted,
             and a wallet hands back a device-bound token that makes that later
             charge harder. Apple Pay also needs a domain verification that is
             not set up, so it renders nothing today regardless — Stripe.js
             says as much in a console warning. One line each to reverse. */
          wallets: { applePay: "never", googlePay: "never", link: "never" },
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
