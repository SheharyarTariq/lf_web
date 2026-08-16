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
same browser authenticates itself with no login prompt, and in a fresh context falls back to
one.

**Not verified by me:** the happy path with a genuine code, which only the inbox has. Every
other branch above is real.

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
`<select>` anywhere, and `booking/common/Modal` already covers the dialog.

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

## Pending — integration

**Agreed order: the logged-in user flow first, guest checkout after.**

Phase 1, logged-in: ~~login~~ → ~~email verification~~ → register onto `apiCall` → address →
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
5. ~~**The verification code is probably not six digits.**~~ **Settled: it is six numeric
   digits.** Three independent sources — the live email sends `488137`, and the backend's own
   `VerificationCodeTest` asserts `458444` and `292323`. `CODE_LENGTH` now lives in
   `utils/auth/model.ts` and governs the regex, the copy and the input's `maxLength` from one
   place. The URL token is still submitted verbatim rather than digit-stripped, since the
   server is the authority on its own codes.
6. **`/reset-password` is still a native-app handoff.** ~~`/verify-email`~~ is a real page now
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
9. **Money is in pennies.** Integers throughout. `utils/booking/model.ts` `Discount` and the
   pricing tables need checking against that.
10. **`toE164` does not enforce length.** The brief says `+44` followed by **10 digits**.
    `utils/api/index.ts` strips non-digits and leading zeros then prefixes `+44`, with no count check.

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
