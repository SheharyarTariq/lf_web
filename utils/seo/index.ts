import type { FaqItem } from "@/utils/faq";

/**
 * Structured data for the home page.
 *
 * Carried over verbatim from the previous homepage rather than replaced with
 * the thinner @graph the design prototype injected at runtime. This version
 * has the GeoCircle areaServed, the offer catalogue and the opening hours,
 * and it is already indexed — a redesign is no reason to hand back ground.
 *
 * The prototype set these from a useEffect, which is too late for crawlers
 * and link previewers. Emitted server-side here.
 *
 * The FAQ entities are generated from the same questions the accordion
 * renders, so the two can never disagree. That invariant survived the move
 * to backend-owned copy, but its mechanism changed: the page makes one
 * `getFaqs()` call and hands the result to both this function and <Faq />,
 * rather than both importing one array. Google compares the schema against
 * the visible text, so the two agreeing is the whole point of fetching on
 * the server.
 */

export const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LaundryService",
  name: "Laundry Free",
  url: "https://www.laundryfree.co.uk",
  logo: "https://www.laundryfree.co.uk/footerlogo.svg",
  image: "https://www.laundryfree.co.uk/og-image.png",
  description:
    "Professional laundry collection and delivery service with free pickup and delivery in Epsom, Leatherhead, Ashtead, Ewell and Fetcham, Surrey, UK.",
  priceRange: "££",
  email: "hello@laundryfree.co.uk",
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@laundryfree.co.uk",
    contactType: "customer service",
    areaServed: "GB",
    availableLanguage: "English",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "08:00",
      closes: "20:00",
    },
  ],
  areaServed: [
    {
      "@type": "GeoCircle",
      geoMidpoint: { "@type": "GeoCoordinates", latitude: 51.336, longitude: -0.268 },
      geoRadius: "15000",
    },
    { "@type": "City", name: "Epsom", containedInPlace: { "@type": "AdministrativeArea", name: "Surrey" } },
    { "@type": "City", name: "Leatherhead", containedInPlace: { "@type": "AdministrativeArea", name: "Surrey" } },
    { "@type": "City", name: "Ashtead", containedInPlace: { "@type": "AdministrativeArea", name: "Surrey" } },
    { "@type": "City", name: "Ewell", containedInPlace: { "@type": "AdministrativeArea", name: "Surrey" } },
    { "@type": "City", name: "Fetcham", containedInPlace: { "@type": "AdministrativeArea", name: "Surrey" } },
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Laundry Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Wash & Fold Service" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Laundry Collection & Delivery" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Professional Clothes Cleaning" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Recurring Laundry Orders" } },
    ],
  },
  sameAs: [
    "https://apps.apple.com/app/id6763839907",
    "https://play.google.com/store/apps/details?id=uk.co.laundryfree.app",
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Laundry Free",
  url: "https://www.laundryfree.co.uk",
  description: "Free laundry collection and delivery service in Epsom, Leatherhead, Ashtead, Ewell and Fetcham, Surrey.",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://www.laundryfree.co.uk/?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
};

/* A function now, not a const: the questions arrive per render from
   /system-status. The answer goes in exactly as served, blank lines and all —
   it is the text on the page, which is what a crawler checks it against. */
export function faqSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}

/**
 * Serialise a schema for `dangerouslySetInnerHTML`.
 *
 * `JSON.stringify` escapes nothing that matters inside a <script> tag, and
 * the FAQ text is no longer ours — an answer containing "</script>" would
 * close the tag early and put the rest of the payload into the document as
 * markup. Escaping "<" is what Next's own JSON-LD guide prescribes
 * (node_modules/next/dist/docs/01-app/02-guides/json-ld.md). A JSON parser
 * reads the escape back as "<", so the structured data itself is unchanged.
 *
 * Used for all three schemas, not just the FAQ one. Two spellings of the same
 * thing on one page is how the unescaped one survives a later edit.
 */
export function jsonLd(schema: unknown): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
