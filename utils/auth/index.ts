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

import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { deleteCookie, getCookie, setCookie } from "@/utils/helper";
import { readMessage, readViolations, type ErrorBody } from "@/utils/api";
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

interface MyStatusBody {
  user?: AuthUser;
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

/* apiCall only surfaces the backend's own wording for 409 and 422; on a 400 it
   substitutes "Invalid request. Please check your input." Both messages this
   file cares about — "Incorrect code" and "Email is already verified." — are
   400s, so the body has to be read directly. apiCall does return it on
   failure, which is what makes that possible. */
function failure(res: { data: unknown; status: number | null; message: string }): AuthFailure {
  const body = (res.data ?? null) as ErrorBody | null;
  return {
    ok: false,
    message: readMessage(body) ?? res.message,
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

/* ── Restore ──────────────────────────────────────────────────────
   GET /my-status → everything about the current user in one call.
   ───────────────────────────────────────────────────────────────── */

/** The bare request, with no opinion about whether the address is proved.
 *  Split out because verification needs to read /my-status at the exact
 *  moment loadSession would have thrown the session away: straight after
 *  promoting a token, when emailVerifiedAt has only just stopped being null. */
export async function fetchStatus(): Promise<AuthUser | null> {
  const res = await apiCall<MyStatusBody>({
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

  const user = res.data?.user;
  /* 200 with no user is not a session. Treat it as signed out rather than
     showing a header with an empty address in it. */
  return user?.email ? user : null;
}

/** Returns null when there is nothing to restore, which is the ordinary case
 *  for a first visit and not an error. */
export async function loadSession(): Promise<AuthUser | null> {
  if (!getToken()) return null;

  const user = await fetchStatus();

  /* Belt and braces. A session cookie is only ever written for a verified
     account, so this should not fire — but if a token ever reaches the cookie
     by another route, this is what stops an unproved address being treated as
     signed in everywhere else in the app. */
  if (user?.emailVerifiedAt === null) {
    logout();
    return null;
  }
  return user;
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
