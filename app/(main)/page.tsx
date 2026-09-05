import Areas from "@/components/landing/areas";
import Cta from "@/components/landing/cta";
import Faq from "@/components/landing/faq";
import GetTheApp from "@/components/landing/get-the-app";
import Hero from "@/components/landing/hero";
import HowItWorks from "@/components/landing/how-it-works";
import Pricing from "@/components/landing/pricing";
import Reviews from "@/components/landing/reviews";
import StatStrip from "@/components/landing/stat-strip";
import { faqSchema, jsonLd, localBusinessSchema, websiteSchema } from "@/utils/seo";
import { getFaqs } from "@/utils/faq/api";

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
 *
 * Async since the FAQs moved to /system-status. This is still a prerendered
 * page, now revalidating on the interval in utils/faq/api.ts rather than
 * being baked at build — see the note there on what would turn it into a
 * per-request render instead.
 */
export default async function Home() {
  /* One call, two consumers: the accordion below and the FAQPage schema.
     They have to carry the same text — see utils/seo. */
  const faqs = await getFaqs();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema) }}
      />
      {/* An FAQPage with an empty mainEntity is invalid structured data, and
          worse than not claiming to have questions at all. */}
      {faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema(faqs)) }}
        />
      )}

      <main id="lf-main" className="lf-controls flex-1">
        <Hero />
        <StatStrip />
        <HowItWorks />
        <Pricing />
        <Areas />
        <Reviews />
        <Faq faqs={faqs} />
        <GetTheApp />
        <Cta />
      </main>
    </>
  );
}
