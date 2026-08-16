/* ══════════════════════════════════════════════════════════════════
   The session
   ══════════════════════════════════════════════════════════════════

   Three things that are neither transport nor UI: signing in, restoring a
   session on load, and signing out. Kept out of the components so the
   checkout's LoginSheet can reuse them instead of growing a second
   implementation of the same flow.

   Transport is `apiCall` (utils/api-call), per the web-api-patterns skill.
   The token goes in the `authtoken` cookie because that is the one `apiCall`
   reads back — see utils/helper for why it cannot be httpOnly.
   ══════════════════════════════════════════════════════════════════ */

import apiCall from "@/utils/api-call";
import { routes } from "@/utils/routes";
import { deleteCookie, getCookie, setCookie } from "@/utils/helper";

export const TOKEN_COOKIE = "authtoken";

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
   /login-check returns the user alongside the token, and it is the only
   place emailVerifiedAt appears — so the body is what we read, not the JWT.
   ───────────────────────────────────────────────────────────────── */

export interface AuthUser {
  id?: string | number;
  email: string;
  name: string;
  phone?: string;
  /** null means the address has not been proved yet. The brief lists this on
   *  /login-check; §3 says it is also on /my-status, though §4's field list
   *  omits it — hence optional here. */
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

export type LoginResult =
  | { ok: true; user: AuthUser }
  | { ok: false; message: string; status: number | null };

/* ── The token ────────────────────────────────────────────────────
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

export function getToken(): string | null {
  return getCookie(TOKEN_COOKIE);
}

export function storeToken(token: string): void {
  setCookie(TOKEN_COOKIE, token, { maxAge: jwtExpirySeconds(token) });
}

export function logout(): void {
  deleteCookie(TOKEN_COOKIE);
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
    return { ok: false, message, status: res.status };
  }

  const token = res.data?.token;
  if (!token) {
    return { ok: false, message: "Signed in, but no token came back.", status: res.status };
  }
  storeToken(token);

  /* The server is the authority on the address and the display name — what
     was typed into the form is only a fallback for a response that omits
     them. */
  const user = res.data?.user;
  return {
    ok: true,
    user: {
      ...user,
      email: user?.email || email.trim(),
      name: user?.name || "",
    },
  };
}

/* ── Restore ──────────────────────────────────────────────────────
   GET /my-status → everything about the current user in one call.
   Returns null when there is nothing to restore, which is the ordinary
   case for a first visit and not an error.
   ───────────────────────────────────────────────────────────────── */

export async function loadSession(): Promise<AuthUser | null> {
  if (!getToken()) return null;

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
  if (!user?.email) {
    /* 200 with no user is not a session. Treat it as signed out rather than
       showing a header with an empty address in it. */
    return null;
  }
  return user;
}
