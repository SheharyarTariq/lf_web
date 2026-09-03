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

/** The one UK mobile rule, for the one phone field.
 *
 *  There used to be two — this shape and a second in utils/booking/model that
 *  matched the number as typed, +44 and all — because the checkout collected
 *  the whole number in a free text box while the auth modal collected the
 *  national part behind a fixed +44. Two inputs, two shapes. Both now use
 *  <PhoneInput>, so there is one input and one shape, and the two constants
 *  had to become one before they disagreed about a number in front of somebody.
 *
 *  Still written to tolerate a leading 0 or 44 even though PhoneInput strips
 *  them on the way in: autofill can write a DOM value without an input event
 *  ever firing, and a customer whose browser helpfully filled the field is
 *  exactly who should not be told their own number is wrong. */
export const UK_MOBILE_RE = /^(?:0|\+?44)?7\d{9}$/;

/** Shown against the field, which sits behind a fixed +44 — hence no leading
 *  zero in the example. */
export const UK_MOBILE_MESSAGE = "Enter a UK mobile, for example 7700 900123.";

export const NAME_MIN = 3;

/** Letters, plus the three separators real names carry: a space, a hyphen, an
 *  apostrophe — straight or curly, because iOS substitutes U+2019 as you type and
 *  a customer whose keyboard "helped" is exactly who must not be told their own
 *  name is wrong. Unicode letters rather than A–Z: "Renée", "Ruairí" and
 *  "Владимир" are names, and a rule that refuses them is a bug that only ever
 *  appears in front of the person it refuses.
 *
 *  Every segment starts on a letter, so a separator cannot lead, trail or repeat
 *  — " John", "John " and "John  Smith" fail on shape rather than on length.
 *  \p{M} carries the combining marks of decomposed input but is deliberately not
 *  allowed to open a segment, or " " + U+0301 would pass and render as an accent
 *  floating on nothing. */
export const NAME_RE = /^\p{L}[\p{L}\p{M}]*(?:[ '’‐-]\p{L}[\p{L}\p{M}]*)*$/u;

/** Says what is allowed rather than what is banned. "Letters only" is a lie the
 *  moment somebody types the space in "John Smith" and it is accepted. */
export const NAME_CHARS_MESSAGE = "Use letters, spaces, hyphens and apostrophes only.";

/** Not "your full name" — the rule never demands a surname, and Ali passes. */
export const NAME_MIN_MESSAGE = `Enter at least ${NAME_MIN} letters.`;

/** The one name rule, for the two name fields, for the same reason UK_MOBILE_RE
 *  is one constant: the checkout and the auth modal collect the same name for
 *  the same account, and two copies is how they end up disagreeing about it in
 *  front of somebody.
 *
 *  `unknown` rather than `string` because yup hands a test `undefined` for an
 *  empty optional field, and a signature promising otherwise is a lie that
 *  throws rather than returns false.
 *
 *  The letters are counted over [\p{L}\p{M}], not \p{L}: in Devanagari and Thai
 *  the vowel signs are marks, so "राम" is a whole name that would otherwise be
 *  told it is two letters short of being one. */
export function isValidName(v: unknown): boolean {
  if (typeof v !== "string") return false;
  const s = v.normalize("NFC").trim();
  return NAME_RE.test(s) && (s.match(/[\p{L}\p{M}]/gu)?.length ?? 0) >= NAME_MIN;
}
