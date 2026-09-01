import type { LucideIcon } from "lucide-react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Info,
  Leaf,
  List,
  Lock,
  Mail,
  MapPin,
  Repeat,
  ShoppingBag,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import type { ProviderId } from "@/utils/booking/model";

/**
 * The checkout's icon set.
 *
 * `P` used to hold hand-drawn path strings on a 20×20 grid; it now names the
 * lucide component that plays each role. Keeping the map means there is still
 * one place that says "the thing we call `tick` is a Check" — which is what
 * docs/ICONS.md documents, and what makes putting an original back a
 * one-line change. Every previous path is archived under public/icons/.
 *
 * The wrapper stays because it owns the defaults every call site relies on:
 * 20px, decorative-by-default, and a `fill` shorthand for the two solid
 * icons. Lucide draws on a 24×24 grid at stroke 2 where the design used 20×20
 * at 1.7, so the rendered box is unchanged and only the artwork differs.
 */
export const P = {
  back: ChevronLeft,
  chevron: ChevronRight,
  tick: Check,
  info: Info,
  alert: TriangleAlert,
  lock: Lock,
  card: CreditCard,
  clock: Clock,
  pin: MapPin,
  close: X,
  mail: Mail,
  bag: ShoppingBag,
  list: List,
  repeat: Repeat,
  spark: Sparkles,
  leaf: Leaf,
  /* Same glyph as `leaf`, drawn filled — the calendar's eco marker. */
  leafSolid: Leaf,
} satisfies Record<string, LucideIcon>;

export function Icon({
  icon: Glyph,
  size = 20,
  fill = false,
  ...rest
}: { icon: LucideIcon; size?: number; fill?: boolean } & Omit<
  React.SVGProps<SVGSVGElement>,
  "fill" | "ref"
>) {
  return (
    <Glyph
      size={size}
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      aria-hidden="true"
      {...rest}
    />
  );
}

/** Each company's own mark, at each company's own dimensions. Not lucide —
 *  it has no equivalent, and both companies constrain how these are drawn. */
export function ProviderMark({ id }: { id: ProviderId | string }) {
  if (id === "apple") {
    return (
      <svg width="16" height="19" viewBox="0 0 20 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M16.53 12.68c-.03-2.02 1.65-2.99 1.72-3.04-.94-1.37-2.4-1.56-2.92-1.58-1.25-.13-2.44.73-3.08.73-.65 0-1.63-.71-2.68-.69-1.38.02-2.66.8-3.36 2.04-1.44 2.5-.37 6.19 1.02 8.21.68.99 1.49 2.09 2.55 2.05 1.02-.04 1.4-.66 2.63-.66 1.23 0 1.58.66 2.65.64 1.09-.02 1.79-.99 2.46-1.98.77-1.14 1.09-2.25 1.11-2.31-.02-.01-2.09-.8-2.1-3.41zM14.03 6.3c.56-.68.94-1.62.83-2.56-.8.03-1.78.54-2.36 1.21-.51.6-.97 1.57-.85 2.49.9.07 1.82-.46 2.38-1.14z"
          transform="translate(-2 -2)"
        />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.34A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.98 10.72a5.41 5.41 0 0 1 0-3.44V4.94H.96a9 9 0 0 0 0 8.12l3.02-2.34z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.94l3.02 2.34C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
