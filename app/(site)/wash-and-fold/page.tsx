import type { Metadata } from "next";
import Link from "next/link";
import ConversionLink from "@/components/ConversionLink";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config";

export const metadata: Metadata = {
  title: "Wash & Fold Laundry Service — Surrey | Laundry Free",
  description:
    "Professional wash and fold laundry service in Epsom, Leatherhead, Ashtead, Ewell and Fetcham, Surrey. We collect, wash, fold and deliver — free collection and delivery on every order.",
  alternates: { canonical: "/wash-and-fold" },
  openGraph: {
    title: "Wash & Fold Laundry Service — Surrey | Laundry Free",
    description:
      "Wash and fold laundry service with free collection and delivery in Surrey. Book through the Laundry Free app.",
    url: "https://www.laundryfree.co.uk/wash-and-fold",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Wash & Fold Laundry Service",
  serviceType: "Wash and Fold",
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
    "We collect your laundry from your door in Surrey, wash every item following its care label, fold everything neatly and deliver it back — all included with free collection and delivery.",
  offers: {
    "@type": "Offer",
    description: "Wash and fold with free collection and delivery",
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

export default function WashAndFold() {
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
            Wash &amp; <em className="text-lime not-italic">Fold</em> Service
          </h1>
          <p className="text-[16px] text-white/55 max-w-[520px] mx-auto mb-8 leading-[1.65]">
            Our wash and fold service means you never touch a pile of laundry again. We collect from your door, wash every item according to its care label, fold everything and deliver it back — all with free collection and delivery included.
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
            <p className="text-[11px] font-bold tracking-[3px] uppercase text-muted mb-2">The process</p>
            <h2 className="text-[clamp(26px,3.5vw,36px)] font-extrabold tracking-[-1.2px] text-dark mb-4">
              What happens to your laundry
            </h2>
            <p className="text-[15px] text-muted leading-[1.7] mb-10 max-w-[640px]">
              A professional wash and fold service is about more than just putting clothes in a machine. Every item in your order is individually inspected, identified and cleaned the right way. Here is what our process looks like from the moment we collect to the moment we deliver.
            </p>
            <div className="grid grid-cols-2 gap-5 max-[540px]:grid-cols-1">
              {[
                { n: "01", title: "Collection from your door", body: "Book a pickup slot in the app and a driver collects your laundry from your address — in a bag, a basket, however it comes. No sorting needed on your end." },
                { n: "02", title: "Itemising & logging", body: "At our facility, every piece of clothing is logged individually against your order. You see the full list and its cost in the app before cleaning begins." },
                { n: "03", title: "Care-label washing", body: "Each item is washed at the temperature and with the method specified on its care label. We do not put everything on one hot cycle — every item is treated correctly." },
                { n: "04", title: "Folding & delivery", body: "Once clean, your laundry is neatly folded and packed. Your driver delivers it back to your door within 48 hours. Collection and delivery are always free." },
              ].map((step) => (
                <div key={step.n} className="p-6 rounded-[16px] bg-lf-bg flex gap-4">
                  <span className="text-[22px] font-extrabold text-lime/40 shrink-0 leading-none mt-1">{step.n}</span>
                  <div>
                    <h3 className="text-[15px] font-bold text-dark mb-2">{step.title}</h3>
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
              What makes our wash &amp; fold different
            </h2>
            <div className="grid grid-cols-3 gap-5 max-[640px]:grid-cols-1">
              {[
                { title: "Per-item care", body: "Unlike a standard laundrette where everything goes in together, we treat each item individually — the way it was designed to be cleaned." },
                { title: "No hidden fees", body: "Collection and delivery are free. You pay per item, at published prices, and see every charge before paying." },
                { title: "Your preferences applied", body: "Tell us in the app whether you want shirts folded or on hangers, whether to apply stain treatment and more. Applied automatically every order." },
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
            <h2 className="text-[16px] font-bold text-dark mb-4">Service areas</h2>
            <p className="text-[13px] text-muted mb-5">Our wash and fold service is available across these Surrey areas:</p>
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
            Book your first wash &amp; fold collection
          </h2>
          <p className="text-[14px] text-dark/60 mb-7">Download the app — free collection &amp; delivery on every order.</p>
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
