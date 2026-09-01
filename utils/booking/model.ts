/* ══════════════════════════════════════════════════════════════════
   The booking flow — shapes, constants and pure helpers
   ══════════════════════════════════════════════════════════════════

   Everything in here is data or arithmetic: no React, no mocks, no
   network. `mocks.ts` imports this; `flow.ts` imports both. Keeping the
   dependency running one way means the stand-in lookups can be deleted a
   function at a time without unpicking the model.

   Design intent, so the reasoning survives the next edit:

   • No signup gate. The account and the order are created together on
     the final submit. The only place a login can appear is the contact
     screen, and only because the email is already registered — and even
     then the part-filled booking is kept, never reset.

   • Nothing is charged at booking. The total is unknowable until items
     are counted, so the card is stored and charged afterwards. Every
     screen that mentions money says so explicitly.

   • No item picker. "Bag it however it comes" is the product; asking
     people to itemise at checkout would throw that away.
   ══════════════════════════════════════════════════════════════════ */

/* ── The booking ──────────────────────────────────────────────── */

export interface BookingPrefs {
  priceReview: boolean;
  hangers: boolean;
  stains: boolean;
}

export interface BookingData {
  postcode: string;
  line1: string;
  line2: string;
  line3: string;
  town: string;
  county: string;
  access: string;
  collectionDay: string;
  /** The window as shown, e.g. "08:00–10:00". Five screens print this. */
  collectionSlot: string;
  /** The same window's server id. Carried beside the label rather than
   *  replacing it, so the summary, review and confirmed screens keep working
   *  unchanged while POST /orders gets the IRI it needs. */
  collectionSlotId: string;
  deliveryDay: string;
  deliverySlot: string;
  deliverySlotId: string;
  deliveryEco: boolean;
  repeat: boolean;
  repeatEvery: string;
  fullName: string;
  mobile: string;
  email: string;
  verified: boolean;
  identity: string;
  cardReady: boolean;
  terms: boolean;
  prefs: BookingPrefs;
}

export const EMPTY: BookingData = {
  postcode: "",
  line1: "",
  line2: "",
  line3: "",
  town: "",
  county: "",
  access: "",
  collectionDay: "",
  collectionSlot: "",
  collectionSlotId: "",
  deliveryDay: "",
  deliverySlot: "",
  deliverySlotId: "",
  deliveryEco: false,
  repeat: false,
  repeatEvery: "week",
  fullName: "",
  mobile: "",
  email: "",
  verified: false,
  identity: "",
  cardReady: false,
  terms: false,
  prefs: { priceReview: false, hangers: false, stains: false },
};

/** Anything the screens can hand back to the container. */
export type BookingPatch = Partial<BookingData>;

/* ── Coverage ─────────────────────────────────────────────────────
   The SERVED district table that used to live here is gone. Coverage comes
   from `isActive` on the /find-addresses response now, so adding a town is a
   backend change rather than a frontend deploy. `districtOf` stays, because
   the out-of-area card still names the district it cannot serve.

   Anything out of area routes to the waitlist rather than a dead end — that
   part is unchanged, only who decides it. */

/* ── Discount ─────────────────────────────────────────────────────
   null = no discount, so no row is rendered at all. A "£0 off" line reads
   like a bug.

   The hardcoded 25% that used to live here is gone, along with the returning
   customer it lied to. The figure now comes from the server — the public
   first-order table for a visitor, `nextOrderDiscount` on /my-status once we
   know whose order it is — and utils/discount is the one place that decides
   which. The type is re-exported so the context and the three screens that
   render a discount still import it from the model they already read. */
export type { Discount } from "@/utils/discount";

/* ── Rules ────────────────────────────────────────────────────── */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* UK_MOBILE_RE used to live here too, matching the number as typed — +44,
   spaces, parentheses and all — because the mobile field was a free text box.
   It is a <PhoneInput> now, holding only the national part behind a fixed +44,
   which is the shape utils/auth/model's rule already described. Two constants
   for one field was how a valid number came to be refused, so contact/schema
   imports that one and this one is gone. */

/** `7700211244` → `+44 7700 211244`. For reading the number back on Review and
 *  in the summary, where the bare digits the field holds would be a worse
 *  answer to "is this the right number?" than the form it was entered in. */
export function formatUkMobile(national: string): string {
  const n = String(national || "").replace(/\D/g, "");
  /* Anything unexpected is shown as-is rather than sliced into a shape it does
     not have — a half-typed number is still the customer's to recognise. */
  if (!/^7\d{9}$/.test(n)) return national;
  return `+44 ${n.slice(0, 4)} ${n.slice(4)}`;
}

/* `PASSWORD_RE`, `PASSWORD_RULE`, `StrengthLevel` and `passwordStrength()`
   stood here for the identity panel's password row. The checkout registers
   through /register-as-guest now, which takes no password, so the row and its
   strength meter are gone and nothing in the booking flow asks anybody to
   choose a password. The header's sign-up still does, from the canonical
   copies in utils/auth/model.ts. */

/* Character-for-character the backend's Assert\Regex, so a postcode that
   passes here cannot fail on submit. Keep the two in step — including
   the case-insensitive classes, which are redundant now the field
   uppercases as you type but make the two patterns diffable. */
export const POSTCODE_RE =
  /^([Gg][Ii][Rr] ?0[Aa]{2}|[A-Za-z]{1,2}[0-9][A-Za-z]?[0-9][A-Za-z]{2}|[A-Za-z]{1,2}[0-9]{1,2}[A-Za-z]? ?[0-9][A-Za-z]{2})$/;

/* Uppercase and trim only — no space is inserted. The regex accepts one
   optional space, so whatever the person types is kept as they typed it
   and stored the same way the app stores it. */
export function normalisePostcode(raw: string): string {
  return raw.toUpperCase().trim();
}

export function districtOf(postcode: string): string {
  const m = postcode.toUpperCase().match(/^[A-Z]{1,2}\d[A-Z\d]?/);
  return m ? m[0] : "";
}

/* ── The verification code ────────────────────────────────────────
   A code, not a magic link. On a phone a link opens in whichever browser
   owns the mail app, which is usually not the one holding the half-filled
   booking — and since an abandoned verification leaves no order behind,
   that person starts again from nothing. The same token generator can
   mint a numeric code; it just needs storing hashed, with an expiry, an
   attempt count and a resend throttle. */
export const CODE_LENGTH = 6;
export const RESEND_SECONDS = 60;
export const MAX_CODE_ATTEMPTS = 5;

/* ── Email domain suggestions ─────────────────────────────────────
   The list is only four long on screen, so the order is the whole value
   of it. The first five are fixed by hand; the rest are the long tail. */
const EMAIL_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "yahoo.com",
  "outlook.com",
  "icloud.com",
  "yahoo.co.uk",
  "hotmail.co.uk",
  "live.co.uk",
  "btinternet.com",
  "sky.com",
  "aol.com",
  "me.com",
  "googlemail.com",
  "msn.com",
  "virginmedia.com",
  "talktalk.net",
  "ntlworld.com",
  "protonmail.com",
  "outlook.co.uk",
  "blueyonder.co.uk",
];
const DOMAIN_SUGGESTIONS = 4;

/* Whether the address already ends in a domain we know in full. Nothing
   more is coming, so there is no reason to sit on a timer. */
export function domainComplete(value: string): boolean {
  const at = value.indexOf("@");
  return at > 0 && EMAIL_DOMAINS.includes(value.slice(at + 1).trim().toLowerCase());
}

export function domainSuggestions(value: string): string[] {
  const at = value.indexOf("@");
  const local = (at === -1 ? value : value.slice(0, at)).trim();
  /* One character is not enough to be worth offering, and a space means
     this is not an address being typed. */
  if (local.length < 2 || /\s/.test(local)) return [];
  const typed = at === -1 ? "" : value.slice(at + 1).trim().toLowerCase();
  if (typed && EMAIL_DOMAINS.includes(typed)) return [];
  const hits = typed ? EMAIL_DOMAINS.filter((d) => d.startsWith(typed)) : EMAIL_DOMAINS;
  return hits.slice(0, DOMAIN_SUGGESTIONS).map((d) => `${local}@${d}`);
}

/* ── The address form ─────────────────────────────────────────────
   Mirrors the address screen in the app: three optional address lines,
   a required town and an optional county, with the postcode captured
   first and shown back as a locked row. Keeping the web form identical
   means one address shape across both clients and no mapping layer. */
export type AddressKey = "line1" | "line2" | "line3" | "town" | "county";

export const ADDRESS_FIELDS: [
  key: AddressKey,
  label: string,
  required: boolean,
  autoComplete: string,
  placeholder: string,
][] = [
  ["line1", "Address line 1", true, "address-line1", "Flat 2"],
  ["line2", "Address line 2", false, "address-line2", "Fairfield House"],
  ["line3", "Address line 3", false, "address-line3", "42–44 Upper Fairfield Road"],
  ["town", "Town", true, "address-level2", "Leatherhead"],
  ["county", "County", false, "address-level1", "Surrey"],
];

/** One row from /find-addresses.
 *
 *  No `id` — the server does not send one, so the list is keyed by index
 *  within a single response rather than by a field that does not exist.
 *
 *  `postcodeString` is the row's *own* postcode, which is not necessarily the
 *  one that was searched for. Use it rather than echoing the search: it is the
 *  address's actual postcode, and it is what gets saved. */
export interface AddressResult {
  line1: string;
  line2: string;
  line3: string;
  town: string;
  county: string;
  postcodeString: string;
}

/* ── Windows ──────────────────────────────────────────────────────
   The full grid a day can offer. The backend returns a subset per day —
   some days four windows, some six, some days nothing at all — so this
   is only ever the vocabulary, never the availability. */
export const SLOT_TIMES: [from: string, to: string][] = [
  ["08:00", "10:00"],
  ["10:00", "12:00"],
  ["12:00", "14:00"],
  ["14:00", "16:00"],
  ["16:00", "18:00"],
  ["18:00", "20:00"],
];

/* Two clear days between collection and delivery — the 48h turnaround
   quoted on the landing page. Keep the two in step. */
export const TURNAROUND_DAYS = 2;

/* The backend's cap on `note` in POST /orders. Held here rather than in the
   request wrapper so the textarea and the payload enforce one number: the
   field stops accepting characters at exactly the point the server would
   start refusing them. */
export const NOTE_MAX = 400;

export interface Slot {
  /** The server's slot id. POST /orders wants it as an IRI (`/slots/{id}`),
   *  so it has to travel with the choice — the label alone cannot be turned
   *  back into one. */
  id: string;
  label: string;
  eco: boolean;
}

/** dayKey → the windows offered that day. */
export type Availability = Record<string, Slot[]>;

/** Which half of the time step is on screen.
 *
 *  It lives with the booking rather than inside the time screen because the
 *  summary's "Edit" links have to be able to name a leg — "Edit collection
 *  time" that opens the delivery tab is worse than no link at all. See
 *  `timeLeg` on the booking context. */
export type Leg = "collection" | "delivery";

/* Revealed only once Repeat is switched on, the same as the app. Showing
   three frequency buttons to everyone would add a decision that most
   people booking a one-off never need to make. */
export const REPEAT_EVERY: [id: string, label: string, prose: string][] = [
  ["week", "Week", "every"],
  ["2weeks", "2 weeks", "every other"],
  ["4weeks", "4 weeks", "every fourth"],
];

/* ── Dates ────────────────────────────────────────────────────── */

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
export const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/* Monday-first, which is what a UK customer expects. */
export const WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* Zero-padded, because these keys are now compared against the dates the
   slots endpoints send — `2026-08-04`, not `2026-8-4`. Unpadded, every
   `available[dayKey(d)]` lookup in the calendar misses and the whole grid
   renders disabled with no error anywhere. parseDay reads both. */
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseDay(k: string): Date | null {
  if (!k) return null;
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function longDate(d: Date): string {
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function slotLabel(slot: [string, string]): string {
  return slot ? `${slot[0]}–${slot[1]}` : "";
}

/** The first eco window on offer, or null. Used to preselect it. */
/* ── Greener windows ──────────────────────────────────────────────
   The van runs a round on a fixed weekday. A delivery that lands on the
   same weekday and in the same window as the collection is a stop the van
   is already making, so it costs no extra mileage — that is the whole
   claim, and it is the reason this is computed here rather than asked for.

   The slots endpoints send no eco flag, so this is ours to derive. It is
   arithmetic over the collection the person already chose, not a guess: if
   the round schedule ever stops working this way, the rule moves to the
   backend and this becomes a passthrough. */
export function markEcoWindows(
  availability: Availability,
  collectionDay: string,
  collectionSlot: string,
): Availability {
  const collected = parseDay(collectionDay);
  if (!collected || !collectionSlot) return availability;

  const out: Availability = {};
  for (const [day, slots] of Object.entries(availability)) {
    const d = parseDay(day);
    const sameRound = Boolean(d && d.getDay() === collected.getDay());
    out[day] = slots.map((s) => ({ ...s, eco: sameRound && s.label === collectionSlot }));
  }
  return out;
}

export function firstEcoSlot(
  availability: Availability,
): { day: string; slot: string; id: string } | null {
  const days = Object.keys(availability).sort(
    (a, b) => Number(parseDay(a)) - Number(parseDay(b)),
  );
  for (const day of days) {
    const slot = availability[day].find((s) => s.eco);
    /* The id travels with it, because this preselects a real choice and
       POST /orders will need the IRI for whatever was picked. */
    if (slot) return { day, slot: slot.label, id: slot.id };
  }
  return null;
}

/* Short, but it still has to survive every combination: three cadences,
   and legs that may or may not share a weekday and window. "Every 2
   weeks" alone leaves people guessing which day it lands on and when it
   starts, so the day, the window and the first date all stay. */
export function repeatSentence(data: BookingData): string {
  const collect = parseDay(data.collectionDay);
  const deliver = parseDay(data.deliveryDay);
  if (!collect || !deliver) return "";

  const weeks = ({ week: 1, "2weeks": 2, "4weeks": 4 } as Record<string, number>)[
    data.repeatEvery
  ] || 1;
  const first = `First on ${longDate(collect)}.`;
  const sameLeg =
    collect.getDay() === deliver.getDay() && data.collectionSlot === data.deliverySlot;

  if (sameLeg) {
    /* "Every week on Wednesday" is clumsy where "Every Wednesday" is not,
       so the weekly case gets its own phrasing. */
    const when =
      weeks === 1
        ? `Every ${DAY_FULL[collect.getDay()]}`
        : `Every ${weeks} weeks on ${DAY_FULL[collect.getDay()]}`;
    return `${when}, ${data.collectionSlot}. ${first} Skip any week.`;
  }

  const cadence = weeks === 1 ? "Every week" : `Every ${weeks} weeks`;
  return `${cadence} — collect ${DAY_NAMES[collect.getDay()]} ${data.collectionSlot}, return ${DAY_NAMES[deliver.getDay()]} ${data.deliverySlot}. ${first} Skip any week.`;
}

/* ── Provider sign-in ─────────────────────────────────────────────
   Identity from the provider, never from the wallet. Apple Pay and
   Google Pay hand back the billing contact saved against the card, which
   is routinely an address the person stopped reading years ago — no use
   when the price breakdown is emailed. A sign-in returns the account
   they actually use, already verified, so the code step is skipped.

   One operational catch for whoever wires Apple up: if the person picks
   "Hide My Email" you receive a @privaterelay.appleid.com address. Mail
   to it only forwards once the sending domain is registered with Apple,
   otherwise every price breakdown bounces silently. */
export type ProviderId = "apple" | "google";

/* `SOCIAL` was here — the pair of provider buttons the checkout's log-in
   sheet used to offer. They are gone with the mock behind them: there is no
   OAuth endpoint, so pressing one produced an account object and no token,
   and every step past that point now needs a real one. `ProviderId` stays;
   the contact screen still renders a provider mark for a session that came
   from one, which is what will be true again once the endpoints exist. */

/* ── Preferences (confirmation screen) ────────────────────────────
   They live there rather than in the checkout: they are genuine choices,
   and asking for them mid-booking adds friction before anything has been
   committed. Price Review is off by default — opting people into an
   approval step they did not ask for would delay their own order. */
export const PREFERENCES: [key: keyof BookingPrefs, title: string, desc: string][] = [
  [
    "priceReview",
    "Price Review",
    "We message you with the itemised price after counting and wait for your approval before charging. If you do not reply in time we go ahead so your order is not delayed.",
  ],
  ["hangers", "Return shirts on hangers", "Otherwise we return them neatly packed."],
  ["stains", "Treat visible stains", "We will apply stain treatment where we spot it."],
];
