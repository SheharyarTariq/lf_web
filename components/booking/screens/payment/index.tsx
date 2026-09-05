"use client";

/* ══════════════════════════════════════════════════════════════════
   4b · Payment
   ══════════════════════════════════════════════════════════════════

   The name is the design's, and it is slightly wrong: nothing is charged
   here. The total is unknowable until the items are counted, so this step
   stores a card against the account and the charge follows. That is also
   what the API offers — a SetupIntent, and no pay endpoint at all.

   Which means the step has two shapes:

   · No card on the account → mount the Element, capture one, confirm with
     our server that it saved, then create the order.
   · A default card already there → show it and create the order. Asking a
     returning customer to retype a card we already hold, to charge them
     later on the one we already hold, would be a step for nothing.
   ══════════════════════════════════════════════════════════════════ */

import { cn } from "@/utils/cn";
import { useRef, useState } from "react";
import Button from "@/components/common/Button";
import { Icon, P } from "@/components/booking/icons";
import ActionBar from "@/components/booking/common/ActionBar";
import StripePayment, { type StripePaymentHandle } from "@/components/booking/stripe-payment";
import PaymentMethods from "@/components/booking/payment-methods";
import { useAuth } from "@/components/common/AuthProvider";
import { useBooking } from "@/utils/booking/context";
import { useConfirmSubmit, type ConfirmStep } from "@/utils/booking/use-confirm";
import { awaitSetupIntent } from "@/utils/booking/api";
import { toE164 } from "@/utils/api";
import { BRAND } from "@/utils/content";
import {
  BTN_LINK,
  CONTROL_PEER,
  ERR,
  H1,
  HINT,
  LABEL,
  LEDE,
  NAV_BACK,
  NAV_FORWARD,
  SEC_H,
  SEC_P,
  } from "@/utils/booking/styles";

/* ── Checkbox ─────────────────────────────────────────────────────
   The tick is always in the box and always the same size; only its
   colour changes, so nothing moves as it is switched. */
const BOX =
  "mt-px flex h-6 w-6 flex-none items-center justify-center rounded-[7px] border-[1.5px] " +
  "border-bk-line-2 bg-white text-transparent " +
  "transition-[background-color,border-color,color] duration-150 ease-[ease] " +
  "peer-checked:border-brand peer-checked:bg-brand peer-checked:text-bk-ink " +
  "peer-focus-visible:outline peer-focus-visible:outline-[3px] " +
  "peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-bk-ink";

const TIMED_OUT =
  "Your card is still being confirmed. Give it a moment and press Confirm order again — " +
  "you will not be charged twice.";

export default function PaymentScreen() {
  const { data, patch, back, moreBelow, openBilling } = useBooking();
  const { status, refreshSession } = useAuth();

  const cards = status?.paymentMethods ?? [];
  /* The card the server would charge. POST /orders takes payment from the
     default and has no card field of its own, so this is the whole answer to
     "which one". */
  const savedCard = cards.find((m) => m.isDefault);

  const card = useRef<StripePaymentHandle>(null);
  /* Adding a card *on top of* the ones already saved. Distinct from having
     none at all, where the Element is the whole screen and Confirm order
     captures it — see the two branches below. */
  const [adding, setAdding] = useState(false);

  /* The two states with an Element on screen: no cards at all, or adding one
     on top of the cards already saved. Both mean Confirm order captures a card
     before it places anything. */
  const needsCard = adding || cards.length === 0;

  /* With a card already saved there is no Element to complete, so the terms box
     is the only gate left. Otherwise the Element has to be complete too. */
  const ready = data.terms && (needsCard ? data.cardReady : Boolean(savedCard));

  /**
   * Validate → SetupIntent → confirm → wait for our server to attach it.
   *
   * One helper for both entry points — the first card, captured by Confirm
   * order, and an extra one captured by Save card — so the two cannot drift
   * apart on the part that matters, which is never treating a card as saved
   * before `check-status` says so.
   */
  const captureCard = async (): Promise<ConfirmStep> => {
    const captured = await card.current?.confirm();
    if (!captured?.ok) {
      return { ok: false, message: captured?.message ?? "We could not save that card. Please try again." };
    }
    /* Stripe having the card is not us having it. check-status answers true
       only once it is attached to the account and made the default, which is
       the state POST /orders needs.

       Anything short of true stops without blaming the card — see
       awaitSetupIntent, where staging turns out to answer `false` for an
       intent that is merely still landing. A card that is genuinely bad has
       already failed above, at confirm(), with Stripe's own wording. */
    const confirmed = await awaitSetupIntent(captured.setupIntentId);
    if (!confirmed.ok || confirmed.saved !== true) {
      return { ok: false, message: confirmed.ok ? TIMED_OUT : confirmed.message };
    }
    return { ok: true };
  };

  /* One button for the whole step. A new card is saved *and* used by the same
     press that places the order — there is no separate Save card, because the
     only reason to have had one was to stop Confirm order charging the old
     card while a new one sat half-typed, and Confirm order now uses the new
     one. The server makes a freshly saved card the default, which is what
     POST /orders charges, so "saved" and "used" are the same event.

     The card is the whole of this screen's difference from the other two that
     can carry Confirm order; everything after it lives in useConfirmSubmit. */
  const { busy, error, submit: confirm, setError } = useConfirmSubmit(async () => {
    /* Skipped entirely when the account already has a default and nothing new
       is being added. A failure here stops the run: creating an order that
       cannot be charged is worse than making somebody press the button
       again. */
    if (!needsCard) return { ok: true };
    const captured = await captureCard();
    if (!captured.ok) return captured;
    /* Both before the order, deliberately. If POST /orders then fails, the
       person is looking at their new card sitting in the list as the
       default, and pressing Confirm order again takes the saved-card path
       rather than capturing a second one. */
    await refreshSession();
    patch({ cardReady: false });
    setAdding(false);
    return { ok: true };
  });

  const submit = () => {
    if (!ready) return;
    void confirm();
  };

  const startAdding = () => {
    setAdding(true);
    setError("");
  };

  /* `cardReady` is cleared as well as `adding`: it belongs to an Element that is
     about to unmount, and left true it would keep `ready` satisfied for a card
     nobody is entering any more. */
  const cancelAdding = () => {
    setAdding(false);
    setError("");
    patch({ cardReady: false });
  };

  return (
    <>
      <h1 className={H1} tabIndex={-1}>
        {cards.length === 0 ? "Add a payment method" : "Confirm your order"}
      </h1>
      {/* One line, not a paragraph and a boxed notice repeating it. The
          detail lives behind "How billing works" for anyone who wants
          it, which is where it was always going to be read properly. */}
      <p className={LEDE}>
        Nothing is charged today — we count your items first.{" "}
        <Button variant="bare" className={BTN_LINK} onClick={openBilling}>
          How billing works
        </Button>
      </p>

      {cards.length > 0 && (
        <>
          {/* Only worth labelling once there is a list to label. With no cards
              the Element is the whole screen and the h1 already says so. */}
          <p className={LABEL}>{cards.length > 1 ? "Which card shall we use?" : "Your card"}</p>
          <PaymentMethods
            cards={cards}
            onChanged={refreshSession}
            /* The row is part of the list rather than a link beneath it, so
               "use one of these" and "use a different one" are offered as the
               same kind of thing. Withdrawn while the form is open: the answer
               is already on screen. */
            onAdd={adding ? undefined : startAdding}
            /* Not editable while the screen is mid-flight — a default that
               moves under a running order is a charge going somewhere nobody
               chose — nor while a new card is being typed, which is already
               the answer to "which card". */
            disabled={busy || adding}
          />
        </>
      )}

      {/* One Element for both ways in. With no cards it is the whole step; with
          cards saved it opens under the list, under a heading of its own so the
          h1 above is not left describing a form. Either way Confirm order
          captures the card and then places the order, so there is nothing here
          to submit on its own. */}
      {needsCard && (
        <div className={cn(cards.length > 0 && "mt-[22px]")}>
          {cards.length > 0 && (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <h2 className={cn(SEC_H, "mb-0")}>New card</h2>
                {/* A link on the heading row rather than a full-width button
                    below the form. Back already sits in the action bar, and two
                    large buttons pointing backwards made the one going forwards
                    the third of three. */}
                <Button
                  variant="bare"
                  className={cn(BTN_LINK, "flex-none")}
                  disabled={busy}
                  onClick={cancelAdding}
                >
                  Cancel
                </Button>
              </div>
              {/* Above the form, not below it. This says what Confirm order is
                  about to do, and it has to be read before the card is typed —
                  under 600px of Stripe it was answering a question at the point
                  nobody still had it. The row above stays highlighted until
                  this card saves and takes its place, which is the thing being
                  contradicted. */}
              <p className={cn(SEC_P, "mb-3.5 mt-1.5")}>
                We will save this card and use it for this order.
              </p>
            </>
          )}
          <StripePayment
            ref={card}
            /* The details step already asked for name, email and phone, so the
               Element is told not to. That makes supplying them here mandatory
               rather than polite — see the note on BillingDetails. The postcode
               is the softer case: the field stays on screen, this only saves
               it being typed twice. */
            billing={{
              name: data.fullName,
              email: data.email,
              phone: toE164(data.mobile),
              postcode: data.postcode,
            }}
            onCompleteChange={(ok) => patch({ cardReady: ok })}
          />
        </div>
      )}

      <label className="mt-[18px] flex cursor-pointer items-start gap-3 text-[14.5px]">
        <input
          className={CONTROL_PEER}
          type="checkbox"
          checked={data.terms}
          onChange={(e) => patch({ terms: e.target.checked })}
        />
        <span className={BOX} aria-hidden="true">
          <Icon icon={P.tick} size={14} />
        </span>
        {/* New tab, deliberately. People tap anywhere in this sentence to
            tick the box; landing on a link would otherwise navigate away
            and take the whole unsaved booking with it. */}
        <span>
          I agree to the{" "}
          <a className="underline" href="/terms" target="_blank" rel="noopener noreferrer">
            terms
          </a>{" "}
          and{" "}
          <a className="underline" href="/privacy-policy" target="_blank" rel="noopener noreferrer">
            privacy policy
          </a>
          .
        </span>
      </label>

      {/* The card mandate, in our words.
          ──────────────────────────────
          Stripe renders this itself by default, and did until `terms: { card:
          "never" }` was set in stripe-payment — but it rendered it inside the
          frame, in a typeface that was not ours, naming the Stripe account
          ("lf-sandbox") rather than the company. Saying it here instead is what
          that option is conditional on: Stripe permits suppressing the wording
          only if it is displayed somewhere, so this paragraph is load-bearing
          and not decoration. Removing it means putting `terms` back.

          Deliberately outside the checkbox above. That box is consent to the
          terms and privacy policy; this is a statement of what pressing Confirm
          order authorises. Folding one into the other would leave neither
          clearly given. */}
      <p className={cn(HINT, "mt-2.5 max-w-[52ch] pl-9")}>
        By continuing you let {BRAND.trading} save this card and charge it for this order
        once your items are counted, and for future orders you place. You can remove it
        any time.
      </p>

      {error && (
        <p className={cn(ERR, "mt-3")} role="alert">
          <Icon icon={P.alert} size={15} className="mt-0.5 flex-none" />
          {error}
        </p>
      )}

      <ActionBar more={moreBelow} nav>
        <Button
          surface="booking" variant="ghost" size="lg" className={NAV_BACK}
          onClick={back}
          disabled={busy}
        >
          Back
        </Button>
        <Button
          surface="booking" size="lg" className={NAV_FORWARD}
          disabled={!ready}
          isLoading={busy}
          onClick={submit}
        >
          Confirm order
        </Button>
      </ActionBar>
    </>
  );
}
