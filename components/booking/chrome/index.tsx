"use client";

/* ══════════════════════════════════════════════════════════════════
   Header, step indicator, footer
   ══════════════════════════════════════════════════════════════════

   The checkout's own chrome. It is deliberately not the marketing
   header and footer — those live in app/(site)/layout.tsx, and /book/*
   sits outside that route group so the two never both render.
   ══════════════════════════════════════════════════════════════════ */

import { cn } from "@/utils/cn";
import Button from "@/components/common/Button";
import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, P } from "@/components/booking/icons";
import { CLOSE_BTN } from "@/utils/booking/styles";
import { routesFor, stepsFor, type Route } from "@/utils/booking/flow";
import { displayName } from "@/utils/auth";
import { BRAND } from "@/utils/content";
import { routes } from "@/utils/routes";

/* Both header links are the same object; only the order and the ink
   differ, and both are single-property utilities that would otherwise
   fight each other in one class list. */
const HELP_BASE =
  "min-h-11 cursor-pointer whitespace-nowrap border-none bg-transparent px-1.5 " +
  "text-[14px] font-semibold leading-[1.6] no-underline " +
  "hover:text-bk-ink hover:underline hover:underline-offset-[3px] " +
  "to-834:ml-auto to-400:text-[13px]";

/** The mark is 28px but the tap area must not be. Padding takes the link
 *  to 44px without moving the logo. */
function Wordmark() {
  return (
    <Link
      className="inline-flex min-h-11 flex-none items-center py-2 text-bk-ink no-underline"
      href="/"
      aria-label={`${BRAND.name} home`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/logo-primary.svg" alt="" className="h-7 w-auto" />
    </Link>
  );
}

export function Header({
  onBack,
  canGoBack,
  onClose,
  onFaq,
  onLogin,
  user,
  scrolled,
  children,
}: {
  onBack: () => void;
  canGoBack: boolean;
  onClose: () => void;
  onFaq: () => void;
  onLogin: (() => void) | null;
  /** `fullName` so this labels the account the same way the site header does.
   *  Optional: an account can have no name on it. */
  user: { email: string; fullName?: string } | null;
  /** One surface, so a shadow is the only thing that ever separates the
   *  chrome from the page — and only once something is behind it. */
  scrolled: boolean;
  children: ReactNode;
}) {
  return (
    <header
      className={
        cn(
          "sticky top-0 z-[60] bg-white transition-shadow duration-[180ms] ease-[ease]",
          scrolled && "shadow-[0_6px_18px_-14px_rgba(20,20,15,.55)]",
        )
      }
    >
      {/* Two widths, on purpose. The chrome spans the page like the landing
          page header does (max-w-wrap matches it exactly), while the form
          stays at --bk-col, because a 1180px-wide input is unreadable.
          Running the header at --bk-col too is what made the logo look like
          it was floating in the middle of the screen. */}
      <div className="mx-auto flex min-h-16 max-w-wrap flex-wrap items-center gap-x-[14px] gap-y-0 px-6 to-720:min-h-14 to-400:px-4">
        {canGoBack && (
          <Button variant="bare"
            className="-ml-2.5 flex h-11 w-11 flex-none cursor-pointer items-center justify-center py-px px-1.5 rounded-ctl-lg border-none bg-transparent text-bk-ink transition-[background-color] duration-150 ease-[ease] hover:bg-bk-paper-2"
            onClick={onBack}
            aria-label="Go back"
          >
            <Icon icon={P.back} size={22} />
          </Button>
        )}
        <Wordmark />
        {/* Answers open in place rather than sending people to an inbox
            or off to another page — during checkout every outbound link
            is a way to lose someone mid-form. */}
        {children}
        {/* A returning customer otherwise cannot log in until step 3 —
            the one step we eventually want to skip for them. */}
        {user ? (
          /* Who you are is the first thing to go below 560: the logo, Back
             and Close all have to fit before it earns any room.

             Name over address, matching the site header — the two headers are
             one product and had already drifted once. No menu here though:
             mid-form is the wrong place to offer a way to log out. */
          <span
            className="order-3 min-w-0 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap px-1.5 text-[13.5px] text-bk-ink-2 to-560:hidden"
            title={user.email}
          >
            {displayName(user)}
          </span>
        ) : (
          onLogin && (
            /* order 3 so it sits before FAQs, and the same weight as it:
               this is a way back in, not a competing call to action. */
            <Button variant="bare" className={cn(HELP_BASE, "order-3 text-bk-ink")} onClick={onLogin}>
              Log in
            </Button>
          )
        )}
        <Button variant="bare" className={cn(HELP_BASE, "order-4 text-bk-ink-2")} onClick={onFaq}>
          FAQs
        </Button>
        {/* Back walks the flow one step at a time; this leaves it. On a
            phone the flow fills the screen with no visible way out, which
            is the situation that makes people close the tab instead. */}
        <Button variant="bare" className={CLOSE_BTN} onClick={onClose} aria-label="Close booking">
          <Icon icon={P.close} size={20} strokeWidth="2.2" />
        </Button>
      </div>
    </header>
  );
}

/* ── The step indicator ───────────────────────────────────────── */

const DOT =
  "flex h-[26px] w-[26px] flex-none items-center justify-center rounded-[50%] border " +
  "text-[12.5px] font-bold transition-[background-color,color] duration-200 ease-[ease]";
const LABEL =
  "overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold";

export function Steps({
  current,
  allowed,
  onGo,
  wide,
}: {
  current: string;
  allowed: Route;
  onGo: (next: Route) => void;
  wide: boolean;
}) {
  const STEPS = stepsFor(wide);
  const R = routesFor(wide);
  const index = STEPS.findIndex(([id]) => id === current);
  if (index < 0) return null;
  /* A step is reachable if the guard would let the router go there —
     the same furthestAllowed() the deep-link check uses, so the two can
     never disagree about what is filled in. */
  const reach = R.indexOf(allowed);

  const pct = ((index + 1) / STEPS.length) * 100;

  return (
    <>
      {/* Four dots read as four unrelated circles on a phone. A filling
          bar shows momentum, which is the whole point of a step counter
          in a checkout. Jumping between steps stays a desktop affordance,
          where the labelled targets exist. */}
      <div className="order-9 hidden flex-[0_0_100%] pb-2.5 to-720:block">
        <p className="mb-[7px] text-[13px] font-semibold text-bk-ink-2">
          Step <b className="text-bk-ink">{index + 1}</b> of {STEPS.length} ·{" "}
          <b className="text-bk-ink">{STEPS[index][1]}</b>
        </p>
        <div
          className="h-1 overflow-hidden rounded-pill bg-bk-paper-2"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-label={`Step ${index + 1} of ${STEPS.length}: ${STEPS[index][1]}`}
        >
          <i
            className="block h-full rounded-[inherit] bg-brand transition-[width] duration-300 ease-[ease]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {/* Centred as a group rather than stretched across the full width —
          four steps spread over 1180px reads as four unrelated items. */}
      <ol className="order-3 flex min-w-0 flex-auto items-center justify-center gap-2 to-834:order-9 to-834:flex-[0_0_100%] to-720:hidden">
        {STEPS.map(([id, label], i) => {
          const state = i < index ? "done" : i === index ? "now" : "todo";
          const open = R.indexOf(id as Route) <= reach;
          const disabled = !open || state === "now";
          return (
            <li key={id} className="flex min-w-0 flex-none items-center gap-2">
              {/* 44px at every width, not just on phones — an iPad at 834px
                  gets the labelled desktop row and is still a touch device.
                  Only the steps you can actually reach invite a click, so
                  the hover treatment is withheld rather than overridden. */}
              <Button variant="bare"
                className={
                  cn(
                    "group flex min-h-11 min-w-0 cursor-pointer items-center gap-2 rounded-ctl-md",
                    "border-none bg-transparent px-0.5 py-1 text-[16px] leading-[1.6] text-inherit",
                    "disabled:cursor-default to-720:text-[15.5px]",
                  )
                }
                disabled={disabled}
                aria-current={state === "now" ? "step" : undefined}
                onClick={() => onGo(id as Route)}
              >
                <span
                  className={
                    `${DOT} ` +
                    (state === "done"
                      ? "border-bk-ink bg-bk-ink text-white"
                      : state === "now"
                        ? "border-brand bg-brand text-bk-ink"
                        : "border-bk-line bg-bk-paper-2 text-bk-ink-3") +
                    (disabled ? "" : " group-hover:border-bk-ink-3")
                  }
                  aria-hidden="true"
                >
                  {state === "done" ? <Icon icon={P.tick} size={13} /> : i + 1}
                </span>
                <span
                  className={
                    `${LABEL} ` +
                    (state === "done"
                      ? "text-bk-ink-2"
                      : state === "now"
                        ? "text-bk-ink"
                        : "text-bk-ink-3") +
                    (disabled ? "" : " group-hover:underline group-hover:underline-offset-[3px]")
                  }
                >
                  {label}
                </span>
                <span className="visually-hidden">
                  {` — step ${i + 1} of ${STEPS.length}${
                    state === "now" ? ", current" : open ? "" : ", not available yet"
                  }`}
                </span>
              </Button>
              {i < STEPS.length - 1 && (
                <span className="ml-2 h-px w-[52px] flex-none bg-bk-line" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

/* ── Footer ───────────────────────────────────────────────────────
   Hidden below 720: terms and privacy are both linked from the review
   screen, and the help link lives in the header, so it is 90px of
   repetition on the one screen fighting hardest for height. */

export function Footer() {
  return (
    <footer className="bg-white to-720:hidden">
      <div className="mx-auto flex max-w-wrap flex-wrap items-center gap-x-[18px] gap-y-2 px-6 py-5 text-[13px] text-bk-ink-3 to-400:px-4">
        <span>
          © {new Date().getFullYear()} {BRAND.legal}
        </span>
        {/* <Link>, not <a>. As raw anchors these reloaded the document, and
            the booking state lives in BookingShell — so reading the terms
            mid-checkout threw away the address and the chosen slot. */}
        <Link className="no-underline hover:underline" href={routes.ui.terms}>
          Terms
        </Link>
        <Link className="no-underline hover:underline" href={routes.ui.privacyPolicy}>
          Privacy
        </Link>
        <a className="no-underline hover:underline" href={`mailto:${BRAND.email}`}>
          {BRAND.email}
        </a>
      </div>
    </footer>
  );
}
