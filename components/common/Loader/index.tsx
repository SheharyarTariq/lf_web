import { cn } from "@/utils/cn";

/**
 * The spinner, lifted verbatim from the auth modal so there is one of them.
 *
 * `animate-spin-fast` is a project keyframe, not Tailwind's `animate-spin` —
 * the design spins noticeably quicker than the default 1s.
 *
 * The motion-reduce branch is not decoration: with the animation off, a ring
 * that is 3/4 grey and 1/4 ink reads as a broken border rather than a state,
 * so it flips to a single ink segment on the right and simply sits there.
 */
export default function Loader({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-[17px] w-[17px] animate-spin-fast rounded-full border-2",
        "border-[rgba(20,20,15,.25)] border-t-bk-ink",
        "motion-reduce:animate-none motion-reduce:border-t-[rgba(20,20,15,.25)] motion-reduce:border-r-bk-ink",
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
