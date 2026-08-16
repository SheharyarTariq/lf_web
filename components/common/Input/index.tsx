import { cn } from "@/utils/cn";
import { INPUT } from "@/utils/booking/styles";
import { AUTH_INPUT } from "@/utils/auth/styles";

/**
 * The one text input.
 *
 * `surface` picks the recipe, for the same reason <Button> has it: the
 * checkout and the auth modal are genuinely different surfaces, not one with
 * a modifier. They differ in height, radius, padding, text size and
 * placeholder colour, so collapsing them into a single field would restyle
 * one of the two. Both recipes are the strings the pixel audit measured.
 *
 * `error` here only marks the field — it does not render the message. The
 * message belongs to <Field>, which owns the label, the id wiring and the
 * `${id}-err` element that `aria-describedby` points at. Rendering it in both
 * places would announce it twice.
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  surface?: "booking" | "auth";
  error?: string | boolean;
  /** Several fields are focused programmatically — the modal's first field on
   *  open, the contact screen's on a validation failure. React 19 passes ref
   *  as an ordinary prop, so it only has to be declared. */
  ref?: React.Ref<HTMLInputElement>;
}

export default function Input({ surface = "booking", error, className, ...props }: InputProps) {
  return (
    <input
      className={cn(surface === "auth" ? AUTH_INPUT : INPUT, className)}
      /* Both recipes style the invalid state off aria-invalid, so the error
         border comes from the attribute rather than a second class. */
      aria-invalid={error ? "true" : props["aria-invalid"]}
      {...props}
    />
  );
}
