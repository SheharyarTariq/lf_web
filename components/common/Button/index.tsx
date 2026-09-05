import { cn } from "@/utils/cn";
import { btn } from "@/utils/button";
import { bkBtn } from "@/utils/booking/styles";
import Loader from "@/components/common/Loader";

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
  /** Disables the control, sets `aria-busy`, and renders the spinner.
   *
   *  Never put a `<Loader/>` inside a `<Button>` — this is the one place that
   *  treatment lives. Call sites used to assemble it themselves, which cost us
   *  three separate bugs: every such button grew by the spinner's width mid-
   *  press (an additive child sizes the button, it does not leave it alone),
   *  and Contact's spinner was gated on a different condition than its own
   *  `isLoading`, so that button went busy showing nothing at all.
   *
   *  The label is kept in flow but `invisible`, so it goes on reserving exactly
   *  its own width and the spinner is centred over it. The button's box is
   *  therefore identical loading and idle — no jump, and no min-width guess. */
  isLoading?: boolean;
  /** Defaults to "button". A submit has to ask for it, because a stray submit
   *  inside a form is a page reload nobody intended. */
  type?: "button" | "submit" | "reset";
  /** The header's burger and the drawer's close both need one, to move focus
   *  in and back out again. React 19 passes ref as an ordinary prop, so no
   *  forwardRef — it only has to be declared. */
  ref?: React.Ref<HTMLButtonElement>;
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
         four separate bugs during the design port.

         The one thing a caller does not get to win is the busy dim, so it goes
         after `className`: `disabled:opacity-100` is deduped by twMerge against
         whichever `disabled:opacity-45` came before — BTN_BASE's, or the auth
         modal's, which brings its own. A *busy* button keeps full contrast; a
         genuinely *disabled* one still dims. It has to carry the `disabled:`
         variant to do it, since a bare `opacity-100` loses on specificity to a
         pseudo-class. `relative` stays ahead of `className`, so a caller that
         positions its own button still wins that. */
      className={cn(
        recipe,
        isLoading && "relative",
        className,
        isLoading && "disabled:opacity-100",
      )}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading ? (
        <>
          {/* `gap-[inherit]` so the size recipe's gap survives the wrapper —
              the provider buttons are an icon plus a label, not one string. */}
          <span className="invisible inline-flex items-center gap-[inherit]">{children}</span>
          <Loader className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2" />
        </>
      ) : (
        children
      )}
    </button>
  );
}
