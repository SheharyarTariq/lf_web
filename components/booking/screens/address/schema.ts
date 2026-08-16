import * as yup from "yup";
import { POSTCODE_RE } from "@/utils/booking/model";

/* The postcode is validated on its own, at the point the lookup runs, rather
   than with the address lines — it is a separate step and gates the rest. */
export const postcodeSchema = yup.object({
  postcode: yup
    .string()
    .trim()
    .matches(POSTCODE_RE, "Enter a valid UK postcode, for example KT227HH."),
});

/* Only line1 and town are required. line2, line3 and county are genuinely
   optional — plenty of addresses have none of them — so they carry no rule
   rather than an empty-string-allowed one. */
export const addressSchema = yup.object({
  line1: yup.string().trim().required("We need at least the first line."),
  town: yup.string().trim().required("We need the town."),
});
