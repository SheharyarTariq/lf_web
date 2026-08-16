/* ══════════════════════════════════════════════════════════════════
   The API
   ══════════════════════════════════════════════════════════════════

   Everything that leaves the browser goes through here, so there is one
   place to change the base URL, one place that knows how the server
   reports errors, and one place holding the token.

   The prototype proxied /api to staging through the Vite dev server so the
   browser only ever talked to its own origin. Next has no equivalent by
   default, and the site already calls the staging host directly from
   AnnounceBar, so the base is NEXT_PUBLIC_API_URL and CORS is the server's
   problem — as it already is for /system-status.

   NEXT_PUBLIC_API_URL is not validated at build time and can be undefined
   at runtime; callers must survive that. Every request here funnels through
   send(), which turns a failed fetch into an ordinary { ok: false } result
   rather than throwing.
   ══════════════════════════════════════════════════════════════════ */

import { config } from "@/config";

export const API_BASE = config.apiUrl ?? "";

/* ── The token ────────────────────────────────────────────────────
   /login-check returns a JWT in the response body, so it has to live
   somewhere JavaScript can read — which means any injected script can
   read it too. sessionStorage rather than localStorage keeps the blast
   radius to one tab and clears it when the tab closes.

   TODO (integration phase): move to an httpOnly Secure SameSite=Lax
   cookie. Lexik can set one instead of returning the token in the body,
   nothing here needs to change beyond deleting this block, and the token
   stops being reachable from script at all.
   ───────────────────────────────────────────────────────────────── */

const TOKEN_KEY = "lf.token";
let memoryToken: string | null = null;

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  try {
    memoryToken = sessionStorage.getItem(TOKEN_KEY);
  } catch {
    /* Private mode, or storage disabled. Memory only, which still works
       for the length of a visit. */
  }
  return memoryToken;
}

export function setToken(token: string | null): void {
  memoryToken = token || null;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* Memory only. */
  }
}

export function clearToken(): void {
  setToken(null);
}

/* ── Errors ───────────────────────────────────────────────────────
   Every failure comes back the same shape, so callers never have to
   know whether the server speaks JSON-LD, plain JSON, or nothing at
   all because the network dropped.
   ───────────────────────────────────────────────────────────────── */

export interface ApiOk<T = Record<string, unknown>> {
  ok: true;
  status: number;
  data: T;
}

export interface ApiErr {
  ok: false;
  status: number;
  message: string;
  fields: Record<string, string>;
}

export type ApiResult<T = Record<string, unknown>> = ApiOk<T> | ApiErr;

interface Violation {
  propertyPath?: string;
  message?: string;
}

interface ErrorBody {
  violations?: Violation[];
  "hydra:violations"?: Violation[];
  "hydra:description"?: string;
  detail?: string;
  message?: string;
  error?: string;
}

/* Symfony validation, in the three shapes API Platform emits depending
   on the format negotiated. propertyPath is the field name; plainPassword
   is mapped back to the one the form actually shows. */
const FIELD_ALIASES: Record<string, string> = {
  plainPassword: "password",
  password: "password",
};

function readViolations(body: ErrorBody | null): Record<string, string> {
  const list = body?.violations || body?.["hydra:violations"] || [];
  const fields: Record<string, string> = {};
  for (const v of list) {
    if (!v.propertyPath) continue;
    const key = FIELD_ALIASES[v.propertyPath] || v.propertyPath;
    if (key && !fields[key] && v.message) fields[key] = v.message;
  }
  return fields;
}

function readMessage(body: ErrorBody | null, status: number): string {
  return (
    body?.["hydra:description"] ||
    body?.detail ||
    body?.message ||
    body?.error ||
    `Something went wrong (${status}).`
  );
}

async function send<T = Record<string, unknown>>(
  path: string,
  payload: unknown,
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    /* No response at all: offline, DNS, CORS preflight refused, or
       NEXT_PUBLIC_API_URL unset. Say what the person can act on, not what
       the console says. */
    return {
      ok: false,
      status: 0,
      message: "We could not reach our servers just now. Check your connection and try again.",
      fields: {},
    };
  }

  let body: (ErrorBody & T) | null = null;
  try {
    body = await res.json();
  } catch {
    /* 204, or an HTML error page from a proxy. Neither is fatal here. */
  }

  if (res.ok) return { ok: true, status: res.status, data: (body || {}) as T };

  return {
    ok: false,
    status: res.status,
    message: readMessage(body, res.status),
    fields: readViolations(body),
  };
}

/* ── Endpoints ────────────────────────────────────────────────────
   POST /register     { name, email, phone?, plainPassword } → 201
   POST /login-check  { email, password }                    → 200 { token }
   ───────────────────────────────────────────────────────────────── */

/** +441234567890, as the API expects. The form collects a national number
 *  behind a +44 prefix, so the leading zero goes and anything the person
 *  typed for readability goes with it. */
export function toE164(national: string | undefined): string | undefined {
  const digits = String(national || "")
    .replace(/[^\d]/g, "")
    .replace(/^0+/, "");
  return digits ? `+44${digits}` : undefined;
}

export async function register({
  name,
  email,
  phone,
  password,
}: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<ApiResult> {
  const payload: Record<string, string> = {
    name: name.trim(),
    email: email.trim(),
    plainPassword: password,
  };
  const e164 = toE164(phone);
  /* Omitted rather than sent empty: the field is optional and an empty
     string is a value, which validators treat differently from absent. */
  if (e164) payload.phone = e164;

  const r = await send("/register", payload);
  if (r.ok) return r;

  /* 409 and 422-on-email are the same thing to the person reading it. */
  if (r.status === 409 && !r.fields.email) {
    return { ...r, fields: { ...r.fields, email: "That address already has an account." } };
  }
  return r;
}

export interface SessionUser {
  email: string;
  name: string;
  roles: string[];
  exp: number;
}

export type LoginResult = { ok: true; token: string; user: SessionUser } | ApiErr;

export async function login(email: string, password: string): Promise<LoginResult> {
  const r = await send<{ token?: string }>("/login-check", { email: email.trim(), password });
  if (!r.ok) {
    /* One message for a wrong password and for no account at all.
       Distinguishing them turns this form into a way of asking whether
       somebody is a customer. */
    if (r.status === 401 || r.status === 400) {
      return { ...r, message: "Email or password is not right." };
    }
    return r;
  }
  const token = r.data?.token;
  if (!token) {
    return {
      ok: false,
      status: r.status,
      message: "Signed in, but no token came back.",
      fields: {},
    };
  }
  setToken(token);
  return { ok: true, token, user: readUser(token) };
}

/** The payload of a JWT is public — it is base64, not encryption — so
 *  reading it for a display name is fine. It is not a security check:
 *  nothing here decides what anyone is allowed to do. The server does
 *  that, on every request, from the signature. */
export function readUser(token: string): SessionUser {
  try {
    const [, payload] = token.split(".");
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(""),
      ),
    );
    return {
      email: json.email || json.username || json.sub || "",
      name: json.name || "",
      roles: json.roles || [],
      exp: json.exp || 0,
    };
  } catch {
    return { email: "", name: "", roles: [], exp: 0 };
  }
}

export function logout(): void {
  clearToken();
}
