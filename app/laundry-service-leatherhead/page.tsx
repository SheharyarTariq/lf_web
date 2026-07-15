import type { Metadata } from "next";
import Link from "next/link";
import ConversionLink from "@/components/ConversionLink";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config";

export const metadata: Metadata = {
  title: "Laundry Service Leatherhead — Free Collection & Delivery | Laundry Free",
  description:
    "Professional laundry collection and delivery in Leatherhead (KT22). We pick up your laundry, professionally clean it and deliver it back — collection and delivery always free. Book via app.",
  alternates: { canonical: "/laundry-service-leatherhead" },
  openGraph: {
    title: "Laundry Service Leatherhead — Free Collection & Delivery | Laundry Free",
    description:
      "Professional laundry collection and delivery in Leatherhead KT22. Free pickup & delivery. Book via the Laundry Free app.",
    url: "https://www.laundryfree.co.uk/laundry-service-leatherhead",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "LaundryService",
  name: "Laundry Free — Leatherhead",
  url: "https://www.laundryfree.co.uk/laundry-service-leatherhead",
  description: "Professional laundry collection and delivery service in Leatherhead, KT22, Surrey.",
  email: "hello@laundryfree.co.uk",
  areaServed: [
    { "@type": "City", name: "Leatherhead", containedInPlace: { "@type": "AdministrativeArea", name: "Surrey" } },
    { "@type": "PostalCode", postalCode: "KT22" },
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
  { name: "Epsom", href: "/laundry-service-epsom" },
  { name: "Ashtead", href: "/laundry-service-ashtead" },
  { name: "Ewell", href: "/laundry-service-ewell" },
  { name: "Fetcham", href: "/laundry-service-fetcham" },
  { name: "Surrey", href: "/laundry-service-surrey" },
];

export default function LaundryServiceLeatherhead() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="flex-1">
        <section className="bg-dark pt-16 pb-14 px-12 text-center max-[860px]:pt-12 max-[860px]:px-5 max-[860px]:pb-10">
          <div className="text-[11px] font-bold tracking-[3px] uppercase text-lime/70 mb-3">Leatherhead · KT22</div>
          <h1 className="text-[clamp(32px,5vw,56px)] font-extrabold leading-none tracking-[-2px] text-white mb-5">
            Laundry Service in <em className="text-lime not-italic">Leatherhead</em>
          </h1>
          <p className="text-[16px] text-white/55 max-w-[520px] mx-auto mb-8 leading-[1.65]">
            Laundry Free collects your laundry from your Leatherhead address, professionally cleans every item and delivers it back — neatly folded and within 48 hours. Free collection and delivery, always.
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
                { n: "1", title: "Book a pickup in Leatherhead", body: "Open the Laundry Free app, pick a collection time and a driver will come to your Leatherhead door. Scheduling takes under a minute." },
                { n: "2", title: "Every item logged & cleaned", body: "We itemise every piece of clothing against your order so you always have a full record. Cleaning follows the care label on every item — no guesswork." },
                { n: "3", title: "Back to you within 48 hours", body: "Clean, folded and packed laundry is delivered back to your Leatherhead address at a time that suits you. No delivery charge, ever." },
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
              Why Leatherhead residents choose Laundry Free
            </h2>
            <div className="grid grid-cols-2 gap-5 max-[540px]:grid-cols-1">
              {[
                { title: "No hidden fees", body: "Collection and delivery are free on every single order. You only pay for the items we clean, at prices shown in the app before we start." },
                { title: "Flexible scheduling", body: "Book one-off pickups or set up recurring laundry collections in Leatherhead on a weekly, fortnightly or monthly basis." },
                { title: "Price review option", body: "Enable Price Review in your preferences and you'll approve every charge before payment is taken — full control at all times." },
                { title: "Track your order live", body: "From pickup through cleaning to delivery, you can follow your order in real time through the app." },
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
            Ready to book your first Leatherhead laundry pickup?
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
