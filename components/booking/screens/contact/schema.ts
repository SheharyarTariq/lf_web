import * as yup from "yup";
import { EMAIL_RE } from "@/utils/booking/model";
import {
  NAME_CHARS_MESSAGE,
  NAME_MIN_MESSAGE,
  NAME_RE,
  UK_MOBILE_MESSAGE,
  UK_MOBILE_RE,
  isValidName,
} from "@/utils/auth/model";

/* Messages carried over verbatim, with one exception. The mobile example lost
   its leading zero when this field became a <PhoneInput>: the number is typed
   behind a fixed +44 now, so an example beginning 0 is an example of something
   the field will not hold. It is the auth modal's sentence exactly, from the
   same constant — same field, same words. */
export const contactSchema = yup.object({
  /* One test rather than two chained ones, choosing its own sentence inside.
     validateFormSync keeps the first message per path, and "3" breaks both
     rules at once — which of the two yup happens to list first is not
     something to hang a customer-facing sentence on. The one worth saying
     about "3" is the one about letters. */
  fullName: yup
    .string()
    .trim()
    .required("Tell us your name.")
    .test("name-shape", NAME_CHARS_MESSAGE, (v, ctx) => {
      if (!v) return true; // `required` has already spoken
      if (!NAME_RE.test(v.normalize("NFC")))
        return ctx.createError({ message: NAME_CHARS_MESSAGE });
      if (!isValidName(v)) return ctx.createError({ message: NAME_MIN_MESSAGE });
      return true;
    }),
  /* `.required()` as well as `.matches()`, because yup's `matches` passes an
     empty string — so without it the one field the account cannot be made
     without was the one field with no rule against leaving it blank. Two
     sentences rather than one: "enter a UK mobile, for example…" is an odd
     thing to say to somebody who has not tried yet. Same pair, same order, as
     signupSchema. */
  mobile: yup
    .string()
    .trim()
    .required("Enter your mobile number.")
    .matches(UK_MOBILE_RE, UK_MOBILE_MESSAGE),
  email: yup.string().trim().matches(EMAIL_RE, "Enter a valid email address."),
});
