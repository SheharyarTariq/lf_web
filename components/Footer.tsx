import Link from "next/link";
import Logo from "@/components/Logo";

const FOOTER_LINKS = [
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "Request Deletion", href: "/request-deletion" },
  { label: "Contact", href: "/contact" },
];

// Shared footer. Lives in the root layout so it persists across client navigation.
export default function Footer() {
  return (
    <footer className="bg-dark py-6 px-12 flex items-center justify-between flex-wrap gap-3 max-[860px]:px-5">
      <Link href="/" className="no-underline">
        <Logo className="h-9 w-auto" />
      </Link>
      <div className="flex gap-5 flex-wrap justify-end">
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-[12px] text-white/35 no-underline hover:text-white/70 transition-colors whitespace-nowrap"
          >
            {link.label}
          </Link>
        ))}
      </div>
      <p className="text-[12px] text-white/35">&copy; 2026 HQR LTD</p>
    </footer>
  );
}
