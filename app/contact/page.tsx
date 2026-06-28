import Link from "next/link";
import Logo from "@/components/Logo";
import PromoBar from "@/components/PromoBar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | LaundryFree",
  description: "Get in touch with the LaundryFree team. We're happy to help with any questions about our laundry and dry cleaning collection service.",
};

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── PROMO BAR ── */}
      <PromoBar />

      {/* ── NAV ── */}
      <nav className="bg-dark px-12 h-[58px] flex items-center justify-between sticky top-0 z-[99] max-[860px]:px-5">
        <Link href="/" className="no-underline">
          <Logo />
        </Link>
        <a
          href="/download-app"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-lime text-dark font-bold text-[13px] py-2 px-5 rounded-[30px] no-underline transition-opacity duration-[180ms] hover:opacity-[0.82]"
        >
          Get the App
        </a>
      </nav>

      {/* ── CONTENT ── */}
      <main className="flex-1 w-full max-w-[1080px] mx-auto px-12 py-[72px] max-[860px]:px-5 max-[860px]:py-[52px]">
        <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-muted mb-2 text-center">
          Support
        </div>
        <h1 className="text-[clamp(26px,3.5vw,38px)] font-extrabold tracking-[-1.2px] leading-[1.1] text-dark mb-4 text-center">
          Contact Us
        </h1>
        <p className="text-[14px] text-muted text-center mb-12 max-w-[480px] mx-auto">
          Have a question or need help? We&apos;d love to hear from you. Reach out and we&apos;ll get back to you as soon as possible.
        </p>

        <div className="max-w-[480px] mx-auto">
          {/* Email card */}
          <div className="border border-lf-border rounded-[16px] p-8 mb-6 text-center">
            <div className="w-12 h-12 rounded-full bg-lime/20 flex items-center justify-center mx-auto mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-dark">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h2 className="text-[16px] font-bold text-dark mb-1">Email us</h2>
            <p className="text-[13px] text-muted mb-4">
              We typically respond within one business day.
            </p>
            <a
              href="mailto:hello@laundryfree.co.uk"
              className="inline-block bg-dark text-white font-bold text-[13px] py-2.5 px-6 rounded-[30px] no-underline transition-opacity duration-[180ms] hover:opacity-[0.82]"
            >
              hello@laundryfree.co.uk
            </a>
          </div>

          {/* Service area note */}
          <div className="border border-lf-border rounded-[16px] p-6 text-center">
            <h2 className="text-[15px] font-bold text-dark mb-2">Service Area</h2>
            <p className="text-[13px] text-muted leading-[1.7]">
              We currently serve Epsom &amp; Ewell (KT17, KT18, KT19), Ashtead, Leatherhead, and Fetcham in Surrey.
              If you&apos;re outside these areas, get in touch — we&apos;re expanding fast.
            </p>
          </div>

          <p className="text-[12px] text-muted/70 text-center mt-8">
            For account deletion requests,{" "}
            <Link href="/request-deletion" className="text-dark underline hover:opacity-70 transition-opacity duration-[150ms]">
              visit this page
            </Link>
            .
          </p>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-dark py-6 px-12 flex items-center justify-between flex-wrap gap-3 max-[860px]:px-5">
        <Link href="/" className="no-underline">
          <Logo className="h-9 w-auto" />
        </Link>
        <div className="flex gap-5">
          {[
            { label: "Privacy", href: "/privacy-policy" },
            { label: "Terms", href: "/terms" },
            { label: "Request Deletion", href: "/request-deletion" },
            { label: "Contact", href: "/contact" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[12px] text-white/35 no-underline hover:text-white/70 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <p className="text-[12px] text-white/35">&copy; 2026 LaundryFree. All rights reserved.</p>
      </footer>
    </div>
  );
}
