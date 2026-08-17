import * as yup from "yup";
import { CODE_LENGTH, EMAIL_RE, PASSWORD_RE, PASSWORD_RULE } from "@/utils/auth/model";

/* ══════════════════════════════════════════════════════════════════
   Auth modal validation
   ══════════════════════════════════════════════════════════════════

   Every message here is the one that was already on screen. The wording is
   deliberate and is not tidied on the way past — see the note on the login
   pane below.
   ══════════════════════════════════════════════════════════════════ */

/* EMAIL_RE, PASSWORD_RE and PASSWORD_RULE live in utils/auth/model now, so the
   reset-password page can enforce the same rules without restating them. Still
   re-exported here, because this is where the modal has always read them from
   and the indirection is not worth churning every call site over. */
export { EMAIL_RE, PASSWORD_RE, PASSWORD_RULE } from "@/utils/auth/model";

/* Deliberately not the UK_MOBILE_RE in utils/booking/model. This form shows a
   fixed "+44" prefix and strips spaces before testing, so it sees a bare
   national number; the checkout's field accepts the whole thing as typed,
   spaces, parentheses and leading zero included. Two inputs, two shapes —
   which is also why the example in the message differs by a leading zero. */
export const UK_MOBILE_RE = /^(?:0|\+?44)?7\d{9}$/;

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

/* The login pane deliberately has no per-field validation, which is why no
   schema for it appears in this file. A message pointing at the email box
   would tell whoever asked that the address exists, and one pointing at the
   password would say the same by omission — so a failed login gets a single
   banner from the server instead. What is enforced there is only whether the
   button is live. */

export const forgotSchema = yup.object({
  email: yup.string().trim().matches(EMAIL_RE, "Enter a valid email address."),
});

/* Six numeric digits — see utils/auth/model for why that is now settled. The
   length governs the regex, the message and the input's maxLength from one
   constant, so they cannot drift apart if the backend ever changes it. */
export const codeSchema = yup.object({
  code: yup
    .string()
    .trim()
    .matches(
      new RegExp(`^\\d{${CODE_LENGTH}}$`),
      `Enter the ${CODE_LENGTH}-digit code from your email.`,
    ),
});

/* A separate key from `email`, not the same one. `email` holds the address the
   account currently has — it is what the verify pane reads back and what the
   "has it actually changed?" test compares against — so the draft needs
   somewhere of its own to live while it is being typed. */
export const changeEmailSchema = yup.object({
  newEmail: yup.string().trim().matches(EMAIL_RE, "Enter a valid email address."),
});
