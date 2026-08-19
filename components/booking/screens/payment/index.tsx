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
import Loader from "@/components/common/Loader";
import { Icon, P } from "@/components/booking/icons";
import ActionBar from "@/components/booking/common/ActionBar";
import StripePayment, { type StripePaymentHandle } from "@/components/booking/stripe-payment";
import PaymentMethods from "@/components/booking/payment-methods";
import { useAuth } from "@/components/common/AuthProvider";
import { useBooking } from "@/utils/booking/context";
import { awaitSetupIntent } from "@/utils/booking/api";
import { toE164 } from "@/utils/api";
import {
  BTN_LINK,
  CONTROL_PEER,
  ERR,
  H1,
  LABEL,
  LEDE,
  NAV_BACK,
  NAV_FORWARD,
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
  const { data, patch, back, moreBelow, confirmOrder, openBilling } = useBooking();
  const { status, refreshSession } = useAuth();

  const cards = status?.paymentMethods ?? [];
  /* The card the server would charge. POST /orders takes payment from the
     default and has no card field of its own, so this is the whole answer to
     "which one". */
  const savedCard = cards.find((m) => m.isDefault);

  const card = useRef<StripePaymentHandle>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  /* Adding a card *on top of* the ones already saved. Distinct from having
     none at all, where the Element is the whole screen and Confirm order
     captures it — see the two branches below. */
  const [adding, setAdding] = useState(false);

  /* With a card already saved there is no Element to complete, so the terms
     box is the only gate left. While the add panel is open nothing is ready:
     letting Confirm order through there would take a new card off somebody and
     then charge the old one. Cancel is the way out. */
  const ready = adding ? false : (savedCard ? true : data.cardReady) && data.terms;

  /**
   * Validate → SetupIntent → confirm → wait for our server to attach it.
   *
   * One helper for both entry points — the first card, captured by Confirm
   * order, and an extra one captured by Save card — so the two cannot drift
   * apart on the part that matters, which is never treating a card as saved
   * before `check-status` says so.
   */
  const captureCard = async (): Promise<{ ok: true } | { ok: false; message: string }> => {
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

  /* Save card, the add-panel's own submit. The card lands in the list as the
     new default — the server does that on its own — so it is visibly chosen
     before anybody commits to an order. */
  const saveCard = async () => {
    if (!data.cardReady || busy) return;
    setBusy(true);
    setError("");
    const r = await captureCard();
    if (!r.ok) {
      setBusy(false);
      setError(r.message);
      return;
    }
    await refreshSession();
    patch({ cardReady: false });
    setAdding(false);
    setBusy(false);
  };

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError("");

    /* One card capture, skipped entirely when the account already has a
       default. Failures here stop the run: creating an order that cannot be
       charged is worse than making somebody press the button again. */
    if (!savedCard) {
      const captured = await captureCard();
      if (!captured.ok) {
        setBusy(false);
        setError(captured.message);
        return;
      }
    }

    const placed = await confirmOrder();
    /* Left set on success too: confirmOrder navigates away, and clearing it
       first would flash the form back to its idle state under the transition. */
    if (!placed.ok) {
      setBusy(false);
      setError(placed.message ?? "We could not place your order. Please try again.");
    }
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
            /* Not editable while the screen is mid-flight — a default that
               moves under a running order, or under a card being saved, is a
               charge going somewhere nobody chose. */
            disabled={busy}
          />
        </>
      )}

      {/* Two ways in, and they are genuinely different. With no cards at all
          the Element *is* the step, and Confirm order captures it — one tap,
          which is the whole first-time path. With cards already saved, adding
          another is its own act with its own button, so the new card lands in
          the list and can be seen before anything is ordered. */}
      {cards.length === 0 ? (
        <StripePayment
          ref={card}
          /* The details step already asked for all three, so the Element is
             told not to. That makes supplying them here mandatory rather than
             polite — see the note on BillingDetails. */
          billing={{ name: data.fullName, email: data.email, phone: toE164(data.mobile) }}
          onCompleteChange={(ok) => patch({ cardReady: ok })}
        />
      ) : adding ? (
        <div className="mt-3.5">
          <StripePayment
            ref={card}
            billing={{ name: data.fullName, email: data.email, phone: toE164(data.mobile) }}
            onCompleteChange={(ok) => patch({ cardReady: ok })}
          />
          <div className="mt-3.5 flex gap-2.5">
            <Button
              surface="booking" variant="ghost" size="lg" className="flex-[1_1_0]"
              disabled={busy}
              onClick={() => {
                setAdding(false);
                setError("");
                patch({ cardReady: false });
              }}
            >
              Cancel
            </Button>
            <Button
              surface="booking" variant="ink" size="lg" className="flex-[1_1_0] gap-2"
              disabled={!data.cardReady}
              isLoading={busy}
              onClick={saveCard}
            >
              {busy && <Loader className="h-4 w-4" />}
              Save card
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3">
          <Button
            variant="bare"
            className={BTN_LINK}
            disabled={busy}
            onClick={() => {
              setAdding(true);
              setError("");
            }}
          >
            + Add a new card
          </Button>
        </p>
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
          surface="booking" size="lg" className={cn(NAV_FORWARD, "gap-2")}
          disabled={!ready}
          isLoading={busy}
          onClick={submit}
        >
          {busy && <Loader className="h-4 w-4" />}
          Confirm order
        </Button>
      </ActionBar>
    </>
  );
}
