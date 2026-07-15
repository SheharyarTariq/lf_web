import Link from "next/link";
import Logo from "@/components/Logo";

const AREA_LINKS = [
  { label: "Laundry Service Epsom", href: "/laundry-service-epsom" },
  { label: "Laundry Service Leatherhead", href: "/laundry-service-leatherhead" },
  { label: "Laundry Service Ashtead", href: "/laundry-service-ashtead" },
  { label: "Laundry Service Ewell", href: "/laundry-service-ewell" },
  { label: "Laundry Service Fetcham", href: "/laundry-service-fetcham" },
  { label: "Laundry Service Surrey", href: "/laundry-service-surrey" },
];

const SERVICE_LINKS = [
  { label: "Wash & Fold Service", href: "/wash-and-fold" },
  { label: "Collection & Delivery", href: "/laundry-collection-delivery" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "FAQ", href: "/#faq" },
];

const GUIDE_LINKS = [
  { label: "How Laundry Collection Works", href: "/blog/how-laundry-collection-works" },
  { label: "Wash & Fold Guide", href: "/blog/wash-and-fold-guide" },
  { label: "All Guides", href: "/blog" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "Contact", href: "/contact" },
  { label: "Request Deletion", href: "/request-deletion" },
];

export default function Footer() {
  return (
    <footer className="bg-dark pt-12 pb-8 px-12 max-[860px]:px-5">
      <div className="max-w-[1120px] mx-auto">
        <div className="grid grid-cols-4 gap-8 pb-10 border-b border-white/[0.08] max-[860px]:grid-cols-2 max-[540px]:grid-cols-1">
          <div>
            <Link href="/" className="no-underline inline-block mb-4">
              <Logo className="h-8 w-auto" />
            </Link>
            <p className="text-[12px] text-white/35 leading-[1.7] max-w-[180px]">
              Free laundry collection &amp; delivery across Surrey. Book through the app.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[2px] uppercase text-white/30 mb-4">Areas We Serve</p>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {AREA_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[12px] text-white/40 no-underline hover:text-white/75 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[2px] uppercase text-white/30 mb-4">Services</p>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {SERVICE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[12px] text-white/40 no-underline hover:text-white/75 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[2px] uppercase text-white/30 mb-4">Guides</p>
            <ul className="list-none p-0 m-0 flex flex-col gap-2 mb-6">
              {GUIDE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[12px] text-white/40 no-underline hover:text-white/75 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-[10px] font-bold tracking-[2px] uppercase text-white/30 mb-3">Legal</p>
            <ul className="list-none p-0 m-0 flex flex-col gap-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[12px] text-white/40 no-underline hover:text-white/75 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 flex items-center justify-between flex-wrap gap-3">
          <p className="text-[11px] text-white/25">
            &copy; 2026 HQR LTD · Serving Epsom, Leatherhead, Ashtead, Ewell &amp; Fetcham, Surrey
          </p>
          <p className="text-[11px] text-white/20">
            <Link href="mailto:hello@laundryfree.co.uk" className="no-underline text-white/25 hover:text-white/50 transition-colors">
              hello@laundryfree.co.uk
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
