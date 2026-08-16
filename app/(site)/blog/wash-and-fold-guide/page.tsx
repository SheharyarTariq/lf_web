import type { Metadata } from "next";
import Link from "next/link";
import ConversionLink from "@/components/ConversionLink";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config";

export const metadata: Metadata = {
  title: "What Is Wash & Fold — and Is It Worth It? | Laundry Free",
  description:
    "A plain-English guide to wash and fold laundry services: what they include, how pricing works, how they differ from a laundrette and whether they are worth the cost.",
  alternates: { canonical: "/blog/wash-and-fold-guide" },
  openGraph: {
    title: "What Is Wash & Fold — and Is It Worth It? | Laundry Free",
    description:
      "Everything you need to know about wash and fold laundry services — what is included, how pricing works and how they compare to a standard laundrette.",
    url: "https://www.laundryfree.co.uk/blog/wash-and-fold-guide",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What Is Wash & Fold — and Is It Worth It?",
  description:
    "A plain-English guide to wash and fold laundry services: what they include, how pricing works and whether they are worth the cost.",
  author: { "@type": "Organization", name: "Laundry Free" },
  publisher: {
    "@type": "Organization",
    name: "Laundry Free",
    logo: { "@type": "ImageObject", url: "https://www.laundryfree.co.uk/footerlogo.svg" },
  },
  datePublished: "2026-07-01",
  dateModified: "2026-07-01",
  url: "https://www.laundryfree.co.uk/blog/wash-and-fold-guide",
  mainEntityOfPage: "https://www.laundryfree.co.uk/blog/wash-and-fold-guide",
};

export default function WashAndFoldGuide() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <main className="flex-1">
        <section className="bg-dark pt-14 pb-12 px-12 max-[860px]:pt-10 max-[860px]:px-5 max-[860px]:pb-8">
          <div className="max-w-[760px] mx-auto">
            <Link href="/blog" className="text-[12px] text-white/40 no-underline hover:text-white/70 transition-colors mb-6 inline-flex items-center gap-1">
              ← All guides
            </Link>
            <div className="flex gap-2 flex-wrap mb-4">
              <span className="text-[10px] font-bold tracking-[2px] uppercase text-lime/60 bg-white/[0.06] border border-white/[0.10] py-1 px-3 rounded-full">Wash &amp; Fold</span>
              <span className="text-[10px] font-bold tracking-[2px] uppercase text-lime/60 bg-white/[0.06] border border-white/[0.10] py-1 px-3 rounded-full">Guide</span>
            </div>
            <h1 className="text-[clamp(26px,4vw,44px)] font-extrabold tracking-[-1.5px] leading-[1.1] text-white mb-4">
              What Is Wash &amp; Fold — and Is It Worth It?
            </h1>
            <p className="text-[14px] text-white/40">July 2026 · 5 min read · By Laundry Free</p>
          </div>
        </section>

        <article className="bg-white py-16 px-12 max-[860px]:py-12 max-[860px]:px-5">
          <div className="max-w-[760px] mx-auto">
            <p className="text-[17px] text-dark leading-[1.75] mb-6 font-medium">
              Wash and fold is a laundry service where a professional team washes your clothes and returns them neatly folded — usually with collection and delivery from your home. It sounds simple, but there is quite a bit of variation in how different services work and what they actually include. This guide explains exactly what wash and fold means, how pricing typically works and whether it is worth using.
            </p>

            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] text-dark mt-10 mb-4">What does wash and fold actually include?</h2>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              A wash and fold service covers the full laundry cycle for everyday items — the kind of clothes you put in a normal washing machine at home. This typically includes:
            </p>
            <ul className="list-none p-0 mb-6 flex flex-col gap-2">
              {["Everyday clothing — shirts, trousers, jeans, t-shirts, underwear, socks", "Casual knitwear and jumpers", "Gym and sportswear", "Pyjamas and nightwear", "Bedding — sheets, duvet covers, pillowcases", "Towels and bath linens"].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[15px] text-muted leading-[1.65]">
                  <span className="w-5 h-5 rounded-full bg-lime/20 flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              Items that require specialist treatment — leather, suede, tailored suits, embroidered or beaded garments — are generally handled separately as dry cleaning rather than wash and fold.
            </p>

            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] text-dark mt-10 mb-4">How is wash and fold different from a laundrette?</h2>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              The main practical difference is that you do not do any of the work. At a laundrette, you load machines, set temperatures, transfer clothes to dryers, wait and then take everything home to fold. With a wash and fold service, none of that is your job.
            </p>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              The more meaningful difference, though, is in how clothes are treated. Most laundrettes involve customers selecting a single cycle for their entire load — which often means mixing fabrics, temperatures and spin speeds that should not be mixed. A good wash and fold service reads the care label on each individual item and cleans it accordingly.
            </p>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              This matters for the lifespan of your clothes. Washing a merino wool jumper at 40°C alongside jeans is how garments shrink, lose their shape or fade faster than they should.
            </p>

            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] text-dark mt-10 mb-4">How does wash and fold pricing work?</h2>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              There are two common pricing models. Some services charge by the kilogram — you pay a flat rate per kg of laundry, regardless of what items are in the bag. Others charge per item, with different prices for different garment types.
            </p>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              Per-item pricing is generally more transparent. You can see exactly what each piece costs before cleaning begins — a shirt is priced separately from a duvet cover, which makes sense given the difference in what they require to clean properly.
            </p>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              With Laundry Free, pricing is per item. Every piece that is collected is listed in the app with its individual price before any cleaning starts. If you want to review and approve all charges before payment is taken, Price Review mode in your account gives you that control.
            </p>

            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] text-dark mt-10 mb-4">What about collection and delivery — is that included?</h2>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              It depends on the service. Some charge a delivery fee on top of the cleaning cost. Some include it but only above a minimum order value. With Laundry Free, collection and delivery are free on every order — there is no minimum and no delivery fee added at checkout.
            </p>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              This is worth checking before you commit to any wash and fold service, as delivery fees can significantly affect the overall cost, particularly for smaller orders.
            </p>

            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] text-dark mt-10 mb-4">Is wash and fold worth it?</h2>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              The honest answer depends on what your time is worth to you and how much laundry you do. For many people, doing laundry is not just inconvenient — it is genuinely time-consuming. Sorting, loading, waiting, transferring, folding and putting away a full household's laundry can take several hours across a week.
            </p>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              If you can reclaim those hours for something more useful or enjoyable, the cost of a wash and fold service often compares favourably. And because professional cleaning extends the lifespan of garments — by treating each item correctly rather than running everything through the same cycle — the long-term cost of replacing worn-out clothes can be lower too.
            </p>
            <p className="text-[16px] text-muted leading-[1.75] mb-6">
              For households that do laundry regularly, a recurring wash and fold subscription — set up once and running automatically — removes the decision entirely. Your clothes are cleaned, folded and returned without you having to think about it.
            </p>

            <div className="mt-12 p-6 rounded-[16px] bg-lf-bg border border-lf-border">
              <p className="text-[13px] font-bold text-dark mb-1">Try wash &amp; fold in Surrey — free collection &amp; delivery</p>
              <p className="text-[13px] text-muted mb-4">Laundry Free covers Epsom, Leatherhead, Ashtead, Ewell and Fetcham. Book through the app in under a minute.</p>
              <div className="flex gap-2 flex-wrap">
                <ConversionLink href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="bg-dark text-white font-bold text-[13px] py-2 px-5 rounded-full no-underline transition-opacity hover:opacity-80">App Store</ConversionLink>
                <ConversionLink href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="bg-dark text-white font-bold text-[13px] py-2 px-5 rounded-full no-underline transition-opacity hover:opacity-80">Google Play</ConversionLink>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-lf-border">
              <p className="text-[13px] font-bold text-dark mb-3">Related guides</p>
              <Link href="/blog/how-laundry-collection-works" className="text-[14px] text-dark underline hover:opacity-70 transition-opacity">
                How a Laundry Collection Service Works — Step by Step →
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-lf-border">
              <p className="text-[13px] font-bold text-dark mb-3">Wash &amp; fold service areas</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: "Epsom", href: "/laundry-service-epsom" },
                  { name: "Leatherhead", href: "/laundry-service-leatherhead" },
                  { name: "Ashtead", href: "/laundry-service-ashtead" },
                  { name: "Ewell", href: "/laundry-service-ewell" },
                  { name: "Fetcham", href: "/laundry-service-fetcham" },
                ].map((area) => (
                  <Link key={area.href} href={area.href} className="text-[12px] font-semibold text-dark bg-lf-bg border border-lf-border py-1.5 px-3 rounded-full no-underline hover:bg-dark hover:text-white transition-colors">
                    {area.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </article>
      </main>
    </>
  );
}
