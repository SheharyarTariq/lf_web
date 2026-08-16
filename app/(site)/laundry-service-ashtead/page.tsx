import type { Metadata } from "next";
import Link from "next/link";
import ConversionLink from "@/components/ConversionLink";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config";

export const metadata: Metadata = {
  title: "Laundry Service Ashtead — Free Collection & Delivery | Laundry Free",
  description:
    "Professional laundry collection and delivery in Ashtead (KT21). We pick up your laundry, professionally clean it and deliver it back — collection and delivery always free. Book via app.",
  alternates: { canonical: "/laundry-service-ashtead" },
  openGraph: {
    title: "Laundry Service Ashtead — Free Collection & Delivery | Laundry Free",
    description:
      "Professional laundry collection and delivery in Ashtead KT21. Free pickup & delivery. Book via the Laundry Free app.",
    url: "https://www.laundryfree.co.uk/laundry-service-ashtead",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "LaundryService",
  name: "Laundry Free — Ashtead",
  url: "https://www.laundryfree.co.uk/laundry-service-ashtead",
  description: "Professional laundry collection and delivery service in Ashtead, KT21, Surrey.",
  email: "hello@laundryfree.co.uk",
  areaServed: [
    { "@type": "City", name: "Ashtead", containedInPlace: { "@type": "AdministrativeArea", name: "Surrey" } },
    { "@type": "PostalCode", postalCode: "KT21" },
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
  { name: "Ewell", href: "/laundry-service-ewell" },
  { name: "Fetcham", href: "/laundry-service-fetcham" },
  { name: "Surrey", href: "/laundry-service-surrey" },
];

export default function LaundryServiceAshtead() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="flex-1">
        <section className="bg-dark pt-16 pb-14 px-12 text-center max-[860px]:pt-12 max-[860px]:px-5 max-[860px]:pb-10">
          <div className="text-[11px] font-bold tracking-[3px] uppercase text-lime/70 mb-3">Ashtead · KT21</div>
          <h1 className="text-[clamp(32px,5vw,56px)] font-extrabold leading-none tracking-[-2px] text-white mb-5">
            Laundry Service in <em className="text-lime not-italic">Ashtead</em>
          </h1>
          <p className="text-[16px] text-white/55 max-w-[520px] mx-auto mb-8 leading-[1.65]">
            Laundry Free offers a full door-to-door laundry collection and delivery service for Ashtead residents. Book a pickup through our app, hand over your laundry as-is, and have it back clean and folded within 48 hours — with free collection and delivery.
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
              Three simple steps for Ashtead residents
            </h2>
            <div className="grid grid-cols-3 gap-6 max-[640px]:grid-cols-1">
              {[
                { n: "1", title: "Schedule your Ashtead pickup", body: "Use the Laundry Free app to book a collection slot in Ashtead. Choose a morning or afternoon window and a driver comes to your door." },
                { n: "2", title: "Hand it over as-is", body: "No sorting or counting required. We take your laundry however it is, itemise everything at our facility and send you a full list in the app." },
                { n: "3", title: "Delivered back, fresh", body: "Within 48 hours, your clean, folded laundry is back at your Ashtead door. Free delivery, on time, every time." },
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
              Why Ashtead residents choose Laundry Free
            </h2>
            <div className="grid grid-cols-2 gap-5 max-[540px]:grid-cols-1">
              {[
                { title: "Free pickup & drop-off", body: "Collection and delivery are free on every order. There is no minimum bag size and no extra charge for coming to your door in Ashtead." },
                { title: "Professionally cleaned", body: "Our laundry team handles every item with care, following care labels precisely so your clothes are cleaned correctly every time." },
                { title: "Full itemised breakdown", body: "You see a complete list of every item and its individual price in the app — before any payment is processed." },
                { title: "Repeat booking made easy", body: "Set up automatic recurring pickups in Ashtead on the schedule that works for you, and cancel or pause at any time from the app." },
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
            Ready to book your first Ashtead laundry pickup?
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
