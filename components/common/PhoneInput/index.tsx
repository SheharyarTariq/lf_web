import { cn } from "@/utils/cn";
import { toNationalUk } from "@/utils/api";

/**
 * The one phone field: a fixed +44, then the national number.
 *
 * `surface` picks the recipe, for the same reason <Input> and <Button> have it —
 * the checkout and the auth modal are genuinely different surfaces, not one with
 * a modifier. Both recipes are the strings that were already on screen.
 *
 * ── Why a country code that cannot be edited ──────────────────────
 *
 * The API takes `+44` followed by ten digits and nothing else, and every other
 * client in the product asks for the number this way. The checkout was the
 * exception: a free text box that accepted the number in any shape, including
 * with its own +44 — which `toE164` then prefixed a second time, so a perfectly
 * correct mobile went up as +44447700900123 and came back refused. Holding only
 * the national part is what makes that shape unreachable rather than merely
 * unlikely.
 *
 * So `onChange` hands back the *normalised* value, not the keystroke. Paste
 * "+44 7700 900123" or "07700 900123" and the field settles on 7700900123
 * either way. Nothing downstream has to know which of the two somebody typed.
 */
interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  surface?: "booking" | "auth";
  value: string;
  /** The national number, already normalised — not the change event. */
  onChange: (national: string) => void;
  /** Marks the field. The message belongs to <Field>, which owns the label and
   *  the `${id}-err` element `aria-describedby` points at. */
  error?: string | boolean;
  id: string;
  ref?: React.Ref<HTMLInputElement>;
}

/* The border sits on the wrapper, not the input, so the +44 and the number read
   as one control. Everything inside is therefore borderless and shadowless, and
   the invalid state is a wrapper class rather than the `aria-invalid:` variant
   the plain recipes use. */
const SHELL =
  "flex items-stretch gap-0 overflow-hidden bg-white " +
  "border-[1.5px] border-bk-line-2 focus-within:border-bk-ink " +
  "focus-within:shadow-[0_0_0_3px_rgba(20,20,15,.08)]";

const SHELL_BY_SURFACE = {
  /* Matches INPUT in utils/booking/styles: 48px and the control radius. */
  booking: "h-12 rounded-ctl-lg transition-[border-color,box-shadow] duration-150 ease-[ease]",
  /* Matches the row this replaced: 50px of input inside a card radius. */
  auth: "rounded-card-md",
} as const;

/* The divider is on the code's trailing edge, so the number's own inset is all
   that separates the two — the same 1px rule the auth row always had. */
const CODE =
  "flex flex-none items-center border-r border-r-bk-line-2 font-semibold text-bk-ink";

const CODE_BY_SURFACE = {
  booking: "pl-[15px] pr-3 text-[16px]",
  auth: "pl-4 pr-3 text-[15.5px]",
} as const;

const NUMBER =
  "autofill-white min-w-0 flex-auto border-none bg-transparent py-0 text-bk-ink " +
  "focus:outline-none focus:shadow-none";

const NUMBER_BY_SURFACE = {
  booking: "h-full px-[15px] text-[16px] placeholder:text-bk-ink-3",
  auth: "h-[50px] px-4 text-[15.5px] leading-[1.6] placeholder:text-[#9A9A94]",
} as const;

export default function PhoneInput({
  surface = "booking",
  value,
  onChange,
  error,
  id,
  className,
  "aria-describedby": describedBy,
  ...props
}: PhoneInputProps) {
  /* Named off the id rather than useId: the caller already owns the id, and the
     hint has to be addressable alongside whatever <Field> passes in. */
  const ccId = `${id}-cc`;

  return (
    <>
      <span className={cn(SHELL, SHELL_BY_SURFACE[surface], error && "border-danger", className)}>
        {/* aria-hidden, with the country spelled out for screen readers below —
            "+44" read aloud is "plus forty-four", which is not how anybody says
            a dialling code. */}
        <span className={cn(CODE, CODE_BY_SURFACE[surface])} aria-hidden="true">
          +44
        </span>
        <input
          id={id}
          className={cn(NUMBER, NUMBER_BY_SURFACE[surface])}
          type="tel"
          inputMode="tel"
          /* -national, so the browser offers the number without its country
             code. It does not always honour it, which is the other reason the
             value is normalised on the way in rather than trusted. */
          autoComplete="tel-national"
          value={value}
          onChange={(e) => onChange(toNationalUk(e.target.value))}
          aria-invalid={error ? "true" : undefined}
          /* A plain join, not cn: these are ids, and running them through
             tailwind-merge is asking a class-name resolver to arbitrate. */
          aria-describedby={[ccId, describedBy].filter(Boolean).join(" ")}
          {...props}
        />
      </span>
      <span className="visually-hidden" id={ccId}>
        United Kingdom, plus four four
      </span>
    </>
  );
}
