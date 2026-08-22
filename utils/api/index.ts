/* ══════════════════════════════════════════════════════════════════
   Registration
   ══════════════════════════════════════════════════════════════════

   What is left of the original hand-rolled client. Login and the session
   have moved to utils/auth, which goes through `apiCall` per the
   web-api-patterns skill and keeps the token in the `authtoken` cookie.
   Sign-up is the next one across; until then this file owns exactly one
   endpoint, which is why AuthModal imports from both.

   The reason it has not moved with login is the error shape: `register`
   turns Symfony's `violations` into a per-field map, so a duplicate address
   marks the email input rather than throwing a banner over the form.
   `apiCall` returns the raw body, so that translation has to be lifted to
   the call site — a change to the sign-up pane, not to this request, and
   not something to do in passing while wiring login.

   NEXT_PUBLIC_API_URL is not validated at build time and can be undefined
   at runtime; callers must survive that. Every request here funnels through
   send(), which turns a failed fetch into an ordinary { ok: false } result
   rather than throwing.
   ══════════════════════════════════════════════════════════════════ */

import { config } from "@/config";

const API_BASE = config.apiUrl ?? "";

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

/* Exported alongside the two readers below: utils/auth needs them because
   apiCall only surfaces the backend's own wording for 409 and 422, and the
   verification errors that matter ("Incorrect code", "Email is already
   verified.") are 400s. The header comment above anticipated this lift. */
export interface ErrorBody {
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

export function readViolations(body: ErrorBody | null): Record<string, string> {
  const list = body?.violations || body?.["hydra:violations"] || [];
  const fields: Record<string, string> = {};
  for (const v of list) {
    if (!v.propertyPath) continue;
    const key = FIELD_ALIASES[v.propertyPath] || v.propertyPath;
    if (key && !fields[key] && v.message) fields[key] = v.message;
  }
  return fields;
}

/** undefined when the body carries no wording of its own, so callers can fall
 *  back to something better than a status code — apiCall's network-error copy,
 *  say, which is more useful than "Something went wrong (0)." */
export function readMessage(body: ErrorBody | null): string | undefined {
  return (
    body?.["hydra:description"] || body?.detail || body?.message || body?.error || undefined
  );
}

/**
 * The server's own wording, but only where it was written for a person.
 *
 * 4xx bodies carry messages meant to be read — "Incorrect code", "Email is
 * already verified.", validation violations. 5xx bodies carry internals, and
 * `readMessage` cannot tell them apart because both arrive in `detail`.
 * *"Expected an instance of App\Entity\Postcode. Got: NULL"* was rendered
 * under the Town field of the checkout before this existed.
 *
 * Returns undefined for anything outside 400-499, so callers fall back to
 * apiCall's own generic copy for that status.
 */
export function readHumanMessage(
  body: ErrorBody | null,
  status: number | null,
): string | undefined {
  if (status === null || status < 400 || status >= 500) return undefined;
  return readMessage(body);
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
    message: readMessage(body) ?? `Something went wrong (${res.status}).`,
    fields: readViolations(body),
  };
}

/* ── Endpoints ────────────────────────────────────────────────────
   POST /register     { name, email, phone?, plainPassword } → 201
   POST /login-check  { email, password }                    → 200 { token }
   ───────────────────────────────────────────────────────────────── */

/** The national part, the way the +44-prefixed fields hold it: ten digits
 *  starting 7.
 *
 *  Takes every shape a person can produce — "+44 7700 900123", "07700900123",
 *  "447700900123", "(07700) 900123" — because paste and autofill produce all of
 *  them, and a field sitting behind a fixed +44 must never end up holding the
 *  +44 as well. That is exactly what used to reach toE164 and come back out as
 *  +44447700900123.
 *
 *  The 44 goes before the 0, so a 00-dialled number degrades sanely, and it is
 *  `^0` rather than `^0+` because only the trunk zero is not part of the number. */
export function toNationalUk(input: string | undefined): string {
  return String(input || "")
    .replace(/\D/g, "")
    .replace(/^44/, "")
    .replace(/^0/, "")
    .slice(0, 10);
}

/** +441234567890, as the API expects. */
export function toE164(national: string | undefined): string | undefined {
  const n = toNationalUk(national);
  /* Exactly ten, or nothing. The brief is "+44 followed by 10 digits", and the
     field is optional — so a number we cannot form is left out rather than sent
     to be refused. Nobody reaches this with a bad one anyway: the form's own
     schema is what holds the door. */
  return /^7\d{9}$/.test(n) ? `+44${n}` : undefined;
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

/* login(), readUser() and logout() used to live here. They are now in
   utils/auth, which reads the `user` object off the /login-check response
   instead of decoding the JWT — the body is authoritative and is the only
   place emailVerifiedAt appears. The sessionStorage token store went with
   them; the token is a cookie now, because that is what apiCall reads. */
