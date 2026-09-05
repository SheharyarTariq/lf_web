"use client";

/* ══════════════════════════════════════════════════════════════════
   5 · Confirmed
   ══════════════════════════════════════════════════════════════════

   This is the one screen in the checkout drawn from the mobile app rather
   than from the React+Vite prototype every other screen here follows.
   `lf-app/app/screens/OrderConfirmationScreen.tsx` is the source: a 64px
   lime tick, "Order Confirmed", a plain order number, a Collection /
   Delivery card carrying the placed-at stamp, and two tip rows.

   Three blocks that used to live here went with the change, and all three
   were the only caller of something:

   • "What happens next" — four numbered steps. Content only.
   • "Keep your account" — the six-digit code box and the set-a-password
     link, shown when `isNewAccount`. The endpoints behind it
     (resendVerification / verifyEmail / requestPasswordReset) are still
     reached from the header's AuthModal and from /verify-email; only this
     entry point is gone. `isNewAccount` itself left the context with it.
   • "Set your preferences" — the three switches. `prefs` is not part of
     POST /orders, so with `updatePreferences` unreferenced there is now
     nowhere on the web to set them. Deliberate, and recorded here because
     nothing else on screen shows that it happened.

   The app's fourth element, an "Action Required" banner for an account
   with no card, is not ported: the payment step captures a card before
   POST /orders, so it could never render.
   ══════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { Icon, P } from "@/components/booking/icons";
import ActionBar from "@/components/booking/common/ActionBar";
import { useBooking } from "@/utils/booking/context";
import { parseDay, placedStamp, shortDate } from "@/utils/booking/model";
import { bkBtn } from "@/utils/booking/styles";

/* The app's own hexes, kept as literals rather than mapped onto the `bk-`
   tokens. They are close to them and not the same: `--color-bk-ink-3` is
   #6d6d6d precisely because the app's grey is too light to read at this
   size, so borrowing the token here would be matching the design in the
   places nobody looks and missing it in the places they do. The trade is
   deliberate — swap these three for `text-bk-ink-3` if the contrast ever
   matters more than the match. */
const INK = "text-[#111]";
const MUTED = "text-[#888]";
const META = "text-[#bbb]";

const CARD_APP = "rounded-ctl-lg border border-bk-line bg-white";

const TIPS: [icon: (typeof P)[keyof typeof P], text: string][] = [
  [P.tag, "All items are cleaned as per care label instructions."],
  [P.bag, "Just bag your items and leave them ready — we'll handle the rest."],
];

/** One leg of the schedule card. Both are the same object. */
function Leg({ label, day, slot }: { label: string; day: string; slot: string }) {
  const date = parseDay(day);
  return (
    <div className="flex-1">
      <p className={`mb-1 text-[12px] leading-[18px] tracking-[1px] ${MUTED}`}>{label}</p>
      {/* An em dash rather than an empty line: /book/confirmed is a real URL
          and can be opened with no booking behind it, and a card with a
          missing row reads as a rendering fault where a placeholder reads as
          "nothing to show". Same reasoning as the reference below. */}
      <p className={`mb-0.5 text-[16px] font-bold leading-[24px] ${INK}`}>
        {date ? shortDate(date) : "—"}
      </p>
      <p className={`text-[14px] leading-[21px] ${MUTED}`}>{slot || "—"}</p>
    </div>
  );
}

export default function ConfirmedScreen() {
  const { data, reference, placedAt, moreBelow } = useBooking();
  const stamp = placedStamp(placedAt);

  return (
    <>
      {/* 48px from the top of the column, which is the app's paddingTop — the
          <main> above already contributes 28 of it. */}
      <div className="pt-5 pb-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[50%] bg-brand">
          {/* White on lime, where every other tick in the checkout is ink on
              lime. The app's is a filled glyph; lucide's is a stroke, so the
              weight is carried by strokeWidth rather than by the artwork. */}
          <Icon icon={P.tick} size={28} strokeWidth="2.4" className="text-white" />
        </div>
        <h1 className={`mb-1 text-[36px] font-bold leading-[44px] ${INK}`} tabIndex={-1}>
          Order Confirmed
        </h1>
        {/* A deep link to /book/confirmed has no order behind it. The
            placeholder is visibly fake on purpose: a plausible number is one
            somebody would quote back to us. */}
        <p className="text-[16px] leading-[24px] text-[#999]">Order #{reference || "LF-000000"}</p>
      </div>

      <div className={`mb-4 p-5 ${CARD_APP}`}>
        <div className="flex">
          <Leg label="COLLECTION" day={data.collectionDay} slot={data.collectionSlot} />
          <div className="mx-4 w-px bg-bk-line" />
          <Leg label="DELIVERY" day={data.deliveryDay} slot={data.deliverySlot} />
        </div>

        {/* Both the rule and the row belong to the stamp, so they go together
            rather than leaving a divider under nothing. */}
        {stamp && (
          <>
            <div className="my-4 h-px bg-bk-line" />
            <div className="flex items-center justify-between">
              <span className={`text-[12px] leading-[18px] ${META}`}>Order placed</span>
              <span className={`text-[12px] leading-[18px] ${META}`}>{stamp}</span>
            </div>
          </>
        )}
      </div>

      {TIPS.map(([icon, text]) => (
        <div key={text} className={`mt-2.5 flex items-center gap-3 p-4 ${CARD_APP}`}>
          <Icon icon={icon} size={22} className={`flex-none ${MUTED}`} />
          <p className={`flex-1 text-[14px] leading-[21px] ${MUTED}`}>{text}</p>
        </div>
      ))}

      {/* One button where the app has two. Its pair open an order editor and a
          preferences screen, and the web has neither — a control that cannot
          do what it says is worse than an absent one. */}
      <ActionBar more={moreBelow}>
        <Link className={bkBtn({ size: "xl", block: true })} href="/">
          Back to home
        </Link>
      </ActionBar>
    </>
  );
}
