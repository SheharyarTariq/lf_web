/**
 * Landing-page and checkout content.
 * ------------------------------------------------------------------
 * Everything the marketing page renders that is not markup. Ported from
 * the design prototype's CONTENT block.
 *
 * Several of these are placeholders the prototype flagged and the backend
 * has not replaced yet — RATING and HERO_SLOTS. Each is marked. They must not
 * ship unreplaced.
 *
 * The price list used to be here too, and is not any more: it comes from
 * `GET /price-combined` through utils/pricing. Nothing in this file carries a
 * money figure.
 */

import { routes } from "@/utils/routes";

/* Served from public/assets. Change these lines if the assets move. */
export const ASSETS = {
  leafMark: "/assets/leaf-mark.png",
  appIcon: "/assets/icon-512.png",
  /* TODO: confirm this QR still resolves to the current store links. */
  appQr: "/assets/app-qr.png",
  appPhone: "/assets/app-phone.jpg",
  appPhoneSmall: "/assets/app-phone@600.jpg",
  heroAfter: "/assets/hero-doorstep.jpg",
  heroAfterSmall: "/assets/hero-doorstep@800.jpg",
  heroBefore: "/assets/hero-before.jpg",
  heroBeforeSmall: "/assets/hero-before@800.jpg",
} as const;

/* PLACEHOLDER — replace with the real combined rating before launch.
   This is the only fabricated figure on the page. */
export const RATING = { score: 4.9, count: 63 } as const;

export const BRAND = {
  name: "LaundryFree",
  /* The spaced form, for prose that has to name the company rather than
     render the wordmark — the payment mandate, and the metadata in
     app/layout.tsx that already inlines it. `name` above is solid because
     that is how the logo is drawn; a mandate written that way reads as a
     brand asset dropped into a sentence rather than as a company. */
  trading: "Laundry Free",
  legal: "HQR LTD",
  email: "hello@laundryfree.co.uk",
  ios: "https://apps.apple.com/gb/app/laundryfree-dry-cleaners/id6763839907",
  android: "https://play.google.com/store/apps/details?id=uk.co.laundryfree.app",
  offer: "25% off your first order",
  /* Hyphenated in prose, solid in the wordmark — the hyphen makes it read
     as a state ("laundry-free"), which is the whole point of the line. */
  slogan: "Live laundry-free.",
} as const;

/* A null href means the account does not exist yet: the icon still renders
   so the row reads as a set, but it is inert and not announced, because a
   link that goes nowhere is worse than no link. Add the URL to switch it
   back on — no other change needed. */
export const SOCIALS: { name: "Facebook" | "Instagram"; href: string | null }[] = [
  { name: "Facebook", href: null },
  { name: "Instagram", href: "https://www.instagram.com/laundryfree.co.uk" },
];

export const NAV: [label: string, href: string][] = [
  ["How it works", routes.ui.home.howItWorks],
  ["Pricing", routes.ui.home.pricing],
  ["Areas we serve", routes.ui.home.areas],
  ["FAQ", routes.ui.home.faq],
];

/* PLACEHOLDER — static until a slot-capacity endpoint exists. The key is
   passed through to the booking flow so the chosen slot can be preselected
   on /book/time. */
export const HERO_SLOTS = [
  { key: "earliest", label: "Earliest", time: "Tomorrow · 08:00–10:00" },
  { key: "latest", label: "Latest", time: "Tomorrow · 18:00–20:00" },
] as const;

/* Towns cycled in the slot-box label. */
export const TOWNS = ["Epsom", "Ewell", "Ashtead", "Leatherhead", "Fetcham"];

/* Typewriter timings. Deleting is faster than typing — that is how real
   backspacing feels, and an even speed both ways reads as sluggish. */
export const TYPE_SPEED = 43; // ms per character typed
export const DELETE_SPEED = 23; // ms per character removed
export const HOLD_FULL = 1800; // pause on the complete word
export const HOLD_EMPTY = 300; // beat before the next word starts

export const STATS: [value: string, label: string][] = [
  ["£0", "collection & delivery"],
  ["48h", "typical turnaround"],
  ["Every item", "priced from a published list"],
  /* Five towns, six postcode rows — Epsom spans KT18 and KT19. Count towns,
     not rows, or the two disagree. */
  ["5", "Surrey towns covered"],
];

export type StepIconName = "bag" | "list" | "check" | "van";

/* Titles kept short so each fits on one line in a four-across grid —
   roughly 18 characters at the card's ~200px of inner width. */
export const STEPS: {
  title: string;
  body: string;
  icon: StepIconName;
  note?: string;
}[] = [
  {
    title: "Book & bag",
    body: "Pick a slot and bag your laundry as it comes. No sorting, no counting.",
    icon: "bag",
  },
  {
    title: "We collect & count",
    body: "Every piece is logged against your order, and priced from our published list.",
    icon: "list",
  },
  {
    /* "Price Review" is the name this site has always used, and the rest of
       it still does — the checkout, the confirmation screen and the service
       pages all say it. The FAQ no longer agrees: the backend copy now
       served at /system-status calls the same feature "Hold order for my
       approval". Left as it is deliberately; reconciling the two names is a
       copy decision for the backend, not something to fix in one file. */
    title: "You approve & pay",
    note: "optional",
    /* Deliberately says we notify you, not that we hold indefinitely —
       orders auto-approve if the customer does not respond in time. */
    body: "Switch on Price Review and we will notify you once your items are ready to review.",
    icon: "check",
  },
  {
    title: "Delivered free",
    /* Deliberately avoids "folded" — dry cleaning comes back on hangers. */
    body: "Relax while we clean your items and return them fresh to your door.",
    icon: "van",
  },
];

export type TrustIconName = "van" | "tag" | "list";

/* The middle one is the difference worth shouting about — Laundryheap and
   most competitors add a service fee on top of the item prices. */
export const PANEL_TRUST: { label: string; icon: TrustIconName }[] = [
  { label: "Free collection and delivery", icon: "van" },
  { label: "No service fees, ever", icon: "tag" },
  { label: "Every item priced upfront", icon: "list" },
];

/* Call-outs under the price list. "No service fees" matches the wording in
   the how-it-works trust strip so the same promise reads identically. */
export const PRICE_NOTES = [
  "Free collection and delivery",
  "No service fees",
  "No hidden charges",
];

export const AREAS: [postcode: string, town: string, href: string][] = [
  ["KT17", "Ewell", "/laundry-service-ewell"],
  ["KT18", "Epsom", "/laundry-service-epsom"],
  ["KT19", "Epsom", "/laundry-service-epsom"],
  ["KT21", "Ashtead", "/laundry-service-ashtead"],
  ["KT22", "Leatherhead", "/laundry-service-leatherhead"],
  ["KT22", "Fetcham", "/laundry-service-fetcham"],
];

export type ReviewSource = "apple" | "play";

/* Real App Store reviews, transcribed verbatim. Do not edit the wording —
   altering a published review misrepresents it. */
export const REVIEWS: {
  title: string;
  body: string;
  author: string;
  date: string;
  source: ReviewSource;
}[] = [
  {
    title: "Outstanding Laundry service!",
    body: "Very easy to navigate, Was a quick and simple process. Really recommend!",
    author: "Shab.m11",
    date: "8 Jul",
    source: "apple",
  },
  {
    title: "Hassle-Free Service",
    body: "Really easy to use. Booking was quick, the app was straightforward to navigate, and everything worked as expected. Made the whole process simple.",
    author: "Nav_K839",
    date: "6 Jul",
    source: "apple",
  },
  {
    title: "Does exactly what I need",
    body: "Straightforward to use, no faff. I book, they collect, it comes back done. Genuinely saves me time every week.",
    author: "_zaiby",
    date: "1 Aug",
    source: "apple",
  },
];

/* The FAQs used to live here. They are the backend's now — `/system-status`
   serves them — so both the landing accordion and the checkout modal read
   them from utils/faq, which also keeps the last version of this copy as a
   fallback. */

/* Where each review came from. Add "google" here when those arrive. */
export const REVIEW_SOURCES: Record<ReviewSource, { label: string }> = {
  apple: { label: "Review from the App Store" },
  play: { label: "Review from Google Play" },
};

export const FOOTER: [heading: string, links: [label: string, href: string][]][] = [
  [
    "Areas we serve",
    [
      ["Laundry service Epsom", routes.ui.laundryService("epsom")],
      ["Laundry service Leatherhead", routes.ui.laundryService("leatherhead")],
      ["Laundry service Ashtead", routes.ui.laundryService("ashtead")],
      ["Laundry service Ewell", routes.ui.laundryService("ewell")],
      ["Laundry service Fetcham", routes.ui.laundryService("fetcham")],
    ],
  ],
  [
    "Services",
    [
      ["Collection & delivery", routes.ui.laundryCollectionDelivery],
      ["How it works", routes.ui.home.howItWorks],
      ["Pricing", routes.ui.home.pricing],
      ["FAQ", routes.ui.home.faq],
    ],
  ],
  [
    "Legal",
    [
      ["Privacy policy", routes.ui.privacyPolicy],
      ["Terms", routes.ui.terms],
      ["Contact", routes.ui.contact],
      ["Request deletion", routes.ui.requestDeletion],
    ],
  ],
];
