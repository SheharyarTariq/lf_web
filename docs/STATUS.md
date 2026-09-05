# Project status

Where `lf_web` stands, what is finished, and what is still open. Kept in the repo so the
next session starts from a written record.

Companion documents: [`FE-API-GUIDE.md`](./FE-API-GUIDE.md) (the backend brief) and
[`ENDPOINTS.md`](./ENDPOINTS.md) (which file calls which endpoint).

---

## Done — the design port

The landing page, the auth modal and the guest checkout were rebuilt from the React+Vite
prototype into this Next.js app, converted to Tailwind, and measured against the prototype
rather than eyeballed:

- **Landing** — 11 widths (1440 → 360). Section heights match exactly; worst per-section
  pixel diff 0.121–0.533%, all of it font anti-aliasing (self-hosted `next/font` Poppins vs
  the prototype's CDN copy).
- **Auth modal** — 0.000% at 1280 and 600; 0.18–0.27% at phone widths.
- **Mobile drawer** — 46/46 nodes; 0.275–0.301%.
- **Checkout** — 68 states across 7 widths. All heights match, worst pixel 0.0%.

Everything that already worked still works, verified: `/download-app` UA routing, the `/faq`
and `/how-it-works` 308s, the five deep-link routes, the `.well-known` files, gtag
conversions, JSON-LD, the sitemap (16 URLs) and 20 legacy pages. The discount banner was
proven end to end — server returns 40% → renders 40%; server returns 500 → falls back to the
designed copy.

### Four Tailwind traps found during the port — do not reintroduce

These each silently broke the port and were only caught by measuring computed styles. They
are the reason several files look more verbose than they need to.

1. **`max-[Npx]:` is exclusive; the design's `max-width` is inclusive.** Tailwind emits
   `@media not (min-width: N)`, i.e. width < N. At exactly 1024px the port was 927px taller
   than the design. Hence the `to-1280` … `to-360` custom variants in `globals.css` — use
   those, never `max-[…]`.
2. **Bare `text-xs` / `text-sm` / `text-base` ship a paired line-height** the design never
   set. Footer headings came out 19.2px instead of 16px. Use `text-[Npx]`.
3. **Preflight's `font: inherit` on form controls** changes the strut of line boxes inside
   them; hero slot buttons were 67.6px instead of 62px. Fixed by `.lf-controls` in
   `globals.css`, which must stay in `@layer base` — as an `@utility` its (0,2,0) descendant
   selector outranks the very size utilities it needs to lose to.
4. **A property set in both a base recipe and a state recipe is resolved by Tailwind's sort
   order, not authoring order.** Four separate bugs came from this (`hidden` losing to
   `inline-flex`, `border-transparent` beating `border-brand`, `font-semibold` beating
   `font-medium`, `h-[52px]` beating `h-[50px]`). Rule: each property lives in exactly one
   place. `utils/button/index.ts` takes `display` as a parameter for this reason.

`tailwind-merge` is now available via `utils/cn.ts` and resolves conflicts by source order,
which would have prevented trap 4 — worth using as components are refactored.

---

## Done — the real price list

The landing page's price table was invented. Five categories were roughly right and ten were
made up outright — added so the pill row would overflow far enough to test the scrolling — and
both `STATUS.md` and `ENDPOINTS.md` recorded pricing as something the UI offered with no
endpoint behind it. That was wrong: `GET /price-combined` exists, the mobile app has been
using it all along, and on 05/09/26 the backend confirmed it is public. Probed unauthenticated
the same day: `200 application/ld+json`, nine categories, 38 items.

`utils/content` no longer holds a money figure. `utils/pricing` holds the wire types and every
pure transform; the section fetches through `apiCall` on mount.

**Four things about the payload that the shape does not announce**, each of which is a
rendering rule rather than a detail:

- **The wash/dry labels are per-category, nullable, and not one string.** "Wash & Press" in
  five categories, "Wash & Dry" in Duvet, "Wash & Iron" in Beddings. The card decided its dot
  colour with `service === WASH`, comparing the label to the literal `"Wash & Press"` — so
  every Duvet and Beddings wash row would have rendered with the grey dry-cleaning dot. A row
  now carries **which service it is**; the label is only ever displayed. That the old code had
  to recover service identity from a display string is the bug, not the comparison.
- **`priceType` is not always `fixed`.** "Curtains (per pair)" is `from`. The card hardcoded
  "Per item", which quotes a starting price as a fixed one — on a section whose own subheading
  promises "No estimates, no surprises". An unrecognised type renders **no** unit label rather
  than one invented from the token.
- **Both prices are nullable**, independently of the labels. 26 of 38 items offer one service.
- **`totalItems` counts categories** (9), not items (38).

**Failure is silence.** No fallback list: a dead request, or a body without a readable
`member`, renders the section as `null`. The known cost, accepted deliberately: the header and
footer "Pricing" links point at `#pricing`, so on that path they scroll nowhere.

**It is fetched in the browser, not on the server** — a deliberate call, and the trade is that
the price list is not in the served HTML, so crawlers do not see it. Worth revisiting if the
section turns out to carry ranking weight; `utils/seo`'s `hasOfferCatalog` currently emits four
generic services with no prices, and real per-item `Offer` data is the follow-up this unlocks.

### Verified

- 25 checks on the transforms against the live payload — the nullable-label and nullable-price
  matrix, `from` vs `fixed`, `hydra:member` fallback, and every malformed body resolving to the
  same "we do not know the prices" verdict.
- Driven in Chromium against a production build: nine live pills and none of the invented ones;
  Shirt's two rows with the wash dot measuring `rgb(193, 241, 29)` against dry's
  `rgb(122, 119, 109)`; Single Duvet reading "Wash & Dry £15.00" with a **lime** dot — the row
  the old comparison got wrong — where the invented table had said £18.00; Curtains reading
  **FROM**; the description on "Duvet set - single"; search grouping across categories and
  matching on description; and no console errors. Both auth-modal panes confirmed free of
  provider buttons and the "or" divider.
- CORS reflects any Origin (`vary: Origin`, no `allow-credentials`), so the browser call works
  from localhost and from the deployed origins alike.

### Not verified, and worth knowing

- **Staging carries test data.** `Beddings / Pillowcase` currently has the description
  *"description is very long here as we can see"*, and descriptions now render. Ask the backend
  to clean it before this ships — the genuinely useful one ("1x duvet, 2x pillow cases, 1x bed
  sheet") is why the field is worth rendering at all.
- **Published prices are now editable from the database with no review step.** They used to be
  underwritten by code review. That is a change in who can move a live price, not a bug.
- **Production must point at the production API.** `NEXT_PUBLIC_API_URL` is inlined at build,
  so staging prices on the live site would be a build-time mistake with a money consequence.

---

## Done — this session

- Imported the team's three skills from `frontend-starterkit-with-skills-16.2.7` into
  `.claude/skills/` (`web-structure`, `web-api-patterns`, `web-best-practices`). Deleted the
  stale copies at `.skills/skills/lf-web-*`, which described a `src/` directory that does not
  exist here and sat at a path Claude Code never loads.
- Imported `utils/` — `api-call`, `api-request`, `routes`, `validation`, `helper`, `cn`.
  Byte-identical to the starter kit except `routes/index.tsx`.
- Added `axios`, `clsx`, `tailwind-merge`, `react-hot-toast`, `yup`, `lucide-react`, and
  mounted `<Toaster />` once in `app/layout.tsx`.
- Filled `utils/routes/index.tsx` with the real API surface from the brief.
- Wrote `docs/ENDPOINTS.md`.

Nothing was wired. `lib/` was not touched and no component changed.

Verified after: `tsc --noEmit` clean, `next build` green with an unchanged route set (33
pages), and ESLint reporting only the two pre-existing `react/no-unescaped-entities` errors in
`blog/wash-and-fold-guide` and `laundry-service-surrey` — the copied `utils/` produced none.

`<Toaster />` was the only rendering change, so it was checked against a production build at
seven widths (1440 → 360). Its container is `position: fixed` and nearly viewport-tall, so the
risk was pointer events rather than layout: it resolves `pointer-events: none`, nine hit-tests
per width never land on it, and a real click on the offer bar still reaches `/book/address`.
The four in-flow shell children still sum to the page height (drift < 0.5px), `h1` is 56 /
45.06 / 38px at the same breakpoints as before, and no width overflows horizontally.

---

## Done — login

`POST /login-check` and `GET /my-status` are integrated. The token is a JWT in the
**`authtoken` cookie**, which is the name `utils/api-call` reads back and attaches as a
Bearer token — so every endpoint added from here is authenticated for free.

- `utils/auth/index.ts` — `login()`, `loadSession()`, `logout()`. Reads the `user` object off
  the `/login-check` response rather than decoding the JWT; the body is authoritative and is
  the only place `emailVerifiedAt` appears. The JWT is still parsed, but only for `exp`, so
  the cookie expires when the token does.
- `utils/helper/index.ts` — cookie get/set/delete. `SameSite=Lax`, `path=/`, `Secure` only on
  https so localhost works.
- `components/common/AuthProvider/index.tsx` — rebuilds the session from the cookie on mount, so a refresh
  no longer looks like a sign-out. Exposes `loading` for screens that need "don't decide yet".
- `components/layout/site-header/index.tsx` — signed-in state (address + Log out) on desktop and in the
  drawer. New UI: neither the design nor the prototype has one, so it is modelled on the
  checkout header's treatment in `components/booking/chrome/index.tsx`.
- `utils/api/index.ts` — `login()`, `readUser()` and the `sessionStorage` token store removed. It now
  owns only `register()`, which keeps its own client until sign-up moves across, because it
  maps Symfony `violations` to per-field errors and `apiCall` returns the raw body instead.

**Verified.** Against real staging: a wrong password returns 401, shows the inline alert
"Email or password is not right.", sets no cookie and — the point of the `showErrorToast`
change — raises no toast; a dead token gets a 401 from `/my-status` and is discarded. With
`/my-status` stubbed: the signed-in header holds at eight widths from 1440 to 360 with the
address truncating and "Get the app" never pushed, the drawer shows address + Log out, sign
out clears the cookie and survives a reload, and `/book/address` still shows the address.
Signed-out layout is unchanged at all seven widths.

**One regression caught and fixed during this work:** gating the header on `loading` removed
"Log in" from the server-rendered HTML entirely — no control at all without JavaScript, and a
hole in the header on every signed-out load. Signed out is now the default state and renders
immediately; only a returning signed-in user sees one frame of "Log in" before their address
replaces it. If the header ever grows a third auth state, do not reintroduce a `loading`
branch there — check `curl -s localhost:3000/ | grep -c "Log in"` returns 1.

**Not verified by me:** the real success path — a genuine token, cookie and refresh — needs a
real account, so it is being checked by hand. Everything above used either a real 401 or a
structurally valid fake JWT with a stubbed `/my-status`.

## Done — email verification

`POST /email-verification/verify`, `/email-verification/resend` and
`POST /users/{id}/change-email` are integrated, plus `/verification-code/request` as a wrapper
with no call site yet. Three new panes in `AuthModal` (`verify`, `code`, `change-email`)
mirroring the mobile app, and `app/(main)/verify-email` is a real page instead of a
DeepLinkFallback stub.

**The shape of it:** an unverified account gets no session. `/login-check` returns a working
token either way, so the token goes into a one-hour `pendingtoken` cookie read by nothing but
the three verification calls; `authtoken` is written only when a code comes back good. That
makes the gate hold at the `AuthedUser` boundary — `site-header` and `booking-shell` needed no
change, because `user` is simply null. See conflict 7 and the header of `utils/auth`.

**Confirmed against staging before building** (the assumptions the design rested on):
`/my-status` *does* return `emailVerifiedAt` despite §4's field list omitting it; an unverified
token reads `/my-status` with a 200, so the server imposes nothing; a wrong code is
`400 {"detail":"Incorrect code"}`; `/verification-code/request` is already live, 200 for an
unknown address and 422 naming `purpose` for a bad one. The JWT payload is `{iat, exp, roles,
id}` with no verification claim, which is what makes promote-on-verify safe.

**Verified end to end** against real staging with a scripted browser run, 16/16: signup lands
on the verify pane showing the typed address; `pendingtoken` is written with a ~3600s life and
`authtoken` is not; the header still offers "Log in"; the resend countdown continues across
verify → code rather than restarting (60s → 58s); a wrong code shows the server's own
"Incorrect code" under the field with no toast and no cookie; Update is dead until the address
actually differs; both cookies behave correctly across a reload; `/verify-email?token=…` in the
same browser authenticates itself, and in a fresh context falls back to a login.

**Corrected since:** that last claim used to read "with no login prompt", and it was wrong from
the day the page shipped. The same browser *did* authenticate itself — and also raised the
login modal over the top of the success pane, where it stayed until dismissed by hand. The
scripted run missed it because it asserted on the success copy, which passes perfectly well
with a modal stacked on it; nothing asserted on what else was on screen. `useBearerToken`
returned a hardcoded `null` on the hydration render, `view` derived `needsLogin` from it, and
the auto-open effect fired before React re-rendered with the real cookie. Fixed by giving the
hook a third value for "not read yet". Worth remembering that an assertion on the thing you
expect is not an assertion on the absence of the thing you don't.

**Not verified by me:** the happy path with a genuine code, which only the inbox has. Every
other branch above is real.

## Done — the card and the order

`POST /payment-methods/setup-intent`, `GET /payment-methods/check-status` and `POST /orders`
are integrated. **The signed-in checkout now runs end to end against real staging** — proven
by placing real orders (#3488, #3489, #3490, since cancelled) with a real saved card.

**There is no payment step; there is a save-a-card step** (conflict 2, now settled). The
sequence is fixed and the last step is the one that looks optional:

1. `elements.submit()` — deferred mode validates before an intent exists
2. `POST /payment-methods/setup-intent` → `setupIntentClientSecret`
3. `stripe.confirmSetup(…)` with `redirect: "if_required"`
4. `GET /payment-methods/check-status` until it answers `true`
5. `POST /orders`

Step 4 is not ceremony: Stripe answering "succeeded" means Stripe has the card, not that we
do. The endpoint answers `true` only once it is attached to the account and made default.

**`redirect: "if_required"`, not a full redirect.** The Element sits inside a checkout step
and the whole booking lives in React state above it, so a redirect would leave
`/book/payment`, lose the booking, and land back on a flow guard that sends them to
`/book/address` with nothing filled in. A `return_url` is passed anyway for the
redirect-based methods this Element does not offer — pointing at `/book/payment`, *not*
`/payment-callback`, which `assetlinks.json` lets a verified Android install intercept.
The mobile app is not precedent here: `laundry-app-master` targets an entirely different,
older API (`/api/auth/login`, `/api/my-profile`, `/api/slots/pick`, and a
`POST /api/payment-methods` taking a raw card token plus a server-returned `redirection_url`).
There is no SetupIntent anywhere in it.

### Four things staging does that the brief does not say

- **`check-status` answers `false` for an intent that is merely unconfirmed**, not `null`.
  So `false` immediately after `confirmSetup` cannot be told apart from a refusal. Only
  `true` is treated as an answer; anything else is polled through and then reported as "still
  confirming", never as a bad card. Reading it the other way sends somebody off to find
  another card while the one they gave us is landing.
- **`POST /orders` succeeds with no card on the account.** The brief says a default payment
  method is required. Requiring one is our rule, and the right one — but the server does not
  enforce it.
- **The order `number` is an integer** (`3488`), not the design's `LF-000000` string.
- **One recurring subscription per account, and a second one is a 500.** Sending `frequency`
  when the account already holds a `Recurring` fails at `OrderCreateProcessor.php:40` with
  *"Expected null. Got: `App\Entity\Recurring`"* and a full vendor stack trace. Handled by
  hiding the Repeat card when `/my-status` reports one — see "Done — Repeat is hidden" below —
  but the status code and the trace leak are the backend's to fix.
- **`DELETE /payment-methods/{id}` answers 409 while an order is active.** Cancel first.
- **`/my-status` carries the confirmation screen's three preferences** — `priceReviewRequired`,
  `shirtHandling` (`"hang"`), `stainTreatmentEnabled` — plus `laundryBagClaimedAt`,
  `laundryBagDeliveredAt` and `registeredAt`, none of which §4 mentions.
- **They are written back with `PATCH /users/{id}/me`**, and both halves are now wired — the
  toggles hydrate from the account and save on the flip. This paragraph used to end *"there is
  no documented endpoint to write them back"*, which was true of the brief and false of the
  server: the endpoint is absent from §4 but present in the live OpenAPI spec and already
  shipping in the sibling mobile app. Four things about it, all probed against staging:
  - **`Content-Type: application/merge-patch+json` or nothing.** Plain `application/json` is a
    **415**, not a tolerated variation — and `apiCall` defaults to `application/ld+json`, so the
    header has to be passed explicitly. `MERGE_PATCH_HEADERS` in `utils/booking/api.ts` already
    existed for `update-address`; this is its second caller, which makes the ground rule in
    [`ENDPOINTS.md`](./ENDPOINTS.md) about "the only PATCH" out of date.
  - **A 200 answers with the JSON-LD envelope alone** — `@context`, `@id`, `@type`, and not one
    field value. There is nothing to read state back from, so the caller's own optimistic value
    stands and the mobile app re-reads `/my-status` instead.
  - **`shirtHandling` is an enum, not a boolean** — `"hang"` | `"fold"`, where our `BookingPrefs`
    models all three as booleans. The translation lives beside the write.
  - **A partial body is fine.** One field per request validates that field alone, which is what
    lets one toggle save one preference rather than restating all three.
- **The API's own OpenAPI spec is reachable, and it is the fastest way to settle questions like
  the one above.** `GET /docs?showdocs=1` with `Accept: application/vnd.openapi+json` and a
  bearer token. Without the query parameter it is a 403 whose body names the condition it wants
  — *"Expression (request.query.has('showdocs')) is false"* — so the lock tells you the key.

### Two bugs found by running it, both pre-existing

- **The Payment Element never mounted in development.** The StrictMode guard
  (`if (mounted.current) return`) skipped the second effect run, but the *first* run's cleanup
  had already set its own `cancelled` flag — and since Stripe.js loads asynchronously, the
  run that was allowed to resolve was the one that had been cancelled. The Element sat on
  "Loading secure payment…" for ever. There is no guard now: each run creates and destroys its
  own Element, and `loadStripeJs` is memoised so the script is still fetched once.
- **`confirmSetup` threw `IntegrationError` and never settled.** The Element is created with
  `fields.billingDetails` set to `never` for name, email and phone — the details step already
  collected them — but nothing passed them to `confirmSetup`. Opting out of collecting a field
  is a promise to supply it. `StripePayment` now takes a `billing` prop, and only claims
  `never` for a phone it actually has.

### Since amended — what the Element is and is not asked for

The step read as somebody else's form embedded in ours. Three causes, all in the Element's
options, all now set explicitly.

- **The Stripe fields were not in Poppins.** `stripeAppearance()` asked for
  `fontFamily: "'Poppins', sans-serif"`, but `next/font/google` self-hosts under a hashed
  family (`__Poppins_<hash>`) and the literal string `Poppins` is declared nowhere in the served
  CSS — and the Element is a cross-origin iframe that could not read our `@font-face` rules
  under any name. Every Stripe label and input was falling back to `sans-serif` beside a page
  set in Poppins. Fixed with `fonts: [{ cssSrc }]`, which is the only way a family reaches the
  frame. **If a CSP is ever added it needs `style-src fonts.googleapis.com` and `font-src
  fonts.gstatic.com` for the Stripe frame, not for our document** — do not prune those as
  duplicates of the self-hosted font.
- **Link was rendering a second copy of the details step.** A "Secure, fast checkout with Link"
  row plus an "Optional · Save my information" block asking for the email, mobile and name we
  were already holding. The lever is **`wallets: { link: "never" }`** on the Payment Element.
  Two things worth writing down, both established by trying them against a real key rather than
  reasoned: `paymentMethodTypes: ["card"]` does **not** remove Link — Link is a card-type
  method, not a separate one — and `link: { display: "never" }` on either the group or the
  Element is rejected by Stripe.js as an unrecognised parameter. Apple Pay and Google Pay are
  off alongside it: this flow stores a card to charge off-session, and a wallet returns a
  device-bound token that makes that later charge harder.
- **The mandate named the Stripe account, not the company** — *"you allow **lf-sandbox** to
  charge your card…"*. `terms: { card: "never" }` now suppresses it and the screen states the
  mandate itself, in `BRAND.trading` and in our own typeface, under the terms checkbox. **That
  paragraph is load-bearing**: Stripe permits `never` only if the wording is displayed
  somewhere. Deleting it means putting `terms` back. `business: { name }` is deliberately not
  set — it renders only inside that mandate and the wallet sheets, all of which are off.

Two smaller ones. `layout` is `"tabs"` rather than the accordion: at one payment method Stripe
draws no tab bar, where the accordion drew an always-open **Card** panel — a header naming the
only option there was, in a white box, under an `h1` that had just said the same thing.
And the billing country and postcode are **prefilled** from the collection address rather than
suppressed; suppressing them was the other option and is worse, because the postcode is what
the bank's AVS check runs on and a card registered elsewhere would start failing with no field
on screen to correct it in. Prefilling also keeps the `never`/supply rule above unengaged —
`billingFor` owes Stripe nothing new. Note the casing trap: `defaultValues` takes snake_case
`postal_code` where `fields` takes camelCase `postalCode`.

### Verified

**23/23 signed-in with a saved card, 21/21 first-time card, 21/21 decline-and-recover, 5/5
signed out**, in a scripted browser against real staging. The address and contact details
seed from `/my-status`; `/my-status` is fetched **once** per load; a first-time card runs
setup-intent → check-status → orders and the confirmation shows the server's number; a second
booking on the same account skips the Element entirely and calls neither setup-intent nor
check-status; `4000 0000 0000 0002` shows Stripe's own "Your card has been declined.", stays
on `/book/payment`, creates **no** order, and re-entering a good card recovers in place. Signed
out, the address step still loads in ~0.6s, `KT21 1PG` returns 18 addresses, `KT19 8AB` routes
to the waitlist, and the header still server-renders "Log in" exactly once.

**Not verified by me:** 3DS. `4000 0027 6000 3184` was not exercised, so the claim that the
challenge resolves in Stripe's modal with the booking intact behind it is reasoned from
`redirect: "if_required"`, not observed.

**The probe account** `sheharyartariqbutt+lfprobe1@gmail.com` was registered on staging for
this and is unverified — the client gate was stubbed at `/my-status` to get a session. Its
orders and card were cancelled and deleted afterwards; its address (`1 Probe Cottage`,
Ashtead, `KT211PG`) remains.

## Done — the guest checkout

**A visitor with no account can now book from an empty browser to a placed order**, and the
design's flow survived intact: Address → Time → Details → Payment, with identity settled on
the Details step exactly where it was drawn. Nothing was reordered and no screen moved.

**Since amended for returning customers — see "The Details step is now conditional" below.**
The guest flow is still the four steps as drawn; a signed-in account whose details are already
on file sees three.

That was not the plan an hour earlier. The working assumption — mine, from testing the slot
endpoints with a token and never without — was that `/slots/*` required one, which would have
forced identity before the Time step and a reordering of the whole flow. **The backend dev was
right and the assumption was wrong.**

### `postcode` is the whole thing

```
GET /slots/pickup?days=21&postcode=KT211PG              → 200, 21 day groups, 122 slots
GET /slots/pickup?days=21                               → 500, "Got: NULL"
```

Both slot endpoints are **public when `postcode` is passed**, and the brief does not mention
the parameter. Without it they resolve the area from the signed-in user and dereference a null
one; with it they answer 200 to anybody. That single parameter is the difference between a
guest checkout that works and one that cannot exist.

Two things follow from it:

- **It overrides the account's saved address**, so it is sent for everybody. The windows then
  follow the address being booked rather than whatever was last saved — which is what a person
  changing their address on Review would expect, and what used to be wrong.
- **The postcode must already be known to be served.** An inactive one is a 500 whose message
  is addressed to us: *"Callers check the postcode is served before asking for its slots."*
  The address step's `isActive` check is that guard.

The no-postcode 500 is still a backend bug — authentication running after the controller has
already dereferenced a null user, with a vendor stack trace in the body. It should be a 401.

### Three more undocumented things, all of which the design needed

- **`POST /register` answers with a token.** 201 carries `{ token, user }`, the same shape as
  `/login-check`. "Registering does not log you in — call login next" is a round trip for
  nothing.
- **`plainPassword` is optional.** `{ email, name }` alone is a 201. This is what makes the
  design's *One-click registration* real: the recommended path is genuinely one tap, not a
  password field wearing a different label.
- **`POST /login-with-code` exists.** `{ email, code }` → a token. It is the missing half of
  `/verification-code/request`'s `login` purpose, which could always send a code that nothing
  would redeem. Found by guessing route names against the API; a wrong code is
  `400 "Incorrect code"`.

And one that closes a hole rather than opening one: **a duplicate address is `422` naming
`email`** — *"This email is already taken."*

### The account check that should never have been an endpoint

`accountExists`, `checkAccount` and `mobileHasAccount` are **deleted, not replaced**. They
asked an unauthenticated endpoint whether an address belongs to a customer, which is an
account enumeration oracle with a spinner on it. No such endpoint exists and none should.

The 422 above is the answer instead. The identity panel opens on **Create your account** for
everybody and flips to **You already have an account** when the server refuses the
registration — requesting a login code at the same moment, so the box they land on already has
one on its way. Both of the design's states survive; only the moment we learn which one applies
has moved, from a probe on blur to the press that needed the answer.

That deleted the debounce machinery around the email field with it — two pause lengths, the
whole-value input-type detection, the stale-response counter, the retry nudge and the in-field
spinner all existed to pace a request that no longer happens.

#### Since superseded — `POST /register-as-guest`

The checkout no longer registers through `/register`, and the 422 is no longer read as an
account check. `POST /register-as-guest { name, email, phone }` answers **200 with an empty
body** (route probed: `GET` is 405 where an unknown path is 404), and the backend emails the
six-digit code itself — for an address it has never seen and for one it already holds alike.

So the panel has one path, in two steps: **One-click registration**, then **Confirm your
email** with the code box. The design's second state, *You already have an account*, is gone
along with the question it answered — the server decides, silently, and both kinds of customer
see the same two screens.

Three consequences worth holding on to:

- **Registering signs nobody in.** No token comes back, so the session is minted by
  `/login-with-code` when the code is redeemed. `data.verified` — and with it the Details
  step's Next — is set at that moment and not before.
- **The Next button is the submit.** The code box has no button of its own; the action bar's
  Next redeems the code and advances only if it is accepted. That is why the panel's state
  moved up into `components/booking/identity-panel/use-identity.ts`.
- **Nothing requests a code on registration.** The server has already sent one; asking again
  would replace the code sitting in the inbox being read. Only "Send a new code" calls
  `/verification-code/request`.

The password row beside the one-click button went with it — the endpoint takes no password —
and with it the strength meter, `passwordStrength()` and the booking copies of `PASSWORD_RE` /
`PASSWORD_RULE`. The header's sign-up is untouched and still uses `/register`.

### An unverified account gets a session — in the checkout only

`login()` still holds a token back for an address nobody has proved, because there the address
was typed into a form and might belong to someone else. `registerAccount()` does not, because
the person creating the account is sitting there and the next thing they do is put a card
against it. The server asks for nothing either way: an unverified account saves an address,
reads slots, stores a card and places an order — all probed, and then proven in a browser.

**One guard had to come out of `loadSession`**, and it is worth recording because its own
comment predicted this exact moment: it discarded any session whose `emailVerifiedAt` was
null, as a second line of defence behind `login()`'s rule. That rule is no longer an
invariant, so the guard fired on every load for precisely the accounts the checkout had just
created and signed them straight back out between one request and the next. The gate now lives
in `login()` alone, which is the only place that can tell a form submission from a
registration.

**All of that now describes the header's sign-up only.** With `/register-as-guest` the
checkout has no session between registering and confirming — the code is what produces one, so
nobody reaches a card without having read their inbox. `registerAccount()` and its deliberate
unverified session are still there for the header path, and `loadSession` still cannot have
its guard back while that is true.

### What the confirmation asks for instead

The design's *"Keep your account — set a password"* assumed an account created with one click
and no password on it. That half is right. The other half had no endpoint: there is no way to
set a password on an account that is already signed in — `PATCH /users/{id}` is 405,
`change-password` and `set-password` are both 404.

So the block now offers the two things that do exist, and they answer different questions:

- **Confirm your email** — the code box, on `/email-verification/resend` and `/verify`. This is
  for *this* order: it is what makes it trackable.
- **Email me a link to set a password** — `POST /reset-password/request`, landing on the
  `/reset-password` page this site already has. This is for the *next* one.

`isNewAccount` is now `user.verified === false` read off /my-status, rather than a guess from
how they signed in — so it stays right for somebody who verified in another tab.

### The address is saved once, at confirm

The address step cannot save for a guest — `PATCH /users/{id}/update-address` needs an id and
there is no account yet — and saving the moment one appears would cover the identity panel and
miss the Log in link, the header, and a sign-in in another tab. It also would not survive the
address being edited from Review, which the summary's Edit links make a one-tap thing to do.

So `confirmOrder` saves it, once, immediately before `POST /orders`, and a failure stops the
order. Slots no longer need it (they take the postcode directly) but the order does: it is the
address a van is sent to, and **probed, `POST /orders` accepts an account with no address at
all and answers 201**. Nothing downstream will catch a booking with nowhere to collect from,
which makes it ours to refuse.

The address step keeps its own save for a signed-in customer, because it is the only screen
that can put a violation under the field that caused it. That one is the good error message;
the one at confirm is the guarantee.

### The provider buttons came out of the checkout

`signInWith` fabricated an Apple or Google account and returned no token. Survivable while the
checkout ran on mocks; not now, when every step past identity needs a real Bearer token — it
would have waved somebody through to a payment step that answers 401. A control that cannot do
what it says is worse than an absent one.

In their place, the log-in sheet offers what people arrive at it wanting: a code, or their
password. Both real. An unverified account that logs in with a password is handed to the code
path rather than refused, because a code both proves the address and issues the session, which
is exactly what such an account is missing.

**And now out of the header too.** The `AuthModal` copy was the last surface rendering the
mock, and on 05/09/26 both of its call sites — the log-in pane and the sign-up pane — went
behind `SOCIAL_AUTH_ENABLED` in `config.ts`. Gated rather than deleted, because the buttons
are coming back once OAuth is real and the markup is the design.

Two things about that flag are deliberate. It is a **plain constant, not an environment
variable** — `isStaging` is env-driven because ops must set it per deployment, but what this
one reveals is a mock, so switching it on must take a code change and a review rather than a
dashboard. And **flipping it is not the integration**: `POST /login/google` and
`POST /login/apple` exist and the mobile app already posts to them
(`lf-app/app/services/api/index.ts:276, :306`), so the work is to wire those two and replace
`signInWith` — flipping the flag alone just puts the fabricating mock back on screen.

### Verified

**31/31 guest**, in a browser against real staging from an empty context: no cookie at the
start; 14 addresses for `KT211PG`; **`/book/time` reached with no account and no token**;
`postcode=KT211PG` on both slot requests; 21 open days and real windows signed out; the
identity panel opening on a valid address with **nothing probed before the press**; exactly one
`POST /register`; a session cookie written by it; the step advancing on its own; the Element
mounted for an account with no card; `setup-intent` → `check-status` → **`PATCH update-address`
→ `POST /orders`, in that order, one of each**; the server's own order number on the
confirmation; the account block offering both the code and the password link; a wrong code
showing the server's *"Incorrect code"*; and `POST /reset-password/request` fired once with a
non-committal reply.

**12/12 returning customer**: the panel opens on create, the 422 flips it to the known state,
a login code is requested once, the resend sits on its cooldown, **no session is written on the
flip**, a wrong code goes to `/login-with-code` and comes back with the server's own wording,
and nothing about a bad code advances the flow.

**9/9 signed in**, so the finished flow did not regress: `/my-status` still fetched once, the
address still seeded, still saved on the address step, `postcode` now on its slot requests too,
21 days, no identity panel, the signed-in card instead, and Next live without a code.

**Not verified by me:** the two happy paths that need an inbox — a correct login code, and a
correct verification code on the confirmation. Both endpoints are exercised and both refusals
are real; only the success branch is unreached.

**Left on staging:** two or three orders in `created` status on throwaway `@example.com`
accounts, from harness runs before the harness learned to cancel after itself. They carry no
items and a £0 total. The accounts were made by one-click registration, so they have no
password and no reachable inbox — there is no way back into them to cancel from here. Worth
mentioning to the backend dev rather than leaving to be found.

## Done — the saved cards

`POST /payment-methods/{id}/mark-as-default` and `DELETE /payment-methods/{id}` are integrated,
completing §7. The payment step now lists the account's cards, adds another, switches which one
is charged, and removes one — all inline, no new routes.

**Choosing a card is a write, not local state.** `POST /orders` charges the default and carries
no card field of its own, so "use this one" and "make it default" are the same act. Every
mutation ends in `refreshSession()`, so the list always shows the server's answer rather than
our guess at it — which matters, because the list **re-orders on each read**, default first.

Three states, one button:

- **No cards** — the Element is the step and Confirm order captures it.
- **Cards, not adding** — the list. One card renders as a statement (a radio group of one is a
  control with no choice in it); two or more get radios.
- **Cards, adding** — the Element opens below the list under a **New card** heading, with
  **Cancel** as a link on that heading row. Confirm order captures the new card *and* uses it,
  because the server makes a freshly saved card the default and that is what `POST /orders`
  charges — "saved" and "used" are one event.

An earlier build had a separate **Save card**, with Confirm order disabled while the panel was
open, to stop somebody typing a new card and having the order charged to the old one. Making
Confirm order use the new card removes the hazard, so the second button went with it. The panel
says *"We will save this card and use it for this order"*, because the row still highlighted
above it would otherwise contradict what is about to happen, and the list is `disabled` while
the panel is open so the default cannot be switched mid-compose.

**Since amended — the shape of the adding state.** That sentence now sits **above** the Element
rather than below it. Under ~600px of Stripe form it was answering a question at the point
nobody still had it, which is the one place it could not do its job. Cancel moved with it, from
a full-width ghost button under the form to a link on the **New card** heading row: Back already
sits in the action bar, and two large buttons pointing backwards left the one going forwards as
the third of three. The heading is also what stops the `h1` — still *"Confirm your order"* —
from being left describing a card form; mutating the `h1` on a link click was the alternative
and is worse.

**"+ Add a new card" is a row of the list now**, not a bare text link under it. It was the only
alternative action on the screen and looked like the least important thing on it. It lives
inside `PaymentMethods` behind an optional `onAdd`, because the rounding and the -1.5px border
overlap are applied per row: a row appended outside the `<ul>` sits detached under a doubled
border, and the last-row test has to become the add row or the bottom corners stay on the card
above it. It is withdrawn while the form is open. Its button is **not** inside a `<label>`, for
the reason recorded above.

Capture runs **before** the order and refreshes first: if `POST /orders` then fails, the person
is looking at their new card sitting in the list as the default, and pressing Confirm order
again takes the saved-card path rather than capturing a second one.

`captureCard()` is shared by both paths, so they cannot drift on the part that matters — never
treating a card as saved before `check-status` says `true`.

### The list sorts itself, newest first

`/my-status` returns cards **default-first**, so choosing the second row made it jump to the
top — the row moving out from under the finger that pressed it. The list now sorts on
`createdAt` (which staging sends and §4 does not mention; added to `PaymentMethod`), so position
depends on age, which never changes. `mark-as-default` moves nothing, selection is left to the
radio and the highlight, and a card just added arrives at the top where somebody looks for it.
Falls back to the response's own order if any card lacks the field.

### An accessibility bug the aria snapshot caught

Remove was nested inside the row's `<label>`, which makes the label's text the button's
accessible name: a screen reader announced the delete control as *"Mastercard ending 4444
Expires 12/30"*. Identical on screen, and invisible to every check except an aria snapshot —
`getByRole("button", { name: /Remove/ })` matched **zero elements** while the button was plainly
in the DOM. It is now a sibling of the label, which also removed the `preventDefault()` that had
been stopping Remove from selecting the card it deletes.

**Worth keeping as a rule:** a control nested in a `<label>` inherits that label's accessible
name. Put anything that is not the labelled input outside it.

### Verified

**18/18** against real staging from a zero-card account: first card and order in one press; the
list appearing on the next booking with no radio for a single card; adding a second card where
Confirm order fires `setup-intent` → `check-status` → **exactly one** `POST /orders`; **row
order unchanged** across a default switch (`4444,4242 → 4444,4242`) while the selection moved
`4444 → 4242`; Cancel restoring the saved-card path; and `4000 0000 0000 0002` while adding
showing *"Your card has been declined."* with **no order created**. Earlier, 22/22 covered the
removal path — the confirm dialog opening, **Escape cancelling**, and confirming firing
`DELETE`. All test cards and orders were cleaned up afterwards.

**Re-verified after the Element and layout changes below** against a stubbed `/my-status`
locally, not staging: the add row appearing as the last row with the corners on it, Cancel
restoring the list, and the accessible names holding — `Remove Visa ending 4242` and
`Add a new card`. **Not** re-run against staging, so the 18/18 above still stands on the older
markup; the card-capture path itself is untouched.

**The 409 on DELETE is real and its wording is good** — *"You have pending orders that require a
payment method. Add another card before removing this one, or cancel the outstanding orders
first."* Rendered on the row, unmodified. This is what a precondition failure should look like,
and worth showing the backend dev next to the recurring 500, which is the same class of thing
answered as a 5xx with a stack trace.

## Done — Repeat is hidden for an account that already has one

`POST /orders` 500s when `frequency` is sent and the account already holds a `Recurring`:
`Assert::null(…)` at `OrderCreateProcessor.php:40`, "Expected null. Got:
`App\Entity\Recurring`", with a vendor stack trace in the body. Our payload was correct —
`biweekly` is a valid enum value and every other field checked out.

**`recurring` was the field we already had and never read.** `/my-status` returns it, the
brief defines it as the active subscription or null, `AuthProvider` holds it — and nothing
looked. `TimeScreen` now swaps the Repeat card for a plain `Notice` when it is non-null:

> **You already have a repeating collection** — This one is booked as a one-off.

Deliberately no "manage it in the app": there is no endpoint for editing or cancelling a
recurring order and no screen to send anyone to, so that would be a second dead end rather
than a way out of the first.

`confirmOrder` strips `repeat` as a second guard, for the one path around the hidden control —
a visitor who switches Repeat on and *then* signs in, arriving with a flag set from before we
knew who they were.

**Verified**, 6/6 stubbed and 4/4 control, in a browser against real staging. With `recurring`
stubbed non-null the card is gone, the notice reads correctly, no frequency chips exist, and a
real order is placed whose payload carries **no `frequency` key**. With it null the card still
renders, still toggles, and still offers all three cadences. `recurring` is stubbed rather than
created because there is no documented way to remove one — which is also why the control run
stops short of Confirm.

**Still open, and it decides how urgent the backend fix is:** whether that assert blocks only
recurring orders or *every* order once a `Recurring` exists. The check is ten seconds on an
affected account — toggle Repeat off and Confirm. Succeeds → recurring-specific and this
handles it; same 500 → all ordering is blocked for that account.

## Done — one /my-status for the whole app

`AuthProvider` holds the entire `/my-status` payload as `status`, not just the user, and
`useAuth()` exposes it. It went there rather than into a provider of its own because two
providers both fetching `/my-status` is the duplication this was meant to end, and `apiCall`'s
GET cache cannot do the job — every mutation clears it, so the call would come back after each
save.

**The checkout seeds itself from it.** Address, name, mobile and email are filled in for a
signed-in customer, and `verified` is set, which is what makes the account-check and the
`"123456"` code unreachable for them. The address is only taken when nothing has been chosen
this session and never when `isActive` is false; the contact fields always win, because the
account is the authority on who the order is for.

**Two ordering traps, both load-bearing, both in `booking-shell`:**

1. The seed runs **during render**, not in an effect. The screens read their opening state
   from `data` as they mount — AddressScreen's postcode field and its `confirmed` flag are
   both `useState(data.…)` — and an effect runs after children have rendered, so the address
   would arrive one frame too late to be seen.
2. That is not enough on its own, and this is the half that was missing first time. `loading`
   is true on the first render, so the seed *cannot* have happened yet; the screens must not
   mount into that frame or they capture the empty booking and keep it. `children` is gated on
   `seed !== null`. Signed out this costs a frame — `loadSession` answers without a request
   when there is no cookie, measured at 577ms to a usable address field. Signed in it is the
   length of one `/my-status`.

Symptom if either is undone: a signed-in customer with an address on their account is shown an
empty postcode box, the context updates underneath the screen, and nothing on screen changes.

## Done — collection and delivery windows

`GET /slots/pickup` and `GET /slots/dropoff` are integrated via `fetchPickupSlots` /
`fetchDropoffSlots` in [`utils/booking/api.ts`](../utils/booking/api.ts). Both mocks are gone.

**Four mismatches, three of which would have failed silently:**

- **Day keys.** `dayKey` produced `2026-8-18`; the endpoints send `2026-08-18`. It is zero-padded
  now, so the two match exactly. Unpadded, every `available[dayKey(d)]` lookup in the calendar
  misses and the whole grid renders disabled with no error anywhere — nothing would have pointed
  at the cause.
- **Empty days.** The endpoint returns today with `slots: []`. The calendar treats the presence
  of a key as "this day is open", so those are dropped on ingest rather than rendering a
  clickable date offering nothing.
- **Slot ids.** Slot identity was the label string end to end. `POST /orders` needs the IRI, so
  `Slot` gained an `id` and `BookingData` gained `collectionSlotId` / `deliverySlotId` — carried
  *beside* the labels, not replacing them, so the summary, review and confirmed screens keep
  printing what they always did.
- **No `eco` field.** See below.

**The eco rule is ours, and it is not a guess.** The van runs a round on a fixed weekday, so a
delivery landing on the same weekday and in the same window as the collection is a stop already
being made. `markEcoWindows` in model.ts derives it; the endpoints send nothing. Verified: a
collection on Tue 18 Aug at 08:00–10:00 preselects Tue 25 Aug at 08:00–10:00, and the leaf, the
pill, the banner and the summary tag all follow. If the schedule ever stops working this way the
rule moves to the backend and that function becomes a passthrough.

Both legs are async now, with their own stale-request counters — changing the collection refetches
delivery, so two answers can easily be in the air. Loading and failure are distinct from "nothing
offered", because the calendar's own empty state says we have no windows, which would be a lie
while a request is still going. State resets live in the handlers that cause them rather than in
the fetch, which is both what `react-hooks/set-state-in-effect` requires and the more honest
place: changing the collection is what invalidates the delivery windows.

**Verified**, 11/11 against real staging: 21 open pickup days; `days=21` sent; keys padded ISO;
windows labelled `HH:MM–HH:MM`; dropoff fired with `pickupSlot=/slots/{uuid}` as an IRI and a
padded `pickupDate`; the eco preselect landing on the next same-weekday round; Continue enabling
only with both legs set.

**Worth knowing:** the server's turnaround is shorter than ours was. A Tue 18 collection offers
delivery from Wed 19; `TURNAROUND_DAYS = 2` and the landing page's "48h" both assumed two clear
days. The server decides now, so the constant is unused — but the marketing copy may want
checking against what is actually offered.

## Done — saving the address

`PATCH /users/{id}/update-address` is wired into "Continue to times" in
[`utils/booking/api.ts`](../utils/booking/api.ts) `updateAddress()`. Saved on Continue rather
than on pick, because the five lines stay editable after choosing — saving earlier would store
the pre-edit values.

**This is what unblocks slots.** Proven end to end against staging: PATCH → 200, `/my-status`
returns the address with `isActive: true`, and `/slots/pickup` then answers **200 with real
windows** instead of the `Expected an instance of App\Entity\Postcode. Got: NULL` 500. Nothing in
the brief says slots depend on a saved address. (A test address is now set on the `+m200`
staging account as a result.)

Two things the server does that we do not assume away: it **normalises the postcode** (send
`KT21 1PG`, get back `KT211PG`), so its copy is authoritative; and empty optional lines are sent
as `null` rather than `""`, matching what it returns.

**We save the postcode that was searched, not the row's own `postcodeString`** — reversed after
it broke in the browser. `isActive` is decided for the searched postcode and it is the one the
server can resolve to a `Postcode` entity: sending `KT22 7HH` (what staging's rows claim) 500s
with `Expected an instance of App\Entity\Postcode. Got: NULL`, while `KT21 1PG` (what was
searched) returns 200. They agree in real data, so this only matters where they do not — and
there, the coverage-checked one is the only one known to be servable. The rows display it too;
showing one postcode and saving another would be worse than either.

**5xx messages are never shown to users.** `readHumanMessage` in `utils/api` returns the
server's wording only for 4xx, where it is written for a person — "Incorrect code", validation
violations. A 500's `detail` is a stack-trace fragment, and *"Expected an instance of
App\Entity\Postcode. Got: NULL"* rendered under the Town field before this existed. Both
`utils/auth` and `utils/booking/api` go through it now. Also: a failed save is cleared when the
postcode is edited or Change is pressed, so a dead complaint cannot follow somebody to a screen
it no longer describes.

A rejected save **does not advance the step** — 422 violations naming `line1`/`town` land under
those inputs and clear on the next keystroke; anything unattributable gets a banner instead, so
one complaint never appears twice.

Signed-out visitors are skipped, not blocked: the endpoint needs a token and guest checkout is
still undecided. That single `if (user?.id)` in the address screen is the line that changes when
it is. Agreed order stands — logged-in flow first.

Worth knowing for future test harnesses: an **invalid** JWT in the `authtoken` cookie makes even
the public `/find-addresses` fail, because the firewall rejects it before the controller. Real
users self-heal — `loadSession` clears a dead token on the 401 from `/my-status` at page load —
but a stubbed session with a fake token will not.

## Done — address lookup

`POST /find-addresses` is integrated via a new `utils/booking/api.ts` — the same thin-wrapper
shape as `utils/auth`, and where the slots and orders calls should go next.

**The point of this was not removing a mock.** The `SERVED` district table is **deleted**:
coverage now comes from `isActive` on the response, so adding a town is a backend change rather
than a frontend deploy. `districtOf` stays, because the out-of-area card still names the
district it cannot serve.

Two shape mismatches the mock hid, both now handled:
- **No `id`** on the rows — the list was keyed on `a.id`, and is keyed by position now.
- **Each row carries its own `postcodeString`**, which the mock did not. The UI used to echo the
  searched postcode against every result; it shows and saves the row's own, falling back to the
  search. `line2`/`line3`/`county` arrive `null` and are coerced to `""` in the wrapper, so
  nullability does not leak into `BookingData`.

Three states a synchronous mock never needed: **searching** (spinner beside the label, not
replacing it — the button is `flex-none` and would resize), **failed**, and **active but zero
results**. Failed is deliberately distinct from out-of-area: telling somebody we do not cover
their area when the truth is our request fell over would lose the booking on a lie. Stale
responses are guarded with the monotonic-ref pattern the contact screen already uses.

**"Enter it manually" moved out of the results block.** It rendered only when there was a list,
so the one state where somebody most needs to type an address by hand — no results — was the one
state that never offered it.

**Verified**, 13/13 against real staging: `KT21 1PG` signed out returns 14 real addresses each
showing its own postcode; choosing one fills the form and enables Continue; **`KT19 8AB` now
routes to the waitlist** — it was in the old `SERVED` table, so this is the proof coverage is
server-driven; a malformed postcode is refused with **no network call**; offline gives the failed
state and *not* an out-of-area claim; editing the postcode clears stale results.

Also fixed in passing: `Button`'s `isLoading` doc claimed it swaps the label for a spinner. It
does not — it only sets `disabled` and `aria-busy`. Comment corrected rather than the behaviour,
since keeping the label avoids a width jump.

## Done — password reset

`POST /reset-password/request` and `/reset-password/confirm` are integrated, and
`app/(main)/reset-password` is a real page instead of a DeepLinkFallback stub. That completes
auth: the only mock left in the modal is social sign-in — which does have endpoints to call
(`/login/google`, `/login/apple`, both already used by the mobile app); what it has never had is
our integration. It is now gated behind `SOCIAL_AUTH_ENABLED` and renders nowhere.

Both endpoints are **public** — probed — which is what makes this simpler than email
verification: no Bearer token, so no pending cookie, no login-then-resume. The link carries
`email` and `token`, which is everything `confirm` needs, so it finishes on any device.

**On success the page logs them straight in.** We just set the password, so we know it. That
works because **a reset also verifies the address** — the backend's own `VerificationCodeTest`
proves it, by asking for an `email_verification` code straight afterwards and asserting no email
is sent. So `login()` writes a real session rather than routing to the verify pane. If the
auto-login fails, it falls back to a Log in button rather than stranding anyone.

`EMAIL_RE`, `PASSWORD_RE` and `PASSWORD_RULE` moved from the auth modal's schema to
`utils/auth/model.ts`, so the reset page enforces the same password rule from the same constant
instead of restating it. Still re-exported from the schema, so no call site changed.
`forgotSchema`, declared during the schema pass and unused ever since, is finally wired.

**Verified**, 12/12 against real staging: the forgot pane reaches `/reset-password/request` and
gets a 200; the "Check your email" pane stays non-committal, as it must for an endpoint that
answers the same way whether or not the account exists; a complete link asks only for the new
password; a wrong code returns the server's own "Incorrect code" under the field **and reveals
the code box prefilled** so it can be corrected; a weak password is refused before the network;
and a bare `/reset-password` with no query string asks for everything.

**Not verified by me:** the happy path, which needs a code from the inbox. A real reset email
was sent to `+m200@gmail.com` during testing, so it can be completed by hand — note that doing
so changes that account's password **and** verifies its address.

## Done — logout confirmation

"Log out" in the header (desktop bar and mobile drawer) now raises a confirmation instead of
ending the session on one tap.

**`signOut` on the auth context means "ask, then sign out".** The immediate version is private
inside `AuthProvider`. That is deliberate: if the public function were the one that signs you
out, the next call site added would skip the dialog just by reaching for the obvious name. The
automatic `logout()` in `components/verify-email` (a 401 while auto-submitting a code) is
untouched — it is not a user action and goes to `utils/auth` directly.

**`components/booking/common/Modal` → `components/common/Modal`.** Rather than hand-roll a
fourth dialog shell, the existing one moved. Cheaper than it looked: exactly one file imported
it, and both checkout ties dissolved — `P.close` *is* lucide's `X` and the `Icon` wrapper only
restated lucide's own defaults, so the close button reaches lucide directly; and
`CLOSE_BTN_MODAL` had no other consumer, so its recipe now lives in the component (the `-mr-2.5`
`CLOSE_BTN` stays in `utils/booking/styles.ts` for the chrome). Two additions: `lf-controls` on
the panel, needed because it can now render outside `.lf-book` where Preflight's `font: inherit`
would make buttons ~5px taller; and an `elevated` prop for `z-[210]`, because the header's
mobile drawer is `z-[201]` — above every dialog in the app — so a confirm raised from it would
otherwise hide underneath during the 200ms slide-out.

**Still three dialog shells**, not one: `AuthModal` and the header drawer each hand-roll their
own. `AuthModal`'s is the better implementation (it has the only Tab trap in the codebase); the
moved one is the better-packaged. Worth converging, not done here — the point of moving it was
to stop the count going up.

**Verified**, 14/14 with a stubbed `/my-status` and an `authtoken` cookie: the dialog opens
without clearing anything; **Escape and a backdrop click both cancel rather than log out**
(`onClose` is bound to the safe action, which is the one that would be easy to get backwards);
confirming clears both cookies and flips the header; and on a 390px viewport the confirm sits
above the drawer mid-slide-out. Separately 6/6 on the checkout's modals, confirming the close X
still renders at 20px/stroke 2.2 and the wide variant is still 620px.

**Not black-box tested:** the cache clear. It is genuinely unobservable today for the reason
recorded above — it is a preventive fix, verified by reading the code and by the type checker.

**Backend observation:** there is no `POST /logout` and nothing revokes the token server-side,
so the JWT stays valid for its full 365 days. Logging out only stops us sending it.

## Done — the skills restructure

The codebase predated the three imported skills and followed almost none of them. It does
now, in five verified stages.

**Routing.** `app/(site)` is gone, replaced by three groups sharing one `SiteShell`
component: `(main)` the product, `(seo)` content that exists to be found, `(legal)` required
documents and support. Route groups do not appear in URLs — the build's route list was
byte-identical at every step, which is the proof.

**SPA.** Sixteen internal links were raw anchors forcing a full document reload — the whole
header nav, the drawer, "Get the app", the footer's section links, and `/terms` and
`/privacy-policy` from inside the checkout. All `<Link>` now. Anchors with `target="_blank"`
stay anchors; a new tab is a new document either way.

**Layout.** Every component is a folder with `index.tsx`. `lib/` is gone, its twelve modules
under `utils/`. `booking/parts.tsx` split into four components with its class constants moved
to `utils/booking/styles`; `booking/context.tsx` moved to `utils/`, being state rather than UI.

**Components.** `components/common/{Button,Input,Textarea,Loader,Card}`. 76 of 77 raw
`<button>` and every recipe-carrying form control routed through them. `Select` and
`FormDialog` were deliberately not built — the skill says "create on first need", there is no
`<select>` anywhere, and the dialog was already covered. (That dialog has since moved to
`components/common/Modal`, where this section implies it should have been.)

**`cn()`.** 69 composed class strings. Module-level recipe constants keep their `+`, which
wraps lines rather than composing conditionally.

**Validation.** Four Yup schemas beside their components, every message carried over verbatim.
`utils/validation` gained `validateFormSync` because the checkout computes a field's error
during render.

**Icons.** Swapped to lucide. Archived first — see `docs/ICONS.md` and `public/icons/`.

### Two things this left that are worth knowing

**`Button` and `Input` both take a `surface`.** The landing page, the checkout and the auth
modal are genuinely different systems, not one with modifiers. The auth modal's field is 52px
where the checkout's is 48, with a different radius, padding, text size and placeholder — a
shared recipe restyles one of them. That was caught by the audit, not by reading.

**`tailwind-merge` changes how class conflicts resolve** — by source order, where Tailwind
uses its own sort order. That is the fix for trap 4 above, but it means a base and a state
recipe setting the same property now behave differently. `scripts/audit/deep.mjs` drives the
conditional states (selected day, selected slot, open accordion) for exactly this reason.

**`yup` is in the client bundle on every page** — a 56K chunk, because `AuthProvider` imports
`AuthModal` statically from the root layout. Loading the modal with `next/dynamic` would move
it out of the initial bundle; not done, since it changes loading behaviour and deserves its
own pass.

## Done — the Details step is now conditional

**A signed-in account whose details are already on file no longer sees step 3.** Address →
Time → Payment, three steps in the stepper, and Time's button says where it actually lands.
Everyone else — guests, and accounts missing any of it — sees the four steps exactly as
before. This is a deliberate departure from the design, which draws four for everyone.

The step was a click for nothing and had been since the seed was written.
`seedFromStatus` copies the account's name, phone and email into the booking *during render*,
before any screen mounts, so a returning customer was shown three fields read back from their
own account, a "Signed in" banner, and a Next button that was already live.

Worse, it was a click for nothing that looked editable and was not. Nothing persists a change
made there: `createOrder` sends only dates and slots, registration is skipped for an account
that exists, and `PATCH /users/{id}` is 405 (see ENDPOINTS.md). An edit survived until the
next `refreshSession()` and was then silently overwritten by `/my-status`. Removing the
screen removes a promise the API cannot keep.

**What made it possible: the mobile is now required at signup.** It was optional — labelled
"Phone (optional)" — which is exactly why the step could not simply be dropped: an account
could legitimately have no number, and the checkout needs one for the Stripe billing details
and for the driver. `signupSchema.phone` is `.required()` now, the field reads "Mobile
number", and `signupReady` gates the button on `UK_MOBILE_RE`.

**The fallback is the whole design.** The skip is decided by the account, not by being signed
in: name, email, and a mobile that *passes the regex* — not merely present, because a
malformed number on an older account is the case that still needs the step. Accounts made
before this change, and the mocked Google/Apple paths that return no number at all, keep the
four steps until they have one. The skip fades in as the gap closes; nothing has to be
backfilled.

Three things worth knowing about the implementation:

- **`utils/booking/flow.ts` grew a second axis.** `routesFor`/`stepsFor` take a
  `Flow = { wide, skipContact }` instead of a bare `wide`. `ROUTES` — the *parser* set —
  stays complete on purpose: `/book/contact` must remain a recognised URL when it is not in
  the walk, or a deep link to it would be treated as gibberish and sent to the start.
- **The guard's `here < 0` branch used to `replace("/book/address")`.** It was unreachable
  before (only wide-on-Review could hit it, and a separate effect handles that), and it is
  the normal path now — a bookmark to `/book/contact`, or the step being pulled out from
  under someone the moment they sign in. It forwards to `furthestAllowed` instead, so an
  address and a pair of slots already chosen are not thrown away. It is also guarded with
  `allowed !== step`, because replacing to the route you are already on is an effect that
  never settles.
- **Screens no longer name their successor.** Time pushed `"contact"` literally, which is
  precisely what breaks when a step leaves the walk. There is a `forward()` on the context
  now, mirroring `back()`, and it is the only way forward.

**One bug fixed on the way.** `LoginSheet`'s `onLoggedIn` in the booking shell never called
`refreshSession()` — the only login path in the app that did not (`AuthProvider` does,
the contact screen does). The seed therefore never re-ran after logging in from inside the
checkout, so `status` stayed stale. Harmless before; it would have meant a returning customer
who logged in mid-flow stayed on four steps until they reloaded.

Not changed, deliberately: `seedFromStatus` itself. Skipping the *screen* must not skip the
*seed* — `data.fullName/mobile/email` are still populated and the payment step still hands
the phone to Stripe, which `fields.billingDetails: never` depends on (see "Two bugs found by
running it").

### Amended — the Contact row is back on both summaries, with its Edit link

Skipping the step took the Contact row out of the Review card and the pinned panel with it,
on the argument that a row nobody can act on is a dead end. That was the wrong half to drop.
An order summary that does not say who the order is for is not a summary — the name, the
number and the email are the things worth checking before Confirm order, and the values are
there either way, typed on the step or seeded from the account.

So the row is unconditional on both surfaces now, and **Details joined Address as a skip that
can be undone**: `savedContact` is what the account answers, `editContact` is what the Edit
link asks for, and `skipContact = savedContact && !editContact` — the same shape as
`skipAddress`, set in the same place, cleared by the same seed. `go("contact")` sets it, so no
caller has to remember to.

**What that broke, and the fix it forced.** `WALK_WIDE` ends at `payment`, so for a returning
customer who skips it, un-skipping Details puts that step at the **tail of the walk**. Address
could never do this — it is index 0 of both walks. `ContactScreen`'s Next was a bare
`forward()`, which does nothing when `nextAfter` returns null: a live button that did nothing,
and no Confirm order anywhere in the walk. It now asks `isLast` and uses `useConfirmSubmit`
like Time and Review, error line included — the hook's header says four screens, not three,
and that is the whole reason it exists.

**What an edit actually does, said on the screen.** Nothing here reaches the account: POST
/orders carries no contact fields, `PATCH /users/{id}` is 405, and email is refused once
verified. An edit is the booking's copy only and `/my-status` replaces it on the next load.
Rather than leave a form that looks like account settings, the Details step now says so in a
line under the Signed in card, shown only when signed in. When there is a real profile screen
to send people to, that line and this Edit link are what should point at it.

## Done — the Address and card steps are conditional too

**A returning customer books in one step.** For a signed-in account carrying an
address we serve and a default card, the desktop walk is now **Time alone** — its
button says *Confirm order* and places the order — and the phone walk is **Time →
Review**. Everyone else sees exactly what they saw before. This finishes the
argument the Details step started: a screen whose whole content is read back from
`/my-status`, above a button that is already live, is a click for nothing.

| | before | after |
|---|---|---|
| desktop | Address → Time → Payment | **Time** |
| phone | Address → Time → Review → Payment | **Time → Review** |

`Flow` grew from two axes to four — `{ wide, skipContact, skipAddress, skipPayment }` —
and `routesFor`/`stepsFor` filter all three skips through one `Set`. Both new axes are
decided at seed time from `/my-status`, never from `data`, for the reason `skipContact`
already gave: `data` is the seed plus anything typed since, and the question is what the
*account* holds. `savedAddressUsable` is deliberately character-for-character
`furthestAllowed`'s `postcode && line1 && town` plus `seedFromStatus`'s `isActive !== false`;
`hasDefaultCard` tests `isDefault` rather than a card merely being in the list, because
`POST /orders` charges the default and a list without one is an account we cannot bill.

**The landing page says what it now does.** The hero and the closing band read
**Book now** for a signed-in customer, and `useStartBooking` pushes `/book/time`
rather than `/book/address` when the account has a usable address — the guard would
redirect anyway, but only after the address screen had mounted and been seen. It
takes `status` as an argument the way `useOfferDiscount` does, so `utils/` stays out
of `components/`. Signed out is still the default and still renders immediately, so
the server HTML never has a hole where the call to action should be.

### Four things this broke, and what each one taught

- **`ROUTES` was doing two jobs.** It was both the URL parser's set and the walk, and
  it contained `confirmed`. Harmless while only `PaymentScreen` could be last, since
  that screen never calls `forward()`. With Time last, `nextAfter("time", flow)`
  returned `"confirmed"` and the Continue button would have pushed a confirmation for
  an order that was never placed. The walk arrays now stop at `payment`; `ROUTES` is
  spelled out separately for `isRoute()` and `generateStaticParams`. The payoff is
  that **`nextAfter(route, flow) === null` is now the honest test for "this screen
  carries Confirm order"**, which is what the three screens ask via `isLast` rather
  than each knowing why it is last.
- **`indexOf(allowed)` is -1 for a skipped step, and -1 read as a position means the
  start.** `furthestAllowed` answers `"payment"` for a complete account, which is the
  right answer to *how far have they got* and not a route such an account can be on.
  In the indicator that disabled every dot; in the guard it would have sent somebody
  to a step that is not in the walk. `reachIndex` falls back to the **last** index,
  and the implication is sound rather than convenient: a skipped step is one the
  account has already answered, so an answer outside the walk can only mean the whole
  walk is open. The guard also replaces to `routes[limit]` rather than to `allowed`.
- **The `<ol>` of steps is the header's spacer.** It carries `flex-auto`, and the
  account name, FAQs and Close are held on the right by it. Returning `null` for a
  one-step walk slid all three back against the wordmark. `Steps` returns an empty
  `flex-auto` div instead. Worth remembering before anything else in that row is made
  conditional.
- **A skipped step still needs an Edit link.** Both summaries offer *Edit* on the
  address, and with the step out of the walk the guard's `here < 0` branch bounced it
  straight back. Rather than teach the guard about "skipped but reachable", **asking
  for the step is what puts it back in the walk**: `go("address")` sets `editAddress`,
  the walk grows by one, and the guard, `back()`, `forward()` and the indicator all
  follow with no special case anywhere. It stays in the walk afterwards, shown as a
  step already done, which is the truth. There is no equivalent for payment, by
  decision — see below.

### Two decisions taken with the customer, not derived

- **The terms tick is dropped for returning customers.** It lives on the payment
  screen and stays there for everyone who still sees one. `data.terms` is client-side
  only — `createOrder` has never sent it — so this is a product decision rather than a
  technical one, and it is recorded here because nothing in the code says it.
- **No way to choose a card.** The last card used is already the account's default and
  that is what `POST /orders` charges, so the step is skipped however many cards are
  on the account. Changing the default is later work, which is why the Payment row in
  both summaries **names the card and offers no Edit** — a link to a screen that does
  not exist yet would be a control that cannot do what it says. Naming it is not
  optional though: confirming an order that charges a card nobody has been shown is
  the one thing this change must not do. `brandName` moved to `utils/booking/model`
  and gained `cardLabel` beside it so the two summaries and the card list cannot
  disagree.

`useConfirmSubmit` in `utils/booking/use-confirm.ts` now owns the busy flag, the error
line and the rule that a failure must not navigate. `PaymentScreen` passes its card
capture as the hook's `before`, so the three screens that can place an order cannot
drift apart on any of it.

### Verified

**45/45 in a browser**, at 1440 and 390, with `/my-status` and the slot endpoints
stubbed — the same technique the `recurring` runs used, and necessary here because an
invalid JWT makes even the public endpoints fail at the firewall.

- **Signed out, both widths** — unchanged. "Check availability", `/book/address`, four
  steps, Address first. `curl -s localhost:3000/ | grep -c "Log in"` is still 1, and
  the server HTML still carries "Check availability" twice and "Book now" not at all.
- **Signed in, nothing saved** — three steps (Details skipped and nothing else),
  Address first, Payment last.
- **Saved address, no card** — "Book now", lands on `/book/time` and never on
  `/book/address`, two steps, "Continue to payment", **no** Confirm order and no order
  placed. Then: *Edit address* opens the step, **the indicator grows to three**,
  Continue returns to Time and the slots survived the detour.
- **Saved address + card, 1440** — **no step indicator**, FAQs still in the right half
  of the header, Confirm order on the Time screen, no Continue to anything, the panel
  reads "Visa ending 4242", no terms tick. The press fires **exactly one**
  `update-address` and **exactly one** `POST /orders`, with **no** `setup-intent` and
  **no** `check-status`, and the confirmation shows the server's own number.
- **Saved address + card, 390** — Time → Review, Confirm order on Review, the card
  named there, and "Added on the next screen" gone. Same network trace.

`tsc --noEmit` clean, `next build` green at 33 pages with all six `/book/*` routes
still generated, ESLint reporting only the two pre-existing
`react/no-unescaped-entities` errors.

**Not verified by me:** a real order from a real account. Every run above stubbed
`/my-status`, so the flow is proven end to end but `POST /orders` was answered by the
harness rather than by staging. The shapes are the ones staging sends.

## Pending — integration

**Agreed order: the logged-in user flow first, guest checkout after.**

### Staging data, probed — read before starting the address step

`POST /find-addresses` works and is public, but the staging data behind it is inconsistent in
two ways that will bite whoever wires it:

- **Only two postcodes are active**: `KT21 1PG` and `KT18 5AA` return `isActive: true` with 14
  addresses. `KT22 7HH`, `KT21 2AA`, `KT19 8AB`, `KT17 1DS` and everything else return
  `isActive: false` with an empty list — including towns the site advertises.
- **The addresses returned do not match the postcode asked for.** Querying `KT21 1PG` returns 14
  rows all carrying `postcodeString: "KT22 7HH"` — and `KT22 7HH` is itself reported inactive.
  So saving one of those via `PATCH /users/{id}/update-address` would store a postcode this same
  API says is not served, which is likely to break `/slots/*` downstream through `AreaResolver`.

Enough to build the lookup against; not enough to trust an end-to-end run. Worth resolving with
the backend before the address step is called done.

### Slots: resolved, except for the status code

Both of the original complaints turned out to be one thing seen from the wrong side. **Pass
`postcode` and both endpoints answer 200 with no token and no saved address** — that is the
supported anonymous path, and it is not in the brief.

What remains is genuinely a bug, and it is what sent this the wrong way for two sessions:

- `GET /slots/pickup` with **no token and no postcode** returns **500** —
  `Expected an instance of App\Entity\User. Got: NULL` — with a vendor stack trace in the
  body. It should be a `400` naming the missing parameter, or a `401`. As a 500 it reads as
  "this endpoint is broken or protected", which is why the public path went unfound.
- Same for `/slots/dropoff`.

Worth raising with the backend dev alongside the recurring 500 — same class of thing, a
precondition answered as a server error.

Phase 1, logged-in: ~~login~~ → ~~email verification~~ → ~~address~~ → ~~slots~~ →
~~save card~~ → ~~create order~~. **Complete.**

Phase 2, guest checkout: **complete** — see "Done — the guest checkout" above. It needed no
new design and no reordering; it needed the `postcode` parameter, which is not in the brief.

Only `register()` moving onto `apiCall` remains, and it is unrelated to both — see open
item 4 below.

### Ten places the API and the design disagree

Numbered so they can be referred to. 1, 2 and 6 change what gets built; the rest are
contained.

1. ~~**Guest checkout is blocked.**~~ **Settled: it was never blocked, and the design needed no
   change.** The real public set is **eight**, not four: `/register`, `/login-check`,
   `/system-status`, `/reset-password/*`, `/verification-code/request`, `/login-with-code`,
   `/find-addresses` **and both `/slots/*` endpoints when `postcode` is passed**. The last of
   those is what settles it, and I had it wrong twice: first assuming the brief's list was
   complete, then confirming the 500 without trying the parameter. Only
   `/payment-methods/*`, `/orders`, `/my-status` and `/users/{id}/*` genuinely need a token,
   and by the time the flow reaches them the Details step has produced one.
2. ~~**There is no payment step, there is a save-a-card step.**~~ **Done.** The sequence is
   SetupIntent → `confirmSetup` → `check-status` → `POST /orders`, and `PaymentScreen` skips
   the Element entirely when `/my-status` already reports a default card. See "Done — the card
   and the order" above, including the three places staging disagrees with the brief.
3. **Slots carry no `eco` flag.** The API returns `{ id, startTime, endTime }`. The design has
   an Eco pill on slot tiles (`Calendar.tsx` `SlotPicker`), leaf markers on calendar cells and
   a legend explaining them. Nothing backs it.
4. **Slot shape mismatch.** `Availability` is a map of dayKey → `{ label, eco }` and the flow
   carries a label string. `POST /orders` needs the slot IRI, so `Availability` must start
   carrying ids. Contained to `utils/booking/model.ts` and the two fetchers.
5. ~~**The verification code is probably not six digits.**~~ **Settled: it is six numeric
   digits.** Three independent sources — the live email sends `488137`, and the backend's own
   `VerificationCodeTest` asserts `458444` and `292323`. `CODE_LENGTH` now lives in
   `utils/auth/model.ts` and governs the regex, the copy and the input's `maxLength` from one
   place. The URL token is still submitted verbatim rather than digit-stripped, since the
   server is the authority on its own codes.
6. ~~**`/verify-email` and `/reset-password` are native-app handoffs.**~~ **Both are real pages
   now**, and neither needed a change to the association files — those only *authorise* the OS
   to open the app, so a phone with the app installed still gets the app, and the pages render
   for desktop, phones without it, and in-app webviews. Original note kept below for the
   reasoning. ~~`/verify-email` is a real page now
   — and doing it touched **none** of the association files, because they only *authorise* the
   OS to open the app. A phone with the app installed still gets the app; the page renders for
   desktop, phones without it, and in-app webviews. `/reset-password` is the same shape but is
   blocked on `requestPasswordReset()` in `AuthModal` still being a mock: nothing sends that
   email today, so the page would be unreachable. Wire the forgot pane to
   `/reset-password/request` first.
7. ~~**Email verification is gated behind login.**~~ **Done, and turned into the gate itself.**
   Both verify endpoints need a Bearer token, so the order is register → login →
   `emailVerifiedAt === null` → verify. Rather than sign an unverified account in and gate the
   checkout afterwards, **an unverified account gets no session at all**: the token goes into a
   one-hour `pendingtoken` cookie that only the three verification calls read, and `authtoken`
   is written only on a good code. `apiCall` never learns about `pendingtoken`, so every other
   request from such an account goes out unauthenticated, and `AuthedUser` is null — which is
   why `site-header` and `booking-shell` needed no change to honour it.

   Worth knowing: `/login-check` returns a **fully working** token for an unverified account —
   probed against staging, it reads `/my-status` quite happily, and the JWT payload is only
   `{iat, exp, roles, id}` with no verification claim. The server imposes nothing. The whole
   gate is ours, and it is client-side, so it is a product rule and not a security boundary.
8. ~~**`login()` throws away the `user` object.**~~ **Fixed.** `utils/auth` reads
   `res.data.user` off `/login-check` and carries `emailVerifiedAt` into the session, which is
   what conflict 7's verification gate will read.
9. **Money is in pennies.** Integers throughout. **Settled for the price list**, which was the
   half of this that rendered: `formatPrice` in [`utils/pricing`](../utils/pricing/index.ts) is
   the one place pence become pounds, and `/price-combined` confirmed the rule holds on a
   second endpoint (`1500` = £15.00). Still open for `utils/booking/model.ts` `Discount` —
   nothing on the checkout renders a money figure yet, so it is unproven rather than wrong;
   `POST /orders` returns `subtotal`, `discountAmount` and `total`, all `0` until the items
   are counted.
10. ~~**`toE164` does not enforce length.**~~ **Fixed**, and it mattered more than the length.
    Prefixing `+44` unconditionally meant a number that already carried one went up doubled:
    the checkout's mobile field was free text, and its regex explicitly *accepted* `+44 7700
    900123`, so a correct mobile became `+44447700900123` and came back as a 422 reading
    "must be a valid UK number starting with +44 followed by 10 digits" — shown against a field
    that was right. Signed-in customers hit it without typing anything, since `user.phone`
    arrives from `/my-status` already in E.164 and was seeded straight into `mobile`, then
    handed to `toE164` again for the Stripe billing details.
    `toE164` now goes through a new **`toNationalUk`** in `utils/api/index.ts`, which reduces
    any shape — `+44…`, `0…`, `44…`, spaced, bracketed — to the ten national digits, and
    returns `undefined` unless the result is exactly `7` + 9. Both phone fields are the new
    `components/common/PhoneInput`, which holds only the national part behind a fixed `+44`
    and normalises on the way in, so the doubled shape is now unreachable rather than merely
    unlikely. The two divergent `UK_MOBILE_RE` constants collapsed into one in
    `utils/auth/model.ts` at the same time — one field, one shape, one rule.

### The shared `utils/` layer — one change made, several open

`utils/` is shared with the other developer's project, so everything here needs telling them.

**Changed while adding the logout confirmation:** `apiCall` now exports **`clearApiCache()`**.
Purely additive — no existing caller behaves differently. It exists because the GET cache is
keyed on method, endpoint and params with **no token and no user identity**, and entries never
expire, so a response read while one person is signed in was readable by whoever signed in
next. Mutations clear it as a side effect, which is the only reason this never bit: the app's
two GETs happen to be separated by a POST on every realistic path. `utils/auth` `logout()` now
calls it, which covers the one moment when whose data is whose changes with no mutation to ride
on. **Add an authenticated GET without this and log-out-then-log-in-as-someone-else in the same
tab serves the previous account's data.**

**Changed while wiring verification:** `utils/api` now **exports** `readViolations`,
`readMessage` and the `ErrorBody` type, which were module-private. `utils/auth` needs them
because `apiCall` only surfaces the backend's own wording for 409 and 422 — on a 400 it
substitutes *"Invalid request. Please check your input."* — and both messages that matter here
(`"Incorrect code"`, `"Email is already verified."`) are 400s. One behaviour change came with
it: `readMessage` no longer takes a `status` and returns `undefined` instead of
`` `Something went wrong (${status}).` `` when the body carries no wording, so callers can fall
back to something better than a status code. Its only existing call site, `send()`, applies
that fallback itself now.

**Changed while wiring login:** `apiCall` gained **`showErrorToast`** (optional, defaults to
`true`, so no existing caller behaves differently). It exists because `apiCall`'s 401 branch
toasts *"Session expired. Please login again."* — the wrong sentence on the screen you use to
start a session, and a duplicate of the inline alert the form already shows. Only the
HTTP-error toast is suppressed; a dropped connection still toasts, because nothing else
reports it.

**Still open:**

1. **Leading slash.** `apiCall` builds `${BASE_URL}${endpoint}` and the skill mandates
   endpoints with no leading slash. With `NEXT_PUBLIC_API_URL=https://api.staging.laundryfree.co.uk`
   that yields `…co.ukareas`. `utils/routes/index.tsx` here keeps the leading slash, matching
   the brief's own notation and our three existing callers. **Needs the other developer's
   agreement** — if their `apiUrl` carries a trailing slash, one of the two has to move.
2. **Cookie name.** `apiCall` reads `authtoken`; `apiRequest` reads `accessToken`. Login now
   writes **`authtoken`**, so anything server-side would not see the session. Has to be
   reconciled before a Server Component calls a protected endpoint.
3. **`Content-Type` default.** `apiCall` sends `application/ld+json`; the brief opens with
   "Send `Content-Type: application/json` on POST". `utils/auth` overrides it per call rather
   than changing the shared default, so **every endpoint added from here needs the same
   override** until this is settled. Not a bug today — staging `/login-check` was probed with
   both and rejected neither — but it is one override per call site until someone decides.
4. **`apiCall` surfaces only `violations[0].message`** as a toast. It does return the raw
   error body as `data`, so the full `violations` / `hydra:violations` array is still
   reachable — but the mapping to `{ field: message }` has to be redone at each call site.
   This is the only reason `register()` has not moved off `utils/api/index.ts` yet.

### One prerequisite before `apiRequest` can be used at all

`utils/api-request/index.ts` calls `unauthorized()` from `next/navigation` on a 401. In
Next 16 that function is **still experimental** and throws unless
`experimental.authInterrupts: true` is set in `next.config.ts`
(`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/unauthorized.md`).

The flag is not set here, and was deliberately left alone: it is an experimental option on a
production site's build config, nothing calls `apiRequest` yet, and the change was outside
this task. It has to go in before the first Server Component or Server Action uses that
helper. Enabling it also unlocks the `unauthorized.js` / `forbidden.js` file conventions, so
a 401 page should be designed at the same time. `apiCall` (client) is unaffected.

### Other open work

- **`apiCall` caches GETs in memory and only clears on a mutation.** Signing out is not a
  request, so a stale `/my-status` survives until the next login POST clears the cache.
  Harmless today — nothing calls `/my-status` between a sign-out and the next login, and an
  in-memory cache dies on reload — but it becomes a real bug the moment something does. The
  fix is an exported cache-clear on `apiCall`; not worth a second change to a shared file
  until it is needed.
- **No endpoint exists** for the account-exists check, SMS verification or ratings — all of which
  the UI offers. Pricing came off this list: `GET /price-combined` is live and wired. Apple/Google
  came off it too, for a different reason — `/login/google` and `/login/apple` exist and the mobile
  app uses them; what is missing there is our half. See ENDPOINTS.md.
- **Conform existing code to the imported skills** — `cn()` instead of string concatenation,
  Yup schemas via `validateAndSetErrors`, shared `common/` components, `apiCall`/`apiRequest`
  instead of bare `fetch`. Deliberately deferred: the ported design's pixel accuracy depends
  on hand-tuned class recipes, and §7 of the best-practices skill ("icons always from
  `lucide-react`") conflicts with the checkout's inline SVG paths in
  `components/booking/icons.tsx`. Needs to be done component by component with the audit
  harness re-run, not as a sweep.
- **`lib/` vs `utils/`.** Both exist. `lib/` holds design tokens, recipes and models; `utils/`
  holds the shared API layer. The structure skill only names `utils/`. Not reconciled.

---

## Must not ship

| Item | Where |
|---|---|
| Fabricated `RATING = { score: 4.9, count: 63 }` | `utils/content/index.ts` |
| ~~Ten invented `PRICING` categories~~ **Fixed.** The table is gone. The section reads `GET /price-combined` in the browser — nine real categories, 38 items — and renders **nothing at all** if that call fails, because a wrong price is worse than a missing one | `utils/pricing/index.ts` |
| ~~Hardcoded 25% `DISCOUNT`, shown to returning customers too~~ **Fixed.** The const is gone; both the offer bar and the checkout read [`utils/discount`](../utils/discount/index.ts) through `useOfferDiscount()` — `/system-status` signed out, `nextOrderDiscount` signed in, nothing rendered when there is none. `nextOrderDiscount`'s field names still need confirming against a live session | `utils/discount/index.ts` |
| Stripe key now read from `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — **the live key must be set in the deploy environment**; unset, the payment step says so instead of failing at confirm time | `config.ts` |
| JWT in a script-readable `authtoken` cookie — only the server can set httpOnly, so the backend needs to set it instead of returning the token in the body | `utils/auth/index.ts` |
| `SERVED` omits Fetcham, which the landing page advertises | `utils/booking/model.ts` |
| `assetlinks.json` uses `handle_all_urls`, letting the Android app intercept `/book/*` | `public/.well-known/assetlinks.json` |

---

## Environment

`NEXT_PUBLIC_API_URL` is read through `config.ts` — never `process.env` directly.
`.env.local` (gitignored) points at `https://api.staging.laundryfree.co.uk`. Without it the
offer bar silently falls back to its designed copy.

`next.config.ts` marks `/_next/static/*` `immutable` in production only. In dev Turbopack
reuses chunk filenames, so `immutable` there pins whichever stylesheet a browser saw first
and no ordinary reload dislodges it — which once presented as a completely unstyled page.

**A production build left in `.next` can make `next dev` answer 404 to every route but `/`.**
The two share the directory: dev keeps its own tree under `.next/dev`, but the root still
carries the build's `BUILD_ID`, `routes-manifest.json` and `app-path-routes-manifest.json`,
and a dev server started on top of those ends up with a route table that knows almost nothing
— while `.next/dev/server/app/book/[step]/page.js` sits compiled on disk next to the manifest
that does not list it. There is no error in the dev log and no error overlay; it simply reads
as "the app is broken". It is not. `rm -rf .next` and restart.

This is easy to cause by accident, because `scripts/audit/*` require a production build to run
against — see the note in [`scripts/audit/README.md`](../scripts/audit/README.md).
