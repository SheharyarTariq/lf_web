import Areas from "@/components/landing/Areas";
import Cta from "@/components/landing/Cta";
import Faq from "@/components/landing/Faq";
import GetTheApp from "@/components/landing/GetTheApp";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import Reviews from "@/components/landing/Reviews";
import StatStrip from "@/components/landing/StatStrip";
import { faqSchema, localBusinessSchema, websiteSchema } from "@/lib/seo";

/**
 * The landing page.
 *
 * No `metadata` export: the root layout's default title and description are
 * the ones this page has been indexed under, and they are tuned for the local
 * search terms the business ranks on. The design prototype carried its own
 * title ("Laundry and dry cleaning in Surrey | Free collection and delivery")
 * but set it from a useEffect, so it never reached a crawler and nothing
 * depends on it. Changing the served title is an SEO decision, not a design
 * one — deliberately left alone.
 */
export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <a
        className="absolute left-3 top-[-56px] z-[99] rounded-pill bg-brand px-5 py-3 font-bold text-ink no-underline transition-[top] duration-150 focus:top-3"
        href="#lf-main"
      >
        Skip to content
      </a>

      <main id="lf-main" className="lf-controls flex-1">
        <Hero />
        <StatStrip />
        <HowItWorks />
        <Pricing />
        <Areas />
        <Reviews />
        <Faq />
        <GetTheApp />
        <Cta />
      </main>
    </>
  );
}
