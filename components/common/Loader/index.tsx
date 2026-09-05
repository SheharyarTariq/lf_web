import { cn } from "@/utils/cn";

/**
 * The spinner, lifted verbatim from the auth modal so there is one of them.
 *
 * `animate-spin-fast` is a project keyframe, not Tailwind's `animate-spin` —
 * the design spins noticeably quicker than the default 1s.
 *
 * It draws itself in `currentColor` rather than a fixed ink, so it is legible
 * on whatever it is placed on. The colours used to be hardcoded dark, which
 * made it literally invisible twice over: on the ink button (#1f1f1f on
 * #1f1f1f) and in the dark pricing section. Inheriting means a caller only has
 * to get the text colour right, which it already had to.
 *
 * The motion-reduce branch is not decoration: with the animation off, a ring
 * that is 3/4 faded and 1/4 solid reads as a broken border rather than a state,
 * so it flips to a single solid segment on the right and simply sits there.
 */
export default function Loader({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-[17px] w-[17px] animate-spin-fast rounded-full border-2",
        "border-current/25 border-t-current",
        "motion-reduce:animate-none motion-reduce:border-t-current/25 motion-reduce:border-r-current",
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
