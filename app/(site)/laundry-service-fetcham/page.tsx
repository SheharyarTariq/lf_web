import type { Metadata } from "next";
import Link from "next/link";
import ConversionLink from "@/components/ConversionLink";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config";

export const metadata: Metadata = {
  title: "Laundry Service Fetcham — Free Collection & Delivery | Laundry Free",
  description:
    "Professional laundry collection and delivery in Fetcham (KT22). We pick up your laundry, professionally clean it and deliver it back — collection and delivery always free. Book via app.",
  alternates: { canonical: "/laundry-service-fetcham" },
  openGraph: {
    title: "Laundry Service Fetcham — Free Collection & Delivery | Laundry Free",
    description:
      "Professional laundry collection and delivery in Fetcham KT22. Free pickup & delivery. Book via the Laundry Free app.",
    url: "https://www.laundryfree.co.uk/laundry-service-fetcham",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "LaundryService",
  name: "Laundry Free — Fetcham",
  url: "https://www.laundryfree.co.uk/laundry-service-fetcham",
  description: "Professional laundry collection and delivery service in Fetcham, KT22, Surrey.",
  email: "hello@laundryfree.co.uk",
  areaServed: [
    { "@type": "City", name: "Fetcham", containedInPlace: { "@type": "AdministrativeArea", name: "Surrey" } },
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
  { name: "Leatherhead", href: "/laundry-service-leatherhead" },
  { name: "Ashtead", href: "/laundry-service-ashtead" },
  { name: "Ewell", href: "/laundry-service-ewell" },
  { name: "Surrey", href: "/laundry-service-surrey" },
];

export default function LaundryServiceFetcham() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="flex-1">
        <section className="bg-dark pt-16 pb-14 px-12 text-center max-[860px]:pt-12 max-[860px]:px-5 max-[860px]:pb-10">
          <div className="text-[11px] font-bold tracking-[3px] uppercase text-lime/70 mb-3">Fetcham · KT22</div>
          <h1 className="text-[clamp(32px,5vw,56px)] font-extrabold leading-none tracking-[-2px] text-white mb-5">
            Laundry Service in <em className="text-lime not-italic">Fetcham</em>
          </h1>
          <p className="text-[16px] text-white/55 max-w-[520px] mx-auto mb-8 leading-[1.65]">
            Laundry Free now serves Fetcham with professional laundry collection and delivery. We pick up from your door, clean every item properly and return it — all with free collection and delivery included as standard.
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
              Door-to-door laundry for Fetcham residents
            </h2>
            <div className="grid grid-cols-3 gap-6 max-[640px]:grid-cols-1">
              {[
                { n: "1", title: "Book in Fetcham via the app", body: "The Laundry Free app lets you schedule a laundry collection in Fetcham in under a minute. Pick a slot and we come to you." },
                { n: "2", title: "We handle everything", body: "Hand over your laundry as-is. Our team itemises every piece, cleans it according to its care label and provides a full cost breakdown in the app." },
                { n: "3", title: "Back at your door within 48h", body: "Your clean, neatly folded laundry is returned to your Fetcham address. Collection and delivery are always free." },
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
              Why Fetcham residents choose Laundry Free
            </h2>
            <div className="grid grid-cols-2 gap-5 max-[540px]:grid-cols-1">
              {[
                { title: "Zero delivery fee", body: "Every Fetcham collection and every delivery is completely free. You pay only for the laundry items we clean — nothing else." },
                { title: "Your preferences saved", body: "Set how you want your shirts returned (folded or on a hanger), whether to apply stain treatment, and more. Saved and applied automatically to every order." },
                { title: "Itemised every time", body: "Every order comes with a complete list of items and prices in the app so you always know exactly what you are paying for." },
                { title: "Expand your schedule easily", body: "Start with a single collection in Fetcham and move to recurring pickups whenever you're ready. No commitment required to start." },
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
            Ready to book your first Fetcham laundry pickup?
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
