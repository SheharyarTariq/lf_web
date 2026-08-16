"use client";

import { cn } from "@/utils/cn";
import { useId } from "react";

/**
 * SVG stars so the rating does not depend on a font that has the ★ glyph,
 * and so a fractional score renders a partial star.
 *
 * A client component only because useId needs to be — the gradient stop is
 * addressed by id, and two ratings on one page must not share one.
 */
export default function Stars({ value, className = "" }: { value: number; className?: string }) {
  const id = useId();
  const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;
  return (
    <svg
      className={cn("shrink-0", className)}
      width="90"
      height="18"
      viewBox="0 0 90 18"
      role="img"
      aria-label={`Rated ${value} out of 5`}
    >
      <defs>
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" x2="90">
          <stop offset={`${pct}%`} stopColor="var(--color-gold)" />
          <stop offset={`${pct}%`} stopColor="var(--color-line-2)" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          transform={`translate(${i * 18} 0)`}
          fill={`url(#${id})`}
          d="M9 1.4l2.24 4.54 5.01.73-3.62 3.53.85 4.99L9 12.83l-4.48 2.36.85-4.99L1.75 6.67l5.01-.73z"
        />
      ))}
    </svg>
  );
}
