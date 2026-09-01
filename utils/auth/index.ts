/* ══════════════════════════════════════════════════════════════════
   The session
   ══════════════════════════════════════════════════════════════════

   Signing in, restoring a session on load, signing out, and proving the
   address. Kept out of the components so the checkout's LoginSheet can reuse
   them instead of growing a second implementation of the same flow.

   Transport is `apiCall` (utils/api-call), per the web-api-patterns skill.

   ── Two tokens, on purpose ──
   `authtoken` is a session. `pendingtoken` is not.

   /login-check hands back a working token even when emailVerifiedAt is null —
   probed against staging, where that token reads /my-status quite happily. The
   server places no restriction on an unverified account, so the whole gate is
   ours: an account that has not proved its inbox never gets `authtoken`, and
   without `authtoken` apiCall sends no Authorization header, AuthProvider
   builds no user, and the header and checkout see a signed-out visitor.

   The token still has to go somewhere, because /email-verification/verify is
   itself authenticated — you cannot prove the address without it. So it goes
   in `pendingtoken`: same credential, one hour, and read by nothing except the
   four verification calls at the bottom of this file. Verifying promotes it to
   `authtoken`, and that is the moment somebody is logged in.

   A module variable would have been tighter, but it dies on every page load,
   and the "Verify my account" button in the email is a page load — it opens a
   fresh tab that would have no credential and would have to ask for a password
   to do the one thing the person just clicked. Against script the two are
   equivalent anyway; `authtoken` cannot be httpOnly either (see utils/helper).
   What the cookie really adds is persistence at rest, for a credential to an
   account holding no orders, no card and no address.
   ══════════════════════════════════════════════════════════════════ */

import apiCall, { clearApiCache } from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { deleteCookie, getCookie, setCookie } from "@/utils/helper";
import { readHumanMessage, readViolations, type ErrorBody } from "@/utils/api";
import type { VerificationPurpose } from "@/utils/auth/model";

export const TOKEN_COOKIE = "authtoken";
export const PENDING_COOKIE = "pendingtoken";

/* Deliberately not jwtExpirySeconds. The JWT runs for a year; this credential
   should not. An hour is roughly how long the emailed code stays useful. */
const PENDING_MAX_AGE = 60 * 60;

/* The backend brief opens with "Send Content-Type: application/json on POST",
   but `apiCall` defaults to application/ld+json for the other project's API
   Platform endpoints. Overridden per call rather than changed globally, since
   utils/ is shared. Staging accepts both on /login-check — probed — so this is
   about following the brief, not about fixing a failure. */
const JSON_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

/* ── Shapes ───────────────────────────────────────────────────────
   /login-check returns the user alongside the token. /my-status returns the
   same user with more on it — including emailVerifiedAt, which §4 of the
   brief omits from its field list but which staging does send.
   ───────────────────────────────────────────────────────────────── */

export interface AuthUser {
  id?: string | number;
  email: string;
  name: string;
  phone?: string;
  /** null means the address has not been proved yet. Present on both
   *  /login-check and /my-status — confirmed against staging. Optional here
   *  only so that an endpoint which omits it reads as "no opinion" rather
   *  than as "unverified"; see the `=== null` checks below. */
  emailVerifiedAt?: string | null;
  isAdmin?: boolean;
}

interface LoginBody {
  token?: string;
  user?: AuthUser;
}

/** The saved address, as /my-status returns it. `isActive` is the server's
 *  answer to "do we collect from that postcode", decided for the postcode it
 *  holds — and note it normalises what we send: PATCH `KT21 1PG`, read back
 *  `KT211PG`. Its copy is the authoritative one. */
export interface MyStatusAddress {
  line1?: string | null;
  line2?: string | null;
  line3?: string | null;
  town?: string | null;
  county?: string | null;
  postcodeString?: string | null;
  isActive?: boolean;
}

/** A saved card. `isDefault` is the one that matters to the checkout: POST
 *  /orders charges the default card, so an account with one already needs no
 *  card step at all. */
export interface PaymentMethod {
  id: string | number;
  brand?: string | null;
  last4?: string | null;
  expiryMonth?: number | null;
  expiryYear?: number | null;
  isDefault?: boolean;
  paymentChannel?: string | null;
  /** Not in §4's field list, but staging sends it. It is what the card list
   *  sorts on: the response itself is ordered default-first, so without a
   *  stable key of its own the rows reshuffle every time somebody chooses a
   *  different card. */
  createdAt?: string | null;
}

/** The in-flight order, or null. Statuses are `created`, `awaiting_review`,
 *  `payment_pending`, `payment_failed`, `processing`, `delivered`,
 *  `cancelled`. `pickupSlot` arrives as an IRI rather than an object. */
export interface RecentActiveOrder {
  id?: string | number;
  number?: string | null;
  status?: string | null;
  pickupDate?: string | null;
  pickupSlot?: string | null;
  dropoffDate?: string | null;
}

/**
 * Everything /my-status returns — §4 of the brief, and the single source the
 * whole app hydrates from.
 *
 * `recurring` and `nextOrderDiscount` are deliberately loose: the brief names
 * them but does not give their fields, and inventing a shape here would make a
 * guess look like a contract. Type them properly once something reads them.
 *
 * **Money is integers in pennies** wherever it appears below.
 */
export interface MyStatus {
  user?: AuthUser;
  address?: MyStatusAddress | null;
  recentActiveOrder?: RecentActiveOrder | null;
  completedOrderCount?: number;
  paymentMethods?: PaymentMethod[];
  recurring?: Record<string, unknown> | null;
  nextOrderDiscount?: Record<string, unknown> | null;
}

/** Every failure in this file, in one shape, so callers never have to know
 *  whether the server answered with a `detail`, a violations array or nothing
 *  at all. `fields` is empty unless the server named a property. */
export interface AuthFailure {
  ok: false;
  message: string;
  fields: Record<string, string>;
  status: number | null;
}

export type LoginResult = ({ ok: true; verified: boolean; user: AuthUser }) | AuthFailure;

export type VerifyResult = { ok: true; user: AuthUser | null } | AuthFailure;

/** `promoted` is set when the server turned out to have verified the address
 *  already — the caller is now logged in and should stop asking for a code. */
export type ChangeEmailResult = { ok: true; promoted?: AuthUser | null } | AuthFailure;

/* ── How an account is labelled on screen ─────────────────────────
   Three places show who is signed in — the header bar, the mobile drawer and
   the checkout chrome — and all three used to print the raw address. The name
   has been on /my-status the whole time.

   Typed structurally rather than against AuthedUser: that interface lives in
   components/common/AuthProvider, which imports *this* file, so naming it here
   would close the loop. Every caller's object satisfies this anyway.
   ───────────────────────────────────────────────────────────────── */

interface Named {
  email: string;
  /** What /my-status calls `name`. AuthProvider maps it across. */
  fullName?: string;
  /** A social provider gives one field rather than two. */
  name?: string;
}

/** The name if the account has one, the address otherwise.
 *
 *  Trimmed before it is judged: an account created with a space in the name
 *  field would otherwise label the header with a blank. */
export function displayName(who: Named): string {
  return who.fullName?.trim() || who.name?.trim() || who.email;
}

/**
 * Up to two letters for the avatar.
 *
 * Initials from the first and last word of a name — "Sheharyar Tariq" gives ST
 * and "Ada Something Lovelace" gives AL, because the surname is the half people
 * recognise. One word gives one letter rather than two from the same word,
 * which reads as an abbreviation of nothing.
 *
 * With no name it falls back to the address' local part, and "?" only if that
 * is empty too — which the server should never allow, but a placeholder beats
 * an empty circle.
 */
export function initials(who: Named): string {
  const name = who.fullName?.trim() || who.name?.trim() || "";
  if (name) {
    const words = name.split(/\s+/);
    const first = words[0][0];
    const last = words.length > 1 ? words[words.length - 1][0] : "";
    return (first + last).toUpperCase();
  }
  /* Not who.email[0]: an address may legitimately start with a character that
     is not a letter, but the first of the local part is still the best guess
     available and is what every other product does here. */
  return who.email.trim()[0]?.toUpperCase() ?? "?";
}

/* apiCall only surfaces the backend's own wording for 409 and 422; on a 400 it
   substitutes "Invalid request. Please check your input." Both messages this
   file cares about — "Incorrect code" and "Email is already verified." — are
   400s, so the body has to be read directly. apiCall does return it on
   failure, which is what makes that possible. */
function failure(res: { data: unknown; status: number | null; message: string }): AuthFailure {
  const body = (res.data ?? null) as ErrorBody | null;
  return {
    ok: false,
    /* Human-readable only. A 500's `detail` is a stack-trace fragment, and it
       has already reached one customer's screen from another wrapper. */
    message: readHumanMessage(body, res.status) ?? res.message,
    fields: readViolations(body),
    status: res.status,
  };
}

/* ── The tokens ───────────────────────────────────────────────────
   The JWT payload is base64, not encryption, so reading `exp` off it is
   fine. It is not a security check — nothing here decides what anyone may
   do; the server does that from the signature on every request. All we want
   is a cookie that expires when the token does, rather than one that
   outlives it and makes every later call fail with a stale 401.
   ───────────────────────────────────────────────────────────────── */

function jwtExpirySeconds(token: string): number | undefined {
  try {
    const payload = token.split(".")[1];
    if (!payload) return undefined;
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    if (typeof json.exp !== "number") return undefined;
    const remaining = json.exp - Math.floor(Date.now() / 1000);
    return remaining > 0 ? remaining : undefined;
  } catch {
    /* Not a JWT, or a payload we cannot parse. Falls back to a session
       cookie, which is the safer of the two wrong answers. */
    return undefined;
  }
}

/* Anything holding a credential in React state needs telling when it changes,
   because a cookie fires no event. The verify-email page subscribes so that
   logging in mid-page resumes its submit — see utils/hooks useBearerToken. */
const listeners = new Set<() => void>();

function announce(): void {
  for (const fn of listeners) fn();
}

export function subscribeToken(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToken(): string | null {
  return getCookie(TOKEN_COOKIE);
}

export function getPendingToken(): string | null {
  return getCookie(PENDING_COOKIE);
}

/** The session token if there is one, otherwise the unverified one. The single
 *  accessor for anything that needs an Authorization header. Note the order:
 *  a real session always wins, so a verified user clicking an old verification
 *  link uses their own token rather than a leftover. */
export function getBearerToken(): string | null {
  return getToken() ?? getPendingToken();
}

export function storeToken(token: string): void {
  setCookie(TOKEN_COOKIE, token, { maxAge: jwtExpirySeconds(token) });
  announce();
}

export function setPendingToken(token: string): void {
  setCookie(PENDING_COOKIE, token, { maxAge: PENDING_MAX_AGE });
  announce();
}

export function clearPendingToken(): void {
  deleteCookie(PENDING_COOKIE);
  announce();
}

/** Turn a held token into a session. A no-op when there is nothing pending,
 *  which is the ordinary case for someone who was already signed in. */
export function promotePendingToken(): void {
  const pending = getPendingToken();
  if (!pending) return;
  deleteCookie(PENDING_COOKIE);
  storeToken(pending);
}

/** No credential of any kind. Both cookies, always — `loadSession` calls this
 *  on a 401, and leaving a pending token behind there would let a dead
 *  session's credential get promoted later. */
export function logout(): void {
  deleteCookie(TOKEN_COOKIE);
  deleteCookie(PENDING_COOKIE);
  /* Dropping the credential is not enough on its own: apiCall's GET cache is
     keyed without any identity in it, so anything read while signed in would
     still be served to whoever signs in next in the same tab. Correct on all
     three paths into here — a real sign-out, a 401, and login() clearing a
     stale session — because each is a moment when whose data is whose has
     changed. */
  clearApiCache();
  announce();
}

/* ── Sign in ──────────────────────────────────────────────────────
   POST /login-check { email, password } → { token, user }
   ───────────────────────────────────────────────────────────────── */

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await apiCall<LoginBody>({
    endpoint: routes.api.loginCheck,
    method: "POST",
    data: { email: email.trim(), password },
    headers: JSON_HEADERS,
    /* The form shows its own alert. apiCall's generic 401 copy is "Session
       expired. Please login again.", which is the wrong sentence on the
       screen you use to start a session. */
    showErrorToast: false,
  });

  if (!res.success) {
    /* One message for a wrong password and for an address with no account.
       Telling them apart turns this form into a way of asking whether
       somebody is a customer. */
    const message =
      res.status === 401 || res.status === 400
        ? "Email or password is not right."
        : res.message;
    return { ok: false, message, fields: {}, status: res.status };
  }

  const token = res.data?.token;
  if (!token) {
    return {
      ok: false,
      message: "Signed in, but no token came back.",
      fields: {},
      status: res.status,
    };
  }

  const user = res.data?.user;

  /* `=== null` rather than a truthy test, and the difference matters: an
     endpoint that simply does not send the field must read as "no opinion",
     not as "unverified". Getting this wrong signs out every returning
     customer on every refresh. */
  const verified = user?.emailVerifiedAt !== null;

  if (verified) {
    clearPendingToken();
    storeToken(token);
  } else {
    /* logout() first, to clear any session left from a previous account —
       and it has to be this way round, because logout() also clears the
       pending cookie and would otherwise wipe what we just held. */
    logout();
    setPendingToken(token);
  }

  /* The server is the authority on the address and the display name — what
     was typed into the form is only a fallback for a response that omits
     them. */
  return {
    ok: true,
    verified,
    user: {
      ...user,
      email: user?.email || email.trim(),
      name: user?.name || "",
    },
  };
}

/* ── Signing up inside the checkout ───────────────────────────────
   POST /register { email, name, phone?, plainPassword? } → { token, user }
   ─────────────────────────────────────────────────────────────────

   Two things the brief gets wrong about this endpoint, both probed:

   · **It answers with a token.** "Registering does not log you in — call
     login next" is not what happens; 201 carries the same `{ token, user }`
     shape as /login-check, so the second round trip buys nothing.
   · **`plainPassword` is optional.** `{ email, name }` alone is a 201. That
     is the whole reason the design's *One-click registration* can exist —
     without it the recommended path would be a password field like the
     alternative beside it, and the two would be the same thing twice.

   **This writes a session for an unverified address, and `login()`
   deliberately does not.** The rule elsewhere is that an unproved address
   gets a one-hour `pendingtoken` and nothing else, because there the address
   was *typed into a form* and might belong to somebody else. Here it was
   typed by the person creating the account, seconds ago, and the next thing
   they do is put a card against it. Sending them to their inbox mid-booking
   costs the booking, and the server asks for nothing — an unverified account
   saves an address, reads slots, stores a card and places an order, all
   probed. The confirmation screen offers to finish the account afterwards,
   which is the moment somebody has to spare.

   So the gate still holds where it was written for — the header's sign-up —
   and does not hold here. That is a product decision, not a security one:
   the server has never enforced it either way. */
export async function registerAccount(details: {
  email: string;
  name: string;
  phone?: string;
  password?: string;
}): Promise<LoginResult> {
  const email = details.email.trim();
  const body: Record<string, unknown> = { email, name: details.name.trim() };
  /* Omitted rather than sent empty. `phone: ""` is a 422 naming the field;
     leaving the key out is a 201. */
  if (details.phone) body.phone = details.phone;
  if (details.password) body.plainPassword = details.password;

  const res = await apiCall<LoginBody>({
    endpoint: routes.api.register,
    method: "POST",
    data: body,
    headers: JSON_HEADERS,
    /* The panel shows its own message under the field the server named.
       apiCall would toast only violations[0] and lose which field it was. */
    showErrorToast: false,
  });

  if (!res.success) return failure(res);

  const token = res.data?.token;
  if (!token) {
    return {
      ok: false,
      message: "Your account was created, but no token came back.",
      fields: {},
      status: res.status,
    };
  }

  const user = res.data?.user;
  clearPendingToken();
  storeToken(token);
  return {
    ok: true,
    verified: user?.emailVerifiedAt != null,
    user: { ...user, email: user?.email || email, name: user?.name || details.name.trim() },
  };
}

/* ── Registering from the checkout ────────────────────────────────
   POST /register-as-guest { name, email, phone } → 200, empty body
   ─────────────────────────────────────────────────────────────────

   The checkout's own registration, and deliberately not `registerAccount`
   above. Three differences, all of which the identity panel is built around:

   · **No token comes back.** A 200 carries nothing at all, so there is nothing
     to store and nobody is signed in yet. The session arrives from
     `loginWithCode` when the emailed code is redeemed — which is why the
     panel's code step is not optional any more, and why the contact screen's
     Next stays shut until it passes.
   · **The server sends the code itself.** Nothing here calls
     /verification-code/request; doing so on top would put a second code in
     the same inbox and invalidate the one already on its way. The resend link
     is the only thing that still asks for one.
   · **An address it already holds is not an error.** The server recognises it
     and sends a code to it, so the same screen serves a new customer and a
     returning one. That also settles what `registerAccount`'s 422 was being
     used for here — see the identity panel's header. */
export async function registerGuest(details: {
  email: string;
  name: string;
  phone?: string;
}): Promise<{ ok: true } | AuthFailure> {
  const body: Record<string, unknown> = {
    name: details.name.trim(),
    email: details.email.trim(),
  };
  /* Omitted rather than sent empty, the same trap `registerAccount` documents:
     `phone: ""` is a 422 naming the field. */
  if (details.phone) body.phone = details.phone;

  const res = await apiCall({
    endpoint: routes.api.registerAsGuest,
    method: "POST",
    data: body,
    headers: JSON_HEADERS,
    /* The panel shows its own message under the field the server named. */
    showErrorToast: false,
  });

  return res.success ? { ok: true } : failure(res);
}

/* ── Signing in with an emailed code ──────────────────────────────
   POST /login-with-code { email, code } → { token, user }
   ─────────────────────────────────────────────────────────────────

   Undocumented, and the missing half of `requestVerificationCode`'s `login`
   purpose — which has always been able to *send* a code that nothing could
   redeem. Probed: the route is live and a wrong code is a 400 "Incorrect
   code", the same wording the email-verification endpoint uses.

   Unlike `login()` this always writes a session, and for the opposite reason
   to `registerAccount` above: reading a code out of an inbox *is* proof of the
   address. Somebody who arrives this way has demonstrated more than a password
   would, so holding their token back to ask them to prove it again would be
   asking twice for the same thing. */
export async function loginWithCode(email: string, code: string): Promise<LoginResult> {
  const res = await apiCall<LoginBody>({
    endpoint: routes.api.loginWithCode,
    method: "POST",
    data: { email: email.trim(), code: code.trim() },
    headers: JSON_HEADERS,
    showErrorToast: false,
  });

  if (!res.success) return failure(res);

  const token = res.data?.token;
  if (!token) {
    return {
      ok: false,
      message: "That code was accepted, but no token came back.",
      fields: {},
      status: res.status,
    };
  }

  const user = res.data?.user;
  clearPendingToken();
  storeToken(token);
  return {
    ok: true,
    verified: true,
    user: { ...user, email: user?.email || email.trim(), name: user?.name || "" },
  };
}

/* ── Restore ──────────────────────────────────────────────────────
   GET /my-status → everything about the current user in one call.
   ───────────────────────────────────────────────────────────────── */

/** The bare request, with no opinion about whether the address is proved.
 *  Split out because verification needs to read /my-status at the exact
 *  moment loadSession would have thrown the session away: straight after
 *  promoting a token, when emailVerifiedAt has only just stopped being null.
 *
 *  Returns the **whole** payload, not just the user. AuthProvider holds it for
 *  the life of the page so the address, the saved cards and the in-flight order
 *  are read once rather than refetched per screen — `apiCall`'s GET cache
 *  cannot do that job, because every mutation clears it. */
export async function fetchMyStatus(): Promise<MyStatus | null> {
  const res = await apiCall<MyStatus>({
    endpoint: routes.api.myStatus,
    method: "GET",
    headers: JSON_HEADERS,
    /* Arriving with an expired token is not something to interrupt someone
       about — they simply see the signed-out header. */
    showErrorToast: false,
  });

  if (!res.success) {
    /* A rejected token is a dead token. Dropping it here stops every later
       request retrying with the same credential and stops the next reload
       repeating this round trip. */
    if (res.status === 401 || res.status === 403) logout();
    return null;
  }

  /* 200 with no user is not a session. Treat it as signed out rather than
     showing a header with an empty address in it. */
  return res.data?.user?.email ? res.data : null;
}

/** Just the user, for the three verification calls that only ever wanted that
 *  much. Kept so those call sites read as what they are. */
export async function fetchStatus(): Promise<AuthUser | null> {
  return (await fetchMyStatus())?.user ?? null;
}

/** Returns null when there is nothing to restore, which is the ordinary case
 *  for a first visit and not an error. */
export async function loadSession(): Promise<MyStatus | null> {
  if (!getToken()) return null;

  /* This used to throw the session away when `emailVerifiedAt` came back
     null, as a second line of defence behind login()'s rule that an unproved
     address gets no session. It cannot any more, because that is no longer an
     invariant: `registerAccount` writes a session for an unverified account on
     purpose, since a guest booking has to be able to reach a card without a
     detour through their inbox.

     Removing it was not optional — it fired on every load for exactly the
     accounts the checkout had just created, and signed them straight back out
     between one request and the next.

     The gate still exists, in the one place that can tell the two apart:
     `login()` holds a token back for an unverified address, because there the
     address was typed into a form and might not be theirs. Registration knows
     it is, because it just made it. Nothing else in the app needs to ask —
     `user.verified` carries the answer from /my-status, which is what the
     confirmation screen reads to decide whether to offer the code. */
  return fetchMyStatus();
}

/* ── Proving the address ──────────────────────────────────────────
   All of these run on a token that is usually still pending, so they pass
   Authorization explicitly: apiCall builds its own from `authtoken` alone,
   which by design is absent here. Caller headers are spread last, so this
   wins where both exist.
   ───────────────────────────────────────────────────────────────── */

function bearerHeaders(): Record<string, string> | null {
  const token = getBearerToken();
  return token ? { ...JSON_HEADERS, Authorization: `Bearer ${token}` } : null;
}

const NO_CREDENTIAL: AuthFailure = {
  ok: false,
  message: "Log in again to finish confirming your email.",
  fields: {},
  status: null,
};

/** POST /email-verification/verify { code } → promotes the held token. */
export async function verifyEmail(code: string): Promise<VerifyResult> {
  const headers = bearerHeaders();
  if (!headers) return NO_CREDENTIAL;

  const res = await apiCall({
    endpoint: routes.api.emailVerificationVerify,
    method: "POST",
    data: { code: code.trim() },
    headers,
    showErrorToast: false,
  });

  if (!res.success) return failure(res);

  promotePendingToken();
  /* Fresh rather than cached, and only because the POST above just emptied
     apiCall's GET cache. Slipping any other GET in between would quietly
     bring the stale /my-status back. */
  return { ok: true, user: await fetchStatus() };
}

/** POST /email-verification/resend {} — the same code comes again if it is
 *  under an hour old. Chosen over the public /verification-code/request for
 *  anyone holding a token: it follows the account rather than an address in
 *  our state, so it still works after a change of email, and it can report a
 *  failure instead of always answering 200. */
export async function resendVerification(): Promise<{ ok: true } | AuthFailure> {
  const headers = bearerHeaders();
  if (!headers) return NO_CREDENTIAL;

  const res = await apiCall({
    endpoint: routes.api.emailVerificationResend,
    method: "POST",
    data: {},
    headers,
    showErrorToast: false,
  });

  return res.success ? { ok: true } : failure(res);
}

/** POST /users/{id}/change-email { email } — fixes a typo made at sign-up,
 *  and sends a fresh code to the new address. */
export async function changeEmailAddress(
  userId: string | number,
  email: string,
): Promise<ChangeEmailResult> {
  const headers = bearerHeaders();
  if (!headers) return NO_CREDENTIAL;

  const res = await apiCall({
    endpoint: routes.api.changeEmail(userId),
    method: "POST",
    data: { email: email.trim() },
    headers,
    showErrorToast: false,
  });

  if (res.success) return { ok: true };

  const failed = failure(res);

  /* "Email is already verified." means they proved the address somewhere else
     — on the phone, in another tab — while this screen sat open. They are now
     stuck: no code to enter and no address to change. Rather than trust the
     wording, use it as a reason to go and ask. */
  if (res.status === 400 && /already.*verified/i.test(failed.message)) {
    const pending = getPendingToken();
    if (pending) storeToken(pending);
    const user = await fetchStatus();
    if (user && user.emailVerifiedAt !== null) {
      clearPendingToken();
      return { ok: true, promoted: user };
    }
    /* Wrong guess. Put things back as they were rather than leaving a session
       cookie behind for an address nobody has proved. */
    if (pending) {
      deleteCookie(TOKEN_COOKIE);
      announce();
    }
  }

  return failed;
}

/** POST /verification-code/request { email, purpose } — the one verification
 *  call that needs no token, for the verify-email page reached from a mail
 *  client with no session. Always answers 200, even for an address with no
 *  account, so nothing here can be used to ask who is a customer. */
export async function requestVerificationCode(
  email: string,
  purpose: VerificationPurpose,
): Promise<{ ok: true } | AuthFailure> {
  const res = await apiCall({
    endpoint: routes.api.verificationCodeRequest,
    method: "POST",
    data: { email: email.trim(), purpose },
    headers: JSON_HEADERS,
    showErrorToast: false,
  });

  return res.success ? { ok: true } : failure(res);
}

/* ── Resetting a forgotten password ───────────────────────────────
   Both public — probed, they answer without a token — which is what lets the
   link in the email finish the job on any device, with no session and no
   login first. That is the whole difference between this and email
   verification, which needs a Bearer token and so needs one of ours.
   ───────────────────────────────────────────────────────────────── */

/** POST /reset-password/request { email } — sends the code.
 *
 *  **Always answers 200**, including for an address with no account. That is
 *  deliberate on the server's side and the UI has to honour it: never confirm
 *  that a message was sent, or this becomes a way of asking who is a customer. */
export async function requestPasswordReset(email: string): Promise<{ ok: true } | AuthFailure> {
  const res = await apiCall({
    endpoint: routes.api.resetPasswordRequest,
    method: "POST",
    data: { email: email.trim() },
    headers: JSON_HEADERS,
    showErrorToast: false,
  });

  return res.success ? { ok: true } : failure(res);
}

/** POST /reset-password/confirm { email, token, newPassword }
 *
 *  `token` is the same six digits the verification emails use, and a wrong or
 *  expired one comes back as 400 "Incorrect code" — the identical shape, so
 *  readMessage already handles it.
 *
 *  Side effect worth knowing: a successful reset also **verifies the address**.
 *  The backend's own VerificationCodeTest proves it — asking for an
 *  email_verification code straight afterwards sends nothing. So whoever calls
 *  this can log the person straight in and get a real session, rather than
 *  landing them back on the verify screen. */
export async function confirmPasswordReset(
  email: string,
  token: string,
  newPassword: string,
): Promise<{ ok: true } | AuthFailure> {
  const res = await apiCall({
    endpoint: routes.api.resetPasswordConfirm,
    method: "POST",
    data: { email: email.trim(), token: token.trim(), newPassword },
    headers: JSON_HEADERS,
    showErrorToast: false,
  });

  return res.success ? { ok: true } : failure(res);
}
