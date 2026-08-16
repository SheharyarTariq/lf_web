"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthProvider";
import { Footer, Header, Steps } from "@/components/booking/chrome";
import { BillingModal, ExitConfirm, FaqModal, LoginSheet } from "@/components/booking/overlays";
import { BookingContext, type BookingContextValue } from "@/utils/booking/context";
import SummaryPanel from "@/components/booking/summary-panel";
import { furthestAllowed, isRoute, routesFor, stepOf, type Route } from "@/utils/booking/flow";
import { accountExists, makeReference } from "@/utils/booking/mocks";
import { DISCOUNT, EMPTY, type BookingData, type BookingPatch } from "@/utils/booking/model";
import { INHERIT_FONT } from "@/utils/booking/styles";
import { useWide } from "@/utils/hooks";

/**
 * Everything the six screens share: the data, the router, the overlays and
 * the two layouts.
 *
 * Wide (>=1024px) drops the Review screen and pins a summary beside the form
 * instead; narrow keeps Review, because there is nowhere on a phone to put a
 * running summary. `useWide` is false on the server and on the first client
 * render, so the narrow route set is the one the markup is built from and
 * hydration cannot mismatch.
 */
export default function BookingShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const wide = useWide();
  const { user, openAuth } = useAuth();

  const [data, setData] = useState<BookingData>(EMPTY);
  const [exiting, setExiting] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [loginFor, setLoginFor] = useState<string | null>(null);
  const [reference, setReference] = useState("");

  const segment = pathname.split("/").filter(Boolean)[1] ?? "address";
  const step: Route = isRoute(segment) ? segment : "address";

  const patch = useCallback((next: BookingPatch) => {
    setData((d) => ({ ...d, ...next }));
  }, []);

  const go = useCallback(
    (next: Route) => {
      router.push(`/book/${next}`);
    },
    [router],
  );

  /* A bookmarked /book/review renders a summary of empty strings, so the
     guard sends anyone past their filled-in state back to where they stopped.
     Confirmed is exempt: once an order exists the data is deliberately no
     longer what gates the screen. */
  useEffect(() => {
    if (step === "confirmed") return;
    const allowed = furthestAllowed(data);
    const routes = routesFor(wide);
    const here = routes.indexOf(step);
    const limit = routes.indexOf(allowed);
    if (here < 0) {
      router.replace("/book/address");
    } else if (limit >= 0 && here > limit) {
      router.replace(`/book/${allowed}`);
    }
  }, [step, data, wide, router]);

  /* Widening the window while on Review has nowhere to land — that screen
     does not exist in the wide flow — so slide forward to Payment, which is
     what Review was about to do anyway. replace(), not push(), so Back does
     not return to a screen that is no longer in the set. */
  useEffect(() => {
    if (wide && step === "review") router.replace("/book/payment");
  }, [wide, step, router]);

  /* Two edges worth tracking: whether anything has scrolled under the header,
     and whether anything is still hidden below the action bar. Each earns a
     shadow, and only while it is true. */
  const [scrolled, setScrolled] = useState(false);
  const [moreBelow, setMoreBelow] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      setScrolled(window.scrollY > 2);
      const doc = document.documentElement;
      setMoreBelow(doc.scrollHeight - window.innerHeight - window.scrollY > 2);
    };
    measure();
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    const ro =
      typeof ResizeObserver !== "undefined" && bodyRef.current
        ? new ResizeObserver(measure)
        : null;
    if (ro && bodyRef.current) ro.observe(bodyRef.current);
    return () => {
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
    };
  }, [step]);

  /* Every screen focuses its own heading and returns to the top, so a step
     change reads as a new page to a screen reader rather than as a silent
     swap of the middle of one. */
  useEffect(() => {
    window.scrollTo(0, 0);
    const h1 = document.querySelector<HTMLElement>("main h1");
    h1?.focus();
  }, [step]);

  const dirty = useMemo(
    () => Boolean(data.postcode || data.line1 || data.email || data.fullName),
    [data],
  );

  const back = useCallback(() => {
    const routes = routesFor(wide);
    const here = routes.indexOf(step);
    if (here <= 0) {
      if (dirty) setExiting(true);
      else router.push("/");
      return;
    }
    router.push(`/book/${routes[here - 1]}`);
  }, [wide, step, dirty, router]);

  const confirmOrder = useCallback(() => {
    setReference(makeReference());
    router.push("/book/confirmed");
  }, [router]);

  const value = useMemo<BookingContextValue>(
    () => ({
      data,
      patch,
      step,
      go,
      back,
      wide,
      moreBelow,
      discount: DISCOUNT,
      reference,
      /* Whether the confirmation offers to keep the account it just made.
         Asked of the address, not of how they signed in: someone who
         verified a code on an address that already had an account does not
         need a password set, and someone who came in through Apple or
         Google is new to us unless the address is one we know. */
      isNewAccount: !user && !accountExists(data.email),
      confirmOrder,
      requestExit: () => (dirty ? setExiting(true) : router.push("/")),
      openLogin: (prefill?: string) => setLoginFor(prefill ?? data.email ?? ""),
      openBilling: () => setBillingOpen(true),
    }),
    [data, patch, step, go, back, wide, moreBelow, reference, user, confirmOrder, dirty, router],
  );

  const showChrome = step !== "confirmed";
  /* Nothing until there is an address. An empty card is a promise of content
     rather than content, and reserving the column for it leaves the form
     pinned left against 360px of nothing on the one screen where there is
     least to look at. The shift when it appears costs nothing: choosing an
     address swaps the whole screen, so there is no stable thing for the eye
     to lose. */
  const split = wide && showChrome && Boolean(data.line1);

  return (
    <BookingContext.Provider value={value}>
      {/* lf-controls restores the UA font metrics Preflight overrides on form
          controls; lf-book carries the three things the design put on its own
          root and no utility can express — the checkout's focus ring,
          max-width on svg, and the 64px header offset for anchors. Both are
          in globals.css. Without lf-controls every button in here is a few
          pixels taller than the design. */}
      {/* INHERIT_FONT is the checkout's own base — 16px/1.6, stepping to
          15.5 at 720. It has to be said here: the site's body rule drops to
          15.5px from 1180 down, which is right for a page whose column is
          shrinking with the window and wrong for a checkout whose column is
          capped at 620 the whole way. Without it every inherited size
          between 721 and 1180 came out half a pixel small. */}
      <div
        className={`lf-controls lf-book ${INHERIT_FONT} flex min-h-screen flex-1 flex-col bg-bk-paper text-bk-ink`}
      >
        <Header
          onBack={back}
          /* Back is on every screen but the confirmation, including the
             first: there it walks out of the flow, which is exactly what
             the arrow means everywhere else. */
          canGoBack={step !== "confirmed"}
          onClose={() => (dirty ? setExiting(true) : router.push("/"))}
          onFaq={() => setFaqOpen(true)}
          /* Nothing to log in for once the order exists — the screen
             underneath is already the account's. */
          onLogin={user || step === "confirmed" ? null : () => openAuth("login")}
          user={user ? { email: user.email } : null}
          scrolled={scrolled}
        >
          {showChrome && (
            <Steps
              current={stepOf(step, wide)}
              allowed={furthestAllowed(data)}
              onGo={go}
              wide={wide}
            />
          )}
        </Header>

        {/* Column flex so the action bar can be pushed to the foot of a short
            screen with margin-top:auto. On a tall screen there is no free
            space and the auto margin does nothing, so the bar simply follows
            the content and sticks.

            From 1024 the same element becomes the two-column row.
            `items-stretch` is load-bearing: `items-start` collapses the form
            column to its own content height, which kills the margin-top:auto
            on the action bar — on a short screen like Address the bar stops
            halfway up the page with its shadow across the middle of nothing.
            The panel opts out with self-start, because a stretched item
            cannot stick.

            Two max-widths on purpose: exactly the two columns and their
            gutters when the panel is there, so the auto margins leave the
            same space either side; the page width when it is not. */}
        <main
          ref={bodyRef}
          className={
            "mx-auto flex w-full max-w-[var(--bk-col)] flex-auto flex-col px-5 pb-0 pt-7 " +
            "to-720:pt-3.5 to-400:px-4 " +
            "from-1024:flex-row from-1024:items-stretch from-1024:gap-8 from-1024:px-6 " +
            (split
              ? "from-1024:max-w-[calc(620px+32px+328px+48px)]"
              : "from-1024:max-w-wrap")
          }
        >
          {/* The screens still own the column, so every existing rule — the
              sticky action bar, margin-top:auto, the full-bleed ::before —
              keeps working whether or not there is a panel beside it. */}
          <div
            className={
              "flex min-w-0 flex-auto flex-col from-1024:max-w-[var(--bk-col)]" +
              (split ? "" : " from-1024:mx-auto from-1024:w-full")
            }
          >
            {children}
          </div>
          {split && <SummaryPanel />}
        </main>

        <Footer />
      </div>

      {exiting && (
        <ExitConfirm onStay={() => setExiting(false)} onLeave={() => router.push("/")} />
      )}
      {faqOpen && <FaqModal onClose={() => setFaqOpen(false)} />}
      {billingOpen && <BillingModal onClose={() => setBillingOpen(false)} />}
      {loginFor !== null && (
        <LoginSheet
          email={loginFor}
          onClose={() => setLoginFor(null)}
          onLoggedIn={(who) => {
            patch({
              identity: who.identity,
              email: who.email,
              fullName: who.fullName || data.fullName,
              verified: true,
            });
            setLoginFor(null);
          }}
        />
      )}
    </BookingContext.Provider>
  );
}
