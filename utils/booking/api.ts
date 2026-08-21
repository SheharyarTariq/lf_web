/* ══════════════════════════════════════════════════════════════════
   The checkout's endpoints
   ══════════════════════════════════════════════════════════════════

   Same shape as utils/auth: thin wrappers over `apiCall`, so the screens hold
   UI state and nothing else. This is where the slots and order calls go as
   they land.

   Everything here returns a discriminated result rather than throwing, and
   passes `showErrorToast: false`, because each of these has a state on screen
   that says more than a toast can — "we are not in your area yet" is not an
   error, and a failed lookup needs a Try again next to the field it belongs to.
   ══════════════════════════════════════════════════════════════════ */

import apiCall, { clearApiCache } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { readHumanMessage, readViolations, type ErrorBody } from "@/utils/api";
import {
  NOTE_MAX,
  slotLabel,
  type AddressResult,
  type Availability,
  type BookingData,
} from "@/utils/booking/model";

/* The brief opens with "Send Content-Type: application/json on POST", but
   apiCall defaults to application/ld+json for the other project's API Platform
   endpoints. Overridden per call rather than globally, since utils/ is shared. */
const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

/* The one PATCH in the brief, and it is strict about this — API Platform
   rejects a merge-patch sent as plain json. */
const MERGE_PATCH_HEADERS = {
  "Content-Type": "application/merge-patch+json",
  Accept: "application/json",
};

/** What the server sends. `line2`, `line3` and `county` come back null for
 *  addresses that have none, where the form's fields are all strings — hence
 *  the coercion below rather than nullable types spreading into BookingData. */
interface AddressRow {
  line1?: string | null;
  line2?: string | null;
  line3?: string | null;
  town?: string | null;
  county?: string | null;
  postcodeString?: string | null;
}

interface FindAddressesBody {
  isActive?: boolean;
  addresses?: AddressRow[];
}

export type FindAddressesResult =
  | { ok: true; isActive: boolean; addresses: AddressResult[] }
  | { ok: false; message: string };

const str = (v: string | null | undefined) => v ?? "";

/**
 * POST /find-addresses { postcodeString } → { isActive, addresses }
 *
 * **Public** — probed, it answers 200 with no token, which the brief does not
 * say. That is what lets the checkout's first step work for a signed-out
 * visitor, and it is the only checkout call that can.
 *
 * `isActive: false` is not a failure. It is the answer "we do not collect from
 * that postcode yet", and it replaces the hardcoded SERVED district table —
 * coverage is the server's to decide now, so adding a town no longer needs a
 * frontend deploy.
 */
export async function findAddresses(postcode: string): Promise<FindAddressesResult> {
  const res = await apiCall<FindAddressesBody>({
    endpoint: routes.api.findAddresses,
    method: "POST",
    data: { postcodeString: postcode.trim() },
    headers: JSON_HEADERS,
    showErrorToast: false,
  });

  if (!res.success) return { ok: false, message: res.message };

  return {
    ok: true,
    /* Absent reads as "not covered" rather than "covered": the failure that
       shows a waitlist card is recoverable, the one that walks somebody into
       booking a collection we cannot make is not. */
    isActive: res.data?.isActive === true,
    addresses: (res.data?.addresses ?? []).map((a) => ({
      line1: str(a.line1),
      line2: str(a.line2),
      line3: str(a.line3),
      town: str(a.town),
      county: str(a.county),
      postcodeString: str(a.postcodeString),
    })),
  };
}

/* ── Saving it on the account ─────────────────────────────────────── */

export interface AddressPayload {
  line1: string;
  line2: string;
  line3: string;
  town: string;
  county: string;
  postcode: string;
}

export type UpdateAddressResult =
  | { ok: true }
  | { ok: false; message: string; fields: Record<string, string> };

/** Empty optional lines go as null, not "". The server returns null for the
 *  ones an address does not have, and sending it back a blank string where it
 *  said null is how a "no changes" save ends up looking like an edit. */
const orNull = (v: string) => v.trim() || null;

/**
 * PATCH /users/{userId}/update-address — requires a token.
 *
 * Verified against staging end to end: this is what unblocks `/slots/*`, which
 * 500s with `Expected an instance of App\Entity\Postcode. Got: NULL` until the
 * account has an address. Nothing in the brief says so.
 *
 * The server normalises the postcode — send `KT21 1PG`, `/my-status` gives back
 * `KT211PG` — so treat its copy as authoritative rather than assuming ours
 * round-trips unchanged.
 */
export async function updateAddress(
  userId: string | number,
  a: AddressPayload,
): Promise<UpdateAddressResult> {
  const res = await apiCall({
    endpoint: routes.api.updateAddress(userId),
    method: "PATCH",
    data: {
      line1: a.line1.trim(),
      line2: orNull(a.line2),
      line3: orNull(a.line3),
      town: a.town.trim(),
      county: orNull(a.county),
      postcodeString: a.postcode.trim(),
    },
    headers: MERGE_PATCH_HEADERS,
    showErrorToast: false,
  });

  if (res.success) return { ok: true };

  /* 422 names the property, and line1/town are fields on this very form, so
     the message belongs under the input rather than in a banner above it. */
  const body = (res.data ?? null) as ErrorBody | null;
  return {
    ok: false,
    message: readHumanMessage(body, res.status) ?? res.message,
    fields: readViolations(body),
  };
}

/* ── Collection and delivery windows ──────────────────────────────
   Both endpoints answer with the same shape — an array of day groups —
   which is turned into the map the calendar reads.

   Both require a token **and** a saved address on the account: without one
   they 500 from AreaResolver rather than returning anything useful. So
   update-address above has to have run first.
   ───────────────────────────────────────────────────────────────── */

interface SlotRow {
  id?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

interface DayGroup {
  date?: string | null;
  slots?: SlotRow[] | null;
}

export type SlotsResult = { ok: true; availability: Availability } | { ok: false; message: string };

/**
 * Day groups → `Availability`.
 *
 * Two things this has to do beyond reshaping:
 *
 * · **Drop days with no windows.** The endpoint sends today back with
 *   `slots: []`, and the calendar treats the presence of a key as "this day
 *   is open" — so keeping it would render a clickable date offering nothing.
 *
 * · **Keep the server's date string as the key.** `dayKey` is zero-padded to
 *   match it exactly; anything else and every lookup misses in silence.
 *
 * `eco` starts false for every window. Collection windows stay that way;
 * delivery ones are marked afterwards by `markEcoWindows`, which needs the
 * chosen collection to compare against.
 */
function toAvailability(groups: DayGroup[]): Availability {
  const out: Availability = {};
  for (const g of groups) {
    if (!g.date) continue;
    const slots = (g.slots ?? [])
      .filter((s): s is SlotRow & { id: string } => Boolean(s.id))
      .map((s) => ({
        id: s.id,
        label: slotLabel([s.startTime ?? "", s.endTime ?? ""]),
        eco: false,
      }));
    if (slots.length) out[g.date] = slots;
  }
  return out;
}

/**
 * GET /slots/pickup?postcode=&days= — 28 is the documented maximum.
 *
 * **`postcode` is what makes this work signed out**, and it is not in the
 * brief. Without it the endpoint resolves the area from the logged-in user and
 * answers 500 to anyone who is not one; with it, 200 and no token needed. It is
 * sent for everybody, not only guests, because it also *overrides* the
 * account's saved address — so the windows follow the address being booked
 * rather than whatever happens to be on the account.
 *
 * The caller must already know the postcode is served. An inactive one is a
 * 500 whose message is addressed to us rather than to a customer: "Callers
 * check the postcode is served before asking for its slots." The address
 * step's `isActive` check is that guard, which is why this is only ever
 * reached with a postcode that passed it.
 */
export async function fetchPickupSlots(postcode: string, days = 21): Promise<SlotsResult> {
  const res = await apiCall<DayGroup[]>({
    endpoint: routes.api.slotsPickup,
    method: "GET",
    data: { days, postcode },
    headers: JSON_HEADERS,
    showErrorToast: false,
  });

  if (!res.success || !Array.isArray(res.data)) {
    return { ok: false, message: readHumanMessage(null, res.status) ?? res.message };
  }
  return { ok: true, availability: toAvailability(res.data) };
}

/**
 * GET /slots/dropoff?pickupSlot=&pickupDate=&postcode=
 *
 * `pickupSlot` goes as an IRI (`/slots/{id}`), not a bare id — which is the
 * whole reason slot ids are carried through the booking at all.
 *
 * `postcode` does the same job as it does on pickup: it is the difference
 * between 200 and a 500 for a signed-out visitor.
 */
export async function fetchDropoffSlots(
  pickupSlotId: string,
  pickupDate: string,
  postcode: string,
): Promise<SlotsResult> {
  const res = await apiCall<DayGroup[]>({
    endpoint: routes.api.slotsDropoff,
    method: "GET",
    data: { pickupSlot: routes.api.slotIri(pickupSlotId), pickupDate, postcode },
    headers: JSON_HEADERS,
    showErrorToast: false,
  });

  if (!res.success || !Array.isArray(res.data)) {
    return { ok: false, message: readHumanMessage(null, res.status) ?? res.message };
  }
  return { ok: true, availability: toAvailability(res.data) };
}

/* ── The card ─────────────────────────────────────────────────────
   This is card *capture*, not payment. Nothing is charged at booking, because
   the total is unknowable until the items are counted — the card is stored
   against the account and charged afterwards, which is why the endpoint mints
   a SetupIntent rather than a PaymentIntent.

   The order of operations is fixed, and the last step is the one that is easy
   to think optional:

     1. elements.submit()                      — validate before asking us
     2. POST /payment-methods/setup-intent     — the client secret
     3. stripe.confirmSetup(…)                 — the card leaves the browser
     4. GET  /payment-methods/check-status     — *our* server confirms it saved

   Step 4 is not ceremony. Stripe answering "succeeded" means Stripe has the
   card; it does not mean we do. The endpoint answers `true` only once the card
   is attached to the account and made the default, and that is the state
   POST /orders requires.
   ───────────────────────────────────────────────────────────────── */

interface SetupIntentBody {
  setupIntentClientSecret?: string | null;
}

export type SetupIntentResult =
  | { ok: true; clientSecret: string }
  | { ok: false; message: string };

/** POST /payment-methods/setup-intent {} → { setupIntentClientSecret } */
export async function createSetupIntent(): Promise<SetupIntentResult> {
  const res = await apiCall<SetupIntentBody>({
    endpoint: routes.api.paymentMethodsSetupIntent,
    method: "POST",
    data: {},
    headers: JSON_HEADERS,
    showErrorToast: false,
  });

  if (!res.success) {
    const body = (res.data ?? null) as ErrorBody | null;
    return { ok: false, message: readHumanMessage(body, res.status) ?? res.message };
  }

  /* A 200 carrying no secret is not something to hand to Stripe.js, which
     would fail with wording written for a developer. */
  const clientSecret = res.data?.setupIntentClientSecret;
  if (!clientSecret) {
    return { ok: false, message: "We could not start the card setup. Please try again." };
  }
  return { ok: true, clientSecret };
}

interface CheckStatusBody {
  success?: boolean | null;
}

export type CheckSetupResult =
  /** `saved` is the endpoint's own answer, passed through unread. Only `true`
   *  means the card is attached to the account and made the default; see
   *  `awaitSetupIntent` for why `false` and `null` are not distinguished. */
  | { ok: true; saved: boolean | null }
  | { ok: false; message: string };

/** GET /payment-methods/check-status?setupIntentId= */
export async function checkSetupIntent(setupIntentId: string): Promise<CheckSetupResult> {
  const res = await apiCall<CheckStatusBody>({
    endpoint: routes.api.paymentMethodsCheckStatus,
    method: "GET",
    data: { setupIntentId },
    headers: JSON_HEADERS,
    showErrorToast: false,
  });

  if (!res.success) {
    const body = (res.data ?? null) as ErrorBody | null;
    return { ok: false, message: readHumanMessage(body, res.status) ?? res.message };
  }
  /* Absent reads as "not decided", the same as an explicit null. */
  return { ok: true, saved: res.data?.success ?? null };
}

/**
 * Poll `check-status` until it says the card is on the account.
 *
 * **Only `true` is an answer.** The brief describes `false` as "card entry
 * failed" and `null` as "still pending", but staging does not draw that line:
 * a SetupIntent that has simply not been confirmed yet answers
 * `{"success": false}` — probed. So immediately after `confirmSetup` resolves
 * there is a window where `false` means "our server has not attached it yet"
 * rather than "the card was refused", and the two are indistinguishable from
 * here.
 *
 * Treating that `false` as a decline is the expensive mistake: it sends
 * somebody off to find another card while the one they gave us is landing. So
 * anything that is not `true` is polled through, and the caller is told only
 * that the card is not confirmed *yet*. A card that is genuinely bad has
 * already failed earlier, at `confirmSetup`, with wording from Stripe.
 *
 * `clearApiCache()` before each attempt is load-bearing, not hygiene:
 * `apiCall` caches GETs on method, endpoint and params, none of which change
 * between polls. Without it every attempt after the first is served the first
 * answer out of memory and the loop cannot observe the thing it exists to wait
 * for.
 */
export async function awaitSetupIntent(
  setupIntentId: string,
  { attempts = 10, intervalMs = 1200 } = {},
): Promise<CheckSetupResult> {
  let last: CheckSetupResult = { ok: true, saved: null };
  for (let i = 0; i < attempts; i += 1) {
    if (i > 0) await new Promise((resolve) => setTimeout(resolve, intervalMs));
    clearApiCache();
    last = await checkSetupIntent(setupIntentId);
    /* A transport failure stops the run — retrying a dead connection ten times
       only makes somebody wait longer for the same answer. */
    if (!last.ok || last.saved === true) return last;
  }
  return last;
}

/* ── The order ────────────────────────────────────────────────────
   Last call in the flow, and the one with prerequisites: the account needs a
   saved address *and* a default card, because payment is taken from that card
   rather than at a pay screen. Both are satisfied by the steps before it —
   update-address on Continue, and the SetupIntent above, which the server
   makes the default on success.
   ───────────────────────────────────────────────────────────────── */

/** What the backend calls the three cadences, against what the toggle calls
 *  them. The design's ids are about the interval; the API's are about the
 *  subscription. Neither is wrong, so this is a translation, not a fix. */
const FREQUENCY: Record<string, string> = {
  week: "weekly",
  "2weeks": "biweekly",
  "4weeks": "every_four_weeks",
};

export interface OrderResult {
  id?: string | number;
  /** The human-friendly order number, minted by the server. It is printed on
   *  the confirmation and quoted in every email about the order, so it is the
   *  server's to issue — never ours.
   *
   *  An **integer** in practice — staging returns `3488`, not `"LF-3488"` —
   *  which is why the type admits both and the caller stringifies rather than
   *  assuming. The design's `LF-000000` is a placeholder, not the format. */
  number?: string | number | null;
  status?: string | null;
}

export type CreateOrderResult =
  | { ok: true; order: OrderResult }
  | { ok: false; message: string };

/**
 * POST /orders
 *
 * Slots go as IRIs (`/slots/{id}`), not bare ids — which is the whole reason
 * `collectionSlotId` / `deliverySlotId` are carried beside the labels through
 * the booking. Dates are the calendar's own day keys, already zero-padded to
 * `YYYY-MM-DD` by `dayKey` to match what the slots endpoints send back.
 */
export async function createOrder(data: BookingData): Promise<CreateOrderResult> {
  const note = data.access.trim().slice(0, NOTE_MAX);

  const body: Record<string, unknown> = {
    pickupDate: data.collectionDay,
    pickupSlot: routes.api.slotIri(data.collectionSlotId),
    dropoffDate: data.deliveryDay,
    dropoffSlot: routes.api.slotIri(data.deliverySlotId),
  };
  /* Both optional, and omitted rather than sent empty — an empty string is a
     value, which validators treat differently from absent. `frequency` turns
     the order into a subscription, so it must never be sent by accident. */
  if (note) body.note = note;
  if (data.repeat && FREQUENCY[data.repeatEvery]) {
    body.frequency = FREQUENCY[data.repeatEvery];
  }

  const res = await apiCall<OrderResult>({
    endpoint: routes.api.orders,
    method: "POST",
    data: body,
    headers: JSON_HEADERS,
    showErrorToast: false,
  });

  if (!res.success) {
    const errorBody = (res.data ?? null) as ErrorBody | null;
    return { ok: false, message: readHumanMessage(errorBody, res.status) ?? res.message };
  }
  /* A 200 with no body is still an order — the server took it. Falling back to
     an empty object keeps the caller on the success path rather than telling
     somebody their booking failed when it did not. */
  return { ok: true, order: res.data ?? {} };
}

/* ── Managing the saved cards ─────────────────────────────────────
   Both take an id from `paymentMethods` on /my-status, and neither returns
   anything worth reading — the list is re-read from /my-status afterwards
   rather than patched locally, so what is on screen is always the server's
   answer rather than our guess at it.

   No `clearApiCache()` here, unlike the check-status poll: these are
   mutations, and `apiCall` empties the GET cache on every one, so the
   /my-status that follows is already fresh.
   ───────────────────────────────────────────────────────────────── */

export type CardActionResult = { ok: true } | { ok: false; message: string };

function cardFailure(res: { data: unknown; status: number | null; message: string }): CardActionResult {
  const body = (res.data ?? null) as ErrorBody | null;
  return { ok: false, message: readHumanMessage(body, res.status) ?? res.message };
}

/**
 * POST /payment-methods/{id}/mark-as-default
 *
 * This is how a card is *chosen*, not merely flagged: `POST /orders` charges
 * the default and carries no card field of its own, so the default is the
 * only expression of "use this one".
 */
export async function markCardDefault(id: string | number): Promise<CardActionResult> {
  const res = await apiCall({
    endpoint: routes.api.paymentMethodMarkDefault(id),
    method: "POST",
    data: {},
    headers: JSON_HEADERS,
    showErrorToast: false,
  });
  return res.success ? { ok: true } : cardFailure(res);
}

/**
 * DELETE /payment-methods/{id}
 *
 * **409 while an order is active** on the account — probed, and not in the
 * brief. That is reachable from the checkout, because somebody can be booking
 * a second collection while the first is still in flight, so the caller has to
 * be able to show the refusal rather than assume success.
 */
export async function deleteCard(id: string | number): Promise<CardActionResult> {
  const res = await apiCall({
    endpoint: routes.api.paymentMethodDelete(id),
    method: "DELETE",
    headers: JSON_HEADERS,
    showErrorToast: false,
  });
  return res.success ? { ok: true } : cardFailure(res);
}
