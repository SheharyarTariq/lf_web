"use client";

import Button from "@/components/common/Button";
import { useAuth } from "@/components/common/AuthProvider";
import { BRAND } from "@/utils/content";
import { useOfferDiscount, useStartBooking } from "@/utils/hooks";

/**
 * The lime offer bar, above the sticky header so it scrolls away rather
 * than taking up permanent space. Clickable, because an offer people cannot
 * act on is just decoration.
 *
 * The figure is live, and which source it comes from depends on whether we
 * know who is reading it — see `useOfferDiscount`. Signed out it is the
 * public first-order row from /system-status; signed in it is this account's
 * own `nextOrderDiscount` from /my-status, which is the only source that can
 * be right for somebody on their third order.
 *
 * Signed in with no discount, the bar does not render at all. It used to
 * advertise 25% off a first order to returning customers, which is the bug
 * this component's TODO carried for as long as the figure had only one source.
 */
export default function AnnounceBar() {
  const { status } = useAuth();
  const { discount, signedIn } = useOfferDiscount(status);
  const startBooking = useStartBooking();

  /* Nothing to offer this account. No bar, rather than filler: a strip that
     advertises nothing is decoration, and the checkout already takes the same
     line with its discount row. */
  if (signedIn && !discount) return null;

  /* The designed copy is the fallback for the signed-out path only, so an
     unset NEXT_PUBLIC_API_URL or an offline server degrades to the wording
     that was drawn rather than to a blank. It is never used to fill in for a
     signed-in account — that would be the lie this change removes. */
  const offer = discount?.label ?? BRAND.offer;

  return (
    <Button
      variant="bare"
      onClick={() => startBooking()}
      className="group flex w-full items-center justify-center gap-0 border-none bg-brand px-5 py-2.5 text-center text-[14px] font-medium leading-[1.4] text-ink transition-colors duration-[160ms] ease-[ease] hover:bg-brand-hover to-720:px-3.5 to-720:py-[9px] to-720:text-[13px]"
    >
      <strong className="font-extrabold">{offer}</strong>
      {/* Keep the offer, drop the qualifier on phones so it stays on one line. */}
      <span className="mx-2 opacity-45 to-720:hidden" aria-hidden="true">
        ·
      </span>
      <span className="to-720:hidden">applied automatically, no code needed</span>
      <svg
        className="ml-2 flex-none transition-transform duration-[160ms] ease-[ease] group-hover:translate-x-[3px]"
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </Button>
  );
}
