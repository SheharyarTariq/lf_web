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
import { Icon, P } from "@/components/booking/icons";
import Field from "@/components/booking/common/Field";
import Modal from "@/components/common/Modal";
import { ERR, MODAL_FOOT, MODAL_NAV, MODAL_NAV_BTN } from "@/utils/booking/styles";
import Loader from "@/components/common/Loader";
import { login, loginWithCode, requestVerificationCode } from "@/utils/auth";
import { CODE_LENGTH, EMAIL_RE, RESEND_SECONDS } from "@/utils/booking/model";
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
   and would consume a single-use link before the customer taps it.

   ── What changed when this stopped being a mock ──────────────────

   The code path is real now: `verification-code/request` with
   `purpose: "login"` sends it and `/login-with-code` redeems it. The second
   of those is undocumented and was found by probing; without it this sheet
   could only ever have sent codes nothing would accept.

   **The Apple and Google buttons are gone.** They called a mock that
   fabricated an account and returned no token. That was survivable while the
   checkout ran on mocks; it is not now — every step past this one needs a
   real Bearer token, so a provider button would have waved somebody through
   to a payment step that answers 401. A control that cannot do what it says
   is worse than an absent one. They come back when there is an endpoint
   behind them; see docs/ENDPOINTS.md.

   In their place is the thing people actually arrive here wanting: their
   password. An unverified account is handed to the code path rather than
   refused, because a code both proves the address and issues the session —
   which is exactly what such an account is missing.
   ══════════════════════════════════════════════════════════════════ */

const BTN_SPACE = "mt-2.5";

export function LoginSheet({
  email,
  onClose,
  onLoggedIn,
}: {
  email: string;
  onClose: () => void;
  onLoggedIn: (who: { identity: string; email: string; fullName?: string }) => void;
}) {
  const [view, setView] = useState<"choose" | "email" | "waiting" | "password">("choose");
  const [addr, setAddr] = useState(email || "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const ids = useId();

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((n) => (n <= 1 ? 0 : n - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  /* Deliberately says nothing about whether that address has an account.
     The endpoint answers 200 either way — by design, so it cannot be used to
     ask who is a customer — and a sheet that claimed a code was on its way
     would be repeating a promise the server never made. */
  const sendCode = async (to: string) => {
    setBusy(true);
    setError("");
    await requestVerificationCode(to, "login");
    setBusy(false);
    setCode("");
    setCooldown(RESEND_SECONDS);
    setView("waiting");
  };

  const submitCode = async () => {
    if (busy || code.length !== CODE_LENGTH) return;
    setBusy(true);
    setError("");
    const r = await loginWithCode(addr, code);
    setBusy(false);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    onLoggedIn({ identity: "", email: r.user.email, fullName: r.user.name });
  };

  const submitPassword = async () => {
    if (busy || !EMAIL_RE.test(addr) || !password) return;
    setBusy(true);
    setError("");
    const r = await login(addr, password);
    setBusy(false);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    /* Right password, unproved address. login() has held the token back
       rather than writing a session — that rule is not relaxed here, it is
       satisfied: a code proves the address, and /login-with-code answers with
       a session token of its own. */
    if (!r.verified) {
      void sendCode(addr);
      return;
    }
    onLoggedIn({ identity: "", email: r.user.email, fullName: r.user.name });
  };

  const alert = error ? (
    <p className={cn(ERR, "mt-3")} role="alert">
      <Icon icon={P.alert} size={16} className="mt-0.5 flex-none" />
      {error}
    </p>
  ) : null;

  return (
    <Modal title="Log in to your account" labelledBy="lfb-login-t" onClose={onClose}>
      {view === "choose" && (
        <>
          <p className={SEC_P}>
            Both work. A code needs nothing but your inbox; a password signs you straight in.
          </p>
          <Button
            surface="booking" variant="lime" size="lg" block
            onClick={() => setView("email")}
          >
            <Icon icon={P.mail} size={18} />
            Email me a code
          </Button>
          <div className={BTN_SPACE}>
            <Button
              surface="booking" variant="ghost" size="lg" block
              onClick={() => setView("password")}
            >
              Use my password
            </Button>
          </div>
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
            surface="booking" variant="lime" size="lg" block className="gap-2"
            disabled={!EMAIL_RE.test(addr) || busy}
            isLoading={busy}
            onClick={() => void sendCode(addr)}
          >
            {busy && <Loader className="h-4 w-4" />}
            Send me a code
          </Button>
          {alert}
        </>
      )}

      {view === "password" && (
        <>
          <Field label="Email" id={`${ids}-pe`}>
            <Input
              id={`${ids}-pe`}
              type="email"
              value={addr}
              onChange={(e) => setAddr(e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label="Password" id={`${ids}-pp`}>
            <Input
              id={`${ids}-pp`}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void submitPassword();
              }}
              autoComplete="current-password"
            />
          </Field>
          <Button
            surface="booking" variant="lime" size="lg" block className="gap-2"
            disabled={!EMAIL_RE.test(addr) || !password || busy}
            isLoading={busy}
            onClick={() => void submitPassword()}
          >
            {busy && <Loader className="h-4 w-4" />}
            Log in
          </Button>
          {alert}
          <p className={cn(MODAL_FOOT, "text-center")}>
            <Button variant="bare" className={BTN_LINK} onClick={() => setView("email")}>
              Email me a code instead
            </Button>
          </p>
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
                if (e.key === "Enter") void submitCode();
              }}
            />
          </Field>
          <Button
            surface="booking" variant="lime" size="lg" block className="gap-2"
            disabled={code.length !== CODE_LENGTH || busy}
            isLoading={busy}
            onClick={() => void submitCode()}
          >
            {busy && <Loader className="h-4 w-4" />}
            Log in
          </Button>
          <p className="mt-[14px] text-center">
            <Button variant="bare"
              className={cn(BTN_LINK, "disabled:cursor-default disabled:opacity-50")}
              disabled={cooldown > 0 || busy}
              onClick={() => void sendCode(addr)}
            >
              {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
            </Button>
          </p>
        </div>
      )}
    </Modal>
  );
}
