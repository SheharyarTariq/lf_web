import * as yup from "yup";
import {
  CODE_LENGTH,
  EMAIL_RE,
  PASSWORD_RE,
  PASSWORD_RULE,
  UK_MOBILE_MESSAGE,
  UK_MOBILE_RE,
} from "@/utils/auth/model";

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

/* UK_MOBILE_RE was declared here, alongside a second one in utils/booking/model
   that matched a different shape — the checkout collected the whole number in a
   free text box, this form collected the national part behind a fixed +44. Both
   fields are <PhoneInput> now, so there is one shape and one constant, in
   utils/auth/model beside EMAIL_RE. Re-exported because this is where the modal
   has always read its rules from. */
export { UK_MOBILE_RE } from "@/utils/auth/model";

export const signupSchema = yup.object({
  name: yup.string().trim().required("Tell us your name."),
  /* Required, because the checkout now trusts it. An account that carries a
     valid mobile skips the Details step entirely — see utils/booking/flow.ts —
     so the number has to be collected at the one moment we are certainly
     asking. Spaces are stripped first: the field itself no longer lets any
     through, but a schema that only holds for values its own input produced is
     not a rule, it is a coincidence. */
  phone: yup
    .string()
    .transform((v) => (typeof v === "string" ? v.replace(/\s/g, "") : v))
    .required("Enter your mobile number.")
    .test("uk-mobile", UK_MOBILE_MESSAGE, (v) => UK_MOBILE_RE.test(v || "")),
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
