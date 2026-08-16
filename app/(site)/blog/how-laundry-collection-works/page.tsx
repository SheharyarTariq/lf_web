import type { Metadata } from "next";
import Link from "next/link";
import ConversionLink from "@/components/ConversionLink";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/config";

export const metadata: Metadata = {
  title: "How a Laundry Collection Service Works — Laundry Free",
  description:
    "A step-by-step guide to how a laundry collection and delivery service works — from booking a pickup to receiving your clean clothes at the door. Written by the Laundry Free team.",
  alternates: { canonical: "/blog/how-laundry-collection-works" },
  openGraph: {
    title: "How a Laundry Collection Service Works — Step by Step | Laundry Free",
    description:
      "Everything that happens from booking a laundry pickup to getting your clean clothes back at your door, explained clearly.",
    url: "https://www.laundryfree.co.uk/blog/how-laundry-collection-works",
  },
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How a Laundry Collection Service Works — Step by Step",
  description:
    "A step-by-step guide to how a laundry collection and delivery service works — from booking a pickup to receiving clean clothes at the door.",
  author: { "@type": "Organization", name: "Laundry Free" },
  publisher: {
    "@type": "Organization",
    name: "Laundry Free",
    logo: { "@type": "ImageObject", url: "https://www.laundryfree.co.uk/footerlogo.svg" },
  },
  datePublished: "2026-07-01",
  dateModified: "2026-07-01",
  url: "https://www.laundryfree.co.uk/blog/how-laundry-collection-works",
  mainEntityOfPage: "https://www.laundryfree.co.uk/blog/how-laundry-collection-works",
};

export default function HowLaundryCollectionWorks() {
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
              <span className="text-[10px] font-bold tracking-[2px] uppercase text-lime/60 bg-white/[0.06] border border-white/[0.10] py-1 px-3 rounded-full">Laundry Service</span>
              <span className="text-[10px] font-bold tracking-[2px] uppercase text-lime/60 bg-white/[0.06] border border-white/[0.10] py-1 px-3 rounded-full">How It Works</span>
            </div>
            <h1 className="text-[clamp(26px,4vw,44px)] font-extrabold tracking-[-1.5px] leading-[1.1] text-white mb-4">
              How a Laundry Collection Service Works — Step by Step
            </h1>
            <p className="text-[14px] text-white/40">July 2026 · 4 min read · By Laundry Free</p>
          </div>
        </section>

        <article className="bg-white py-16 px-12 max-[860px]:py-12 max-[860px]:px-5">
          <div className="max-w-[760px] mx-auto prose-like">
            <p className="text-[17px] text-dark leading-[1.75] mb-6 font-medium">
              A laundry collection service sounds straightforward: someone picks up your laundry, cleans it and brings it back. But if you have never used one before, you might wonder exactly what the process involves — what happens to your clothes, how pricing works and what you are responsible for. This guide explains all of it, step by step.
            </p>

            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] text-dark mt-10 mb-4">Step 1: You book a collection through the app</h2>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              With Laundry Free, everything starts in the app. You open it, choose a collection date and time window, and confirm. The whole process takes under a minute. You do not need to specify what laundry you have or how much — that comes later.
            </p>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              Collections are available Monday to Sunday, 8am to 8pm, across Epsom, Leatherhead, Ashtead, Ewell and Fetcham in Surrey. Once you have confirmed, the booking is locked in and you will receive a reminder closer to the time.
            </p>

            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] text-dark mt-10 mb-4">Step 2: A driver collects from your door</h2>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              At your chosen time, a driver arrives at your address and collects your laundry. You hand it over however it is — in a bag, a laundry basket, or loose. There is no requirement to sort by colour, fabric or temperature. There is no minimum or maximum amount.
            </p>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              This collection is free. There is no charge for the driver visiting your address, regardless of how much laundry you hand over.
            </p>

            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] text-dark mt-10 mb-4">Step 3: Every item is logged at the facility</h2>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              When your laundry arrives at the cleaning facility, a team member goes through every piece individually. Each item is identified, logged against your order and given a price according to a published price list. Shirts, trousers, bedding, delicates — each one has its own entry.
            </p>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              This itemised list appears in the app so you can see exactly what was collected and what each piece will cost. If you have enabled Price Review in your preferences, you will receive a notification and can approve all charges before any cleaning begins. Nothing is processed without your knowledge.
            </p>

            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] text-dark mt-10 mb-4">Step 4: Cleaning to the care label</h2>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              Each item is cleaned according to the care label attached to it. This matters more than most people realise. A cotton shirt and a merino wool jumper require completely different wash temperatures, spin speeds and drying methods. A service that puts everything on one cycle risks damaging delicates or under-cleaning everyday items.
            </p>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              Where an item has no care label — older garments, for example — the cleaning team applies their professional experience to determine the safest and most effective cleaning method. Your preferences for stain treatment, folding style and other details are also applied at this stage, based on what you have set in your account.
            </p>

            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] text-dark mt-10 mb-4">Step 5: Your clothes are returned, clean and folded</h2>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              Once cleaned, everything is neatly folded and packed. A driver delivers your laundry back to your address in the delivery slot you selected when you booked. The entire turnaround from collection to delivery is within 48 hours.
            </p>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              Delivery is free. If your plans change before the delivery goes out, you can change the delivery slot directly in the app at no extra charge.
            </p>

            <h2 className="text-[22px] font-extrabold tracking-[-0.5px] text-dark mt-10 mb-4">What about payment?</h2>
            <p className="text-[16px] text-muted leading-[1.75] mb-4">
              Payment is taken after your items have been logged and priced, not at booking. You are charged only for what was cleaned — at the per-item prices listed in the app. There are no membership fees, no minimum order charges and no delivery fees added at checkout.
            </p>
            <p className="text-[16px] text-muted leading-[1.75] mb-6">
              If you want full control before paying, enabling Price Review means you explicitly approve every charge before it is taken. The app shows you the complete breakdown and waits for your confirmation.
            </p>

            <div className="mt-12 p-6 rounded-[16px] bg-lf-bg border border-lf-border">
              <p className="text-[13px] font-bold text-dark mb-1">Ready to try a laundry collection service in Surrey?</p>
              <p className="text-[13px] text-muted mb-4">Laundry Free covers Epsom, Leatherhead, Ashtead, Ewell and Fetcham. Free collection and delivery on every order.</p>
              <div className="flex gap-2 flex-wrap">
                <ConversionLink href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="bg-dark text-white font-bold text-[13px] py-2 px-5 rounded-full no-underline transition-opacity hover:opacity-80">App Store</ConversionLink>
                <ConversionLink href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="bg-dark text-white font-bold text-[13px] py-2 px-5 rounded-full no-underline transition-opacity hover:opacity-80">Google Play</ConversionLink>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-lf-border">
              <p className="text-[13px] font-bold text-dark mb-3">Related guides</p>
              <Link href="/blog/wash-and-fold-guide" className="text-[14px] text-dark underline hover:opacity-70 transition-opacity">
                What Is Wash &amp; Fold — and Is It Worth It? →
              </Link>
            </div>

            <div className="mt-8 pt-8 border-t border-lf-border">
              <p className="text-[13px] font-bold text-dark mb-3">Areas we cover</p>
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
