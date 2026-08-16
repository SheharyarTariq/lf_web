/**
 * Shared class recipes for the landing-page design.
 *
 * The prototype had these as single CSS classes reused across sections;
 * as utilities they would be copy-pasted, which is how two sections end up
 * with different gutters. One constant each instead.
 */

/** The page container: 1180px cap with gutters that step down at 1024 and 720. */
export const WRAP = "mx-auto max-w-wrap px-8 to-1024:px-6 to-720:px-5";

/** A standard section: 64px block padding with a hairline rule beneath,
 *  stepping down at 1280 and 1024. */
export const SECTION =
  "py-16 border-b border-b-line to-1280:py-[52px] to-1024:py-[46px] to-720:py-12";

/**
 * Section heading — clamp(26px, 2.8vw, 34px), 800, -1px.
 *
 * The bottom margin jumping from 6px to 32px below 1280 looks wrong, and it
 * is: in the source `.lf-sec h2 { margin-bottom: 32px }` inside the 1280
 * media query outranks nothing at full width but beats every component's own
 * heading margin below it, including the how-it-works panel, which has none
 * of its own. Reproduced rather than corrected — this is a like-for-like
 * port, and "fixing" it would move three headings the design was signed off
 * with. Worth raising separately.
 */
export const SECTION_H2 =
  "text-[clamp(26px,2.8vw,34px)] font-extrabold tracking-[-1px] leading-[1.12] " +
  "mb-1.5 to-1280:mb-8 to-1024:mb-[26px]";

/** The same margin ramp, for headings that are not the shared size. */
export const SECTION_H2_MARGIN = "to-1280:mb-8 to-1024:mb-[26px]";

/** Section sub-heading. The bottom margin steps down with the section padding. */
export const SECTION_SUB =
  "text-ink-2 text-[16.5px] max-w-[620px] mb-8 to-1280:mb-[26px] to-1180:text-[15.5px] to-1024:mb-[22px]";
