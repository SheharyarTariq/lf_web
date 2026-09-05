"use client";

import { createContext, useContext } from "react";
import type { Route } from "@/utils/booking/flow";
import type { BookingData, BookingPatch, Discount, Leg } from "@/utils/booking/model";

/**
 * Everything the six screens need from the shell.
 *
 * It lives in the layout rather than in each page so a step change keeps
 * a part-filled form: App Router unmounts the page on every navigation,
 * and holding the booking in the page would empty the address the moment
 * someone pressed Continue.
 */
export interface BookingContextValue {
  data: BookingData;
  patch: (next: BookingPatch) => void;
  /** The route currently on screen, read back from the URL. */
  step: Route;
  /** Push a route. The prototype's go() + history.pushState. */
  go: (next: Route) => void;
  /** One route back, or the exit prompt if there is nowhere left to go. */
  back: () => void;
  /**
   * One route on, whichever that is in the shape of the flow currently in play.
   *
   * Screens must use this rather than naming their successor: with the Details
   * step conditional, "the screen after Time" is Details for some customers and
   * Payment for others, and only the shell knows which.
   */
  forward: () => void;
  /** ≥1024px: the split layout with the pinned summary and no Review. */
  wide: boolean;
  /**
   * The Details step is out of the walk, because the signed-in account already
   * carries everything it asks for — see the header of utils/booking/flow.ts.
   *
   * The two summaries read it to drop their Contact row: with the step gone
   * there is nowhere for its Edit link to go, and nothing behind an edit to
   * save it. `data` still holds the contact fields, seeded from the account,
   * and the payment step still sends them to Stripe.
   */
  skipContact: boolean;
  /**
   * The card step is out of the walk, because the account already has a default
   * card and POST /orders charges the default — see the header of
   * utils/booking/flow.ts.
   *
   * The two summaries read it to decide whether to name the card at all: it is
   * the only place a returning customer is shown what is about to be charged,
   * since the screen that would otherwise have shown it is gone.
   */
  skipPayment: boolean;
  /**
   * This screen is the last in the walk, so its forward button places the order
   * rather than moving on.
   *
   * Which screen that is depends on the account: Payment for anyone who still
   * has to give us a card, Review on a phone without one, and the Time step
   * itself for a returning customer on a desktop. Screens ask rather than
   * assume, for the same reason they call `forward()` instead of naming a
   * successor.
   */
  isLast: boolean;
  /**
   * Which leg the time step has open.
   *
   * Held here rather than inside `TimeScreen` because two other screens write
   * it: the summary panel and the Review screen each carry an "Edit" link per
   * leg, and a link named "Edit collection time" has to be able to open the
   * collection tab. Kept out of `BookingData` — it is which tab is showing,
   * not part of the order.
   *
   * Living above the screen also means it survives navigation, so returning to
   * the time step lands on the tab it was left on rather than one re-guessed
   * from the data on every mount.
   */
  timeLeg: Leg;
  setTimeLeg: (leg: Leg) => void;
  /** Something is still hidden below the action bar, so it earns a shadow. */
  moreBelow: boolean;
  discount: Discount | null;
  /** The order number, once the server has minted one. Empty until then. */
  reference: string;
  /**
   * When the order was placed, as an ISO string. Empty until it is.
   *
   * Stamped in the shell at the moment POST /orders succeeds, rather than read
   * from the clock on the confirmation screen: that route is prerendered, so a
   * time taken during its render would differ between the served HTML and the
   * hydrating client. The endpoint returns no `createdAt` of its own.
   */
  placedAt: string;
  /**
   * POST /orders, then move to the confirmation.
   *
   * It does **not** take the card — the payment step owns that, because it
   * owns the Element and the decision about whether one is needed at all.
   * By the time this is called there must already be a default card on the
   * account, which is what the endpoint charges.
   *
   * Rejection is reported back rather than thrown, and it deliberately does
   * not navigate on failure: a confirmation screen for an order that was
   * never created is the one outcome worth any amount of code to avoid.
   */
  confirmOrder: () => Promise<{ ok: boolean; message?: string }>;
  requestExit: () => void;
  openLogin: (prefill?: string) => void;
  openBilling: () => void;
}

export const BookingContext = createContext<BookingContextValue | null>(null);

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside the /book layout");
  return ctx;
}
