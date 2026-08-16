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
  collectionSlot: string;
  deliveryDay: string;
  deliverySlot: string;
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
  deliveryDay: "",
  deliverySlot: "",
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
   Districts we actually collect from. Anything else routes to the
   waitlist instead of a dead end. */
export const SERVED: Record<string, string> = {
  KT17: "Ewell",
  KT18: "Epsom",
  KT19: "Epsom",
  KT21: "Ashtead",
  KT22: "Leatherhead",
};

/* ── Discount ─────────────────────────────────────────────────────
   null = returning customer, so no discount row is rendered at all. A
   "£0 off" line reads like a bug. The backend sends this; because the
   order total is not known until items are counted, it can only ever be
   a percentage here — the cash figure appears on the invoice. */
export interface Discount {
  label: string;
  value: number;
  unit: string;
}

const FIRST_ORDER_DISCOUNT: Discount = {
  label: "25% off your first order",
  value: 25,
  unit: "percent",
};

/* Swap to null to see the returning-customer variant of the review
   screen. */
export const DISCOUNT: Discount | null = FIRST_ORDER_DISCOUNT;

/* ── Rules ────────────────────────────────────────────────────── */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const UK_MOBILE_RE = /^(?:\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}$/;

/* Eight or more, one capital and one symbol. Kept as one regex so the
   client and the server can be checked against the same rule rather than
   two prose descriptions that drift. */
export const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
export const PASSWORD_RULE =
  "At least 8 characters, one capital letter and one symbol (! ? @ # £ %)";

export type StrengthLevel = "weak" | "ok" | "strong";

/* Five cheap signals rather than a real entropy estimate — enough to
   tell someone their password is thin, which is all a meter is for. */
export function passwordStrength(
  pw: string,
): { level: StrengthLevel; label: string; pct: number } | null {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (score <= 2) return { level: "weak", label: "weak", pct: 33 };
  if (score <= 4) return { level: "ok", label: "moderate", pct: 66 };
  return { level: "strong", label: "strong", pct: 100 };
}

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

export interface AddressResult {
  id: string;
  line1: string;
  line2: string;
  line3: string;
  town: string;
  county: string;
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

export interface Slot {
  label: string;
  eco: boolean;
}

/** dayKey → the windows offered that day. */
export type Availability = Record<string, Slot[]>;

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

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
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
export function firstEcoSlot(
  availability: Availability,
): { day: string; slot: string } | null {
  const days = Object.keys(availability).sort(
    (a, b) => Number(parseDay(a)) - Number(parseDay(b)),
  );
  for (const day of days) {
    const slot = availability[day].find((s) => s.eco);
    if (slot) return { day, slot: slot.label };
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

export const SOCIAL: [id: ProviderId, label: string][] = [
  ["apple", "Apple"],
  ["google", "Google"],
];

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
