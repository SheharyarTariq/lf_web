import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — LaundryFree",
  description:
    "Privacy Policy for Laundry Free, operated by HQR LTD. Learn how we collect, use, and protect your personal data.",
};

export default function PrivacyPolicy() {
  return (
    <>
      {/* ── PROMO BAR ── */}
      <div className="bg-lime py-[10px] px-12 text-center text-[13px] font-bold text-dark tracking-[0.1px]">
        🎉 50% off your first order{" "}
        <span className="font-normal opacity-70">— download the app to claim</span>
      </div>

      {/* ── NAV ── */}
      <nav className="bg-dark px-12 h-[58px] flex items-center justify-between sticky top-0 z-[99] max-[860px]:px-5">
        <Link href="/" className="text-[18px] font-extrabold tracking-[-0.5px] no-underline">
          <span className="text-white">Laundry</span>
          <span className="text-lime">Free</span>
        </Link>
        <a
          href="#download"
          className="bg-lime text-dark font-bold text-[13px] py-2 px-5 rounded-[30px] no-underline transition-opacity duration-[180ms] hover:opacity-[0.82]"
        >
          Get the App
        </a>
      </nav>

      {/* ── PRIVACY POLICY CONTENT ── */}
      <main className="max-w-[1080px] mx-auto px-12 py-[72px] max-[860px]:px-5 max-[860px]:py-[52px]">
        <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-muted mb-2 text-center">
          Legal
        </div>
        <h1 className="text-[clamp(26px,3.5vw,38px)] font-extrabold tracking-[-1.2px] leading-[1.1] text-dark mb-4 text-center">
          Privacy Policy
        </h1>
        <p className="text-[14px] text-muted text-center mb-12">
          <strong>Last updated:</strong> 31 March 2026
        </p>

        <div className="text-[14px] leading-[1.7] text-dark/80">
          <p className="mb-6">
            This Privacy Policy explains how <strong>Laundry Free</strong> (operated by{" "}
            <strong>HQR LTD</strong>) (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;)
            collects, uses, and protects your personal data when you use our mobile application and
            related services.
          </p>
          <p className="mb-6">
            We comply with the UK General Data Protection Regulation (UK GDPR) and the Data
            Protection Act 2018.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 1. Information We Collect ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">1. Information We Collect</h2>
          <p className="mb-4">We may collect the following personal data:</p>

          <h3 className="text-[16px] font-semibold text-dark mt-6 mb-3">
            a) Information you provide:
          </h3>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>Name</li>
            <li>Email address</li>
            <li>Phone number</li>
            <li>Address (for pickup and delivery)</li>
            <li>Notes or instructions related to your orders</li>
          </ul>

          <h3 className="text-[16px] font-semibold text-dark mt-6 mb-3">b) Order Information:</h3>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>Order history</li>
            <li>Service preferences</li>
            <li>Internal notes to improve service quality</li>
          </ul>

          <h3 className="text-[16px] font-semibold text-dark mt-6 mb-3">c) Technical Data:</h3>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>Device information (e.g. device type, operating system)</li>
            <li>Log data and usage information</li>
            <li>Performance, diagnostics, and error reports</li>
            <li>Information collected through analytics or monitoring tools</li>
          </ul>

          <hr className="border-lf-border my-8" />

          {/* ── 2. How We Use Your Data ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">2. How We Use Your Data</h2>
          <p className="mb-4">We use your data for:</p>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>Providing and managing laundry services</li>
            <li>Processing orders and payments</li>
            <li>Communicating with you regarding your orders</li>
            <li>Improving and maintaining our app and services</li>
          </ul>

          <h3 className="text-[16px] font-semibold text-dark mt-6 mb-3">Legal Basis:</h3>
          <ul className="list-disc pl-5 mb-4 space-y-1">
            <li>
              <strong>Contract</strong> – to deliver your order
            </li>
            <li>
              <strong>Legitimate interest</strong> – to improve service and maintain internal records
            </li>
            <li>
              <strong>Legal obligation</strong> – for tax and accounting requirements
            </li>
            <li>
              <strong>Consent</strong> – for notifications or marketing where required
            </li>
          </ul>

          <hr className="border-lf-border my-8" />

          {/* ── 3. Communications ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">3. Communications</h2>
          <p className="mb-4">
            We may contact you using the following methods (where available):
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>Email</li>
            <li>SMS</li>
            <li>Push notifications</li>
          </ul>
          <p className="mb-4">These communications may include:</p>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>Order updates and service-related messages</li>
            <li>Important account or service notifications</li>
            <li>Promotional or marketing messages (only where permitted by law)</li>
          </ul>
          <p className="mb-4">You can opt out of marketing communications at any time.</p>

          <hr className="border-lf-border my-8" />

          {/* ── 4. Payments ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">4. Payments</h2>
          <p className="mb-4">
            Payments are securely processed via <strong>Stripe</strong>.
          </p>
          <p className="mb-4">
            We do <strong>not store your card details</strong>. Stripe processes payment data
            independently.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 5. Data Sharing ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">5. Data Sharing</h2>
          <p className="mb-4">We do not sell your personal data.</p>
          <p className="mb-4">We may share your data with:</p>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>Drivers and delivery personnel (to fulfil your order)</li>
            <li>Payment providers (e.g. Stripe)</li>
            <li>Technical service providers (e.g. hosting, monitoring, or analytics tools)</li>
          </ul>
          <p className="mb-4">
            All third parties are required to process personal data in accordance with applicable
            data protection laws.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 6. Data Retention ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">6. Data Retention</h2>
          <p className="mb-4">We retain your data only for as long as necessary:</p>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>Account data: until account deletion</li>
            <li>Order data: for operational and legal purposes</li>
            <li>Payment records: as required by applicable laws</li>
          </ul>
          <p className="mb-4">
            We may retain limited data where necessary to resolve disputes, enforce agreements, or
            comply with legal obligations.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 7. International Transfers ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">
            7. International Transfers
          </h2>
          <p className="mb-4">
            Some of our service providers may process data outside the UK.
          </p>
          <p className="mb-4">
            Where this occurs, we ensure appropriate safeguards are in place, such as contractual
            protections or transfers to jurisdictions with adequate data protection standards.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 8. Your Rights ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">8. Your Rights</h2>
          <p className="mb-4">Under UK GDPR, you have the right to:</p>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>Access your personal data</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Object to or restrict processing</li>
            <li>Request data portability</li>
          </ul>
          <p className="mb-4">
            To exercise your rights, contact us at:{" "}
            <a
              href="mailto:support@laundryfree.co.uk"
              className="text-dark font-semibold underline"
            >
              support@laundryfree.co.uk
            </a>
          </p>
          <p className="mb-4">
            You also have the right to lodge a complaint with the{" "}
            <strong>Information Commissioner&apos;s Office (ICO)</strong>.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 9. Account Deletion ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">9. Account Deletion</h2>
          <p className="mb-4">
            You can delete your account via the app or by contacting us.
          </p>
          <p className="mb-4">
            We will delete your personal data unless we are required to retain it for legal,
            regulatory, or legitimate business purposes.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 10. Data Security ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">10. Data Security</h2>
          <p className="mb-4">
            We implement appropriate technical and organisational measures to protect your personal
            data.
          </p>
          <p className="mb-4">
            However, no method of transmission or storage is completely secure, and we cannot
            guarantee absolute security.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 11. Changes to This Policy ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">
            11. Changes to This Policy
          </h2>
          <p className="mb-4">We may update this Privacy Policy from time to time.</p>
          <p className="mb-4">
            Any updates will be made available within the app or on our website.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 12. Contact ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">12. Contact</h2>
          <p className="mb-4">
            <a
              href="mailto:support@laundryfree.co.uk"
              className="text-dark font-semibold underline"
            >
              support@laundryfree.co.uk
            </a>
          </p>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-dark py-6 px-12 flex items-center justify-between flex-wrap gap-3 max-[860px]:px-5">
        <Link href="/" className="text-[15px] font-extrabold tracking-[-0.5px] no-underline">
          <span className="text-white">Laundry</span>
          <span className="text-lime">Free</span>
        </Link>
        <div className="flex gap-5">
          {[
            { label: "Privacy", href: "/privacy-policy" },
            { label: "Terms", href: "/terms" },
            { label: "Contact", href: "#" },
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
        <p className="text-[12px] text-white/35">© 2026 LaundryFree. All rights reserved.</p>
      </footer>
    </>
  );
}
