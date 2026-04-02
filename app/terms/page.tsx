import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions — LaundryFree",
  description:
    "Terms & Conditions for Laundry Free, operated by HQR LTD. Read the terms governing use of our laundry pickup, cleaning, and delivery services.",
};

export default function TermsAndConditions() {
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

      {/* ── TERMS & CONDITIONS CONTENT ── */}
      <main className="max-w-[1080px] mx-auto px-12 py-[72px] max-[860px]:px-5 max-[860px]:py-[52px]">
        <div className="text-[10px] font-bold tracking-[2.5px] uppercase text-muted mb-2 text-center">
          Legal
        </div>
        <h1 className="text-[clamp(26px,3.5vw,38px)] font-extrabold tracking-[-1.2px] leading-[1.1] text-dark mb-4 text-center">
          Terms &amp; Conditions
        </h1>
        <p className="text-[14px] text-muted text-center mb-12">
          <strong>Last updated:</strong> 31 March 2026
        </p>

        <div className="text-[14px] leading-[1.7] text-dark/80">
          <p className="mb-6">
            These Terms &amp; Conditions govern your use of the Laundry Free service (operated by{" "}
            <strong>HQR LTD</strong>) (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;).
          </p>
          <p className="mb-6">
            By creating an account and using our services, you agree to these Terms &amp; Conditions.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 1. Service Overview ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">1. Service Overview</h2>
          <p className="mb-4">
            Laundry Free provides laundry pickup, cleaning, and delivery services. All services are
            subject to availability and these Terms.
          </p>
          <p className="mb-4">
            We may use third-party service providers to perform part or all of the services. However,
            we remain responsible for providing the service to you under these Terms.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 2. Customer Responsibilities ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">
            2. Customer Responsibilities
          </h2>
          <p className="mb-4">You agree to:</p>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>Provide accurate contact, address, and access details</li>
            <li>Be available at the agreed pickup and delivery times</li>
            <li>Ensure items are suitable for cleaning</li>
            <li>Remove all personal belongings from items before collection</li>
          </ul>
          <p className="mb-4">
            We are not responsible for delays, failed pickups, failed deliveries, or additional
            charges resulting from incorrect information, lack of access, or customer unavailability.
          </p>
          <p className="mb-4">
            If a pickup or delivery attempt fails due to customer unavailability, you must contact us
            within <strong>24 hours</strong> to rearrange the service. Additional fees may apply for
            rescheduling.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 3. Orders, Cancellations & Fees ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">
            3. Orders, Cancellations &amp; Fees
          </h2>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>Orders must be cancelled before the scheduled pickup time</li>
            <li>Once items have been processed, orders cannot be cancelled or refunded</li>
            <li>Once the scheduled pickup time has passed, cancellation may incur a fee</li>
          </ul>
          <p className="mb-4">
            We reserve the right to charge reasonable fees for missed pickups or failed delivery
            attempts.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 4. Pricing & Payments ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">
            4. Pricing &amp; Payments
          </h2>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>
              Prices are determined based on the cleaning method required for each item, as assessed
              by us in accordance with care label instructions
            </li>
            <li>
              We reserve the right to determine whether an item requires washing, dry cleaning, or
              other appropriate treatment
            </li>
            <li>
              Pricing may vary depending on location, service area, demand, or other operational
              factors
            </li>
            <li>Payment is processed securely via Stripe</li>
            <li>All charges must be paid in full before or during service</li>
          </ul>

          <hr className="border-lf-border my-8" />

          {/* ── 5. Cleaning Risks ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">5. Cleaning Risks</h2>
          <p className="mb-4">
            By using our service, you acknowledge that cleaning involves inherent risks.
          </p>
          <p className="mb-4">We are not responsible for:</p>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>Colour bleeding</li>
            <li>Shrinkage</li>
            <li>Fabric wear or damage due to normal cleaning processes</li>
            <li>Manufacturer defects or weak fabrics</li>
            <li>Items left in pockets</li>
            <li>Any damage resulting from inaccurate or missing care instructions.</li>
          </ul>

          <hr className="border-lf-border my-8" />

          {/* ── 6. High-Value & Special Care Items ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">
            6. High-Value &amp; Special Care Items
          </h2>
          <p className="mb-4">
            You must declare any items requiring special care or of high value before service.
          </p>
          <p className="mb-4">
            If such items are not declared, we accept no liability for any damage or loss, to the
            fullest extent permitted by law.
          </p>
          <p className="mb-4">Additional charges may apply for special handling.</p>

          <hr className="border-lf-border my-8" />

          {/* ── 7. Claims & Issues ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">
            7. Claims &amp; Issues
          </h2>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>
              Any issues (including damage, loss, or billing disputes) must be reported within{" "}
              <strong>24 hours of delivery</strong>
            </li>
            <li>
              After this period, items are considered accepted and no claims will be accepted
            </li>
            <li>We may require reasonable evidence to support any claim.</li>
          </ul>

          <hr className="border-lf-border my-8" />

          {/* ── 8. Liability ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">8. Liability</h2>
          <p className="mb-4">
            Nothing in these Terms limits or excludes liability where it would be unlawful to do so.
          </p>
          <p className="mb-4">To the fullest extent permitted by law:</p>
          <p className="mb-4">
            We provide our services with reasonable care and skill as required by law.
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>
              Our liability for any loss or damage is limited to the lower of:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>
                  <strong>2 times the service price of the item</strong>, or
                </li>
                <li>
                  <strong>£25 per item</strong>
                </li>
              </ul>
            </li>
          </ul>
          <p className="mb-4">We are not liable for:</p>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>Any indirect, incidental, or consequential losses</li>
            <li>Loss of profit, business, or opportunity</li>
          </ul>
          <p className="mb-4">
            Certain items may require special handling or incur different pricing based on their
            type, condition, or care requirements. By using our service, you agree that such items
            may be processed accordingly.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 9. Failed Delivery & Unreturned Items ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">
            9. Failed Delivery &amp; Unreturned Items
          </h2>
          <p className="mb-4">
            If we are unable to complete delivery due to customer unavailability or failure to
            provide access:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>We will make reasonable attempts to redeliver the items</li>
            <li>
              Items may be held for up to <strong>90 days</strong> from the original delivery
              attempt
            </li>
          </ul>
          <p className="mb-4">If items remain undelivered after this period:</p>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>They will be considered abandoned</li>
            <li>
              We reserve the right to dispose of or donate the items at our discretion
            </li>
          </ul>

          <hr className="border-lf-border my-8" />

          {/* ── 10. Right to Refuse Service ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">
            10. Right to Refuse Service
          </h2>
          <p className="mb-4">
            We reserve the right to refuse or cancel any order at our sole discretion.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 11. Delays & Events Outside Our Control ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">
            11. Delays &amp; Events Outside Our Control
          </h2>
          <p className="mb-4">
            We are not liable for delays or failure to perform services due to events outside our
            control, including but not limited to:
          </p>
          <ul className="list-disc pl-5 mb-6 space-y-1">
            <li>Traffic or transport issues</li>
            <li>Weather conditions</li>
            <li>System failures</li>
            <li>Operational disruptions</li>
          </ul>

          <hr className="border-lf-border my-8" />

          {/* ── 12. Changes to These Terms ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">
            12. Changes to These Terms
          </h2>
          <p className="mb-4">
            We may update these Terms &amp; Conditions at any time. Updated versions will be made
            available via our app or website.
          </p>

          <hr className="border-lf-border my-8" />

          {/* ── 13. Contact ── */}
          <h2 className="text-[20px] font-bold text-dark mt-10 mb-4">13. Contact</h2>
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
        <p className="text-[12px] text-white/35">&copy; 2026 LaundryFree. All rights reserved.</p>
      </footer>
    </>
  );
}
