import * as yup from "yup";
import { EMAIL_RE } from "@/utils/booking/model";
import { UK_MOBILE_MESSAGE, UK_MOBILE_RE } from "@/utils/auth/model";

/* Messages carried over verbatim, with one exception. The mobile example lost
   its leading zero when this field became a <PhoneInput>: the number is typed
   behind a fixed +44 now, so an example beginning 0 is an example of something
   the field will not hold. It is the auth modal's sentence exactly, from the
   same constant — same field, same words. */
export const contactSchema = yup.object({
  fullName: yup.string().trim().required("Tell us your name."),
  mobile: yup.string().trim().matches(UK_MOBILE_RE, UK_MOBILE_MESSAGE),
  email: yup.string().trim().matches(EMAIL_RE, "Enter a valid email address."),
});
