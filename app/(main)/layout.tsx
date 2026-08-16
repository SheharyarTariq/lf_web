import SiteShell from "@/components/layout/site-shell";

/**
 * The product side of the site: the landing page, plus the routes the native
 * app deep-links into (verify-email, reset-password, payment-callback,
 * payment-methods/add, orders/:id).
 *
 * verify-email is a real page now — it confirms the address and signs you in,
 * and it sits here so the header and footer are there for the "Continue" that
 * follows. The other four are still stubs that ask you to open the app;
 * reset-password becomes real once password reset is wired, which is why they
 * sit here rather than with the SEO content.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
