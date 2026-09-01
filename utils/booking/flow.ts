/* ══════════════════════════════════════════════════════════════════
   Two axes, four shapes of the same flow
   ══════════════════════════════════════════════════════════════════

   Narrow keeps the Review screen, because there is nowhere else to put a
   summary on a phone. Wide drops it: the summary is pinned beside the
   form the whole way through, so a screen that only repeats what is
   already on the right is a click for nothing.

   Both are four labelled steps. The fourth is Review on a phone and
   Payment on a desktop — the difference is which screen the last step
   lands on, not how far along someone is.

   `skipContact` drops the Details step to make three. It is set when the
   signed-in account already carries a name, a valid UK mobile and its email —
   everything that screen asks for. `seedFromStatus` copies all three into the
   booking before anything mounts, so Details would render three fields read
   back from the account, a "Signed in" banner, and a Next button that is
   already live. Worse, the fields look editable and are not: the order payload
   carries none of them and there is no endpoint to save them against, so an
   edit made there is silently overwritten by the next /my-status.

   An account missing any of it — the ones made before the mobile was required
   at signup, and the social paths that return no number — keeps the step. That
   is the whole fallback: the skip fades in as the gap closes.
   ══════════════════════════════════════════════════════════════════ */

import type { BookingData } from "@/utils/booking/model";

export type Route = "address" | "time" | "contact" | "review" | "payment" | "confirmed";

/** The two things that decide which screens are in the walk. */
export type Flow = { wide: boolean; skipContact: boolean };

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

/* Every route any shape of the flow can be on, for the URL parser and the guard
   — neither should reject /book/review just because the window is wide, and
   /book/contact stays a recognised URL even when it is not in the walk. The
   guard is what turns a deep link to a skipped step into a redirect; the parser
   refusing to name it would send them to the start instead. */
export const ROUTES = ROUTES_NARROW;

export const routesFor = ({ wide, skipContact }: Flow): Route[] => {
  const routes = wide ? ROUTES_WIDE : ROUTES_NARROW;
  return skipContact ? routes.filter((r) => r !== "contact") : routes;
};
export const stepsFor = ({ wide, skipContact }: Flow) => {
  const steps = wide ? STEPS_WIDE : STEPS_NARROW;
  return skipContact ? steps.filter(([id]) => id !== "contact") : steps;
};

/** The screen after this one, or null at the end of the walk. The one place a
 *  screen's successor is worked out — hardcoding it is how Time ended up
 *  pushing to a step that is no longer in the set. */
export const nextAfter = (route: Route, flow: Flow): Route | null => {
  const routes = routesFor(flow);
  const here = routes.indexOf(route);
  return here < 0 || here === routes.length - 1 ? null : routes[here + 1];
};

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
   signed-in customer back to Details for one render.

   Nothing here knows about `skipContact`, and it does not need to: the only
   accounts that skip Details are the ones whose seed has already put a name, a
   mobile, an email and `verified: true` into the booking, so both of the tests
   below pass on their own. If a seed ever produced less than that, returning
   "contact" would be the right answer — the step would still be in the walk,
   because the same completeness decides both. */
export function furthestAllowed(d: BookingData, signedIn = false): Route {
  if (!(d.postcode && d.line1 && d.town)) return "address";
  if (!(d.collectionDay && d.collectionSlot && d.deliveryDay && d.deliverySlot)) return "time";
  if (!(d.fullName && d.mobile && d.email)) return "contact";
  /* No account yet — the card and the order both need one. */
  if (!signedIn && !d.verified) return "contact";
  return "payment";
}
