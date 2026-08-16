import type { SVGProps } from "react";
import type { ProviderId } from "@/utils/booking/model";

/**
 * One 20x20 grid for every icon in the checkout, stroked or filled.
 *
 * `strokeWidth` is declared before the spread so a caller can raise it —
 * the close cross and the confirmation tick both do.
 */
export function Icon({
  d,
  size = 20,
  fill = false,
  ...rest
}: { d: string; size?: number; fill?: boolean } & Omit<SVGProps<SVGSVGElement>, "fill">) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

export const P = {
  back: "M12 4 6 10l6 6",
  chevron: "M7.5 4 13 10l-5.5 6",
  tick: "m4 10.5 4 4 8-9",
  /* Two closed subpaths, cuff then hand, so one filled path draws the
     whole thumb. Solid rather than stroked — at 13px a 1.7 stroke fills
     the shape in anyway and reads as a smudge. */
  thumb:
    "M2.6 9.4h2.8q.8 0 .8.8v5.6q0 .8-.8.8H2.6q-.8 0-.8-.8v-5.6q0-.8.8-.8Z" +
    "M7.6 9.4 10.8 3.2c.5-1 2-.8 2.2.3l.1.6-.5 3h3.6c1.2 0 2.1 1.1 1.9 2.3" +
    "l-.9 4.6c-.2 1.1-1.1 1.9-2.2 1.9H7.6Z",
  info: "M10 9v5M10 6.2v.1M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z",
  alert: "M10 7v4m0 3v.1M10 2 1.8 17h16.4Z",
  lock: "M5.5 9V6.5a4.5 4.5 0 0 1 9 0V9M4 9h12v8H4Z",
  card: "M2 6h16v9H2Zm0 3.5h16",
  clock: "M10 5.5V10l3 1.8M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z",
  pin: "M10 18s6-5.2 6-9.4A6 6 0 0 0 4 8.6C4 12.8 10 18 10 18Zm0-7.6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  close: "M5 5l10 10M15 5 5 15",
  mail: "M2 6h16v9H2Zm0 .5 8 5.5 8-5.5",
  eye: "M10 4.5c4 0 7 3 8.5 5.5C17 12.5 14 15.5 10 15.5S3 12.5 1.5 10C3 7.5 6 4.5 10 4.5Zm0 3a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z",
  eyeOff:
    "M3 3l14 14M8.2 8.3a2.5 2.5 0 0 0 3.5 3.5M6 5.6A9.6 9.6 0 0 1 10 4.5c4 0 7 3 8.5 5.5a13 13 0 0 1-3 3.4M4.4 7A13.6 13.6 0 0 0 1.5 10C3 12.5 6 15.5 10 15.5c1 0 2-.2 2.9-.5",
  bag: "M6 7V5.5a4 4 0 0 1 8 0V7m-10 0h12l-1 10H5Z",
  list: "M7 6h9M7 10h9M7 14h6M3.5 6v.1M3.5 10v.1M3.5 14v.1",
  repeat: "M4 8a4 4 0 0 1 4-4h8m0 0-2.5-2.5M16 4l-2.5 2.5M16 12a4 4 0 0 1-4 4H4m0 0 2.5 2.5M4 16l2.5-2.5",
  spark: "M10 2.5 11.8 8 17 9.8 11.8 11.7 10 17l-1.8-5.3L3 9.8 8.2 8Z",
  leaf: "M4 16c0-6 4.5-10 13-10 0 8-4 12-9 12a5 5 0 0 1-4-2Zm2 1c1.5-4 4-6.5 7-8",
  leafSolid: "M17 3c0 8-4.6 12.4-9.2 12.4A5.2 5.2 0 0 1 3.4 13C4.6 8 9.2 4.4 17 3Z",
};

/** Each company's own mark, at each company's own dimensions. */
export function ProviderMark({ id }: { id: ProviderId | string }) {
  if (id === "apple") {
    return (
      <svg width="16" height="19" viewBox="0 0 20 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M16.6 12.7c0-2.9 2.4-4.3 2.5-4.4-1.4-2-3.5-2.3-4.2-2.3-1.8-.2-3.5 1.1-4.4 1.1-.9 0-2.3-1-3.8-1-1.9 0-3.7 1.1-4.7 2.9-2 3.5-.5 8.7 1.5 11.5 1 1.4 2.1 3 3.6 2.9 1.4-.1 2-.9 3.8-.9s2.2.9 3.8.9 2.5-1.4 3.5-2.8c1.1-1.6 1.5-3.2 1.6-3.2 0 0-3.1-1.2-3.2-4.7M13.8 4.2c.8-1 1.3-2.3 1.2-3.7-1.2 0-2.5.8-3.4 1.7-.7.9-1.4 2.2-1.2 3.5 1.3.1 2.6-.6 3.4-1.5"
        />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.64h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.57Z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.1 0 5.7-1.03 7.62-2.78l-3.72-2.9c-1.03.7-2.35 1.1-3.9 1.1-2.98 0-5.5-2.01-6.4-4.72H1.75v2.99A11.5 11.5 0 0 0 12 23.5Z"
      />
      <path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4V6.8H1.75a11.5 11.5 0 0 0 0 10.4L5.6 14.2Z" />
      <path
        fill="#EA4335"
        d="M12 4.75c1.68 0 3.19.58 4.38 1.72l3.28-3.28C17.7 1.3 15.1.25 12 .25 7.5.25 3.6 2.84 1.75 6.8L5.6 9.8c.9-2.71 3.42-4.72 6.4-4.72Z"
      />
    </svg>
  );
}
