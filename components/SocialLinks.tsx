import { SocialGlyph } from "@/components/icons";
import { BRAND, SOCIALS } from "@/lib/content";

/**
 * A null href means the account does not exist yet: the icon still renders
 * so the row reads as a set, but it is inert, not focusable and not
 * announced, because a link that goes nowhere is worse than no link. Add
 * the URL in lib/content.ts to switch it back on — nothing else to change.
 */
export default function SocialLinks({
  variant = "light",
  className = "",
}: {
  variant?: "light" | "dark";
  className?: string;
}) {
  const chip =
    "flex h-[42px] w-[42px] items-center justify-center rounded-[50%] no-underline transition-[background-color,transform] duration-[160ms] ease-[ease]";
  const tone =
    variant === "dark" ? "bg-surface-dark text-on-dark" : "bg-paper-2 text-ink";
  const hover =
    variant === "dark"
      ? "hover:bg-brand hover:text-ink hover:-translate-y-0.5"
      : "hover:bg-brand hover:-translate-y-0.5";

  return (
    <ul className={`flex gap-2.5 ${variant === "dark" ? "mt-[18px]" : ""} ${className}`.trim()}>
      {SOCIALS.map((s) => (
        <li key={s.name}>
          {s.href ? (
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${BRAND.name} on ${s.name} (opens in a new tab)`}
              className={`${chip} ${tone} ${hover}`}
            >
              <SocialGlyph name={s.name} />
            </a>
          ) : (
            <span className={`${chip} ${tone} cursor-default opacity-55`} aria-hidden="true">
              <SocialGlyph name={s.name} />
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
