import SiteShell from "@/components/layout/site-shell";

/**
 * Everything reachable only from the footer: the town and service landing
 * pages, the blog, and the legal set.
 *
 * They share one property that makes the grouping worth having — none of them
 * is part of the product flow. They are crawler-facing, static, and linked
 * from the footer rather than the nav, so they can be reasoned about and
 * changed without touching the booking path.
 *
 * The legal pages (privacy policy, terms, contact, request deletion) are not
 * SEO content, but they are footer-only static pages with the same needs, so
 * they live here rather than earning a third group.
 */
export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
