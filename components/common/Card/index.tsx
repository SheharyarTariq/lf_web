import { cn } from "@/utils/cn";
import { CARD } from "@/utils/booking/styles";

/**
 * The checkout's bordered panel — the out-of-area capture, the summary
 * blocks, the confirmation groups. `CARD` in utils/booking/styles is the
 * recipe; this exists so the markup says what it is.
 */
/* HTMLElement rather than HTMLDivElement: `as` can render an <li>, and the
   per-element event handler types are not interchangeable. */
interface CardProps extends React.HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "li";
}

export default function Card({ as: Tag = "div", className, children, ...props }: CardProps) {
  return (
    <Tag className={cn(CARD, className)} {...props}>
      {children}
    </Tag>
  );
}
