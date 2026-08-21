/* ══════════════════════════════════════════════════════════════════
   Two shapes of the same flow
   ══════════════════════════════════════════════════════════════════

   Narrow keeps the Review screen, because there is nowhere else to put a
   summary on a phone. Wide drops it: the summary is pinned beside the
   form the whole way through, so a screen that only repeats what is
   already on the right is a click for nothing.

   Both are four labelled steps. The fourth is Review on a phone and
   Payment on a desktop — the difference is which screen the last step
   lands on, not how far along someone is.
   ══════════════════════════════════════════════════════════════════ */

import type { BookingData } from "@/utils/booking/model";

export type Route = "address" | "time" | "contact" | "review" | "payment" | "confirmed";

const STEPS_NARROW: [id: string, label: string][] = [
  ["address", "Address"],
  ["time", "Time"],
  ["contact", "Details"],
  ["review", "Review"],
];
const STEPS_WIDE: [id: string, label: string][] = [
  ["address", "Address"],
  ["time", "Time"],
  ["contact", "Details"],
  ["payment", "Payment"],
];

const ROUTES_NARROW: Route[] = [
  "address",
  "time",
  "contact",
  "review",
  "payment",
  "confirmed",
];
const ROUTES_WIDE: Route[] = ["address", "time", "contact", "payment", "confirmed"];

/* Every route either flow can be on, for the URL parser and the guard —
   neither should reject /book/review just because the window is wide. */
export const ROUTES = ROUTES_NARROW;

export const routesFor = (wide: boolean): Route[] => (wide ? ROUTES_WIDE : ROUTES_NARROW);
export const stepsFor = (wide: boolean) => (wide ? STEPS_WIDE : STEPS_NARROW);

export const isRoute = (value: string): value is Route =>
  (ROUTES as string[]).includes(value);

/** Narrow: payment is the tail of the review step. Wide: it is the step. */
export function stepOf(route: Route, wide: boolean): string {
  if (wide) return route;
  return route === "payment" ? "review" : route;
}

/* Each screen may only be reached once the one before it has what it
   needs. Without this, a bookmarked /book/review renders a summary of
   empty strings.

   Address and Time are open to anyone: /find-addresses is public, and so are
   both slot endpoints once a `postcode` is passed — which is the whole reason
   the design's order survives contact with the API. Everything past Details
   needs a token, so `verified` is the gate, and it is set by exactly two
   things: the identity panel resolving, or the seed recognising a session.

   `signedIn` is now belt and braces rather than the rule. It covers the frame
   after a sign-in from the header, where the session exists but the seed that
   sets `verified` has not run yet — without it the guard would bounce a
   signed-in customer back to Details for one render. */
export function furthestAllowed(d: BookingData, signedIn = false): Route {
  if (!(d.postcode && d.line1 && d.town)) return "address";
  if (!(d.collectionDay && d.collectionSlot && d.deliveryDay && d.deliverySlot)) return "time";
  if (!(d.fullName && d.mobile && d.email)) return "contact";
  /* No account yet — the card and the order both need one. */
  if (!signedIn && !d.verified) return "contact";
  return "payment";
}
