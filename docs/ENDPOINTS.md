# Endpoint → call site

Which file calls which endpoint, and what it replaces. Source of truth for the endpoints
themselves is [`FE-API-GUIDE.md`](./FE-API-GUIDE.md); this file maps that brief onto our
code. Path constants live in [`utils/routes/index.tsx`](../utils/routes/index.tsx).

**Nothing below is wired yet** except the rows marked *live*.

**Both flows are complete end to end.** A signed-in customer and a visitor with no account
can each book from an empty browser to a placed order, proven against staging. What is left
is the account surface — order tracking, cancellation, preferences — which has no design yet.

## Ground rules from the brief

- `Content-Type: application/json` on POST. PATCH needs `application/merge-patch+json`
  (only `/users/{id}/update-address` uses PATCH).
- `Authorization: Bearer <token>` on everything except the public endpoints below. The brief
  says four; probed, it is **eight** — `/find-addresses` and both slot endpoints answer 200
  with no token, and `/login-with-code` is not in the brief at all.
- **Money is integers in pennies** — `1295` = £12.95. Dates `YYYY-MM-DD`, times `HH:MM`.

---

## Public — no token

| Endpoint | Call site | State |
|---|---|---|
| `GET /system-status` | [`utils/hooks`](../utils/hooks/index.ts) `useOfferDiscount()` → [`announce-bar`](../components/layout/announce-bar/index.tsx) and [`booking-shell`](../components/booking/booking-shell/index.tsx) | **live and correct**, and now the **signed-out** source only — reads `orderDiscounts`, picks `forOrder === 1`, appends `%` when `type === "percent"`, falls back to `BRAND.offer` on any failure. Probed: `[{forOrder:1,type:"percent",amount:25},{forOrder:2,type:"percent",amount:15}]`. Not requested at all once somebody is signed in |
| `POST /register` | [`utils/api/index.ts`](../utils/api/index.ts) `register()` → [`AuthModal`](../components/auth/auth-modal/index.tsx), and [`utils/auth`](../utils/auth/index.ts) `registerAccount()` | **live**, and now the **header sign-up only** — the checkout registers through `/register-as-guest` below. Two things the brief gets wrong, both probed: it **answers with a token** (201 carries `{ token, user }`, so "call login next" is a round trip for nothing), and **`plainPassword` is optional** — `{ email, name }` alone is a 201. A duplicate address is `422` naming `email` — *"This email is already taken."* — which the identity panel used to read as its account check, before the guest endpoint made the question unnecessary |
| `POST /register-as-guest` | [`utils/auth`](../utils/auth/index.ts) `registerGuest()` → [`use-identity`](../components/booking/identity-panel/use-identity.ts) → [`identity-panel`](../components/booking/identity-panel/index.tsx) | **live** — `{ name, email, phone }` → `200` with an **empty body**. Route existence probed: `GET` is `405` where an unknown path is `404`. Three things follow from the empty body, and the whole checkout identity step is built on them: **no token**, so registering signs nobody in and the session comes from `/login-with-code`; **the server sends the six-digit code itself**, so nothing calls `/verification-code/request` alongside it (that would put a second code in the same inbox and kill the one already sent); and **an address it already holds is not an error** — it is recognised and sent a code, so a returning customer and a new one see the same screen and nothing has to ask, or say, which they are |
| `POST /login-with-code` | [`utils/auth`](../utils/auth/index.ts) `loginWithCode()` → [`identity-panel`](../components/booking/identity-panel/index.tsx) and the checkout's [`LoginSheet`](../components/booking/overlays/index.tsx) | **live, and absent from the brief** — `{ email, code }` → `{ token, user }`, the same shape as `/login-check`. Found by probing: a wrong code is `400 "Incorrect code"`. It is the half `verificationCodeRequest`'s `login` purpose was missing — without it the checkout could send codes that nothing would accept. Always writes a session, unlike `login()`: reading a code out of an inbox proves the address, which is the very thing the pending-token rule exists to establish |
| `POST /login-check` | [`utils/auth`](../utils/auth/index.ts) `login()` → [`AuthModal.tsx`](../components/auth/auth-modal/index.tsx) `submitLogin` | **live and integrated** — goes through `apiCall`, reads the response's `user` object (the only source of `emailVerifiedAt`), stores the JWT in the `authtoken` cookie |
| `GET /my-status` | [`utils/auth`](../utils/auth/index.ts) `loadSession()` → [`AuthProvider.tsx`](../components/common/AuthProvider/index.tsx) on mount | **live and integrated** — restores the session on load; a 401 clears the dead token |
| `POST /verification-code/request` | [`utils/auth`](../utils/auth/index.ts) `requestVerificationCode()` → the identity panel's **"Send a new code"** link only | **live** — `{ email, purpose }`, purpose ∈ `email_verification` \| `login` \| `password_reset`. Live on staging: 200 for an unknown address, 422 naming `purpose` for a bad one. Everywhere we hold a token, `emailVerificationResend` is preferred — it follows the account rather than an address in our state, and it can actually report a failure |
| `POST /reset-password/request` | [`utils/auth`](../utils/auth/index.ts) `requestPasswordReset()` → [`AuthModal.tsx`](../components/auth/auth-modal/index.tsx) `forgot` pane | **live** — always answers 200, even for an address with no account, so the UI must never confirm that a message was sent |
| `POST /reset-password/confirm` | [`utils/auth`](../utils/auth/index.ts) `confirmPasswordReset()` → [`components/reset-password`](../components/reset-password/index.tsx) | **live** — public, so the emailed link finishes on any device with no session. A successful reset also verifies the address, so the page logs them straight in |

`/my-status`'s `recurring` is read by `TimeScreen` (to hide Repeat) and by `confirmOrder`.
`nextOrderDiscount` is read by [`utils/discount`](../utils/discount/index.ts) via `useOfferDiscount()`
— it is the **signed-in** source for both the offer bar and the checkout's discount row, and `null`
means neither renders.

**Observed `null` on a real staging account** (`+m203@gmail.com`, 22/08/26) — so the null path is
confirmed and that account correctly sees no offer bar and no discount row. **The non-null shape is
still unconfirmed**: the brief never named its fields and nothing has yet seen one populated, so the
reader accepts `amount` / `value` / `percentage` and `type` / `unit` and returns `null` on anything
else. When a populated one does turn up, collapse the reader to the fields that actually come back
and tighten `MyStatus.nextOrderDiscount` in [`utils/auth`](../utils/auth/index.ts) from
`Record<string, unknown>` to a named interface.

Worth knowing before deriving it locally instead: that account has `completedOrderCount: 0`, which
against `/system-status`'s table would say *25% off your first order* — while the server itself says
`null`. It also has a `recentActiveOrder`, which is the likeliest reason. **The two do not agree, and
the server is the one that decides**, which is why `completedOrderCount` is not used for this.

`completedOrderCount` and `recentActiveOrder` are fetched and still unread.

`/system-status` also returns fields nothing reads yet: `serviceAreas`, `supportEmail`,
`supportWhatsAppNumber`, `supportDaysLabel`, `supportHoursLabel`,
`freeLaundryBagRewardEnabled`, `minimumAppVersion`. The first can replace the hardcoded
`TOWNS` in [`utils/content/index.ts`](../utils/content/index.ts); the support fields can drive the contact page.

---

## Authenticated

### Account

| Endpoint | Call site | Replaces |
|---|---|---|
| `POST /email-verification/verify` | [`utils/auth`](../utils/auth/index.ts) `verifyEmail()` → the modal's `code` pane and [`components/verify-email`](../components/verify-email/index.tsx) | **live** — success promotes the held token into `authtoken`, and that is the moment anyone is signed in |
| `POST /email-verification/resend` | [`utils/auth`](../utils/auth/index.ts) `resendVerification()` → the modal's `verify` pane and the verify-email page | **live**, with a 60s cooldown held as a deadline so it survives pane switches |
| `POST /users/{id}/change-email` | [`utils/auth`](../utils/auth/index.ts) `changeEmailAddress()` → the modal's `change-email` pane | **live** — 400 "Email is already verified." is treated as a trigger to re-check `/my-status`, not as a message to show |

Verification is gated behind login: register → login → `emailVerifiedAt === null` → verify.
**An unverified account gets no session.** `/login-check` hands back a working token either
way — probed, it reads `/my-status` fine — so the gate is entirely ours: the token goes in a
one-hour `pendingtoken` cookie that only these three calls read, and `authtoken` is written
only once the code comes back good. See the header of [`utils/auth`](../utils/auth/index.ts).

The email carries a 6-digit code **and** a link to `{site}/verify-email?token=<code>`.
[`app/(main)/verify-email`](<../app/(main)/verify-email/page.tsx>) is a real page now: same
browser, the pending cookie is there and it verifies with no interaction; a different device
has nothing to authenticate with, so it asks for a login once and resumes by itself.

### Address

| Endpoint | Call site | Replaces |
|---|---|---|
| `POST /find-addresses` | [`utils/booking/api.ts`](../utils/booking/api.ts) `findAddresses()` → [`AddressScreen.tsx`](../components/booking/screens/address/index.tsx) `search()` | **live** — replaced both the `lookupAddresses` mock and the hardcoded `SERVED` district table, so coverage is server-driven and adding a town no longer needs a frontend deploy. **Public** — 200 with no token, contradicting the brief's "only four are public", and the one checkout call a signed-out visitor can make. Note the rows carry no `id` (list is keyed by position) and each carries its own `postcodeString`, which is not always the one searched |
| `PATCH /users/{id}/update-address` | [`utils/booking/api.ts`](../utils/booking/api.ts) `updateAddress()` → `AddressScreen.tsx` "Continue to times" | **live** — `line1`, `town`, `postcodeString` required, `merge-patch+json`, empty optionals sent as `null`. Saved on Continue, not on pick, since the lines stay editable after choosing. **Slots 500 until this has run** — undocumented, and the reason it comes first. Skipped for signed-out visitors until guest checkout is decided |
| `POST /postcode-activation-notifications` | `AddressScreen.tsx` out-of-area waitlist | the local `setWaitlisted` state, which currently just flips a boolean |

Response field is `postcodeString`, not `postcode`. The address fields (`line1`, `line2`,
`line3`, `town`, `county`) already match what the form collects.

### Slots

| Endpoint | Call site | Replaces |
|---|---|---|
| `GET /slots/pickup?days=&postcode=` | [`utils/booking/api.ts`](../utils/booking/api.ts) `fetchPickupSlots()` → [`TimeScreen.tsx`](../components/booking/screens/time/index.tsx) | **live** — 21 days requested, 28 is the documented max. **`postcode` is undocumented and is what makes the guest flow possible** |
| `GET /slots/dropoff?pickupSlot=&pickupDate=&postcode=` | [`utils/booking/api.ts`](../utils/booking/api.ts) `fetchDropoffSlots()` → `TimeScreen.tsx` | **live** — `pickupSlot` goes as an IRI (`/slots/{id}`), which is why slot ids are carried through the booking |

**The `postcode` parameter is the single most important undocumented thing in this file.**
Without it, both endpoints resolve the area from the signed-in user and answer **500** —
`Expected an instance of App\Entity\User. Got: NULL` — to anybody else. With it they answer
200 with no token at all. That is the difference between a guest checkout that works and one
that cannot exist, and the brief does not mention it.

Two consequences worth knowing:

- **It overrides the account's saved address.** Probed: the same signed-in account gets
  different windows for two different postcodes. So we send it for everybody, and the windows
  follow the address being booked rather than whatever was last saved.
- **The postcode must already be known to be served.** An inactive one is a 500 whose message
  is written for us rather than for a customer: *"Callers check the postcode is served before
  asking for its slots."* The address step's `isActive` check is that guard.

The 500-instead-of-401 on the no-postcode path is still a backend bug: authentication is
running after the controller has already dereferenced a null user, and the response carries a
vendor stack trace.

`pickupSlot` is passed as an IRI (`/slots/{id}`), not a bare id — use `routes.api.slotIri`.
The response is day groups of `{ id, startTime, endTime }`; our `Availability` type is a map
of dayKey → `{ label, eco }`. Two gaps: there is no `eco` field, and the slot **id** has to
start being carried because `POST /orders` needs the IRI.

### Payment

| Endpoint | Call site | Replaces |
|---|---|---|
| `POST /payment-methods/setup-intent` | [`utils/booking/api.ts`](../utils/booking/api.ts) `createSetupIntent()` → [`StripePayment`](../components/booking/stripe-payment/index.tsx) `confirm()` | **live** — response field is `setupIntentClientSecret`. Called at confirm time, not on mount: the Element runs in deferred mode, so a mistyped card never costs an intent |
| `GET /payment-methods/check-status?setupIntentId=` | [`utils/booking/api.ts`](../utils/booking/api.ts) `checkSetupIntent()` / `awaitSetupIntent()` → [`PaymentScreen`](../components/booking/screens/payment/index.tsx) | **live** — polled. See the warning below about `false` |
| `POST /payment-methods/{id}/mark-as-default` | [`utils/booking/api.ts`](../utils/booking/api.ts) `markCardDefault()` → [`payment-methods`](../components/booking/payment-methods/index.tsx) | **live** — this *is* how a card is chosen. `POST /orders` charges the default and has no card field, so selecting a radio in the list is a `mark-as-default` write |
| `DELETE /payment-methods/{id}` | [`utils/booking/api.ts`](../utils/booking/api.ts) `deleteCard()` → the same list, behind a confirm dialog | **live** — see the 409 below |

This is card capture, not payment. Nothing is charged at booking; the card is stored and
charged after the items are counted. The saved-cards list comes from `/my-status`, and
`PaymentScreen` skips the Element entirely when one is already `isDefault`.

**`check-status` does not mean what the brief says.** The brief describes `false` as "card
entry failed" and `null` as "still pending". Probed, a SetupIntent that has merely not been
confirmed yet answers `{"success": false}` — so immediately after `confirmSetup` there is a
window where `false` means "not attached yet", indistinguishable from a refusal. Only `true`
is treated as an answer; everything else is polled through and then reported as "not
confirmed yet". A genuinely bad card has already failed earlier, at `confirmSetup`, with
Stripe's own wording.

**The polling clears `apiCall`'s GET cache on every attempt.** The cache key is method +
endpoint + params, none of which change between polls, so without `clearApiCache()` every
attempt after the first is served the first answer out of memory.

### Orders

| Endpoint | Call site | Replaces |
|---|---|---|
| `POST /orders` | [`utils/booking/api.ts`](../utils/booking/api.ts) `createOrder()` → [`BookingShell`](../components/booking/booking-shell/index.tsx) `confirmOrder` | **live** — replaced the `makeReference` mock. The server mints the `number` |
| `POST /orders/{id}/mark-as-cancelled` | no UI | — probed and works (`200`) |

Body: `pickupDate`, `pickupSlot` (IRI), `dropoffDate`, `dropoffSlot` (IRI), optional `note`
(max 400 chars — `NOTE_MAX` in model.ts, enforced on the textarea too), optional `frequency`
(`weekly` / `biweekly` / `every_four_weeks`) to make it recurring. The checkout's own ids are
`week` / `2weeks` / `4weeks`, so `createOrder` translates them.

Two things the brief gets wrong, both probed:

- **`number` is an integer**, not a string — `3488`, not `"LF-3488"`. The design's
  `LF-000000` is a placeholder, not the format. `confirmOrder` stringifies it.
- **A default payment method is not enforced.** The brief says the user needs one first; the
  server accepts an order without any card at all. Requiring one is our product rule, not a
  server constraint — but it is the right rule, since nothing could then be charged.

An invalid `frequency` is refused with `frequency: This value should be of type
Frequency|null`, which confirms both the enum and that omitting it is valid.

**One recurring subscription per account, enforced as a 500.** Sending `frequency` when the
account already holds one fails at `OrderCreateProcessor.php:40` —
`Assert::null(…)`, *"Expected null. Got: `App\Entity\Recurring`"* — with a full vendor stack
trace in the body. It should be a 409 or 422 with wording written for a person; as a 5xx we
refuse to show its `detail` (correctly — it is a stack-trace fragment), so the customer gets
the generic "Something went wrong. Please try again later." and retries forever.

The frontend does not let them get there: `TimeScreen` hides the Repeat card when
`/my-status` reports a non-null `recurring`, and `confirmOrder` strips `repeat` as a second
guard. **Still worth fixing on the backend** — the status code and the trace leak are both
wrong regardless of what we send. Open question: whether the assert blocks only recurring
orders or every order once a `Recurring` exists.

`DELETE /payment-methods/{id}` answers **409 while an order is pending**, with wording written
for a person and worth quoting because it names the way out:

> *"You have pending orders that require a payment method. Add another card before removing
> this one, or cancel the outstanding orders first."*

Undocumented, and reachable from the checkout — somebody can be booking a second collection
while the first is in flight. It is a 4xx, so `readHumanMessage` surfaces it and the list shows
it on the row. Note the rule is about leaving a pending order *with no card*, not about
deleting cards generally: with two cards saved, removing the non-default one succeeds.

**The card list re-orders on every read** — the default sorts first — so anything holding a
position across a refresh is holding the wrong card.

Statuses: `created`, `awaiting_review`, `payment_pending`, `payment_failed`, `processing`,
`delivered`, `cancelled`. Track via `recentActiveOrder` in `/my-status`.

---

## The UI offers these; no endpoint exists

| Feature | Where it appears | Note |
|---|---|---|
| ~~Account-exists check~~ | ~~`checkAccount`, `accountExists`, `mobileHasAccount`~~ | **Gone, and deliberately not replaced.** An unauthenticated yes/no on any address typed into a box is an account enumeration oracle. Nothing needs the answer any more either: `POST /register-as-guest` recognises an address it already holds and emails it a code, so the checkout takes the same two steps for a new customer and a returning one and never learns, or reveals, which it is dealing with |
| Set a password while signed in | the confirmation's "Keep your account" | **No endpoint.** `PATCH /users/{id}` is 405; `change-password` and `set-password` are 404. The block asks `POST /reset-password/request` to email a link instead, which lands on our own `/reset-password` page |
| Apple / Google sign-in | [`AuthModal`](../components/auth/auth-modal/index.tsx) only | **Removed from the checkout.** The mock returned an account and no token, which was survivable while the checkout ran on mocks and is not now — every step past identity needs a real Bearer token, so a provider button waved somebody through to a payment step that answers 401. The header's copy of the mock is still there |
| SMS / mobile verification | the tel row in `ContactScreen` | the brief covers email verification only |
| Pricing | [`utils/content/index.ts`](../utils/content/index.ts) `PRICING`, ten categories | invented for the design |
| Ratings | [`utils/content/index.ts`](../utils/content/index.ts) `RATING = { 4.9, 63 }` | invented for the design |
| `POST /request-deletion` | [`request-deletion/page.tsx:24`](<../app/(legal)/request-deletion/page.tsx>) | in production use, URL hardcoded rather than `config.apiUrl`, and absent from the brief |

---

## Every mock, accounted for — there are none left

| Mock | Status |
|---|---|
| ~~`makeReference`~~ | **gone** — `createOrder`; the server mints the number |
| ~~`attemptLogin`~~ | **gone** — `login()` in `utils/auth` |
| ~~`lookupAddresses`~~ | **gone** — `findAddresses`. The `SERVED` district table went with it |
| ~~`fetchCollectionAvailability`~~ | **gone** — `fetchPickupSlots` |
| ~~`fetchDeliveryAvailability`~~ | **gone** — `fetchDropoffSlots`. The eco rule survived into `markEcoWindows`: the endpoints send no flag, and same-weekday-same-window is the real round schedule |
| ~~`verifyCode`~~ | **gone** — `POST /login-with-code` for signing in, `POST /email-verification/verify` for confirming an address |
| ~~`accountExists` / `checkAccount` / `mobileHasAccount`~~ | **deleted, not replaced** — see the row above |
| ~~`signInWith`~~ | **gone from the checkout** — still mocked in `components/auth/auth-modal` |

[`utils/booking/mocks.ts`](../utils/booking/mocks.ts) is now only the record of where each one
went, kept because three of them turned out to be the wrong question rather than a missing
endpoint.
