import { cn } from "@/utils/cn";
import { INPUT } from "@/utils/booking/styles";

/**
 * The one text input. `INPUT` from utils/booking/styles is the recipe the
 * audit measured, so this wraps it rather than restating it.
 *
 * `error` here only marks the field — it does not render the message. The
 * message belongs to <Field>, which owns the label, the id wiring and the
 * `${id}-err` element that `aria-describedby` points at. Rendering it in both
 * places would announce it twice.
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | boolean;
}

export default function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      className={cn(INPUT, className)}
      /* The recipe already styles the invalid state off aria-invalid, so the
         error border comes from the attribute rather than a second class. */
      aria-invalid={error ? "true" : props["aria-invalid"]}
      {...props}
    />
  );
}
