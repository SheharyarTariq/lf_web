# Endpoint → call site

Which file calls which endpoint, and what it replaces. Source of truth for the endpoints
themselves is [`FE-API-GUIDE.md`](./FE-API-GUIDE.md); this file maps that brief onto our
code. Path constants live in [`utils/routes/index.tsx`](../utils/routes/index.tsx).

**Nothing below is wired yet** except the four rows marked *live*. Integration order is
recorded in [`STATUS.md`](./STATUS.md): logged-in flow first, guest checkout after.

## Ground rules from the brief

- `Content-Type: application/json` on POST. PATCH needs `application/merge-patch+json`
  (only `/users/{id}/update-address` uses PATCH).
- `Authorization: Bearer <token>` on everything except the five public endpoints below.
- **Money is integers in pennies** — `1295` = £12.95. Dates `YYYY-MM-DD`, times `HH:MM`.

---

## Public — no token

| Endpoint | Call site | State |
|---|---|---|
| `GET /system-status` | [`components/layout/announce-bar/index.tsx`](../components/layout/announce-bar/index.tsx) | **live and correct** — reads `orderDiscounts`, picks `forOrder === 1`, appends `%` when `type === "percent"`, falls back to `BRAND.offer` on any failure |
| `POST /register` | [`utils/api/index.ts`](../utils/api/index.ts) `register()` → [`AuthModal.tsx:402`](../components/auth/auth-modal/index.tsx) | **live**, payload matches: `{ email, plainPassword, name, phone? }` |
| `POST /login-check` | [`utils/auth`](../utils/auth/index.ts) `login()` → [`AuthModal.tsx`](../components/auth/auth-modal/index.tsx) `submitLogin` | **live and integrated** — goes through `apiCall`, reads the response's `user` object (the only source of `emailVerifiedAt`), stores the JWT in the `authtoken` cookie |
| `GET /my-status` | [`utils/auth`](../utils/auth/index.ts) `loadSession()` → [`AuthProvider.tsx`](../components/common/AuthProvider/index.tsx) on mount | **live and integrated** — restores the session on load; a 401 clears the dead token |
| `POST /reset-password/request` | [`AuthModal.tsx`](../components/auth/auth-modal/index.tsx) `forgot` view | mocked — [line 23](../components/auth/auth-modal/index.tsx) says no endpoint exists. It does now |
| `POST /reset-password/confirm` | `/reset-password` page — **does not exist as a real page yet** | currently a `DeepLinkFallback` stub |

`/system-status` also returns fields nothing reads yet: `serviceAreas`, `supportEmail`,
`supportWhatsAppNumber`, `supportDaysLabel`, `supportHoursLabel`,
`freeLaundryBagRewardEnabled`, `minimumAppVersion`. The first can replace the hardcoded
`TOWNS` in [`utils/content/index.ts`](../utils/content/index.ts); the support fields can drive the contact page.

---

## Authenticated

### Account

| Endpoint | Call site | Replaces |
|---|---|---|
| `POST /email-verification/verify` | [`IdentityPanel.tsx`](../components/booking/identity-panel/index.tsx), [`Overlays.tsx:326`](../components/booking/overlays/index.tsx) | `verifyCode` in [`utils/booking/mocks.ts`](../utils/booking/mocks.ts) |
| `POST /email-verification/resend` | [`IdentityPanel.tsx:201`](../components/booking/identity-panel/index.tsx) — the resend button already has its cooldown | nothing |
| `POST /users/{id}/change-email` | no UI exists | — |

Verification is gated behind login: register → login → `emailVerifiedAt === null` → verify.
The email also links to `{site}/verify-email?token=<code>`, so that page must read the token
from the URL and submit it as `code`.

### Address

| Endpoint | Call site | Replaces |
|---|---|---|
| `POST /find-addresses` | [`AddressScreen.tsx`](../components/booking/screens/address/index.tsx) `search()` | `lookupAddresses` mock **and** the `SERVED` district table in [`utils/booking/model.ts`](../utils/booking/model.ts) — `isActive` in the response is now what decides whether we serve a postcode |
| `PATCH /users/{id}/update-address` | `AddressScreen.tsx` `choose()` / `enterManually()` | nothing — a new step. `line1`, `town`, `postcodeString` required |
| `POST /postcode-activation-notifications` | `AddressScreen.tsx` out-of-area waitlist | the local `setWaitlisted` state, which currently just flips a boolean |

Response field is `postcodeString`, not `postcode`. The address fields (`line1`, `line2`,
`line3`, `town`, `county`) already match what the form collects.

### Slots

| Endpoint | Call site | Replaces |
|---|---|---|
| `GET /slots/pickup?days=` | [`TimeScreen.tsx`](../components/booking/screens/time/index.tsx) | `fetchCollectionAvailability` mock |
| `GET /slots/dropoff?pickupSlot=&pickupDate=` | `TimeScreen.tsx` | `fetchDeliveryAvailability` mock |

`pickupSlot` is passed as an IRI (`/slots/{id}`), not a bare id — use `routes.api.slotIri`.
The response is day groups of `{ id, startTime, endTime }`; our `Availability` type is a map
of dayKey → `{ label, eco }`. Two gaps: there is no `eco` field, and the slot **id** has to
start being carried because `POST /orders` needs the IRI.

### Payment

| Endpoint | Call site | Replaces |
|---|---|---|
| `POST /payment-methods/setup-intent` | [`StripePayment.tsx`](../components/booking/stripe-payment/index.tsx) | the hardcoded test key |
| `GET /payment-methods/check-status?setupIntentId=` | [`PaymentScreen.tsx`](../components/booking/screens/payment/index.tsx) | nothing |
| `POST /payment-methods/{id}/mark-as-default` | no UI | — |
| `DELETE /payment-methods/{id}` | no UI | — |

This is card capture, not payment. `check-status` returns `true` (saved and made default),
`false` (retry) or `null` (poll again). The saved-cards list comes from `/my-status`.

### Orders

| Endpoint | Call site | Replaces |
|---|---|---|
| `POST /orders` | [`BookingShell.tsx`](../components/booking/booking-shell/index.tsx) `confirmOrder` | `makeReference` mock — the server mints the order `number` |
| `POST /orders/{id}/mark-as-cancelled` | no UI | — |

Body: `pickupDate`, `pickupSlot` (IRI), `dropoffDate`, `dropoffSlot` (IRI), optional `note`
(max 400 chars), optional `frequency` (`weekly` / `biweekly` / `every_four_weeks`) to make it
recurring. Requires an address **and** a default payment method already on the account.

Statuses: `created`, `awaiting_review`, `payment_pending`, `payment_failed`, `processing`,
`delivered`, `cancelled`. Track via `recentActiveOrder` in `/my-status`.

---

## The UI offers these; no endpoint exists

| Feature | Where it appears | Note |
|---|---|---|
| Account-exists check | `checkAccount`, `accountExists`, `mobileHasAccount` → [`ContactScreen.tsx`](../components/booking/screens/contact/index.tsx), [`BookingShell.tsx`](../components/booking/booking-shell/index.tsx), [`utils/booking/flow.ts`](../utils/booking/flow.ts) | `ContactScreen` probes on blur and has spinner, retry and stale-response handling. Nothing to call |
| Apple / Google sign-in | [`AuthModal.tsx:38`](../components/auth/auth-modal/index.tsx), [`Overlays.tsx:243`](../components/booking/overlays/index.tsx) | both render provider buttons |
| SMS / mobile verification | `mobileHasAccount`, the tel row in `ContactScreen` | the brief covers email verification only |
| Pricing | [`utils/content/index.ts`](../utils/content/index.ts) `PRICING`, ten categories | invented for the design |
| Ratings | [`utils/content/index.ts`](../utils/content/index.ts) `RATING = { 4.9, 63 }` | invented for the design |
| `POST /request-deletion` | [`request-deletion/page.tsx:24`](<../app/(legal)/request-deletion/page.tsx>) | in production use, URL hardcoded rather than `config.apiUrl`, and absent from the brief |

---

## Every mock, accounted for

Each of these is one function body in [`utils/booking/mocks.ts`](../utils/booking/mocks.ts):

| Mock | Status |
|---|---|
| `lookupAddresses` | → `POST /find-addresses` |
| `fetchCollectionAvailability` | → `GET /slots/pickup` |
| `fetchDeliveryAvailability` | → `GET /slots/dropoff` |
| `verifyCode` | → `POST /email-verification/verify` |
| `makeReference` | → `POST /orders` (server mints `number`) |
| `attemptLogin` | → `POST /login-check` — delete it, `utils/auth` `login()` already does this |
| `checkAccount`, `accountExists`, `mobileHasAccount` | **unbacked** |
| `signInWith` | **unbacked** |
