"use client";

/* ══════════════════════════════════════════════════════════════════
   4 · Review, then payment
   ══════════════════════════════════════════════════════════════════
   Narrow layouts only. Wide drops this screen and pins the same content
   beside the form the whole way through — see SummaryPanel.
   ══════════════════════════════════════════════════════════════════ */

import { cn } from "@/utils/cn";
import Button from "@/components/common/Button";
import type { ReactNode } from "react";
import { Icon, P } from "@/components/booking/icons";
import ActionBar from "@/components/booking/common/ActionBar";
import { useAuth } from "@/components/common/AuthProvider";
import { useBooking } from "@/utils/booking/context";
import { useConfirmSubmit } from "@/utils/booking/use-confirm";
import {
  REPEAT_EVERY,
  cardLabel,
  formatUkMobile,
  longDate,
  parseDay,
  type Leg,
  formatPostcode,
} from "@/utils/booking/model";
import {
  BTN_LINK,
  DISC,
  ERR,
  H1,
  LEDE,
  NAV_BACK,
  NAV_FORWARD,
  SEC_H,
  } from "@/utils/booking/styles";

/* ── Selected summary rows ────────────────────────────────────────
   The rule is `.lfb-sum + .lfb-sum` in the source, so the first row has
   no top border and no border colour of its own. Said as :not(:first-child)
   rather than a `first:` override, which would still paint the colour. */
const SUM =
  "flex items-start gap-[14px] py-[15px] [&:not(:first-child)]:border-t " +
  "[&:not(:first-child)]:border-t-bk-line to-720:flex-wrap to-720:gap-y-1";
const SUM_K =
  "flex-[0_0_108px] pt-0.5 text-[13px] font-bold uppercase tracking-[.6px] text-bk-ink-3 " +
  "to-720:flex-[1_1_100%]";
const SUM_V = "min-w-0 flex-auto text-[15px] font-medium";
/* Deliberately no line-height: `.lfb-sum-edit` never says `font: inherit`,
   so it keeps the UA's `normal` that .lf-controls restores. */
const SUM_EDIT =
  "flex-none cursor-pointer border-none bg-transparent px-0 py-0.5 text-[14px] font-semibold " +
  "text-bk-ink underline underline-offset-[3px]";
/* Every line under the headline row. `.lfb-sum-v span` in the source. */
const SUM_LINE = "block text-[14px] font-normal text-bk-ink-2";

/* The Eco pill as the source actually renders it inside a summary row.
   `.lfb-eco-tag` is (0,1,0) and `.lfb-sum-v span` is (0,2,0), so the
   descendant rule keeps font-size, weight and colour and only the
   later, equally-weighted `.lfb-sum-v .lfb-eco-tag` wins back display,
   width, position and the margin. Reproduced rather than corrected —
   changing it here would change the screen. The panel's copy is the
   10.5px one, because nothing outranks it there. */
const SUM_ECO_TAG =
  "static ml-2 inline-flex w-auto items-center rounded-pill bg-brand px-1.5 py-px align-[1px] " +
  "text-[14px] font-normal uppercase leading-[1.5] tracking-[.3px] text-bk-ink-2";

function SummaryRow({
  label,
  children,
  onEdit,
  editLabel,
}: {
  label: string;
  children: ReactNode;
  onEdit?: () => void;
  editLabel?: string;
}) {
  return (
    <div className={SUM}>
      <span className={SUM_K}>{label}</span>
      <span className={SUM_V}>{children}</span>
      {onEdit && (
        <Button variant="bare" className={SUM_EDIT} onClick={onEdit}>
          Edit<span className="visually-hidden"> {editLabel}</span>
        </Button>
      )}
    </div>
  );
}

export default function ReviewScreen() {
  const {
    data,
    discount,
    go,
    back,
    forward,
    isLast,
    moreBelow,
    openBilling,
    skipPayment,
    setTimeLeg,
  } = useBooking();
  const { status } = useAuth();
  /* On a phone with a card already on the account this is the last screen, so
     the Next below places the order instead of moving on. */
  const { busy, error, submit } = useConfirmSubmit();
  const savedCard = status?.paymentMethods?.find((m) => m.isDefault);
  const collection = parseDay(data.collectionDay);
  const delivery = parseDay(data.deliveryDay);
  const every = REPEAT_EVERY.find(([id]) => id === data.repeatEvery);

  /* Both time rows lead to the same step, so the leg has to be named
     separately or "Edit collection time" opens whichever tab the time step was
     last on — which, having just come through it, is delivery. */
  const editTime = (leg: Leg) => () => {
    setTimeLeg(leg);
    go("time");
  };

  return (
    <>
      <h1 className={H1} tabIndex={-1}>
        Review and confirm
      </h1>
      <p className={LEDE}>
        You are charged after we count and clean your items.{" "}
        <Button variant="bare" className={BTN_LINK} onClick={openBilling}>
          Learn more
        </Button>
      </p>

      {discount && (
        <div className={cn(DISC, "mb-4")}>
          <Icon icon={P.spark} size={22} fill className="flex-none" />
          <span>
            <b className="block text-[15px] font-bold">{discount.label}</b>
            <span className="block text-[13.5px]">Applied automatically — no code needed.</span>
          </span>
        </div>
      )}

      <h2 className={SEC_H}>Order details</h2>
      {/* The card recipe with its vertical padding pulled in to 4px: the
          rows carry 15px of their own, and 20px on top of that reads as
          a gap before the first label. */}
      <div className="rounded-card-lg border border-bk-line bg-white px-5 py-1 to-720:px-[17px]">
        <SummaryRow label="Collection" onEdit={editTime("collection")} editLabel="collection time">
          {collection ? longDate(collection) : ""}
          <span className={SUM_LINE}>{data.collectionSlot}</span>
        </SummaryRow>
        <SummaryRow label="Delivery" onEdit={editTime("delivery")} editLabel="delivery time">
          {delivery ? longDate(delivery) : ""}
          {data.deliveryEco && (
            <span className={SUM_ECO_TAG} aria-label="Greener window">
              Eco
            </span>
          )}
          <span className={SUM_LINE}>
            {data.deliverySlot}
            {data.repeat && every ? ` · repeats every ${every[1].toLowerCase()}` : ""}
          </span>
        </SummaryRow>
        <SummaryRow label="Address" onEdit={() => go("address")} editLabel="address">
          {[data.line1, data.line2, data.line3].filter(Boolean).join(", ")}
          <span className={SUM_LINE}>
            {[data.town, data.county, formatPostcode(data.postcode)].filter(Boolean).join(", ")}
          </span>
        </SummaryRow>
        {/* Shown whether or not the Details step is in the walk. An order
            summary that leaves out who the order is for is not a summary, and
            the values are there either way — typed on the step, or seeded from
            the account. Its Edit puts the step back in the walk for an account
            that had skipped it; see `go` in booking-shell. */}
        <SummaryRow label="Contact" onEdit={() => go("contact")} editLabel="contact details">
          {data.fullName}
          {/* One line each. Run together they read as one string, and the
              email is the thing most worth checking here — it is the only
              address the order confirmation goes to. */}
          <span className={SUM_LINE}>{formatUkMobile(data.mobile)}</span>
          <span className={SUM_LINE}>{data.email}</span>
        </SummaryRow>
        {/* With the card step skipped this is the only place a returning
            customer is told which card the order will be charged to, so it
            names it rather than pointing at a screen they will never see.
            Deliberately no Edit: choosing a card is `mark-as-default`, and
            there is no screen for that yet. */}
        <SummaryRow label="Payment">
          <span className={SUM_LINE}>
            {skipPayment && savedCard
              ? cardLabel(savedCard)
              : "Added on the next screen to confirm your order."}
          </span>
        </SummaryRow>
      </div>

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
        {/* `forward()` rather than go("payment"): the screen after this one is
            the card step for somebody who still needs it and nothing at all for
            somebody who does not, and only the shell knows which. */}
        <Button
          surface="booking" size="lg" className={NAV_FORWARD}
          isLoading={isLast ? busy : undefined}
          onClick={isLast ? submit : forward}
        >
          {isLast ? "Confirm order" : "Next"}
        </Button>
      </ActionBar>
    </>
  );
}
