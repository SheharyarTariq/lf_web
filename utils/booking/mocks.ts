/* ══════════════════════════════════════════════════════════════════
   Nothing in the checkout is mocked any more
   ══════════════════════════════════════════════════════════════════

   This file held the stand-ins for endpoints the backend owed. It is kept
   as the record of where each one went, because the answer is not always
   "a wrapper with the same name" — three of them turned out to be the wrong
   question rather than a missing endpoint.

   ── Replaced by a real request ───────────────────────────────────

   · `makeReference`                 → `createOrder`, POST /orders. The number
                                       is minted by the server, as it always
                                       should have been: it is printed on the
                                       confirmation and quoted in every email.
   · `attemptLogin`                  → `login()` in utils/auth.
   · `lookupAddresses`               → `findAddresses`, POST /find-addresses.
                                       The hardcoded SERVED district table went
                                       with it — coverage is `isActive` on the
                                       response now.
   · `fetchCollectionAvailability`   → `fetchPickupSlots`, GET /slots/pickup
   · `fetchDeliveryAvailability`     → `fetchDropoffSlots`, GET /slots/dropoff
                                       The eco rule survived the move into
                                       `markEcoWindows`: same weekday, same
                                       window is the real round schedule, and
                                       the endpoints send no flag for it.

   ── Deleted, because the question was wrong ──────────────────────

   · `accountExists` / `checkAccount` / `mobileHasAccount`
       These asked an unauthenticated endpoint whether an address or a number
       belongs to a customer. No such endpoint exists and none should: it
       answers "is this person one of yours?" to anybody who asks, which is an
       account enumeration oracle with a spinner on it.

       Nothing needs the answer either. `POST /register-as-guest` recognises an
       address it already holds and emails it a code rather than refusing it,
       so the identity panel takes the same two steps — register, then confirm
       — for a new customer and a returning one, and never learns which it is
       dealing with.

   · `verifyCode`
       Compared against the string "123456". Real codes are six digits from
       the inbox and are redeemed by `POST /login-with-code` (undocumented;
       found by probing) or, for an address being confirmed rather than logged
       in with, `POST /email-verification/verify`.

   · `signInWith`
       Fabricated an Apple or Google account and returned no token. Survivable
       while the checkout ran on mocks; not now, when every step past identity
       needs a Bearer token — it would have waved somebody through to a payment
       step that answers 401. The provider buttons came out of the checkout's
       log-in sheet with it. `components/auth/auth-modal` still has a copy of
       this mock on the header path; that one is listed in docs/ENDPOINTS.md
       under "the UI offers these; no endpoint exists".
   ══════════════════════════════════════════════════════════════════ */

export {};
