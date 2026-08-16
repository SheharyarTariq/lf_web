import type { Metadata } from "next";
import Link from "next/link";
import ConversionLink from "@/components/ConversionLink";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config";

export const metadata: Metadata = {
  title: "Laundry Service Epsom — Free Collection & Delivery | Laundry Free",
  description:
    "Professional laundry collection and delivery in Epsom (KT17, KT18, KT19). We pick up your laundry, professionally clean it and deliver it back — collection and delivery always free. Book via app.",
  alternates: { canonical: "/laundry-service-epsom" },
  openGraph: {
    title: "Laundry Service Epsom — Free Collection & Delivery | Laundry Free",
    description:
      "Professional laundry collection and delivery in Epsom (KT17, KT18, KT19). Free pickup & delivery. Book via the Laundry Free app.",
    url: "https://www.laundryfree.co.uk/laundry-service-epsom",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "LaundryService",
  name: "Laundry Free — Epsom",
  url: "https://www.laundryfree.co.uk/laundry-service-epsom",
  description: "Professional laundry collection and delivery service in Epsom, KT17, KT18 and KT19, Surrey.",
  email: "hello@laundryfree.co.uk",
  areaServed: [
    { "@type": "City", name: "Epsom", containedInPlace: { "@type": "AdministrativeArea", name: "Surrey" } },
    { "@type": "PostalCode", postalCode: "KT17" },
    { "@type": "PostalCode", postalCode: "KT18" },
    { "@type": "PostalCode", postalCode: "KT19" },
  ],
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "08:00",
      closes: "20:00",
    },
  ],
  sameAs: ["https://www.laundryfree.co.uk"],
};

const OTHER_AREAS = [
  { name: "Leatherhead", href: "/laundry-service-leatherhead" },
  { name: "Ashtead", href: "/laundry-service-ashtead" },
  { name: "Ewell", href: "/laundry-service-ewell" },
  { name: "Fetcham", href: "/laundry-service-fetcham" },
  { name: "Surrey", href: "/laundry-service-surrey" },
];

export default function LaundryServiceEpsom() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="flex-1">
        <section className="bg-dark pt-16 pb-14 px-12 text-center max-[860px]:pt-12 max-[860px]:px-5 max-[860px]:pb-10">
          <div className="text-[11px] font-bold tracking-[3px] uppercase text-lime/70 mb-3">Epsom · KT17 · KT18 · KT19</div>
          <h1 className="text-[clamp(32px,5vw,56px)] font-extrabold leading-none tracking-[-2px] text-white mb-5">
            Laundry Service in <em className="text-lime not-italic">Epsom</em>
          </h1>
          <p className="text-[16px] text-white/55 max-w-[520px] mx-auto mb-8 leading-[1.65]">
            We collect your laundry from your door in Epsom, professionally clean every item following its care label, and deliver it back to you — fresh, folded and on time. Collection and delivery are always free.
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
            <p className="text-[11px] font-bold tracking-[3px] uppercase text-muted mb-2">How It Works</p>
            <h2 className="text-[clamp(26px,3.5vw,36px)] font-extrabold tracking-[-1.2px] text-dark mb-8">
              Your laundry, handled from start to finish
            </h2>
            <div className="grid grid-cols-3 gap-6 max-[640px]:grid-cols-1">
              {[
                { n: "1", title: "Book a pickup in Epsom", body: "Open the Laundry Free app, choose a collection slot that suits you and a driver will come to your door anywhere in Epsom — KT17, KT18 or KT19." },
                { n: "2", title: "We clean to the care label", body: "Every item is individually identified, logged, and cleaned according to its care label. You get a full itemised list in the app before any payment is taken." },
                { n: "3", title: "Delivered back within 48h", body: "Your clean, neatly folded laundry is delivered back to your Epsom address in the slot you chose. No extra charge for collection or delivery." },
              ].map((step) => (
                <div key={step.n} className="p-7 rounded-[20px] bg-lf-bg flex flex-col gap-3">
                  <span className="w-9 h-9 rounded-full bg-dark text-lime text-[15px] font-bold inline-flex items-center justify-center shrink-0">
                    {step.n}
                  </span>
                  <h3 className="text-[17px] font-bold text-dark">{step.title}</h3>
                  <p className="text-[14px] leading-[1.65] text-muted">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-lf-bg py-16 px-12 max-[860px]:py-12 max-[860px]:px-5">
          <div className="max-w-[860px] mx-auto">
            <h2 className="text-[clamp(22px,3vw,30px)] font-extrabold tracking-[-1px] text-dark mb-6">
              Why Epsom residents choose Laundry Free
            </h2>
            <div className="grid grid-cols-2 gap-5 max-[540px]:grid-cols-1">
              {[
                { title: "Free collection & delivery", body: "No minimum order, no delivery charge. We come to your door in Epsom and bring everything back — included in the price." },
                { title: "Transparent pricing", body: "Every item is listed with its price in the app before cleaning begins. You approve before we charge — no surprises." },
                { title: "Care-label cleaning", body: "Our team reads and follows the care label on every single item, so your clothes are always cleaned the right way." },
                { title: "Recurring orders available", body: "Set up a weekly, fortnightly or monthly laundry pickup in Epsom. Once scheduled, it runs automatically — no action needed." },
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
            <h2 className="text-[16px] font-bold text-dark mb-4">Also serving nearby areas</h2>
            <div className="flex flex-wrap gap-2">
              {OTHER_AREAS.map((area) => (
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
            Ready to book your first Epsom laundry pickup?
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
