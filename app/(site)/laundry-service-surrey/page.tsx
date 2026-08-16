import type { Metadata } from "next";
import Link from "next/link";
import ConversionLink from "@/components/ConversionLink";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config";

export const metadata: Metadata = {
  title: "Laundry Service Surrey — Free Collection & Delivery | Laundry Free",
  description:
    "Professional laundry collection and delivery service across Surrey — Epsom, Leatherhead, Ashtead, Ewell and Fetcham. Free pickup & delivery on every order. Book via the Laundry Free app.",
  alternates: { canonical: "/laundry-service-surrey" },
  openGraph: {
    title: "Laundry Service Surrey — Free Collection & Delivery | Laundry Free",
    description:
      "Laundry collection and delivery across Surrey including Epsom, Leatherhead, Ashtead, Ewell and Fetcham. Free pickup & delivery. Book via app.",
    url: "https://www.laundryfree.co.uk/laundry-service-surrey",
  },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "LaundryService",
  name: "Laundry Free — Surrey",
  url: "https://www.laundryfree.co.uk/laundry-service-surrey",
  description:
    "Professional laundry collection and delivery service covering Epsom, Leatherhead, Ashtead, Ewell and Fetcham in Surrey.",
  email: "hello@laundryfree.co.uk",
  areaServed: [
    { "@type": "AdministrativeArea", name: "Surrey" },
    { "@type": "City", name: "Epsom" },
    { "@type": "City", name: "Leatherhead" },
    { "@type": "City", name: "Ashtead" },
    { "@type": "City", name: "Ewell" },
    { "@type": "City", name: "Fetcham" },
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

const AREAS = [
  { name: "Epsom", postcode: "KT17–KT19", href: "/laundry-service-epsom" },
  { name: "Leatherhead", postcode: "KT22", href: "/laundry-service-leatherhead" },
  { name: "Ashtead", postcode: "KT21", href: "/laundry-service-ashtead" },
  { name: "Ewell", postcode: "KT17, KT19", href: "/laundry-service-ewell" },
  { name: "Fetcham", postcode: "KT22", href: "/laundry-service-fetcham" },
];

export default function LaundryServiceSurrey() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <main className="flex-1">
        <section className="bg-dark pt-16 pb-14 px-12 text-center max-[860px]:pt-12 max-[860px]:px-5 max-[860px]:pb-10">
          <div className="text-[11px] font-bold tracking-[3px] uppercase text-lime/70 mb-3">Surrey · Expanding</div>
          <h1 className="text-[clamp(32px,5vw,56px)] font-extrabold leading-none tracking-[-2px] text-white mb-5">
            Laundry Service in <em className="text-lime not-italic">Surrey</em>
          </h1>
          <p className="text-[16px] text-white/55 max-w-[560px] mx-auto mb-8 leading-[1.65]">
            Laundry Free is Surrey's professional laundry collection and delivery service. We currently serve Epsom, Leatherhead, Ashtead, Ewell and Fetcham — with collection and delivery always free. Book in under a minute through the app.
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
            <p className="text-[11px] font-bold tracking-[3px] uppercase text-muted mb-2">Coverage Map</p>
            <h2 className="text-[clamp(26px,3.5vw,36px)] font-extrabold tracking-[-1.2px] text-dark mb-8">
              Areas we currently serve in Surrey
            </h2>
            <div className="grid grid-cols-2 gap-4 max-[540px]:grid-cols-1 mb-8">
              {AREAS.map((area) => (
                <Link
                  key={area.href}
                  href={area.href}
                  className="p-5 rounded-[16px] bg-lf-bg border border-lf-border no-underline group hover:bg-dark transition-colors duration-[200ms]"
                >
                  <p className="text-[10px] font-bold tracking-[2px] uppercase text-muted group-hover:text-lime/60 transition-colors mb-1">
                    {area.postcode}
                  </p>
                  <p className="text-[18px] font-bold text-dark group-hover:text-white transition-colors">
                    {area.name}
                  </p>
                  <p className="text-[12px] text-muted group-hover:text-white/50 transition-colors mt-1">
                    View service details →
                  </p>
                </Link>
              ))}
              <div className="p-5 rounded-[16px] bg-lf-bg border border-dashed border-lf-border opacity-60">
                <p className="text-[10px] font-bold tracking-[2px] uppercase text-muted mb-1">Coming soon</p>
                <p className="text-[18px] font-bold text-dark">More Surrey areas</p>
                <p className="text-[12px] text-muted mt-1">We are expanding — get in touch if you&apos;re nearby</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-lf-bg py-16 px-12 max-[860px]:py-12 max-[860px]:px-5">
          <div className="max-w-[860px] mx-auto">
            <h2 className="text-[clamp(22px,3vw,30px)] font-extrabold tracking-[-1px] text-dark mb-4">
              The Surrey laundry service built around your life
            </h2>
            <p className="text-[15px] text-muted leading-[1.7] mb-8 max-w-[640px]">
              Laundry Free was built for Surrey residents who want professional laundry results without the trip to a laundrette. We collect from your door, clean every item to its care label, and return it fresh and folded within 48 hours. No minimum order. No hidden charges. No membership fees. Just clean laundry, delivered.
            </p>
            <div className="grid grid-cols-3 gap-5 max-[640px]:grid-cols-1">
              {[
                { title: "Free collection & delivery", body: "On every order, across every Surrey area we serve. No exceptions, no minimum bag size." },
                { title: "Transparent pricing", body: "Full itemised cost shown in the app before cleaning begins. Enable Price Review to approve every charge." },
                { title: "Care-label cleaning", body: "Every item is cleaned according to its care label. We treat your clothes the right way, every time." },
              ].map((item) => (
                <div key={item.title} className="p-6 rounded-[16px] bg-white border border-lf-border">
                  <h3 className="text-[15px] font-bold text-dark mb-2">{item.title}</h3>
                  <p className="text-[13px] leading-[1.65] text-muted">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-lime py-14 px-12 text-center max-[860px]:py-10 max-[860px]:px-5">
          <h2 className="text-[clamp(22px,3vw,32px)] font-extrabold tracking-[-1px] text-dark mb-3">
            Book your first Surrey laundry collection today
          </h2>
          <p className="text-[14px] text-dark/60 mb-7">Free collection &amp; delivery on every order — available on iOS &amp; Android.</p>
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
