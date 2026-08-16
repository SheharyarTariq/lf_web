"use client";

/* ══════════════════════════════════════════════════════════════════
   4b · Payment
   ══════════════════════════════════════════════════════════════════ */

import Button from "@/components/common/Button";
import { Icon, P } from "@/components/booking/icons";
import ActionBar from "@/components/booking/common/ActionBar";
import StripePayment from "@/components/booking/stripe-payment";
import { useBooking } from "@/utils/booking/context";
import {
  BTN_LINK,
  CONTROL_PEER,
  H1,
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

export default function PaymentScreen() {
  const { data, patch, back, moreBelow, confirmOrder, openBilling } = useBooking();
  const ready = data.cardReady && data.terms;

  return (
    <>
      <h1 className={H1} tabIndex={-1}>
        Add a payment method
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

      <StripePayment onCompleteChange={(ok) => patch({ cardReady: ok })} />

      <label className="mt-[18px] flex cursor-pointer items-start gap-3 text-[14.5px]">
        <input
          className={CONTROL_PEER}
          type="checkbox"
          checked={data.terms}
          onChange={(e) => patch({ terms: e.target.checked })}
        />
        <span className={BOX} aria-hidden="true">
          <Icon d={P.tick} size={14} />
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

      <ActionBar more={moreBelow} nav>
        <Button
          surface="booking" variant="ghost" size="lg" className={NAV_BACK}
          onClick={back}
        >
          Back
        </Button>
        <Button
          surface="booking" size="lg" className={NAV_FORWARD}
          disabled={!ready}
          onClick={confirmOrder}
        >
          Confirm order
        </Button>
      </ActionBar>
    </>
  );
}
