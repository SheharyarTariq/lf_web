import * as yup from "yup";
import { CODE_LENGTH } from "@/utils/auth/model";

/* ══════════════════════════════════════════════════════════════════
   Verify-email page validation
   ══════════════════════════════════════════════════════════════════

   This governs the manual-entry field only. The token that arrives in the URL
   is submitted verbatim and never validated here — the server is the
   authority on its own codes, and rejecting a valid-but-unexpected shape on
   the client would be a dead end we inflicted on ourselves.
   ══════════════════════════════════════════════════════════════════ */

export const verifyEmailSchema = yup.object({
  code: yup
    .string()
    .trim()
    .matches(
      new RegExp(`^\\d{${CODE_LENGTH}}$`),
      `Enter the ${CODE_LENGTH}-digit code from your email.`,
    ),
});
