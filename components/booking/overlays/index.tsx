"use client";

/* ══════════════════════════════════════════════════════════════════
   Everything that opens over the flow
   ══════════════════════════════════════════════════════════════════
   Exit confirmation · FAQs · How billing works · Log in
   ══════════════════════════════════════════════════════════════════ */

import { cn } from "@/utils/cn";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Link from "next/link";
import { useEffect, useId, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Icon, P, ProviderMark } from "@/components/booking/icons";
import Field from "@/components/booking/common/Field";
import Modal from "@/components/booking/common/Modal";
import { MODAL_FOOT, MODAL_NAV, MODAL_NAV_BTN } from "@/utils/booking/styles";
import { verifyCode, signInWith } from "@/utils/booking/mocks";
import {
  CODE_LENGTH,
  EMAIL_RE,
  RESEND_SECONDS,
  SOCIAL,
  type ProviderId,
} from "@/utils/booking/model";
import { BTN_LINK, SEC_H, SEC_P } from "@/utils/booking/styles";
import { routes } from "@/utils/routes";
import { BRAND, FAQ, FAQ_PREVIEW_COUNT } from "@/utils/content";

/* Preflight hands anchors `text-decoration: inherit`, where the design
   kept the browser's underline. Said outright on the few plain links in
   the overlays rather than added back globally. */
const LINK = "underline";

/* ── Leaving ──────────────────────────────────────────────────────
   Confirmed rather than immediate. Nothing is saved yet, so a mis-tap on
   a full form would silently bin the lot. */

export function ExitConfirm({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
  return (
    <Modal onClose={onStay} labelledBy="lfb-exit-t">
      <h2 className={SEC_H} id="lfb-exit-t">
        Leave this booking?
      </h2>
      <p className={SEC_P}>Nothing has been saved yet, so what you have filled in will be lost.</p>
      <div className={MODAL_NAV}>
        <Button
          surface="booking" variant="ghost" size="lg" className={MODAL_NAV_BTN}
          onClick={onLeave}
        >
          Leave
        </Button>
        <Button
          surface="booking" variant="lime" size="lg" className={MODAL_NAV_BTN}
          onClick={onStay}
        >
          Keep booking
        </Button>
      </div>
    </Modal>
  );
}

/* ── FAQs ─────────────────────────────────────────────────────────
   The same questions and the same accordion as the landing page, pulled
   from the same array in @/utils/content — nine answers duplicated across
   two files is nine answers that drift. */

const SIGN =
  "flex h-7 w-7 flex-none items-center justify-center rounded-pill text-[16px] leading-none " +
  "transition-[transform,background-color] duration-200 ease-[ease]";

export function FaqModal({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(-1);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? FAQ : FAQ.slice(0, FAQ_PREVIEW_COUNT);
  const hidden = FAQ.length - FAQ_PREVIEW_COUNT;
  return (
    <Modal title="Frequently asked" labelledBy="lfb-faq-t" onClose={onClose} wide>
      <div>
        {visible.map(([q, a], i) => {
          const isOpen = open === i;
          return (
            <div
              className="mb-2 overflow-hidden rounded-card-md border border-bk-line bg-white transition-[border-color] duration-150 ease-[ease] hover:border-bk-line-2"
              key={q}
            >
              <h3>
                <Button variant="bare"
                  className="group flex w-full cursor-pointer items-center justify-between gap-[14px] border-none bg-transparent px-4 py-[14px] text-left text-[15.5px] font-semibold text-bk-ink"
                  aria-expanded={isOpen}
                  aria-controls={`lfb-fp-${i}`}
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  {q}
                  {/* Rotating a plus 45° is the cheapest close affordance
                      there is and needs no second glyph. The open state is
                      matched, not out-weighted: in the source both rules
                      score 0,3,0 and the expanded one simply comes last. */}
                  <span
                    className={cn(SIGN, isOpen ? "rotate-45 bg-brand" : "bg-bk-paper-2 group-hover:bg-bk-line")}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </Button>
              </h3>
              {isOpen && (
                <div
                  className="px-4 pb-4 pt-0 text-[14.5px] leading-[1.65] text-bk-ink-2"
                  id={`lfb-fp-${i}`}
                >
                  {a}
                </div>
              )}
            </div>
          );
        })}
        {!showAll && hidden > 0 && (
          <Button variant="bare"
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-card-md border border-bk-line bg-white px-4 py-[14px] text-left text-[15.5px] font-bold text-bk-ink-2 transition-[border-color] duration-150 ease-[ease] hover:border-bk-line-2 hover:text-bk-ink"
            onClick={() => setShowAll(true)}
          >
            Show more questions
            <span className="flex h-6 min-w-6 flex-none items-center justify-center rounded-pill bg-bk-paper-2 px-1.5 text-[13px] font-bold text-bk-ink-2">
              {hidden}
            </span>
            <span
              className="ml-auto flex h-7 w-7 flex-none rotate-90 items-center justify-center rounded-pill bg-brand text-bk-ink"
              aria-hidden="true"
            >
              <Icon icon={P.chevron} size={15} />
            </span>
          </Button>
        )}
      </div>
      <p className={MODAL_FOOT}>
        Still stuck? Email{" "}
        <a className={LINK} href={`mailto:${BRAND.email}`}>
          {BRAND.email}
        </a>{" "}
        and a person will reply.
      </p>
    </Modal>
  );
}

/* ── How billing works ────────────────────────────────────────────
   Shown at the point the card details are asked for, because that is
   where the doubt is. Every claim here has to match what actually
   happens: the card is stored and charged after counting, and Price
   Review is opt-in, so nothing promises approval by default. */

const BILLING_POINTS: [icon: LucideIcon, title: string, body: string][] = [
  [
    P.bag,
    "Nothing to itemise",
    "Bag it however it comes. We count and log every piece against your order when we collect — no lists, no sorting, no guessing.",
  ],
  [
    P.list,
    "Priced from a published list",
    "Every item has a price on our website and that is the price you pay. Nothing is estimated, and collection and delivery are always free.",
  ],
  [
    P.lock,
    "Card saved, not charged",
    "Your card is stored securely and charged only once your items have been counted. The full breakdown arrives by email.",
  ],
  [
    P.tick,
    "Change your mind any time",
    "Cancel or move your collection free of charge up to two hours before. If you would rather approve the price yourself first, switch on Price Review in your account.",
  ],
];

export function BillingModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How billing works" labelledBy="lfb-bill-t" onClose={onClose} wide>
      <ul>
        {BILLING_POINTS.map(([icon, title, body], i) => (
          <li
            key={title}
            className={cn("flex gap-[14px] py-[14px]", i ? " border-t border-bk-line" : "")}
          >
            <span
              className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-card-md bg-panel text-bk-ink"
              aria-hidden="true"
            >
              <Icon icon={icon} size={20} />
            </span>
            <span>
              <b className="mb-[3px] block text-[15.5px] font-bold">{title}</b>
              <span className="block text-[14px] leading-[1.6] text-bk-ink-2">{body}</span>
            </span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

/* ── Log in ───────────────────────────────────────────────────────
   A code, not a magic link. A link tapped on a different device lands on
   a machine with no booking on it, so the person starts again — avoidable
   only by polling a login request from this tab, which is server work
   that buys nothing a code does not already give. A code is typed here,
   in the tab holding the booking, and nothing can be lost.

   It also sidesteps mail scanners and link previewers, which follow URLs
   and would consume a single-use link before the customer taps it. */

export function LoginSheet({
  email,
  onClose,
  onLoggedIn,
}: {
  email: string;
  onClose: () => void;
  onLoggedIn: (who: { identity: string; email: string; fullName?: string }) => void;
}) {
  const [view, setView] = useState<"choose" | "email" | "waiting">("choose");
  const [addr, setAddr] = useState(email || "");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const ids = useId();

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((n) => (n <= 1 ? 0 : n - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  return (
    <Modal title="Log in or create an account" labelledBy="lfb-login-t" onClose={onClose}>
      {view === "choose" && (
        <>
          <div className="mb-4 grid gap-2.5" style={{ gridTemplateColumns: "1fr" }}>
            {SOCIAL.map(([id, label]) => (
              <Button
                key={id}
                surface="booking" variant={id as ProviderId} size="oauth"
                onClick={() => {
                  const who = signInWith(id);
                  onLoggedIn({ identity: id, email: who.email, fullName: who.name });
                }}
              >
                <ProviderMark id={id} />
                {/* Both companies specify the wording. "Sign in with" and
                    "Continue with" are approved; anything else is not. */}
                Sign in with {label}
              </Button>
            ))}
          </div>
          <p className="mb-4 flex items-center gap-[14px] text-[13px] text-bk-ink-3 before:h-px before:flex-auto before:bg-bk-line before:content-[''] after:h-px after:flex-auto after:bg-bk-line after:content-['']">
            <span>or</span>
          </p>
          <Button
            surface="booking" variant="email" size="oauth"
            onClick={() => setView("email")}
          >
            <Icon icon={P.mail} size={18} />
            Continue with email
          </Button>
          <p className={MODAL_FOOT}>
            By continuing you agree to our{" "}
            <Link className={LINK} href={routes.ui.terms}>
              terms
            </Link>{" "}
            and{" "}
            <Link className={LINK} href={routes.ui.privacyPolicy}>
              privacy policy
            </Link>
            .
          </p>
        </>
      )}

      {view === "email" && (
        <>
          <Field label="To log in, please enter your email" id={`${ids}-le`}>
            <Input
              id={`${ids}-le`}
              type="email"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Button
            surface="booking" variant="lime" size="lg" block
            disabled={!EMAIL_RE.test(addr)}
            onClick={() => {
              setView("waiting");
              setCooldown(RESEND_SECONDS);
            }}
          >
            Send me a code
          </Button>
        </>
      )}

      {view === "waiting" && (
        <div>
          <p className={SEC_H}>Check your email</p>
          {/* States what to do and nothing about how it works. */}
          <p className={SEC_P}>
            We have sent a {CODE_LENGTH}-digit code to {addr}.
          </p>
          <Field label={`${CODE_LENGTH}-digit code`} id={`${ids}-lc`} error={error}>
            <Input
              id={`${ids}-lc`}
              className="text-center text-[19px] font-bold tracking-[.45em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={CODE_LENGTH}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH));
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || code.length !== CODE_LENGTH) return;
                if (!verifyCode(addr, code)) setError("That code is not right.");
                else onLoggedIn({ identity: "", email: addr });
              }}
            />
          </Field>
          <Button
            surface="booking" variant="lime" size="lg" block
            disabled={code.length !== CODE_LENGTH}
            onClick={() => {
              if (!verifyCode(addr, code)) return setError("That code is not right.");
              onLoggedIn({ identity: "", email: addr });
            }}
          >
            Log in
          </Button>
          <p className="mt-[14px] text-center">
            <Button variant="bare"
              className={cn(BTN_LINK, "disabled:cursor-default disabled:opacity-50")}
              disabled={cooldown > 0}
              onClick={() => {
                setCooldown(RESEND_SECONDS);
                setCode("");
                setError("");
              }}
            >
              {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
            </Button>
          </p>
        </div>
      )}
    </Modal>
  );
}
