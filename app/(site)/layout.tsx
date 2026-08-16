import AnnounceBar from "@/components/AnnounceBar";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

/**
 * The marketing shell: offer bar, sticky header, footer.
 *
 * A route group rather than the root layout so /book/* can opt out — the
 * checkout has its own stripped-back header and footer, and rendering both
 * sets would be two logos and two navs on one screen.
 *
 * `contents` on the wrapper means it generates no box of its own, so the
 * body's flex column still sees the bar, header, page and footer as its four
 * children. Its only job is to scope the focus ring: the auth modal is
 * rendered by AuthProvider at the root, outside this element, and in the
 * design it keeps the browser's own focus treatment rather than the site's
 * ink ring.
 *
 * Every page inside this group must supply its own <main className="flex-1">
 * or the footer floats up the screen.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lf-focus contents">
      <AnnounceBar />
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
