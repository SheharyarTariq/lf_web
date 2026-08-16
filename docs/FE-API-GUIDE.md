# LF API – Frontend Integration Brief

**General rules**
- Send `Content-Type: application/json` on POST. PATCH endpoints require `Content-Type: application/merge-patch+json`.
- After login, send `Authorization: Bearer <token>` on every request. Only `/register`, `/login-check`, `/system-status`, and `/reset-password/*` are public.
- All money values are integers in **pennies** (e.g. `1295` = £12.95). Dates are `YYYY-MM-DD`, times are `HH:MM`.

## 1. Register

```
POST /register
{
  "email": "jane@example.com",
  "plainPassword": "Secret123!",
  "name": "Jane Doe",
  "phone": "+447700900123"
}
```
- `email` — unique, used for login.
- `plainPassword` — min 8 chars, needs lowercase + uppercase + special character.
- `name` — display name.
- `phone` — optional; must be `+44` followed by 10 digits.

Registering does not log you in — call login next. A verification email is sent on first login if the email isn't verified yet.

## 2. Login

```
POST /login-check
{ "email": "jane@example.com", "password": "Secret123!" }
```
Response:
```
{ "token": "eyJ...", "user": { "id", "email", "name", "isAdmin", "emailVerifiedAt" } }
```
- `token` — the JWT; store it and send as `Authorization: Bearer <token>`.
- `emailVerifiedAt` — `null` means not verified yet (see section 3).

## 3. Verify email (after login, if not verified yet)

Both endpoints require the user to be logged in (Bearer token). Check `emailVerifiedAt` from `/login-check` or `/my-status` — if `null`, show the verification screen. For the design, just reuse the email verification screen from the mobile app.

**Verify with the code from the email:**
```
POST /email-verification/verify
{ "code": "abc123..." }
```
- `code` — the code from the verification email. The email also contains a link to `{site}/verify-email?token=<code>`, so the FE page at that route should read the token from the URL and submit it as `code`. Returns 400 "Incorrect code" if wrong or expired.

**Resend the email** (no body needed; the same code is reused if it's less than an hour old):
```
POST /email-verification/resend
{}
```

## 4. My status (everything about the current user in one call)

```
GET /my-status
```
Response fields:
- `user` — `id`, `email`, `name`, `phone`.
- `address` — `line1`, `line2`, `line3`, `town`, `county`, `postcodeString`, `isActive` (`isActive` = we currently serve that postcode).
- `recentActiveOrder` — the user's current in-flight order (`id`, `number`, `status`, `pickupDate`, `pickupSlot`, `dropoffDate`), or `null`.
- `completedOrderCount` — number of delivered orders.
- `paymentMethods` — saved cards: `id`, `brand`, `last4`, `expiryMonth`, `expiryYear`, `isDefault`, `paymentChannel`.
- `recurring` — active recurring-order subscription, or `null`.
- `nextOrderDiscount` — discount coupon applied to their next order, or `null`.

Call this after login and on app load to hydrate the UI.

## 5. Find and set address

**Step 1 – look up addresses by postcode:**
```
POST /find-addresses
{ "postcodeString": "SW1A 1AA" }
```
Response: `{ "isActive": true, "addresses": [ { "line1", "line2", "line3", "town", "county", "postcodeString" } ] }`
- `isActive: false` → we don't serve this postcode; offer `POST /postcode-activation-notifications` to notify the user when it goes live.

**Step 2 – save the chosen address on the user:**
```
PATCH /users/{userId}/update-address        (Content-Type: application/merge-patch+json)
{ "line1": "10 Downing St", "line2": null, "line3": null, "town": "London", "county": null, "postcodeString": "SW1A 1AA" }
```
- `line1`, `town`, `postcodeString` required; the rest optional.

## 6. Pick slots (pickup then dropoff)

**Pickup slots** (next 10 days by default, `days` optional, max 28):
```
GET /slots/pickup?days=10
```
Response: array of day groups: `{ "date": "2026-08-10", "weekDay": 1, "slots": [ { "id", "startTime": "09:00", "endTime": "11:00" } ] }`

**Dropoff slots** — only valid ones for the chosen pickup:
```
GET /slots/dropoff?pickupSlot=/slots/{slotId}&pickupDate=2026-08-10
```
Same response shape. Note `pickupSlot` is passed as an IRI path (`/slots/{id}`), not a bare id.

## 7. Add a payment method (Stripe)

**Step 1 – ask the server for a SetupIntent:**
```
POST /payment-methods/setup-intent
{}
```
Response: `{ "setupIntentClientSecret": "seti_..._secret_..." }` — feed this to Stripe.js (`stripe.confirmSetup` / Payment Element) to collect the card on the client.

**Step 2 – after Stripe redirects/completes, confirm it saved:**
```
GET /payment-methods/check-status?setupIntentId=seti_...
```
Response: `{ "success": true | false | null }` — `true` = card saved (it's automatically made the default), `false` = card entry failed (retry), `null` = still pending/unknown (poll again).

Also available: `POST /payment-methods/{id}/mark-as-default`, `DELETE /payment-methods/{id}`. The saved cards list comes from `/my-status`.

## 8. Create order

The user needs an address and a default payment method first — payment is taken automatically from the default card, there's no pay screen.

```
POST /orders
{
  "pickupDate": "2026-08-10",
  "pickupSlot": "/slots/{pickupSlotId}",
  "dropoffDate": "2026-08-12",
  "dropoffSlot": "/slots/{dropoffSlotId}",
  "note": "Ring the top bell",
  "frequency": "weekly"
}
```
- `pickupDate` / `dropoffDate` — from step 6.
- `pickupSlot` / `dropoffSlot` — slot IRIs (`/slots/{id}`) from step 6.
- `note` — optional, max 400 chars, instructions for the driver.
- `frequency` — optional; `"weekly"`, `"biweekly"`, or `"every_four_weeks"` turns this into a recurring order. Omit for a one-off.

Response is the order: `id`, `number` (human-friendly order number), `status`, dates/slots, `note`, `subtotal`, `total`. Track it afterwards via `recentActiveOrder` in `/my-status`; `POST /orders/{id}/mark-as-cancelled` cancels it.

Order status values: `created`, `awaiting_review`, `payment_pending`, `payment_failed`, `processing`, `delivered`, `cancelled`.

## 9. System status (public config)

```
GET /system-status
```
Response fields:
- `minimumAppVersion` — force-update check for apps.
- `freeLaundryBagRewardEnabled` — whether the free-bag promo is on (show/hide that UI).
- `orderDiscounts` — automatic discount tiers to display (e.g. first-order discounts).
- `supportEmail`, `supportWhatsAppNumber`, `supportDaysLabel`, `supportHoursLabel` — contact-us section content.
- `serviceAreas` — list of area names we serve (for marketing copy).

Call it on app/site load before the user logs in.

## 10. Change email (fix a typo)

```
POST /users/{userId}/change-email
{ "email": "corrected@example.com" }
```
- `email` — the corrected email address. A fresh verification link is sent to it.

**Only allowed while the email is NOT yet verified** (returns 400 "Email is already verified." otherwise) — it exists to fix a typo made at registration. Once `emailVerifiedAt` is set (see `/login-check` / `/my-status`), hide the change-email option in the UI.

## 11. Reset password

Both endpoints are public (no auth needed).

**Step 1 – request the reset email:**
```
POST /reset-password/request
{ "email": "jane@example.com" }
```
- `email` — where the reset link is sent. Always returns 200 (doesn't reveal whether the account exists).

**Step 2 – set the new password using the token from the email link:**
```
POST /reset-password/confirm
{
  "email": "jane@example.com",
  "token": "abc123...",
  "newPassword": "NewSecret123!"
}
```
- `token` — comes from the reset link in the email; the FE reset page should read it from the URL.
- `newPassword` — same rules as registration: min 8 chars, lowercase + uppercase + special character.

After confirming, log in normally via `/login-check` with the new password.
