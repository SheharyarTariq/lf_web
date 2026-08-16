import { cn } from "@/utils/cn";
import { btn } from "@/utils/button";
import { bkBtn } from "@/utils/booking/styles";

/**
 * Every button on the site.
 *
 * It does not re-derive any styling. The two recipes already exist — `btn()`
 * for the landing page's warm palette and `bkBtn()` for the checkout's neutral
 * one — and those are the exact strings the pixel audit measured, so this
 * wraps them rather than reinventing them.
 *
 * `surface` picks the recipe. The two really are different systems, not one
 * with a modifier: different palettes, radii and heights, because the checkout
 * is a form and the landing page is a page.
 *
 * `variant="bare"` opts out of both. Roughly half the buttons in this codebase
 * are icon buttons, close crosses and link-styled controls with no recipe at
 * all — a `<Button variant="bare" className="…">` keeps them out of raw
 * `<button>` territory without inventing twenty variants nobody would reuse.
 */

type SiteVariant = "lime" | "ink" | "ghost" | "ghost-shine";
/* `apple`, `google` and `email` are the provider buttons: they follow Apple's
   and Google's published specs rather than our own style, which is why they
   are variants here instead of one-off class strings. */
type BookingVariant = "lime" | "ink" | "ghost" | "apple" | "google" | "email";
type BookingSize = "md" | "lg" | "oauth";

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Which recipe to use. Defaults to the landing page's. */
  surface?: "site" | "booking";
  variant?: SiteVariant | BookingVariant | "bare";
  size?: "md" | "lg" | "oauth";
  block?: boolean;
  /** Only meaningful on the site recipe, where two buttons swap at a
   *  breakpoint — see the note in utils/button. */
  display?: string;
  /** Swaps the label for a spinner and disables the control. */
  isLoading?: boolean;
  /** Defaults to "button". A submit has to ask for it, because a stray submit
   *  inside a form is a page reload nobody intended. */
  type?: "button" | "submit" | "reset";
}

export default function Button({
  surface = "site",
  variant = "lime",
  size = "md",
  block = false,
  display,
  isLoading = false,
  type = "button",
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const recipe =
    variant === "bare"
      ? ""
      : surface === "booking"
        ? bkBtn({ variant: variant as BookingVariant, size: size as BookingSize, block })
        : btn({
            variant: variant as SiteVariant,
            /* `oauth` is a checkout-only size; the site recipe has no
               equivalent and never needs one. */
            size: size === "oauth" ? "md" : size,
            block,
            ...(display ? { display } : {}),
          });

  return (
    <button
      type={type}
      /* cn() last, so a caller's class wins any conflict outright rather than
         leaving it to Tailwind's sort order — the exact trap that produced
         four separate bugs during the design port. */
      className={cn(recipe, className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {children}
    </button>
  );
}
