import type { Metadata } from "next";
import Link from "next/link";
import ConversionLink from "@/components/ConversionLink";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config";

export const metadata: Metadata = {
  title: "Laundry Collection & Delivery Service — Surrey | Laundry Free",
  description:
    "Door-to-door laundry collection and delivery service in Epsom, Leatherhead, Ashtead, Ewell and Fetcham, Surrey. Free pickup and delivery on every order. Book through the app in under a minute.",
  alternates: { canonical: "/laundry-collection-delivery" },
  openGraph: {
    title: "Laundry Collection & Delivery Service — Surrey | Laundry Free",
    description:
      "Free laundry collection and delivery service in Surrey. We pick up, professionally clean and deliver back. Book via the Laundry Free app.",
    url: "https://www.laundryfree.co.uk/laundry-collection-delivery",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Laundry Collection & Delivery Service",
  serviceType: "Laundry Collection and Delivery",
  provider: {
    "@type": "LaundryService",
    name: "Laundry Free",
    url: "https://www.laundryfree.co.uk",
    email: "hello@laundryfree.co.uk",
  },
  areaServed: [
    { "@type": "City", name: "Epsom" },
    { "@type": "City", name: "Leatherhead" },
    { "@type": "City", name: "Ashtead" },
    { "@type": "City", name: "Ewell" },
    { "@type": "City", name: "Fetcham" },
  ],
  description:
    "A door-to-door laundry collection and delivery service covering Epsom, Leatherhead, Ashtead, Ewell and Fetcham in Surrey. Free collection and delivery on every order.",
  offers: {
    "@type": "Offer",
    description: "Free laundry collection and delivery",
    areaServed: "Surrey, UK",
  },
};

const AREAS = [
  { name: "Epsom", href: "/laundry-service-epsom" },
  { name: "Leatherhead", href: "/laundry-service-leatherhead" },
  { name: "Ashtead", href: "/laundry-service-ashtead" },
  { name: "Ewell", href: "/laundry-service-ewell" },
  { name: "Fetcham", href: "/laundry-service-fetcham" },
];

export default function LaundryCollectionDelivery() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="flex-1">
        <section className="bg-dark pt-16 pb-14 px-12 text-center max-[860px]:pt-12 max-[860px]:px-5 max-[860px]:pb-10">
          <div className="text-[11px] font-bold tracking-[3px] uppercase text-lime/70 mb-3">Laundry Free · Surrey</div>
          <h1 className="text-[clamp(32px,5vw,56px)] font-extrabold leading-none tracking-[-2px] text-white mb-5">
            Laundry <em className="text-lime not-italic">Collection</em>
            <br />
            &amp; Delivery
          </h1>
          <p className="text-[16px] text-white/55 max-w-[520px] mx-auto mb-8 leading-[1.65]">
            A complete door-to-door laundry service for Surrey residents. We collect your laundry from your address, clean every item professionally and deliver it back within 48 hours. Collection and delivery are free on every single order.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <ConversionLink
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-lime text-dark font-bold text-[14px] py-3 px-7 rounded-full no-underline transition-opacity duration-[180ms] hover:opacity-[0.82]"
            >
              Download on App Store
            </ConversionLink>
            <ConversionLink
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/10 text-white font-bold text-[14px] py-3 px-7 rounded-full no-underline border border-white/20 transition-opacity duration-[180ms] hover:opacity-[0.82]"
            >
              Get on Google Play
            </ConversionLink>
          </div>
        </section>

        <section className="bg-white py-16 px-12 max-[860px]:py-12 max-[860px]:px-5">
          <div className="max-w-[860px] mx-auto">
            <p className="text-[11px] font-bold tracking-[3px] uppercase text-muted mb-2">How the service works</p>
            <h2 className="text-[clamp(26px,3.5vw,36px)] font-extrabold tracking-[-1.2px] text-dark mb-4">
              From your door to fresh and folded — in 48 hours
            </h2>
            <p className="text-[15px] text-muted leading-[1.7] mb-10 max-w-[640px]">
              A laundry collection and delivery service removes the most time-consuming part of doing laundry — all of it. You do not go to a laundrette, you do not sort your clothes, you do not wait. Here is exactly how Laundry Free handles your order from start to finish.
            </p>
            <div className="grid grid-cols-1 gap-4 max-w-[640px]">
              {[
                { n: "1", title: "You book a collection slot", body: "Open the Laundry Free app and choose a collection time. We cover Epsom, Leatherhead, Ashtead, Ewell and Fetcham — Monday to Sunday, 8am to 8pm." },
                { n: "2", title: "Driver collects from your door", body: "A driver arrives at your chosen time and collects your laundry. Hand it over however it is — there is no need to sort, count or bag items in any particular way." },
                { n: "3", title: "Every item is logged at our facility", body: "At our facility, every piece of clothing is individually identified and logged to your order in the app. You can see exactly what was collected and what each item will cost before cleaning starts." },
                { n: "4", title: "Professional cleaning to care labels", body: "We clean every item according to its individual care label — not all on one setting. Your delicates, your shirts, your everyday wear — each treated the right way." },
                { n: "5", title: "Delivered back, neatly folded", body: "Within 48 hours of collection, a driver returns your clean, folded laundry to your door in the delivery slot you chose. Free, on time, every time." },
              ].map((step) => (
                <div key={step.n} className="flex gap-5 p-5 rounded-[14px] bg-lf-bg">
                  <span className="w-8 h-8 rounded-full bg-dark text-lime text-[13px] font-bold inline-flex items-center justify-center shrink-0 mt-0.5">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="text-[15px] font-bold text-dark mb-1">{step.title}</h3>
                    <p className="text-[13px] leading-[1.65] text-muted">{step.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-lf-bg py-16 px-12 max-[860px]:py-12 max-[860px]:px-5">
          <div className="max-w-[860px] mx-auto">
            <h2 className="text-[clamp(22px,3vw,30px)] font-extrabold tracking-[-1px] text-dark mb-6">
              Why choose Laundry Free collection &amp; delivery?
            </h2>
            <div className="grid grid-cols-2 gap-5 max-[540px]:grid-cols-1">
              {[
                { title: "Genuinely free collection & delivery", body: "Not a promotion, not a minimum spend threshold — collection and delivery are always free on every order, with no minimum bag size." },
                { title: "Full transparency on every order", body: "Every item and its price is visible in the app before any cleaning begins. No estimates. No surprises. What you see is exactly what you pay." },
                { title: "Recurring collections", body: "Set a weekly, fortnightly or monthly recurring laundry schedule. Once configured, your collection and delivery happens automatically with no action needed from you." },
                { title: "Live order tracking", body: "Track your laundry from collection through cleaning to delivery in real time through the app. You always know exactly where your clothes are." },
                { title: "Care-label cleaning", body: "Our team reads the care label on every individual item and cleans it accordingly. Your clothes are never over-washed, shrunk or damaged." },
                { title: "Flexible delivery slots", body: "If plans change before your order is out for delivery, you can update the delivery slot directly in the app — no calls, no friction." },
              ].map((item) => (
                <div key={item.title} className="p-6 rounded-[16px] bg-white border border-lf-border">
                  <h3 className="text-[15px] font-bold text-dark mb-2">{item.title}</h3>
                  <p className="text-[13px] leading-[1.65] text-muted">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-12 px-12 max-[860px]:py-10 max-[860px]:px-5 border-t border-lf-border">
          <div className="max-w-[860px] mx-auto">
            <h2 className="text-[16px] font-bold text-dark mb-4">Collection &amp; delivery areas in Surrey</h2>
            <p className="text-[13px] text-muted mb-5">We currently offer laundry collection and delivery in the following Surrey areas:</p>
            <div className="flex flex-wrap gap-2">
              {AREAS.map((area) => (
                <Link
                  key={area.href}
                  href={area.href}
                  className="text-[13px] font-semibold text-dark bg-lf-bg border border-lf-border py-2 px-4 rounded-full no-underline hover:bg-dark hover:text-white transition-colors duration-[180ms]"
                >
                  {area.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-lime py-14 px-12 text-center max-[860px]:py-10 max-[860px]:px-5">
          <h2 className="text-[clamp(22px,3vw,32px)] font-extrabold tracking-[-1px] text-dark mb-3">
            Book your first laundry collection today
          </h2>
          <p className="text-[14px] text-dark/60 mb-7">Download the Laundry Free app — free collection &amp; delivery on every order.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <ConversionLink
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-dark text-white font-bold text-[14px] py-3 px-7 rounded-full no-underline transition-opacity duration-[180ms] hover:opacity-[0.82]"
            >
              App Store
            </ConversionLink>
            <ConversionLink
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-dark text-white font-bold text-[14px] py-3 px-7 rounded-full no-underline transition-opacity duration-[180ms] hover:opacity-[0.82]"
            >
              Google Play
            </ConversionLink>
          </div>
        </section>
      </main>
    </>
  );
}
