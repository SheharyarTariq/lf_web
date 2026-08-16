import Link from "next/link";
import SocialLinks from "@/components/SocialLinks";
import Wordmark from "@/components/Wordmark";
import { BRAND, FOOTER } from "@/lib/content";
import { WRAP } from "@/lib/styles";

/**
 * Site footer. Ported 1:1 from the design — three link columns beside the
 * lockup.
 *
 * Note this drops four links the old footer carried: Laundry service
 * Surrey, Wash & fold service, and the three blog/guide links. Those pages
 * still exist and are still in sitemap.ts; they no longer have an internal
 * link from every page. That was an explicit call to match the design
 * exactly — revisit if their rankings move.
 *
 * Hash links (#how-it-works, #pricing, #faq) are plain anchors, not
 * next/link, because from a legacy page they need a real navigation to "/"
 * before the browser can find the target.
 */
export default function SiteFooter() {
  return (
    <footer className="lf-controls on-dark bg-ink pt-14 text-[14.5px] text-on-dark-2">
      <div className={WRAP}>
        <div className="grid grid-cols-[1.5fr_repeat(3,1fr)] gap-9 pb-11 to-1024:grid-cols-[1fr_1fr] to-720:grid-cols-[1fr] to-720:gap-[30px]">
          <div>
            {/* inline-block, not the header's inline-flex: `.lf-foot .lf-wm`
                outranked `.lf-wm--img` in the source and won. */}
            <span className="mb-3 inline-block flex-none items-center whitespace-nowrap text-[21px] font-extrabold tracking-[-.5px] text-white">
              <Wordmark className="block h-9 w-auto" title={BRAND.name} />
            </span>
            <p className="mb-2 text-[17px] font-extrabold tracking-[-.3px] text-brand">
              {BRAND.slogan}
            </p>
            <p className="max-w-[250px] leading-[1.6]">
              Free laundry collection and delivery across Surrey. Book online in under two minutes.
            </p>
            <SocialLinks variant="dark" className="[&_li]:mb-2.5" />
          </div>

          {FOOTER.map(([heading, links]) => {
            const id = `lf-ft-${heading.replace(/\s+/g, "")}`;
            return (
              <nav key={heading} aria-labelledby={id}>
                <h2
                  id={id}
                  className="mb-3.5 text-[12px] font-bold uppercase tracking-[1.5px] text-ink-3"
                >
                  {heading}
                </h2>
                <ul>
                  {links.map(([label, href]) => (
                    <li key={label} className="mb-2.5">
                      {href.startsWith("#") ? (
                        <a
                          href={`/${href}`}
                          className="no-underline transition-colors duration-150 hover:text-brand"
                        >
                          {label}
                        </a>
                      ) : (
                        <Link
                          href={href}
                          className="no-underline transition-colors duration-150 hover:text-brand"
                        >
                          {label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-between gap-3.5 border-t border-line-dark py-5 text-[13.5px] text-ink-3 to-720:flex-col">
          <span>
            © {new Date().getFullYear()} {BRAND.legal} · Epsom · Leatherhead · Ashtead · Ewell ·
            Fetcham
          </span>
          <a
            href={`mailto:${BRAND.email}`}
            className="no-underline transition-colors duration-150 hover:text-brand"
          >
            {BRAND.email}
          </a>
        </div>
      </div>
    </footer>
  );
}
