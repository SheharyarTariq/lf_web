import SiteShell from "@/components/layout/site-shell";

/**
 * The product side of the site: the landing page, plus the routes the native
 * app deep-links into (verify-email, reset-password, payment-callback,
 * payment-methods/add, orders/:id).
 *
 * Those five render the marketing shell today because they are stubs that ask
 * you to open the app. Two of them — verify-email and reset-password — become
 * real pages once email verification and password reset are wired, which is
 * why they sit here rather than with the SEO content.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
