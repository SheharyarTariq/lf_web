/* ══════════════════════════════════════════════════════════════════
   Verification constants
   ══════════════════════════════════════════════════════════════════

   Six numeric digits, confirmed three ways: the live email sends `488137`,
   and the backend's own VerificationCodeTest asserts `458444` and `292323`.
   That closes conflict 5 in docs/STATUS.md, which had it down as unknown
   because §3 of the brief writes the example as "abc123...".

   Deliberately not imported from utils/booking/model.ts, which declares the
   same two numbers. Those annotate a mocked flow that is due to be rewritten
   against the real endpoints, and the session must not depend on a module
   scheduled for replacement. When the checkout is wired for real it should
   import from here, not the other way round.
   ══════════════════════════════════════════════════════════════════ */

export const CODE_LENGTH = 6;

/** How long the resend button stays disabled. The server reuses the same code
 *  for an hour, so this is about not letting somebody hammer the button, not
 *  about when a new code becomes available. */
export const RESEND_SECONDS = 60;

/** POST /verification-code/request rejects anything else with a 422 naming
 *  `purpose` — the enum is CodePurpose on the backend. */
export type VerificationPurpose = "email_verification" | "login" | "password_reset";

/* ── Field rules ──────────────────────────────────────────────────
   Here rather than in the auth modal's schema, because the reset-password
   page enforces the same password rule and must not restate it — two copies
   of "8 characters, one capital, one symbol" is how the two screens end up
   disagreeing about what the server will accept.
   ───────────────────────────────────────────────────────────────── */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The registration rule, per §1 of the brief: min 8, lowercase + uppercase +
 *  a special character. /reset-password/confirm applies the same one. */
export const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_RULE = "At least 8 characters, one capital letter and one symbol";
