/* ══════════════════════════════════════════════════════════════════
   Stand-ins for the endpoints the backend still owes
   ══════════════════════════════════════════════════════════════════

   Every mock in the checkout lives here, each next to the request that
   replaces it, so the swap is one function body at a time and nothing
   else in the flow has to know where its data came from. The components
   take their data as props precisely so that stays true.

   Nothing here is real except the Stripe Payment Element, which mounts
   against a live publishable key (see components/booking/StripePayment).
   ══════════════════════════════════════════════════════════════════ */

import {
  addDays,
  dayKey,
  parseDay,
  slotLabel,
  SERVED,
  SLOT_TIMES,
  TURNAROUND_DAYS,
  districtOf,
  type AddressResult,
  type Availability,
  type ProviderId,
} from "@/utils/booking/model";

/* ── Who already has an account ───────────────────────────────────
   MOCK. Replace with a rate-limited endpoint that answers in constant
   time — this is the account-enumeration surface, and it is now probed
   on blur, so the rate limit matters more than before. */
const KNOWN_EMAILS = ["returning@laundryfree.co.uk"];
const KNOWN_MOBILES = ["07778423419", "+447778423419"];

export function accountExists(email: string): boolean {
  return KNOWN_EMAILS.includes(email.trim().toLowerCase());
}

export function mobileHasAccount(mobile: string): boolean {
  const n = mobile.replace(/[\s()]/g, "");
  return KNOWN_MOBILES.includes(n);
}

/* The async form, and the one the screen actually uses.
   ─────────────────────────────────────────────────────
   POST /api/account/exists  { email }  →  { exists: boolean }

   Replace the body and nothing else changes: the field already shows a
   spinner while this is in flight, discards answers that arrive after
   the address has moved on, and offers a retry if it throws.

   MOCK latency is deliberately slow enough to see. Set FAIL_CHECK_FOR to
   an address to exercise the failure path. */
const ACCOUNT_CHECK_MS = 700;
const FAIL_CHECK_FOR = "offline@example.com";

export function checkAccount(email: string): Promise<{ exists: boolean }> {
  const e = email.trim().toLowerCase();
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (e === FAIL_CHECK_FOR) reject(new Error("network"));
      else resolve({ exists: KNOWN_EMAILS.includes(e) });
    }, ACCOUNT_CHECK_MS);
  });
}

/* MOCK only: any password of 8+ characters is accepted, except the
   literal "wrongpass" so the failure state can be seen.
   POST /login-check { email, password } → 200 { token }  (see lib/api.ts,
   which already speaks to the real endpoint for the auth modal). */
export function attemptLogin(
  email: string,
  password: string,
): { ok: boolean; error?: string } {
  if (password === "wrongpass") return { ok: false, error: "That password is not right." };
  if (password.length < 8) return { ok: false, error: "That password is not right." };
  return { ok: true };
}

/* MOCK only. The real call returns the provider's verified email. */
export function signInWith(provider: ProviderId): { name: string; email: string } {
  return provider === "apple"
    ? { name: "Shahzaib Tariq", email: "sx8k2p9qmt@privaterelay.appleid.com" }
    : { name: "Shahzaib Tariq", email: "shahzaib.tariq@gmail.com" };
}

/* MOCK only: the code is always 123456.
   POST /api/account/verify { email, code } → { ok: boolean } */
const MOCK_CODE = "123456";

export function verifyCode(email: string, code: string): boolean {
  return code === MOCK_CODE;
}

/* ── Addresses ────────────────────────────────────────────────────
   MOCK stand-in for the postcode API. Returns addresses already split
   across the same line1/line2/line3/town/county fields the form uses, so
   the real lookup can be dropped in without a mapping step.
   GET /api/address?postcode=… → AddressResult[] */
export function lookupAddresses(postcode: string): AddressResult[] {
  const town = SERVED[districtOf(postcode)] || "";
  const base = { line2: "", line3: "", town, county: "Surrey" };
  return [
    { id: "a1", ...base, line1: "12 Upper Fairfield Road" },
    { id: "a2", ...base, line1: "14 Upper Fairfield Road" },
    {
      id: "a3",
      ...base,
      line1: "Flat 2",
      line2: "Fairfield House",
      line3: "42–44 Upper Fairfield Road",
    },
    { id: "a4", ...base, line1: "16 Upper Fairfield Road" },
    { id: "a5", ...base, line1: "18A Upper Fairfield Road" },
  ];
}

/* ── Availability ─────────────────────────────────────────────────
   The two functions below stand in for the backend. Both return the
   same shape — a map of dayKey to the windows offered on that day —
   and nothing else in the flow knows where that map came from, so
   replacing them with fetches is contained to these two bodies.

   Delivery deliberately takes the collection day *and* window, because
   what can be returned depends on when it was collected. That is also
   why delivery cannot be chosen until collection is settled.

   When these become async, the components already handle an empty map
   as "nothing offered", so a loading state is the only thing to add.

   GET /api/availability/collection            → Availability
   GET /api/availability/delivery?day=&slot=   → Availability
   ───────────────────────────────────────────────────────────────── */

/* MOCK only: vans run Wed, Fri, Sat and Sun, with a varying number of
   windows per day. Delete this with the two functions below. */
const MOCK_RUN_DAYS = [0, 3, 5, 6];

function mockSlotsFor(d: Date): string[] | null {
  if (!MOCK_RUN_DAYS.includes(d.getDay())) return null;
  const count = [4, 5, 6][d.getDate() % 3];
  return SLOT_TIMES.slice(0, count).map(slotLabel);
}

export function fetchCollectionAvailability(today: Date): Availability {
  const out: Availability = {};
  for (let i = 1; i <= 21; i += 1) {
    const d = addDays(today, i);
    const slots = mockSlotsFor(d);
    if (slots) out[dayKey(d)] = slots.map((label) => ({ label, eco: false }));
  }
  return out;
}

/* Eco marks the windows where a van is already due on that round, so the
   return trip costs no extra mileage. The mock approximates it as the
   same weekday and the same window as the collection — replace with
   whatever the routing data actually says. The flag is per slot because
   only some windows on a given day will be on an existing round. */
export function fetchDeliveryAvailability(
  collectionDay: string,
  collectionSlot: string,
): Availability {
  if (!collectionDay || !collectionSlot) return {};
  const collected = parseDay(collectionDay);
  if (!collected) return {};
  const from = addDays(collected, TURNAROUND_DAYS);
  const out: Availability = {};
  for (let i = 0; i <= 21; i += 1) {
    const d = addDays(from, i);
    const slots = mockSlotsFor(d);
    if (!slots) continue;
    const sameRound = d.getDay() === collected.getDay();
    out[dayKey(d)] = slots.map((label) => ({
      label,
      eco: sameRound && label === collectionSlot,
    }));
  }
  return out;
}

/* ── The order ────────────────────────────────────────────────────
   MOCK. The reference is the server's to mint — it is printed on the
   confirmation and quoted in every email about the order.
   POST /api/orders { … } → { reference } */
export function makeReference(): string {
  const n = Math.floor(100000 + Math.random() * 900000);
  return `LF-${n}`;
}
