import AnnounceBar from "@/components/layout/announce-bar";
import SiteHeader from "@/components/layout/site-header";
import SiteFooter from "@/components/layout/site-footer";

/**
 * The marketing shell: offer bar, sticky header, footer.
 *
 * Lives in a component rather than in a layout because two route groups need
 * it — (main) and (seo) — and copying the markup into both is how the two
 * quietly drift apart. Each group's layout.tsx is one line that delegates here.
 *
 * The groups exist so /book/* can opt out: the checkout brings its own
 * stripped-back header and footer, and the root layout always renders, so a
 * group is the only way to give one subtree a shell and not another.
 *
 * `contents` on the wrapper means it generates no box of its own, so the
 * body's flex column still sees the bar, header, page and footer as its four
 * children. Its only job is to scope the focus ring: the auth modal is
 * rendered by AuthProvider at the root, outside this element, and in the
 * design it keeps the browser's own focus treatment rather than the site's
 * ink ring.
 *
 * Every page inside either group must supply its own <main className="flex-1">
 * or the footer floats up the screen.
 */
export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="lf-focus contents">
      <AnnounceBar />
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}
