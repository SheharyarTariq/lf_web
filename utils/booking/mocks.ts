/* ══════════════════════════════════════════════════════════════════
   Stand-ins for the endpoints the backend still owes
   ══════════════════════════════════════════════════════════════════

   Every mock in the checkout lives here, each next to the request that
   replaces it, so the swap is one function body at a time and nothing
   else in the flow has to know where its data came from. The components
   take their data as props precisely so that stays true.

   What is left is **unreachable for a signed-in customer** and survives only
   until guest checkout is decided. A session settles who somebody is, so the
   account check, the code and the provider buttons are all gated off behind
   it — see `signedIn` in the contact screen and in flow.ts `furthestAllowed`.
   None of the three has an endpoint to be replaced by; that is the open
   question, not an outstanding piece of wiring.
   ══════════════════════════════════════════════════════════════════ */

import { type ProviderId } from "@/utils/booking/model";

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

/* `attemptLogin` was here. It is `login()` in utils/auth, against the real
   POST /login-check, and had no call site left. */

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

/* `lookupAddresses` was here. It is `findAddresses` in utils/booking/api.ts
   now, against the real POST /find-addresses — and the district table it used
   to derive the town from is gone with it, because the response carries both
   the town and whether we cover the postcode at all. */

/* `fetchCollectionAvailability` and `fetchDeliveryAvailability` were here.
   They are `fetchPickupSlots` / `fetchDropoffSlots` in utils/booking/api.ts
   now, against GET /slots/pickup and GET /slots/dropoff.

   The eco rule went with them but survived: the mock's "same weekday and the
   same window as the collection" is the real round schedule, not a
   placeholder, and it lives in `markEcoWindows` in model.ts. The endpoints
   send no eco flag, so it stays ours to derive. */

/* `makeReference` was here. The order number is `createOrder` in
   utils/booking/api.ts now, against the real POST /orders — and it always
   should have been the server's to mint, since it is printed on the
   confirmation and quoted in every email about the order. */
