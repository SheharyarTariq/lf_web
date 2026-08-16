import { FAQ } from "@/utils/content";

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
 * The FAQ entities are generated from the same FAQ array the accordion
 * renders, so the two can never disagree.
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

export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(([q, a]) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};
