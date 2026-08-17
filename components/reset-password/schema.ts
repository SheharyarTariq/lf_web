import * as yup from "yup";
import { CODE_LENGTH, EMAIL_RE, PASSWORD_RE, PASSWORD_RULE } from "@/utils/auth/model";

/* ══════════════════════════════════════════════════════════════════
   Reset-password page validation
   ══════════════════════════════════════════════════════════════════

   The same password rule registration uses, taken from the same constant —
   /reset-password/confirm applies the server-side rule that §1 of the brief
   documents for /register, so two copies of the wording would eventually
   disagree with each other about what will be accepted.

   `token` is the six digits from the email. The link supplies it, but the
   field is validated the same way either way, because a mistyped code and a
   mis-copied one fail identically.
   ══════════════════════════════════════════════════════════════════ */

export const resetPasswordSchema = yup.object({
  email: yup.string().trim().matches(EMAIL_RE, "Enter a valid email address."),
  token: yup
    .string()
    .trim()
    .matches(
      new RegExp(`^\\d{${CODE_LENGTH}}$`),
      `Enter the ${CODE_LENGTH}-digit code from your email.`,
    ),
  newPassword: yup.string().matches(PASSWORD_RE, `${PASSWORD_RULE}.`),
});
