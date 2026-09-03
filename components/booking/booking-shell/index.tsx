"use client";

import { cn } from "@/utils/cn";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthProvider";
import { Footer, Header, Steps } from "@/components/booking/chrome";
import { BillingModal, ExitConfirm, FaqModal, LoginSheet } from "@/components/booking/overlays";
import { BookingContext, type BookingContextValue } from "@/utils/booking/context";
import SummaryPanel from "@/components/booking/summary-panel";
import Loader from "@/components/common/Loader";
import {
  furthestAllowed,
  isRoute,
  nextAfter,
  routesFor,
  stepOf,
  type Flow,
  type Route,
} from "@/utils/booking/flow";
import { createOrder, updateAddress } from "@/utils/booking/api";
import { toNationalUk } from "@/utils/api";
import { UK_MOBILE_RE, isValidName } from "@/utils/auth/model";
import { EMPTY, type BookingData, type BookingPatch, type Leg } from "@/utils/booking/model";
import type { MyStatus } from "@/utils/auth";
import { INHERIT_FONT } from "@/utils/booking/styles";
import { useOfferDiscount, useWide } from "@/utils/hooks";

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
/**
 * What a signed-in account already tells us about the booking.
 *
 * The address is only taken when nothing has been chosen yet — somebody who
 * has picked one this session must not have it swapped underneath them — and
 * never when the server says `isActive: false`, which would walk them into a
 * collection we cannot make.
 *
 * The contact fields are taken unconditionally, because the account is the
 * authority on who the order is for.
 */
function seedFromStatus(status: MyStatus, current: BookingData): BookingPatch {
  const who = status.user;
  const next: BookingPatch = {
    fullName: who?.name || current.fullName,
    /* E.164 from the server, national for the field — <PhoneInput> supplies the
       +44 itself, and a value arriving with one already on it is how a valid
       number ends up sent as +4444…. */
    mobile: toNationalUk(who?.phone) || current.mobile,
    email: who?.email || current.email,
    /* No code to enter: this session exists because the address was proved. */
    verified: true,
  };

  const address = status.address;
  if (address?.line1 && address.isActive !== false && !current.line1) {
    next.postcode = address.postcodeString ?? "";
    next.line1 = address.line1 ?? "";
    next.line2 = address.line2 ?? "";
    next.line3 = address.line3 ?? "";
    next.town = address.town ?? "";
    next.county = address.county ?? "";
  }
  return next;
}

export default function BookingShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const wide = useWide();
  const { user, status, loading, openAuth, refreshSession } = useAuth();
  const signedIn = Boolean(user);

  /* The same answer the offer bar shows, from the same place — a bar promising
     25% above a review screen offering nothing would be worse than either
     alone. Replaces the hardcoded 25% that used to come from the model and was
     shown to returning customers too. */
  const { discount } = useOfferDiscount(status);

  const [data, setData] = useState<BookingData>(EMPTY);
  const [exiting, setExiting] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [loginFor, setLoginFor] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  /* Which leg the time step shows. Up here because the summary panel and the
     Review screen both name a leg in their Edit links — see the note on
     `timeLeg` in the context. */
  const [timeLeg, setTimeLeg] = useState<Leg>("collection");

  const segment = pathname.split("/").filter(Boolean)[1] ?? "address";
  const step: Route = isRoute(segment) ? segment : "address";

  const patch = useCallback((next: BookingPatch) => {
    setData((d) => ({ ...d, ...next }));
  }, []);

  /* ── Seeding from /my-status ──────────────────────────────────────
     During render, not in an effect, and the difference is the whole reason
     this is written the way it is.

     The screens below read their opening state from `data` as they mount —
     AddressScreen's postcode field and its `confirmed` flag are both
     `useState(data.…)`. An effect runs *after* children have rendered, so the
     address would arrive one frame too late to be seen and those two would
     stay stuck on the empty values they captured. Setting state during render
     makes React discard this pass and retry before anything commits, so the
     screens' first render is already the seeded one.

     `seed` is the identity it was done for, so it re-runs if somebody signs in
     from the header mid-checkout, and does not re-run on every re-render. The
     empty string is the settled answer for a signed-out visitor — distinct
     from null, which means we do not know yet. */
  const [seed, setSeed] = useState<string | null>(null);
  /* Whether the account covers everything the Details step asks for — see the
     header of utils/booking/flow.ts for why that means the step comes out of
     the walk. Read off the account rather than off `data`, because `data` is the
     seed plus anything typed since and the question is what the *account*
     holds. Recomputed on every seed, so signing in mid-checkout starts skipping
     from that point rather than at the next reload.

     The mobile and the name are both rule-tested, not merely truthy: a
     malformed number or a name of "3" on an older account is exactly the case
     that still needs the step. The name only became truthiness-proof when it
     got a rule of its own — before that, any non-empty string skipped Details,
     and whatever the account held went to Stripe as the billing name without
     anybody being shown it. */
  const [skipContact, setSkipContact] = useState(false);
  const seedFor = loading ? null : (status?.user?.email ?? "");
  if (seedFor !== null && seedFor !== seed) {
    setSeed(seedFor);
    const who = status?.user;
    setSkipContact(
      Boolean(isValidName(who?.name) && who?.email && UK_MOBILE_RE.test(toNationalUk(who?.phone))),
    );
    if (status?.user) setData((d) => ({ ...d, ...seedFromStatus(status, d) }));
  }

  const flow = useMemo<Flow>(() => ({ wide, skipContact }), [wide, skipContact]);

  const go = useCallback(
    (next: Route) => {
      /* Going where you already are is not a navigation. The summary's Edit
         links are the reason this matters: pressed from the step they point
         at — which the pinned panel makes easy, since it is on screen the
         whole way through — a push would stack a history entry that Back then
         has to be pressed twice to get past. The screens still react, because
         what those links change is state, not the route. */
      if (next === step) return;
      router.push(`/book/${next}`);
    },
    [router, step],
  );

  /* A bookmarked /book/review renders a summary of empty strings, so the
     guard sends anyone past their filled-in state back to where they stopped.
     Confirmed is exempt: once an order exists the data is deliberately no
     longer what gates the screen. */
  useEffect(() => {
    if (step === "confirmed") return;
    /* Nothing decided until the seed has run. A signed-in customer reloading
       on /book/time has an address on their account and no address in `data`
       yet, and this guard would bounce them to /book/address for the frame it
       takes to arrive. */
    if (seed === null) return;
    const allowed = furthestAllowed(data, signedIn);
    const routes = routesFor(flow);
    const here = routes.indexOf(step);
    const limit = routes.indexOf(allowed);
    /* Two ways to be somewhere you should not be. Past the filled-in state is
       the original one. `here < 0` is the new one: a real route this shape of
       the flow does not contain — a deep link or a bookmark to /book/contact
       from an account that now skips it, or the step being pulled out from
       under somebody standing on it when they sign in. Both send them to
       wherever they had actually got to, which for a complete account is the
       payment screen they were heading for anyway; replacing to /book/address,
       as the missing-route case used to, would throw away an address and a pair
       of slots already chosen.

       The `allowed !== step` test is what makes that safe. `furthestAllowed`
       cannot name a skipped step today — the same completeness decides both —
       but if it ever did, replacing to the route we are already on would run
       this effect again on arrival and never settle. */
    if (here < 0 || (limit >= 0 && here > limit)) {
      if (allowed !== step) router.replace(`/book/${allowed}`);
    }
  }, [step, data, flow, router, seed, signedIn]);

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
     swap of the middle of one.

     Both details here are load-bearing. focus() scrolls implicitly, which
     aligns the heading to the viewport top — exactly where the sticky header
     already is, so the heading it just focused ends up hidden behind it;
     preventScroll keeps the announcement without the scroll. And the reset
     must say behavior:"auto", because the page is scroll-behavior:smooth and
     the two-argument scrollTo(0, 0) inherits it: that only *starts* an
     animation, which the focus on the line before pre-empts. Together they
     were opening every step already scrolled past its own heading — visible
     on mobile, where the taller wrapped header and the hidden footer leave
     just enough scroll range for it. */
  useEffect(() => {
    document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [step]);

  const dirty = useMemo(
    () => Boolean(data.postcode || data.line1 || data.email || data.fullName),
    [data],
  );

  const back = useCallback(() => {
    const routes = routesFor(flow);
    const here = routes.indexOf(step);
    if (here <= 0) {
      if (dirty) setExiting(true);
      else router.push("/");
      return;
    }
    router.push(`/book/${routes[here - 1]}`);
  }, [flow, step, dirty, router]);

  /* The mirror of back(), and the only way a screen should move forward. The
     screens used to name their successor — Time pushed "contact" — which is
     precisely what breaks when a step leaves the walk. */
  const forward = useCallback(() => {
    const next = nextAfter(step, flow);
    if (next) router.push(`/book/${next}`);
  }, [flow, step, router]);

  const confirmOrder = useCallback(async () => {
    /* ── The address, saved once, here ─────────────────────────────
       This is the only place the booking's address is written to the account,
       and it is here because it is the only point every route through the
       checkout passes through with an id in hand.

       The address step cannot do it for a guest — PATCH
       /users/{id}/update-address needs an account and there is none yet — and
       doing it the moment one appears would cover the identity panel and miss
       the Log in link, the header, and a sign-in that happened in another tab.
       It also would not survive the address being edited afterwards from
       Review, which the summary's Edit links make a one-tap thing to do.

       Slots no longer depend on it (they take the postcode directly), but the
       order does: this is the address a van is sent to. Probed, POST /orders
       accepts an account with no address at all and answers 201 — so nothing
       downstream will catch a booking with nowhere to collect from, which
       makes it ours to refuse.

       A failure stops the order. An order that cannot be collected is worse
       than one that has to be placed again, and the message is the server's
       own — these are 4xx violations naming a field. */
    if (user?.id) {
      const saved = await updateAddress(user.id, {
        line1: data.line1,
        line2: data.line2,
        line3: data.line3,
        town: data.town,
        county: data.county,
        postcode: data.postcode,
      });
      if (!saved.ok) {
        return {
          ok: false,
          message:
            saved.message ||
            "We could not save your collection address. Please check it and try again.",
        };
      }
    }

    /* One recurring subscription per account: a second `frequency` is refused,
       and refused as a 500 rather than as something we could show anybody. The
       time step hides the toggle when /my-status reports one, so this only
       catches the way round it — a visitor who switches Repeat on and *then*
       signs in, arriving here with a flag set before we knew who they were. */
    const r = await createOrder(status?.recurring ? { ...data, repeat: false } : data);
    if (!r.ok) return { ok: false, message: r.message };

    /* The server mints the number; ours was a mock that invented one. It comes
       back as an integer (`3488`), so it is stringified rather than trusted to
       be text. Falling back to an empty string means the confirmation shows its
       own visibly-fake "LF-000000" filler rather than a plausible number nobody
       can quote back to us. */
    setReference(r.order.number == null ? "" : String(r.order.number));

    /* Not awaited. The order exists and the confirmation is what they are
       waiting for; the only thing this refresh feeds is `recentActiveOrder`
       for the header on the way back. Awaiting it would hold the screen on a
       spinner for a request nothing on the next screen reads. */
    void refreshSession();

    router.push("/book/confirmed");
    return { ok: true };
  }, [data, router, refreshSession, status, user]);

  const value = useMemo<BookingContextValue>(
    () => ({
      data,
      patch,
      step,
      go,
      back,
      forward,
      wide,
      skipContact,
      timeLeg,
      setTimeLeg,
      moreBelow,
      discount,
      reference,
      /* Whether the confirmation offers to finish the account this booking
         created. `verified` is the answer: an account reached by typing a code
         out of an inbox has proved its address and needs nothing, while one
         made by the panel's one-click path — which is most of them — has an
         unproved address and no password on it.

         Read off /my-status rather than off how they signed in, so it stays
         right for somebody who verified in another tab. */
      isNewAccount: Boolean(user) && user?.verified === false,
      confirmOrder,
      requestExit: () => (dirty ? setExiting(true) : router.push("/")),
      openLogin: (prefill?: string) => setLoginFor(prefill ?? data.email ?? ""),
      openBilling: () => setBillingOpen(true),
    }),
    [data, patch, step, go, back, forward, wide, skipContact, timeLeg, moreBelow, discount, reference, user, confirmOrder, dirty, router],
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
        className={cn("lf-controls lf-book", INHERIT_FONT, "flex min-h-screen flex-1 flex-col bg-bk-paper text-bk-ink")}
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
          onLogin={
            /* Prefilled from the checkout's own state, the same way openLogin
               above seeds the booking flow's own LoginSheet. */
            user || step === "confirmed" ? null : () => openAuth("login", data.email)
          }
          user={user ? { email: user.email, fullName: user.fullName } : null}
          scrolled={scrolled}
        >
          {showChrome && (
            <Steps
              current={stepOf(step, wide)}
              allowed={furthestAllowed(data, signedIn)}
              onGo={go}
              flow={flow}
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
            cn(
              "mx-auto flex w-full max-w-[var(--bk-col)] flex-auto flex-col px-5 pb-0 pt-7",
              "to-720:pt-3.5 to-400:px-4",
              "from-1024:flex-row from-1024:items-stretch from-1024:gap-8 from-1024:px-6",
              split
                ? "from-1024:max-w-[calc(620px+32px+328px+48px)]"
                : "from-1024:max-w-wrap",
            )
          }
        >
          {/* The screens still own the column, so every existing rule — the
              sticky action bar, margin-top:auto, the full-bleed ::before —
              keeps working whether or not there is a panel beside it. */}
          <div
            className={
              cn(
                "flex min-w-0 flex-auto flex-col from-1024:max-w-[var(--bk-col)]",
                split ? "" : "from-1024:mx-auto from-1024:w-full",
              )
            }
          >
            {/* Not mounted until the seed above has run, and this is the half
                of that mechanism that actually makes it work.

                The screens read their opening state from `data` as they mount
                — AddressScreen's postcode field and its `confirmed` flag are
                both `useState(data.…)`, and a `useState` initialiser runs once
                and never again. `loading` is true on the first render, so the
                seed cannot have happened yet; letting the screens mount into
                that frame means they capture the empty booking and keep it,
                and a signed-in customer with an address on their account is
                shown an empty postcode box. The context updates underneath
                them and nothing on screen changes.

                Signed out this costs a frame — `loadSession` answers without a
                request when there is no cookie. Signed in it is the length of
                one /my-status, which is the wait it looks like. */}
            {seed === null ? (
              <div className="flex flex-auto items-center justify-center py-16">
                <Loader className="h-6 w-6" />
              </div>
            ) : (
              children
            )}
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
            /* The sheet hands back what it was told by /login-check, which is
               not the whole account — no phone, and nothing to say whether the
               Details step is still needed. This is the only login path in the
               app that did not refresh, so the seed never re-ran and a returning
               customer stayed on the four-step flow until they reloaded. */
            void refreshSession();
            setLoginFor(null);
          }}
        />
      )}
    </BookingContext.Provider>
  );
}
