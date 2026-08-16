/**
 * Landing-page and checkout content.
 * ------------------------------------------------------------------
 * Everything the marketing page renders that is not markup. Ported from
 * the design prototype's CONTENT block.
 *
 * Several of these are placeholders the prototype flagged and the backend
 * has not replaced yet — RATING, the last ten PRICING categories, and
 * HERO_SLOTS. Each is marked. They must not ship unreplaced.
 */

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
  ["How it works", "#how-it-works"],
  ["Pricing", "#pricing"],
  ["Areas we serve", "#areas"],
  ["FAQ", "#faq"],
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
    /* "Price Review" is the feature name used in the app and the FAQ —
       keeping it consistent so people recognise it later. */
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

/* Same shape as the app's pricing screen: category → garment → the
   services available for it. "wash" renders a lime dot, "dry" a grey
   one, matching the app.
   TODO: replace with the real price list from the API. */
export const WASH = "Wash & Press";
export const DRY = "Dry Clean & Press";

export type Garment = [name: string, services: [service: string, price: string][]];

export const PRICING: Record<string, Garment[]> = {
  Shirt: [
    ["Shirt", [[WASH, "£3.50"], [DRY, "£4.50"]]],
    ["T-Shirt", [[WASH, "£2.50"]]],
    ["Polo Shirt", [[WASH, "£3.00"], [DRY, "£4.00"]]],
    ["Blouse", [[WASH, "£4.00"], [DRY, "£5.00"]]],
    ["School Shirt", [[WASH, "£2.50"]]],
  ],
  Suit: [
    ["2-Piece Suit", [[DRY, "£14.00"]]],
    ["3-Piece Suit", [[DRY, "£18.00"]]],
    ["Suit Jacket", [[DRY, "£9.00"]]],
    ["Suit Trousers", [[DRY, "£6.00"]]],
  ],
  Trouser: [
    ["Trousers", [[WASH, "£5.00"], [DRY, "£6.00"]]],
    ["Jeans", [[WASH, "£5.50"]]],
    ["Shorts", [[WASH, "£3.50"], [DRY, "£4.50"]]],
    ["Skirt", [[WASH, "£5.00"], [DRY, "£6.00"]]],
  ],
  Jacket: [
    ["Bomber Jacket", [[DRY, "£8.00"]]],
    ["Leather Jacket", [[DRY, "£25.00"]]],
    ["Blazer", [[DRY, "£9.00"]]],
    ["Waistcoat", [[DRY, "£6.00"]]],
    ["Coat", [[DRY, "£15.00"]]],
    ["Trench Coat", [[DRY, "£18.00"]]],
  ],
  Dress: [
    ["Day Dress", [[WASH, "£7.00"], [DRY, "£8.00"]]],
    ["Cocktail Dress", [[DRY, "£9.00"]]],
    ["Evening Dress", [[DRY, "£12.00"]]],
    ["Wedding Dress", [[DRY, "£45.00"]]],
  ],
  /* ── PLACEHOLDER CATEGORIES ──────────────────────────────────────
     Added so the pill row overflows and the scrolling can be tested.
     Names and prices are invented — replace with the real list. */
  Knitwear: [
    ["Jumper", [[WASH, "£6.00"], [DRY, "£7.50"]]],
    ["Cardigan", [[WASH, "£6.00"], [DRY, "£7.50"]]],
    ["Scarf", [[DRY, "£5.00"]]],
    ["Gilet", [[DRY, "£8.00"]]],
  ],
  Bedding: [
    ["Double Duvet", [[WASH, "£22.00"]]],
    ["Single Duvet", [[WASH, "£18.00"]]],
    ["Duvet Cover", [[WASH, "£8.00"]]],
    ["Bed Sheet", [[WASH, "£7.00"]]],
    ["Pillow", [[WASH, "£6.00"]]],
    ["Pillowcase", [[WASH, "£2.50"]]],
  ],
  Curtains: [
    ["Curtains (per metre)", [[DRY, "£14.00"]]],
    ["Net Curtains", [[WASH, "£9.00"]]],
    ["Voile Panel", [[WASH, "£7.00"]]],
  ],
  Household: [
    ["Tablecloth", [[WASH, "£8.00"], [DRY, "£10.00"]]],
    ["Cushion Cover", [[WASH, "£4.00"]]],
    ["Throw", [[WASH, "£9.00"]]],
    ["Towel", [[WASH, "£2.50"]]],
    ["Tea Towel", [[WASH, "£1.50"]]],
  ],
  Workwear: [
    ["Tunic", [[WASH, "£4.50"]]],
    ["Overalls", [[WASH, "£9.00"]]],
    ["Chef Whites", [[WASH, "£6.50"]]],
    ["Hi-Vis Jacket", [[WASH, "£7.00"]]],
  ],
  Sportswear: [
    ["Gym Top", [[WASH, "£3.00"]]],
    ["Leggings", [[WASH, "£3.50"]]],
    ["Tracksuit", [[WASH, "£8.00"]]],
    ["Football Kit", [[WASH, "£7.50"]]],
  ],
  Kids: [
    ["Kids Jumper", [[WASH, "£4.00"]]],
    ["Kids Trousers", [[WASH, "£3.50"]]],
    ["Baby Blanket", [[WASH, "£6.00"]]],
    ["Pram Liner", [[WASH, "£7.00"]]],
  ],
  Footwear: [
    ["Trainers", [[WASH, "£15.00"]]],
    ["Boots", [[DRY, "£20.00"]]],
    ["Suede Shoes", [[DRY, "£22.00"]]],
  ],
  Leather: [
    ["Leather Coat", [[DRY, "£38.00"]]],
    ["Suede Jacket", [[DRY, "£35.00"]]],
    ["Leather Gloves", [[DRY, "£9.00"]]],
    ["Sheepskin Coat", [[DRY, "£45.00"]]],
  ],
  Rugs: [
    ["Small Rug", [[DRY, "£25.00"]]],
    ["Medium Rug", [[DRY, "£40.00"]]],
    ["Large Rug", [[DRY, "£60.00"]]],
    ["Runner", [[DRY, "£30.00"]]],
  ],
};

export const CATEGORIES = Object.keys(PRICING);

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

/* Wording is channel-neutral: "in the app" is avoided so these read
   correctly for someone who booked on the website and has no app.
   Q5 states the auto-approve fallback rather than promising an
   indefinite hold.

   Shared with the checkout's FAQ modal. Duplicating nine answers across
   two files guarantees they drift, and the two would then contradict each
   other in front of a customer. */
export const FAQ: [question: string, answer: string][] = [
  [
    "Do I need to sort or count my laundry?",
    "There is no sorting, counting, or preparation required on your end. Hand over your laundry however it is — mixed, unsorted, bagged or loose — and our team takes care of everything from there.",
  ],
  [
    "What happens after pickup?",
    "Your laundry is transported to our facility, where every item is identified, counted, and logged against your order — along with its price — before any cleaning begins. You will always have a full, itemised view of your order. If you'd like to review and approve items before payment is taken, you can enable Price Review in your preferences.",
  ],
  [
    "How do you know how to handle my items?",
    "Our team follows the care label on every individual item to determine the appropriate cleaning method. Where no label is present, our team uses their professional judgement and experience to treat the item appropriately. In addition, you can set your own preferences — such as how you'd like your shirts returned (folded or on a hanger) and whether you'd like deep stain treatment applied. These preferences are saved to your account and applied to every order.",
  ],
  [
    "How do I know what I'll be charged?",
    "Every item collected is added to your order with its individual price, based on our published price list. The full breakdown is visible before any payment is taken — there are no estimates or surprises after the fact.",
  ],
  [
    "Can I approve charges before paying?",
    "Yes. By enabling Price Review in your preferences, you will receive an email as soon as your items have been counted and added to your order — and an instant push notification too, if you have the app. You can review every item and its cost before approving payment. If we have not heard back by the time we need to begin cleaning, we will go ahead as normal so your delivery slot is not missed.",
  ],
  [
    "Any hidden costs?",
    "Collection and delivery are included in the service. You are charged only for the items we clean, at the prices listed in our price list — nothing more. There are no membership fees, minimum order requirements, or additional charges.",
  ],
  [
    "What if I need to change my delivery time?",
    "Delivery slots can be updated directly from your order at any point before it is out for delivery. Open the order, select Edit, and choose a new date and time that suits you.",
  ],
  [
    "What if an item is missing or damaged?",
    "Every item is individually logged when it arrives at our facility, so we always have a clear record of what was collected. In the rare event that something is not returned as expected, please contact us and our team will investigate and resolve the matter promptly.",
  ],
  [
    "Can I set up regular pickups?",
    "Recurring orders are available on a weekly, fortnightly, or every-four-weeks schedule. Once set up, your pickups and deliveries are handled automatically with no action required each time. You can pause or cancel your recurring schedule at any point from your account.",
  ],
];

/* First five show by default; the rest sit behind "Show more questions". */
export const FAQ_PREVIEW_COUNT = 5;

/* Where each review came from. Add "google" here when those arrive. */
export const REVIEW_SOURCES: Record<ReviewSource, { label: string }> = {
  apple: { label: "Review from the App Store" },
  play: { label: "Review from Google Play" },
};

export const FOOTER: [heading: string, links: [label: string, href: string][]][] = [
  [
    "Areas we serve",
    [
      ["Laundry service Epsom", "/laundry-service-epsom"],
      ["Laundry service Leatherhead", "/laundry-service-leatherhead"],
      ["Laundry service Ashtead", "/laundry-service-ashtead"],
      ["Laundry service Ewell", "/laundry-service-ewell"],
      ["Laundry service Fetcham", "/laundry-service-fetcham"],
    ],
  ],
  [
    "Services",
    [
      ["Collection & delivery", "/laundry-collection-delivery"],
      ["How it works", "#how-it-works"],
      ["Pricing", "#pricing"],
      ["FAQ", "#faq"],
    ],
  ],
  [
    "Legal",
    [
      ["Privacy policy", "/privacy-policy"],
      ["Terms", "/terms"],
      ["Contact", "/contact"],
      ["Request deletion", "/request-deletion"],
    ],
  ],
];
