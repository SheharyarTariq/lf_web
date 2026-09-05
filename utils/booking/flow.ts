/* ══════════════════════════════════════════════════════════════════
   Four axes, and the shapes of the flow they cut between
   ══════════════════════════════════════════════════════════════════

   Narrow keeps the Review screen, because there is nowhere else to put a
   summary on a phone. Wide drops it: the summary is pinned beside the
   form the whole way through, so a screen that only repeats what is
   already on the right is a click for nothing.

   Signed out, both are four labelled steps. The fourth is Review on a phone
   and Payment on a desktop — the difference is which screen the last step
   lands on, not how far along someone is.

   The other three axes each take a step out for an account that has already
   answered it. They share one argument: a screen whose entire content is read
   back from /my-status, above a button that is already live, is a click for
   nothing — and worse than nothing when the fields look editable and are not.

   · `skipContact` — the account carries a name, a valid UK mobile and its
     email, which is everything the Details step asks for.

   · `skipAddress` — the account carries a complete address the server says it
     serves. `seedFromStatus` has already copied it into the booking, so the
     step would open pre-filled with a locked postcode row.

   Those two can be undone. Both summaries show an Address row and a Contact row
   whether or not their step is in the walk — an order summary that omits where
   the laundry goes or who it is for is not a summary — and both carry an Edit
   link. Asking for either step is what puts it back in the walk; see `go()` in
   booking-shell. What the Details step can then change is the booking's copy
   and nothing else: the order payload carries no contact fields and there is no
   endpoint to save a name or a number against, so the account's values return
   with the next /my-status. The screen says as much, above the fields.

   One consequence, and the reason ContactScreen carries a Confirm order button:
   the wide walk ends at `payment`, so for an account that skips it, un-skipping
   Details puts that step at the tail. `nextAfter` returning null is the only
   test of that, and every screen that can be last has to answer it.

   · `skipPayment` — the account has a default card. Nothing is charged at the
     checkout anyway (the step is a SetupIntent, not a payment), and POST
     /orders takes the default card and carries no card field of its own, so
     there is no choice left on that screen to make.

   An account missing any of it keeps its step — the ones made before the mobile
   was required at signup, an address in a district we do not serve, a first
   order with no card yet. That is the whole fallback: each skip fades in as its
   own gap closes, and nothing has to be backfilled.
   ══════════════════════════════════════════════════════════════════ */

import type { BookingData } from "@/utils/booking/model";
import type { MyStatus, MyStatusAddress } from "@/utils/auth";
import { isValidName } from "@/utils/auth/model";

export type Route = "address" | "time" | "contact" | "review" | "payment" | "confirmed";

/** The four things that decide which screens are in the walk. */
export type Flow = {
  wide: boolean;
  skipContact: boolean;
  skipAddress: boolean;
  skipPayment: boolean;
};

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

/* The walk: the screens somebody is taken through, in order, and nothing else.
   `confirmed` is deliberately absent — it is where the flow lands once an order
   exists, not a step anyone walks to, and its absence is what makes
   `nextAfter(route, flow) === null` mean "this screen carries Confirm order".
   With it in the list, a Time step that is last would have offered a Continue
   to the confirmation of an order that had never been placed. */
const WALK_NARROW: Route[] = ["address", "time", "contact", "review", "payment"];
const WALK_WIDE: Route[] = ["address", "time", "contact", "payment"];

/* Every route the URL parser accepts, which is a wider set than any one walk:
   neither the parser nor the guard should reject /book/review just because the
   window is wide, and /book/contact stays a recognised URL even when it is not
   in the walk. The guard is what turns a deep link to a skipped step into a
   redirect; the parser refusing to name it would send them to the start
   instead. Also what `generateStaticParams` renders. */
export const ROUTES: Route[] = [
  "address",
  "time",
  "contact",
  "review",
  "payment",
  "confirmed",
];

const skipped = ({ skipContact, skipAddress, skipPayment }: Flow): Set<string> => {
  const out = new Set<string>();
  if (skipContact) out.add("contact");
  if (skipAddress) out.add("address");
  if (skipPayment) out.add("payment");
  return out;
};

export const routesFor = (flow: Flow): Route[] => {
  const out = skipped(flow);
  return (flow.wide ? WALK_WIDE : WALK_NARROW).filter((r) => !out.has(r));
};
export const stepsFor = (flow: Flow) => {
  const out = skipped(flow);
  return (flow.wide ? STEPS_WIDE : STEPS_NARROW).filter(([id]) => !out.has(id));
};

/** The screen after this one, or null at the end of the walk. The one place a
 *  screen's successor is worked out — hardcoding it is how Time ended up
 *  pushing to a step that is no longer in the set. Null is also how a screen
 *  knows it is the last one and so carries Confirm order rather than Continue. */
export const nextAfter = (route: Route, flow: Flow): Route | null => {
  const routes = routesFor(flow);
  const here = routes.indexOf(route);
  return here < 0 || here === routes.length - 1 ? null : routes[here + 1];
};

/* ── What the account already answers ─────────────────────────────
   Both read /my-status, and both are the *account's* answer rather than the
   booking's: `data` is the seed plus anything typed since, and the question
   these settle is what was already on file. Same reasoning as skipContact,
   which is computed from `status.user` for exactly this reason. */

/**
 * A saved address complete enough to book against.
 *
 * The field test is character-for-character `furthestAllowed`'s, and the
 * `isActive` test is `seedFromStatus`'s. That is not a coincidence to be
 * tidied away: the same completeness has to decide the seed, the skip and the
 * guard, or the guard bounces somebody towards a step that is not in the walk.
 */
export const savedAddressUsable = (address?: MyStatusAddress | null): boolean =>
  Boolean(address?.line1 && address.town && address.postcodeString && address.isActive !== false);

/**
 * A card the server would charge.
 *
 * `isDefault`, not merely a card in the list: POST /orders takes payment from
 * the default and carries no card field of its own, so a list with no default
 * in it is an account we cannot bill.
 */
export const hasDefaultCard = (status?: MyStatus | null): boolean =>
  Boolean(status?.paymentMethods?.some((m) => m.isDefault));

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

   Nothing here knows about the three skips, and it does not need to: an
   account only skips a step once the seed has put everything that step asks
   for into the booking, so the tests below pass on their own. If a seed ever
   produced less than that, naming the skipped step would be the right answer —
   it would still be in the walk, because the same completeness decides both.

   The answer can name a route the walk does not contain — "payment" for an
   account that skips it. That means everything is filled in, not that nothing
   is reachable; `reachIndex` below is what turns it back into a position. */
export function furthestAllowed(d: BookingData, signedIn = false): Route {
  if (!(d.postcode && d.line1 && d.town)) return "address";
  if (!(d.collectionDay && d.collectionSlot && d.deliveryDay && d.deliverySlot)) return "time";
  /* The name against its rule rather than its truthiness — the same test
     skipContact uses, because the same completeness decides both and a name
     the Details step would refuse must not be a name that walks past it. */
  if (!(isValidName(d.fullName) && d.mobile && d.email)) return "contact";
  /* No account yet — the card and the order both need one. */
  if (!signedIn && !d.verified) return "contact";
  return "payment";
}

/**
 * How far along the walk `furthestAllowed`'s answer reaches.
 *
 * `routes.indexOf(allowed)` alone is -1 whenever the answer is a step this
 * shape of the flow has skipped, and -1 read as a position means "nothing is
 * reachable" — which disabled every dot in the indicator the first time a
 * complete account met `skipPayment`.
 *
 * The implication runs the other way. A skipped step is one the account has
 * already answered, and `furthestAllowed` only names a step whose predecessors
 * are all satisfied, so an answer outside the walk can only mean the whole walk
 * is open. Hence the fallback to the last index rather than to the first.
 */
export function reachIndex(routes: Route[], allowed: Route): number {
  const here = routes.indexOf(allowed);
  return here < 0 ? routes.length - 1 : here;
}
