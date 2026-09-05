import { apiRequest } from "@/utils/api-request";
import { routes } from "@/utils/routes";
import { parseFaqs, type FaqItem } from "@/utils/faq";

/**
 * The questions, read from the backend at render time.
 *
 * `/system-status` grew a `faqs` array, so the nine answers the site used to
 * carry in utils/content are now the backend's to write. Fetched on the
 * server rather than in the browser for one reason: the FAQPage JSON-LD in
 * utils/seo has to carry the same text as the visible accordion, and a
 * client fetch would leave the schema describing content no crawler can see
 * in the served HTML.
 *
 * Server-only, because apiRequest imports next/headers — importing this from
 * a client component is a build error. Client components take the result as
 * a prop and get the shared helpers from @/utils/faq, which is isomorphic.
 */

/* An hour. The copy changes rarely and a stale answer is harmless, so this
   is long enough to keep the homepage a CDN document rather than a request
   that waits on the laundry API, and short enough that a wording fix lands
   without a redeploy. `revalidatePath("/")` is the escape hatch if one ever
   has to land immediately. */
export const FAQ_REVALIDATE_SECONDS = 3600;

/**
 * The copy as the site shipped it before the backend owned it.
 *
 * A safety net, not a second source of truth: it is used only when the
 * payload carries no usable `faqs`, which today is every request against
 * production — api.laundryfree.co.uk still answers without the field. The
 * homepage FAQ section and its rich result would otherwise disappear from
 * the live site the moment this deploys.
 *
 * Delete it once production serves `faqs`. Note the wording differs from the
 * backend's on purpose — it was written channel-neutral, avoiding "in the
 * app" for someone who booked on the website — so while both exist the site
 * can say either, depending on whether the fetch landed.
 */
const FAQ_FALLBACK: FaqItem[] = [
  {
    question: "Do I need to sort or count my laundry?",
    answer:
      "There is no sorting, counting, or preparation required on your end. Hand over your laundry however it is — mixed, unsorted, bagged or loose — and our team takes care of everything from there.",
  },
  {
    question: "What happens after pickup?",
    answer:
      "Your laundry is transported to our facility, where every item is identified, counted, and logged against your order — along with its price — before any cleaning begins. You will always have a full, itemised view of your order. If you'd like to review and approve items before payment is taken, you can enable Price Review in your preferences.",
  },
  {
    question: "How do you know how to handle my items?",
    answer:
      "Our team follows the care label on every individual item to determine the appropriate cleaning method. Where no label is present, our team uses their professional judgement and experience to treat the item appropriately. In addition, you can set your own preferences — such as how you'd like your shirts returned (folded or on a hanger) and whether you'd like deep stain treatment applied. These preferences are saved to your account and applied to every order.",
  },
  {
    question: "How do I know what I'll be charged?",
    answer:
      "Every item collected is added to your order with its individual price, based on our published price list. The full breakdown is visible before any payment is taken — there are no estimates or surprises after the fact.",
  },
  {
    question: "Can I approve charges before paying?",
    answer:
      "Yes. By enabling Price Review in your preferences, you will receive an email as soon as your items have been counted and added to your order — and an instant push notification too, if you have the app. You can review every item and its cost before approving payment. If we have not heard back by the time we need to begin cleaning, we will go ahead as normal so your delivery slot is not missed.",
  },
  {
    question: "Any hidden costs?",
    answer:
      "Collection and delivery are included in the service. You are charged only for the items we clean, at the prices listed in our price list — nothing more. There are no membership fees, minimum order requirements, or additional charges.",
  },
  {
    question: "What if I need to change my delivery time?",
    answer:
      "Delivery slots can be updated directly from your order at any point before it is out for delivery. Open the order, select Edit, and choose a new date and time that suits you.",
  },
  {
    question: "What if an item is missing or damaged?",
    answer:
      "Every item is individually logged when it arrives at our facility, so we always have a clear record of what was collected. In the rare event that something is not returned as expected, please contact us and our team will investigate and resolve the matter promptly.",
  },
  {
    question: "Can I set up regular pickups?",
    answer:
      "Recurring orders are available on a weekly, fortnightly, or every-four-weeks schedule. Once set up, your pickups and deliveries are handled automatically with no action required each time. You can pause or cancel your recurring schedule at any point from your account.",
  },
];

/**
 * Never throws, and never returns an empty array.
 *
 * Both matter more than they look. This runs during the prerender of the
 * homepage and the checkout shell, so an exception here is a failed
 * `next build` — the site would stop deploying because the laundry API had a
 * bad minute. And an empty list would emit an `FAQPage` with no questions,
 * which is invalid structured data and worse than none.
 *
 * Two things must not be added to this call: `isProtected` reads cookies and
 * `cache: "no-store"` opts out of the cache, and either would turn the
 * indexed homepage into a per-request render with this fetch in the critical
 * path of every visit.
 */
export async function getFaqs(): Promise<FaqItem[]> {
  try {
    const body = await apiRequest({
      endpoint: routes.api.systemStatus,
      /* The endpoint speaks both, and plain JSON is the shape parseFaqs
         expects — ld+json only wraps it in @context/@id/@type. */
      headers: { Accept: "application/json" },
      next: { revalidate: FAQ_REVALIDATE_SECONDS },
    });

    const faqs = parseFaqs((body as { faqs?: unknown } | null)?.faqs);
    return faqs.length > 0 ? faqs : FAQ_FALLBACK;
  } catch {
    return FAQ_FALLBACK;
  }
}
