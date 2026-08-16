import * as yup from "yup";

/* ══════════════════════════════════════════════════════════════════
   Auth modal validation
   ══════════════════════════════════════════════════════════════════

   Every message here is the one that was already on screen. The wording is
   deliberate and is not tidied on the way past — see the note on the login
   pane below.
   ══════════════════════════════════════════════════════════════════ */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PASSWORD_RE = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;

/* Deliberately not the UK_MOBILE_RE in utils/booking/model. This form shows a
   fixed "+44" prefix and strips spaces before testing, so it sees a bare
   national number; the checkout's field accepts the whole thing as typed,
   spaces, parentheses and leading zero included. Two inputs, two shapes —
   which is also why the example in the message differs by a leading zero. */
export const UK_MOBILE_RE = /^(?:0|\+?44)?7\d{9}$/;

export const PASSWORD_RULE = "At least 8 characters, one capital letter and one symbol";

export const signupSchema = yup.object({
  name: yup.string().trim().required("Tell us your name."),
  /* Optional, so an empty field passes; anything actually typed must be a UK
     mobile. Spaces are stripped first because the field lets people type the
     number the way they say it. */
  phone: yup
    .string()
    .transform((v) => (typeof v === "string" ? v.replace(/\s/g, "") : v))
    .test(
      "uk-mobile",
      "Enter a UK mobile, for example 7700 900123.",
      (v) => !v || UK_MOBILE_RE.test(v),
    ),
  email: yup.string().trim().matches(EMAIL_RE, "Enter a valid email address."),
  password: yup.string().matches(PASSWORD_RE, `${PASSWORD_RULE}.`),
});

/* The login pane deliberately has no per-field validation. A message pointing
   at the email box would tell whoever asked that the address exists, and one
   pointing at the password would say the same by omission — so a failed login
   gets a single banner from the server instead. What is enforced here is only
   whether the button is live. */
export const forgotSchema = yup.object({
  email: yup.string().trim().matches(EMAIL_RE, "Enter a valid email address."),
});
