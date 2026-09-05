import type { Metadata } from "next";
import BookingShell from "@/components/booking/booking-shell";
import { getFaqs } from "@/utils/faq/api";

/* Checkout steps are a private, half-filled form — there is nothing here for
   a crawler, and /book/review would otherwise invite indexing of a page that
   only makes sense mid-flow. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * The checkout shell.
 *
 * Deliberately outside the (site) route group: that group renders the offer
 * bar, the marketing header and the big footer, and the checkout brings its
 * own stripped-back versions. Showing both would be two logos and two navs on
 * one screen.
 *
 * The booking state lives here rather than in the page because the App Router
 * unmounts the page on every navigation — holding it a level down would empty
 * the address the moment someone pressed Continue.
 *
 * The FAQs the checkout's modal shows are fetched here rather than by the
 * modal itself. It is the same cached `/system-status` read the homepage
 * makes, so it costs this prerendered layout nothing, and it means the modal
 * opens with its answers already in it — no spinner, and no flash of the
 * fallback copy being replaced by the backend's a moment later.
 */
export default async function BookLayout({ children }: { children: React.ReactNode }) {
  const faqs = await getFaqs();
  return <BookingShell faqs={faqs}>{children}</BookingShell>;
}
