import * as yup from "yup";
import { EMAIL_RE, UK_MOBILE_RE } from "@/utils/booking/model";

/* Messages carried over verbatim. The mobile example keeps its leading zero
   because this field takes the number as people write it — the auth modal's
   sits behind a fixed +44 and shows the national form instead. */
export const contactSchema = yup.object({
  fullName: yup.string().trim().required("Tell us your name."),
  mobile: yup
    .string()
    .trim()
    .matches(UK_MOBILE_RE, "Enter a UK mobile, for example 07700 900123."),
  email: yup.string().trim().matches(EMAIL_RE, "Enter a valid email address."),
});
