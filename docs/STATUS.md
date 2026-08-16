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

## Pending — integration

**Agreed order: the logged-in user flow first, guest checkout after.**

Phase 1, logged-in: ~~login~~ → register onto `apiCall` → email verification → address →
slots → save card → create order.

Phase 2, guest checkout: blocked on conflict 1 below.

### Ten places the API and the design disagree

Numbered so they can be referred to. 1, 2 and 6 change what gets built; the rest are
contained.

1. **Guest checkout is not possible against this API.** Only `/register`, `/login-check`,
   `/system-status` and `/reset-password/*` are public. `/find-addresses`, `/slots/*`,
   `/payment-methods/*` and `/orders` all need a Bearer token. The `/book` flow is guest-first
   by design — address, time, contact, payment, confirm, with login merely offered. To use
   this API the user must register or log in **before the address step**. Largest gap; decide
   before phase 2.
2. **There is no payment step, there is a save-a-card step.** Brief §8: "payment is taken
   automatically from the default card, there's no pay screen." `PaymentScreen` mounts a
   Stripe Payment Element to take payment. Correct sequence: SetupIntent → `confirmSetup` →
   `check-status` → `POST /orders`.
3. **Slots carry no `eco` flag.** The API returns `{ id, startTime, endTime }`. The design has
   an Eco pill on slot tiles (`Calendar.tsx` `SlotPicker`), leaf markers on calendar cells and
   a legend explaining them. Nothing backs it.
4. **Slot shape mismatch.** `Availability` is a map of dayKey → `{ label, eco }` and the flow
   carries a label string. `POST /orders` needs the slot IRI, so `Availability` must start
   carrying ids. Contained to `utils/booking/model.ts` and the two fetchers.
5. **The verification code is probably not six digits.** The brief shows `"code": "abc123…"`.
   `utils/booking/model.ts` sets `CODE_LENGTH = 6`, both inputs strip non-digits with
   `replace(/\D/g, "")`, and the copy says "6-digit code" in two places. **Needs confirming
   with the backend.**
6. **`/verify-email` and `/reset-password` are native-app handoffs today.** Both are
   `DeepLinkFallback` stubs. The brief needs them as real pages that read `token` from the URL
   and POST it. Changing them touches `.well-known/assetlinks.json`,
   `apple-app-site-association` and the app's intent filters, since the app claims those paths.
7. **Email verification is gated behind login.** Both verify endpoints need a Bearer token, so
   the order is register → login → `emailVerifiedAt === null` → verify. `AuthModal` currently
   treats signup as finished after register + login.
8. ~~**`login()` throws away the `user` object.**~~ **Fixed.** `utils/auth` reads
   `res.data.user` off `/login-check` and carries `emailVerifiedAt` into the session, which is
   what conflict 7's verification gate will read.
9. **Money is in pennies.** Integers throughout. `utils/booking/model.ts` `Discount` and the
   pricing tables need checking against that.
10. **`toE164` does not enforce length.** The brief says `+44` followed by **10 digits**.
    `utils/api/index.ts` strips non-digits and leading zeros then prefixes `+44`, with no count check.

### The shared `utils/` layer — one change made, several open

`utils/` is shared with the other developer's project, so everything here needs telling them.

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
- **No endpoint exists** for the account-exists check, Apple/Google sign-in, SMS verification,
  pricing or ratings — all of which the UI offers. See ENDPOINTS.md.
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
| Ten invented `PRICING` categories | `utils/content/index.ts` |
| Hardcoded 25% `DISCOUNT`, shown to returning customers too | `utils/booking/model.ts` |
| Stripe **test** publishable key | `components/booking/stripe-payment/index.tsx` |
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
