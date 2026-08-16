/**
 * The landing page's button recipe, as a class string rather than a
 * component: it is worn by <button>, <a> and next/link alike, and wrapping
 * all three would cost more than it saves.
 *
 * Matches the app's Button (app/components/Button.tsx): 16px radius, 1px
 * border on every variant so filled and outlined buttons are the same box,
 * 15/20 medium text, overflow hidden. Two deliberate web deviations:
 *   - Height is 44px, not the app's 56px. 56 is a touch target sized for a
 *     phone; at desktop pointer sizes it reads as oversized. Pass size="lg"
 *     for the full 56.
 *   - Horizontal padding is 18px, not 8px. App buttons are full-width so 8px
 *     is invisible; these sit inline, where 8px puts the label on the edge.
 *
 * Border width is set per variant rather than on the base. Both `border` and
 * `border-2` are border-width utilities, so relying on one to override the
 * other in a single class list depends on Tailwind's internal sort order —
 * which is not a contract worth betting a 2px outline on.
 */

const BASE =
  "items-center justify-center gap-2 font-medium text-[15px] leading-5 " +
  "whitespace-nowrap rounded-ctl-lg min-h-11 px-[18px] py-2 overflow-hidden cursor-pointer " +
  "no-underline transition-[background-color,border-color,transform,box-shadow] " +
  "duration-[160ms] ease-[ease] hover:-translate-y-px active:translate-y-0";

const VARIANTS = {
  lime: "border border-transparent bg-brand text-ink hover:bg-brand-hover hover:shadow-lift",
  ink: "border border-transparent bg-ink text-white hover:bg-ink-hover",
  ghost: "border-2 border-brand bg-transparent text-ink hover:bg-brand hover:border-brand",
  /* Ghost with the gradient border. The border colour is transparent, not
     lime: the gradient is painted by the btn-shine pseudo-element and a lime
     border underneath it would show as a second ring. In the source this fell
     out of `.lf-btn--shine` being written after `.lf-btn--ghost`; here it is
     said outright, because two competing border-color utilities on one
     element resolve by Tailwind's sort order rather than by authoring order. */
  "ghost-shine": "btn-shine border-2 border-transparent bg-transparent text-ink",
} as const;

/* Kept for anywhere that needs the app's full 56px touch target. */
const SIZES = {
  md: "",
  lg: "min-h-14 px-6 text-[16px]",
} as const;

export function btn({
  variant = "lime",
  size = "md",
  block = false,
  display = "inline-flex",
  className = "",
}: {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  block?: boolean;
  /**
   * The display utility, because two of these are shown at one breakpoint and
   * hidden at another. Kept out of the base string on purpose: `hidden` and
   * `inline-flex` are the same property in the same layer, so a caller adding
   * `hidden` to className is relying on Tailwind's sort order to break the tie
   * — and it breaks it the wrong way. Passing base and variant here makes the
   * variant win, which is defined behaviour.
   */
  display?: string;
  className?: string;
} = {}): string {
  return [display, BASE, VARIANTS[variant], SIZES[size], block ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");
}
