"use client";

import { createContext, useContext } from "react";
import type { Route } from "@/utils/booking/flow";
import type { BookingData, BookingPatch, Discount } from "@/utils/booking/model";

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
  /** ≥1024px: the split layout with the pinned summary and no Review. */
  wide: boolean;
  /** Something is still hidden below the action bar, so it earns a shadow. */
  moreBelow: boolean;
  discount: Discount | null;
  reference: string;
  isNewAccount: boolean;
  confirmOrder: () => void;
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
