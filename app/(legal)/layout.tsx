import SiteShell from "@/components/layout/site-shell";

/**
 * Required documents and the support route: terms, privacy policy, contact,
 * request deletion.
 *
 * Separate from (seo) because these are not content that exists to be found.
 * Terms and the privacy policy are referenced from six product surfaces — the
 * checkout footer, the login sheet's consent line, the payment screen, the
 * identity panel, the sign-up consent and the site footer — and are legally
 * load-bearing at the moment someone signs up or pays. Request deletion is an
 * app-store compliance page and contact is how people reach a human.
 *
 * They are still crawlable and still in the sitemap; being findable just is
 * not the reason they exist.
 */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
