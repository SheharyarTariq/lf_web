"use client";

import { cn } from "@/utils/cn";
import Button from "@/components/common/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import SocialLinks from "@/components/common/SocialLinks";
import StoreButtons from "@/components/common/StoreButtons";
import Wordmark from "@/components/common/Wordmark";
import AccountMenu from "@/components/layout/site-header/account-menu";
import { useAuth } from "@/components/common/AuthProvider";
import { BRAND, NAV } from "@/utils/content";
import { displayName } from "@/utils/auth";
import { btn } from "@/utils/button";
import { useEscapeKey, useScrollLock, useStartBooking } from "@/utils/hooks";
import { WRAP } from "@/utils/styles";
import { routes } from "@/utils/routes";

/** How long the drawer takes to leave. Must match the slide-out animation. */
const MENU_EXIT_MS = 200;

const NAV_LINK =
  "text-[15px] font-medium text-ink-2 no-underline whitespace-nowrap transition-colors duration-150 hover:text-ink to-1024:text-[14.5px]";

const DRAWER_ITEM =
  "text-[21px] font-bold tracking-[-.4px] no-underline py-[15px] border-b border-line last:border-b-0";

/* The signed-out control. Sized to match the account menu it swaps with —
   same 44px height — so the header does not reflow when a session lands. */
const AUTH_BTN =
  "inline-flex min-h-11 cursor-pointer items-center whitespace-nowrap border-none bg-transparent px-1 py-0 text-[15px] font-semibold text-ink no-underline hover:underline";

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  /* Two states, not one. `open` drives the animation; `mounted` keeps the
     drawer in the tree while it slides out. Unmounting on the click would
     make it disappear rather than leave. */
  const [mounted, setMounted] = useState(false);
  const burgerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const exitTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const pathname = usePathname();
  const { user, status, signOut, openAuth } = useAuth();
  const startBooking = useStartBooking(status);

  /* routes.ui.home.* are root-relative ("/#faq") so they work from anywhere.
     On the home page itself the leading slash is dropped, leaving a pure
     in-page hash — the browser scrolls and the router is never involved,
     which is what these did before and what keeps the smooth scroll.
     Everywhere else the full path goes through <Link>, so arriving at the
     section is a client-side transition rather than a document reload. */
  const onHome = pathname === "/";
  const anchor = (href: string) => (onHome && href.startsWith("/#") ? href.slice(1) : href);

  const openMenu = useCallback(() => {
    clearTimeout(exitTimer.current);
    setMounted(true);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    clearTimeout(exitTimer.current);
    exitTimer.current = setTimeout(() => setMounted(false), MENU_EXIT_MS);
  }, []);

  useEffect(() => () => clearTimeout(exitTimer.current), []);

  useScrollLock(open);
  useEscapeKey(open, close);

  /* Focus into the drawer on open and back to the burger on close, so a
     keyboard user is not dropped at the top of the document. */
  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    return () => burgerRef.current?.focus();
  }, [open]);

  return (
    <>
      <header className="lf-controls sticky top-0 z-[60] border-b border-b-line bg-white">
        <div
          className={cn(WRAP, "flex h-[72px] items-center gap-[34px] to-1024:gap-[22px] to-900:relative to-900:gap-2.5")}
        >
          {/* First in the DOM, not just first on screen. On a phone this is
              the left-hand control, and tab order should agree with what the
              eye sees. Hidden above 900px, where the nav is back and this
              does nothing. */}
          <Button variant="bare"
            ref={burgerRef}
            className="hidden h-11 w-11 items-center justify-center border-none bg-transparent p-0 -ml-2.5 cursor-pointer text-ink to-900:flex to-900:mr-auto"
            aria-expanded={open}
            aria-controls="lf-mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => (open ? close() : openMenu())}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </Button>

          {/* Below 900px the logo is taken out of flow and centred. Two equal
              side columns would have been tidier, but the sides are not
              equal — a 44px burger against Log in plus a button — so a
              1fr/auto/1fr grid lets the wider side claim the surplus and the
              logo drifts off centre by a few px at the narrow end. */}
          <Link
            href="/"
            className="inline-flex flex-none items-center whitespace-nowrap text-[20px] font-extrabold tracking-[-.5px] text-ink no-underline to-900:absolute to-900:left-1/2 to-900:top-1/2 to-900:-translate-x-1/2 to-900:-translate-y-1/2"
          >
            {/* The leaf sits above the wordmark, so centring the lockup's box
                leaves the wordmark hanging below the nav. Shift up so the two
                baselines meet:
                  nav baseline  = (72 - 15*1.6)/2 + (24 - 15*1.4)/2 + 15*1.05 = 41.25px
                  logo baseline = (72 - 34)/2 + (359/423 * 34)               = 47.85px
                Difference 6.6px. Recalculate if the header height, logo
                height or nav font size changes.

                Below 900px the logo is centred in the bar rather than
                aligned to a baseline, and the correction becomes the
                wordmark's own offset within the artwork: the letters' middle
                sits 88 of 423 user units — 20.8% of the height — below the
                box's middle. 30px * 0.208 = 6.24px. Re-derive if the asset
                changes: it is (lettersMid - boxMid) / height. */}
            <Wordmark
              className="block h-[34px] w-auto -translate-y-[6.6px] to-900:h-[30px] to-900:-translate-y-[6.24px]"
              title={BRAND.name}
            />
          </Link>

          {/* Nav links stay in the header on desktop; only tablet and phone
              collapse to the burger. */}
          <nav aria-label="Primary" className="flex gap-7 to-1024:gap-5 to-900:hidden">
            {NAV.map(([label, href]) => (
              <Link key={href} href={anchor(href)} className={NAV_LINK}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-[18px] to-900:gap-3">
            {/* Signed out is the default, not a third state. Waiting for the
                session before rendering either one drops "Log in" out of the
                server HTML entirely — no control at all without JavaScript,
                and a hole in the header on every signed-out load, which is
                most of them. Rendering it up front costs a returning customer
                one frame of "Log in" before their account replaces it. */}
            {user ? (
              /* Identity is the control and Log out lives inside it. Two
                 separate things in the bar cost more width than the header
                 has — which is why the address used to disappear below
                 1024px, leaving a "Log out" that named no account. */
              <AccountMenu user={user} onSignOut={signOut} />
            ) : (
              /* A button, not a link: it opens a dialog rather than going
                 anywhere, and a link that does not navigate breaks
                 middle-click, right-click and every assistive technology's
                 idea of what it is. */
              <Button variant="bare" onClick={() => openAuth("login")} className={AUTH_BTN}>
                Log in
              </Button>
            )}
            {/* Three things, not four, below 580px. "Get the app" leaves the
                bar on phones: with a burger and a centred logo already there
                it had to shrink to an icon, and there is no glyph for "app"
                that anyone reads at a glance. Nothing is lost — it is the
                first item in the drawer's foot and it has a full section of
                its own further down the page. 580, not 520: between the two
                the pill fits but leaves the logo only 16px of daylight,
                which reads as a collision rather than a layout. */}
            <Link
              className={btn({ variant: "ghost-shine", display: "inline-flex to-580:hidden" })}
              href={anchor(routes.ui.home.getTheApp)}
            >
              Get the app
            </Link>
          </div>
        </div>
      </header>

      {/* A drawer over the page, not a page of its own. Covering everything
          reads as a new page — you lose your place, and closing feels like
          going back rather than dismissing. A panel that slides over the
          page keeps the page there, dimmed, so it is obviously still
          underneath. */}
      {mounted && (
        <>
          <div
            className={cn("fixed inset-0 z-[200] bg-[rgba(20,20,15,.45)]", open ? "animate-fade-in" : "animate-fade-out")}
            role="presentation"
            onClick={close}
          />
          <div
            id="lf-mobile-nav"
            className={cn("lf-controls fixed bottom-0 left-0 top-0 z-[201] flex w-[min(86vw,340px)] flex-col overflow-y-auto overscroll-contain bg-white px-[22px] pb-[30px] pt-0 shadow-[0_0_60px_-12px_rgba(20,20,15,.45)]", open ? "animate-slide-in" : "animate-slide-out")}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            {/* Close on the left, matching the burger it replaces. Book now
                moves to the foot of the drawer, where it is the last thing
                read rather than something competing with the close control. */}
            <div className="-ml-2.5 flex h-[72px] flex-none items-center gap-3.5">
              <Button variant="bare"
                ref={closeRef}
                className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center py-px px-1.5 rounded-ctl-lg border-none bg-transparent text-ink transition-colors duration-150 ease-[ease] hover:bg-paper-2"
                onClick={close}
                aria-label="Close menu"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </Button>
            </div>

            {/* A notch smaller than the full-screen version was: the drawer is
                340px at most, and 26px headings in a 296px column wrap. */}
            <nav className="flex flex-1 flex-col pb-2 pt-4" aria-label="Mobile">
              {NAV.map(([label, href]) => (
                <Link key={href} href={anchor(href)} onClick={close} className={DRAWER_ITEM}>
                  {label}
                </Link>
              ))}
              {/* Log in opens a dialog, so it is a button. Log out is one for
                  the same reason — neither goes anywhere. */}
              {user ? (
                <>
                  {/* Who you are is a label, not a control: there is nothing
                      to tap it for. Smaller and lighter than the nav items so
                      it does not read as another destination, and truncated
                      because the drawer is only 340px at its widest.

                      Flat rows on purpose — the drawer already *is* the menu,
                      and nesting a dropdown inside it would add a tap for
                      nothing. The address stays in the title attribute for an
                      account whose name is showing. */}
                  <span
                    className={cn(DRAWER_ITEM, "block overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-medium tracking-normal text-ink-2")}
                    title={user.email}
                  >
                    {displayName(user)}
                  </span>
                  <Button variant="bare"
                    onClick={() => {
                      close();
                      signOut();
                    }}
                    className={cn(DRAWER_ITEM, "cursor-pointer border-l-0 border-r-0 border-t-0 bg-transparent text-left text-ink")}
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <Button variant="bare"
                  onClick={() => {
                    close();
                    openAuth("login");
                  }}
                  className={cn(DRAWER_ITEM, "cursor-pointer border-l-0 border-r-0 border-t-0 bg-transparent text-left text-ink")}
                >
                  Log in
                </Button>
              )}
            </nav>

            <Button variant="bare"
              className={btn({ block: true, className: "flex-none mt-[18px]" })}
              onClick={() => {
                close();
                startBooking();
              }}
            >
              Book now
            </Button>

            <div className="flex-none pt-[22px]">
              <p className="mb-3.5 text-[12px] font-bold uppercase tracking-[1.4px] text-ink-3">
                Download our app
              </p>
              <StoreButtons />
            </div>

            <div className="flex-none pt-[22px]">
              <p className="mb-3.5 text-[12px] font-bold uppercase tracking-[1.4px] text-ink-3">
                Follow us
              </p>
              <SocialLinks />
            </div>
          </div>
        </>
      )}
    </>
  );
}
