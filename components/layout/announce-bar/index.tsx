"use client";

import { useEffect, useState } from "react";
import Button from "@/components/common/Button";
import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { BRAND } from "@/utils/content";
import { useStartBooking } from "@/utils/hooks";

/**
 * The lime offer bar, above the sticky header so it scrolls away rather
 * than taking up permanent space. Clickable, because an offer people cannot
 * act on is just decoration.
 *
 * Replaces the old PromoBar and keeps its one piece of live wiring: the
 * discount figure comes from GET /system-status. The design's static "25%
 * off your first order" is the fallback, so an unset NEXT_PUBLIC_API_URL,
 * an offline server or a changed payload all degrade to the copy that was
 * designed rather than to a blank.
 *
 * TODO (integration phase): the checkout has its own hardcoded DISCOUNT
 * constant. Both should read one server-side eligibility answer — as it
 * stands a returning customer is shown a first-order offer.
 */

interface OrderDiscount {
  forOrder: number;
  type: string;
  amount: number;
}

interface SystemStatusResponse {
  orderDiscounts?: OrderDiscount[];
}

export default function AnnounceBar() {
  const [offer, setOffer] = useState<string>(BRAND.offer);
  const startBooking = useStartBooking();

  useEffect(() => {
    async function fetchDiscount() {
      const res = await apiCall<SystemStatusResponse>({
        endpoint: routes.api.systemStatus,
        method: "GET",
        /* A missing discount is not something to interrupt anyone about —
           the designed copy is already on screen and reads correctly. */
        showErrorToast: false,
      });
      if (!res.success || !Array.isArray(res.data?.orderDiscounts)) return;

      const firstOrderDiscount = res.data.orderDiscounts.find((d) => d.forOrder === 1);
      if (firstOrderDiscount && typeof firstOrderDiscount.amount === "number") {
        const suffix = firstOrderDiscount.type === "percent" ? "%" : "";
        setOffer(`${firstOrderDiscount.amount}${suffix} off your first order`);
      }
    }

    fetchDiscount();
  }, []);

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
