/**
 * Inline SVG icons ported from the design prototype.
 *
 * Server-safe on purpose — none of these hold state, so they render inside
 * Server Components without shipping JS. The one exception, <Stars>, lives
 * in components/StarsRating.tsx because it needs a unique gradient id.
 *
 * Apple's and Google's store badges are the official supplied artwork.
 * Their text is drawn as paths and must not be recreated with live type —
 * both brands require it.
 */

import type { SVGProps } from "react";
import type { StepIconName, TrustIconName } from "@/lib/content";

/* Review-source badges: the App Store and Google Play. */
export const AppleGlyph = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="#FFFFFF" aria-hidden="true" focusable="false">
    <path d="M16.53 12.68c-.03-2.02 1.65-2.99 1.72-3.04-.94-1.37-2.4-1.56-2.92-1.58-1.25-.13-2.44.73-3.08.73-.65 0-1.63-.71-2.68-.69-1.38.02-2.66.8-3.36 2.04-1.44 2.5-.37 6.19 1.02 8.21.68.99 1.49 2.09 2.55 2.05 1.02-.04 1.4-.66 2.63-.66 1.23 0 1.58.66 2.65.64 1.09-.02 1.79-.99 2.46-1.98.77-1.14 1.09-2.25 1.11-2.31-.02-.01-2.09-.8-2.1-3.41zM14.03 6.3c.56-.68.94-1.62.83-2.56-.8.03-1.78.54-2.36 1.21-.51.6-.97 1.57-.85 2.49.9.07 1.82-.46 2.38-1.14z" />
  </svg>
);

/* Current Google Play palette, matching the official badge artwork —
   #00D9FF / #00F076 / #FFBC00 / #FF3A44 are the superseded colours. */
export const PlayGlyph = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M4.3 2.4c-.3.3-.4.7-.4 1.2v17c0 .5.2.9.5 1.2l.1.1L14 12.4V12l-9.6-9.6z" fill="#4285F4" />
    <path d="M14 12l3.4-3.4-9-5.1c-.4-.2-.8-.3-1.1-.1L14 12z" fill="#34A853" />
    <path d="M17.4 15.4L14 12l3.4-3.4 4 2.3c.9.5.9 1.7 0 2.2l-4 2.3z" fill="#FBBC04" />
    <path d="M4.5 21.6c.3.1.7.1 1-.1l9-5.1L14 12l-9.5 9.6z" fill="#EA4335" />
  </svg>
);

export const Check = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...props}
  >
    <path d="M4.5 12.5l5 5 10-11" />
  </svg>
);

const trustProps: SVGProps<SVGSVGElement> = {
  width: 18,
  height: 18,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

/* className lands on the <svg> itself rather than a wrapper: the source
   styles the svg directly (`flex:none;color:var(--ink-2)`), and inserting a
   span would add a flex item the layout was not measured with. */
export const TrustIcon = ({ name, className = "" }: { name: TrustIconName; className?: string }) => {
  const p = { ...trustProps, className };
  if (name === "van")
    return (
      <svg {...p}>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    );
  if (name === "tag")
    return (
      <svg {...p}>
        <path d="M3 12.5V4h8.5L21 13.5 13.5 21z" />
        <circle cx="7.5" cy="7.5" r="1.2" />
      </svg>
    );
  return (
    <svg {...p}>
      <path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
    </svg>
  );
};

const stepProps: SVGProps<SVGSVGElement> = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const StepIcon = ({ name }: { name: StepIconName }) => {
  if (name === "bag")
    return (
      <svg {...stepProps}>
        <path d="M5.5 8h13l1 12.5h-15z" />
        <path d="M9 8V6.6a3 3 0 0 1 6 0V8" />
      </svg>
    );
  if (name === "list")
    return (
      <svg {...stepProps}>
        <path d="M8 6h12M8 12h12M8 18h12M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
      </svg>
    );
  if (name === "check")
    return (
      <svg {...stepProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.4l2.7 2.7L16 9.6" />
      </svg>
    );
  return (
    <svg {...stepProps}>
      <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
    </svg>
  );
};

export const SocialGlyph = ({ name }: { name: "Facebook" | "Instagram" }) =>
  name === "Facebook" ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.9h-2.34V22c4.78-.79 8.44-4.93 8.44-9.94z" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5.2" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );

/* Deliberately no shared chevron / close / search / info component.
   The prototype inlines each of those with its own size and stroke width
   (the pricing arrows are 15px at 2.6, the hero slot chevron 16px at 2.4,
   the drawer close 24px at 2.2, the search clear 16px at 2.2), and a single
   parameterised icon invites those from drifting into one another. They
   stay inline at their call sites, exactly as in the source. */
