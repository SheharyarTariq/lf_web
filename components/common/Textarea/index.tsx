import { cn } from "@/utils/cn";
import { TEXTAREA } from "@/utils/booking/styles";

/**
 * The multi-line field. One call site today — the driver access note on the
 * time screen — but the skill asks for form controls to be components rather
 * than bare tags, and the next one should not have to rediscover the recipe.
 *
 * Same division of labour as <Input>: `error` marks the control, <Field>
 * renders the message and owns the `${id}-err` wiring.
 */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string | boolean;
  ref?: React.Ref<HTMLTextAreaElement>;
}

export default function Textarea({ error, className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(TEXTAREA, className)}
      aria-invalid={error ? "true" : props["aria-invalid"]}
      {...props}
    />
  );
}
