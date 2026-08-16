import * as yup from "yup";

/* A looser email pattern than the rest of the site — this one allows a
   single-character TLD where the others require two. Kept as it was rather
   than quietly tightened: this form is an app-store compliance route, and
   rejecting an address the old page accepted is a worse failure here than
   letting an odd one through.

   The message keeps its "Please", which the other forms do not use. */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const requestDeletionSchema = yup.object({
  email: yup.string().trim().matches(EMAIL_REGEX, "Please enter a valid email address."),
});
