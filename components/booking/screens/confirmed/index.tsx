"use client";

/* ══════════════════════════════════════════════════════════════════
   5 · Confirmed
   ══════════════════════════════════════════════════════════════════ */

import { cn } from "@/utils/cn";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Icon, P } from "@/components/booking/icons";
import ActionBar from "@/components/booking/common/ActionBar";
import Field from "@/components/booking/common/Field";
import Notice from "@/components/booking/common/Notice";
import { useBooking } from "@/utils/booking/context";
import { useAuth } from "@/components/common/AuthProvider";
import Loader from "@/components/common/Loader";
import { requestPasswordReset, resendVerification, verifyEmail } from "@/utils/auth";
import { CODE_LENGTH, RESEND_SECONDS } from "@/utils/auth/model";
import { PREFERENCES, longDate, parseDay } from "@/utils/booking/model";
import {
  CARD,
  CONTROL_PEER,
  DIVIDER,
  H1,
  SEC_H,
  SEC_P,
  SWITCH,
  TOGGLE,
  TOGGLE_SUB,
  TOGGLE_TEXT,
  TOGGLE_TITLE,
  ERR,
  bkBtn,
} from "@/utils/booking/styles";

const NEXT_STEPS: [title: string, body: string][] = [
  ["Bag it up", "However it comes. No sorting, no counting, no lists."],
  [
    "We collect and count",
    "Your driver texts you when they are close. Every item is logged against your order.",
  ],
  ["We price and charge", ""],
  ["Back to your door", "Fresh and ready, in the delivery window you picked."],
];

export default function ConfirmedScreen() {
  const { data, patch, discount, reference, isNewAccount, moreBelow } = useBooking();
  const { refreshSession } = useAuth();
  const ids = useId();
  const collection = parseDay(data.collectionDay);

  /* ── Finishing the account ────────────────────────────────────────
     The design put "Keep your account — set a password" here, on the theory
     that the account had been created with one click and had no password on
     it. Half of that is right: POST /register really does take no password,
     so the recommended path in the identity panel really is one tap and the
     account really does arrive with nothing on it but an address.

     The other half had no endpoint. There is no way to set a password on an
     account that is already signed in — probed: PATCH /users/{id} is a 405,
     and change-password and set-password are both 404. What exists is the
     reset flow, which is public, already wired, and ends on a page this site
     already has. So the button asks for that email rather than pretending to
     save a password inline.

     Alongside it, the thing the account is actually missing: a proved
     address. Nothing forced it earlier — an unverified account books quite
     happily — so this is the first moment it costs nobody anything. Both are
     offered because they answer different questions: the code is for this
     order, the password is for the next one. */
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [pwSent, setPwSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((n) => (n <= 1 ? 0 : n - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  /* The clock starts as the consequence of a send, never as a claim about one.
     Every other code screen in the app is written this way; this one was not,
     and the difference mattered here more than anywhere. */
  const sendCode = async () => {
    setSending(true);
    setError("");
    const r = await resendVerification();
    setSending(false);
    if (!r.ok) {
      /* Left pressable at 0s. A failed send is the one moment somebody needs
         the button now rather than in sixty seconds. */
      setError(r.message);
      return;
    }
    setSent(true);
    setCooldown(RESEND_SECONDS);
  };

  /* The send this screen was always missing. The header's sign-up can arrive
     with the clock already running because /login-check has put the code in
     the post by then — the comment in the auth modal says exactly that. The
     booking flow only ever calls /register, which sends nothing, so the same
     seeded cooldown here left the first code unsent and disabled the one
     button that could send it for a minute.

     Guarded by a ref because StrictMode mounts twice in dev. The server reuses
     a code under an hour old, so a double fire would be harmless either way —
     but two requests for one arrival is still two more than the truth. */
  const sentRef = useRef(false);
  useEffect(() => {
    if (!isNewAccount || verified || sentRef.current) return;
    sentRef.current = true;
    void sendCode();
  }, [isNewAccount, verified, sendCode]);

  const submitCode = async () => {
    if (busy || code.length !== CODE_LENGTH) return;
    setBusy(true);
    setError("");
    const r = await verifyEmail(code);
    setBusy(false);
    if (!r.ok) {
      setError(r.message);
      return;
    }
    setVerified(true);
    void refreshSession();
  };

  /* Three states, because the hint used to assert the middle one from the
     first paint. It now says what has actually happened — including the pause
     before the request lands, and the failed send, where the error line below
     carries the reason and this stays a promise rather than a lie. */
  const codeHint = sending
    ? `Sending a code to ${data.email}.`
    : sent
      ? `We have sent it to ${data.email}.`
      : `We will send it to ${data.email}.`;

  /* The discount only earns a mention here if there is one — a sentence
     about a discount that does not exist is worse than no sentence. Worded
     generically now the figure is the server's: this is a second-order
     discount as often as a first-order one, and the card above already
     names which. */
  const steps = NEXT_STEPS.map(([title, body]) =>
    title === "We price and charge"
      ? ([
          title,
          `Each item is priced from our published list${
            discount ? ", your discount comes off" : ""
          }, then your saved card is charged. Full breakdown by email.`,
        ] as [string, string])
      : ([title, body] as [string, string]),
  );

  return (
    <>
      <div className="pt-2 text-center">
        <div className="mx-auto mb-[22px] flex h-[76px] w-[76px] items-center justify-center rounded-[50%] bg-brand">
          <Icon icon={P.tick} size={38} strokeWidth="2.4" />
        </div>
        <h1 className={H1} tabIndex={-1}>
          You are booked in
        </h1>
        {/* The lede recipe with its bottom margin dropped: the reference
            pill below carries its own top margin. */}
        <p className="text-[15.5px] text-bk-ink-2">
          We will collect from {data.line1} on {collection ? longDate(collection) : ""} between{" "}
          {data.collectionSlot}.
        </p>
        <p className="mt-4 inline-flex items-baseline gap-2.5 rounded-pill bg-bk-paper-2 px-5 py-3 text-[13px] font-bold uppercase tracking-[.8px] text-bk-ink-3">
          Order{" "}
          {/* A deep link to /book/confirmed has no order behind it. The
              source's container supplied the same placeholder rather
              than printing "Order" with nothing after it. */}
          <b className="text-[17px] normal-case tracking-normal text-bk-ink">
            {reference || "LF-000000"}
          </b>
        </p>
      </div>

      <div className={DIVIDER} />

      <h2 className={SEC_H}>What happens next</h2>
      <ol className="mt-1.5">
        {steps.map(([title, body], i) => (
          <li
            key={title}
            className={cn("flex gap-[14px] py-[14px] text-left", i ? " border-t border-t-bk-line" : "")}
          >
            <span
              className="flex h-7 w-7 flex-none items-center justify-center rounded-[50%] bg-bk-ink text-[13px] font-bold text-white"
              aria-hidden="true"
            >
              {i + 1}
            </span>
            {/* Scoped to the text wrapper, never a bare element selector.
                In the source a descendant rule like `.lfb-next span` scores
                0,1,1 and beats the numbered circle's own class — which is
                how those circles ended up grey-on-black the first time. */}
            <span>
              <b className="block text-[15px] font-semibold">{title}</b>
              <span className="mt-0.5 block text-[14px] text-bk-ink-2">{body}</span>
            </span>
          </li>
        ))}
      </ol>

      {isNewAccount && (
        <>
          <div className={DIVIDER} />
          <h2 className={SEC_H}>Keep your account</h2>
          <p className={SEC_P}>
            We created an account for {data.email} with this booking. Your order is placed either
            way — these just make it yours to manage.
          </p>
          {verified ? (
            <Notice icon={P.tick} title="Email confirmed">
              You can track this order and every one after it from {data.email}.
            </Notice>
          ) : (
            <div className={CARD}>
              <Field
                label={`${CODE_LENGTH}-digit code`}
                id={`${ids}-vc`}
                hint={codeHint}
              >
                <Input
                  id={`${ids}-vc`}
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
                surface="booking" variant="ink" block className="gap-2"
                disabled={code.length !== CODE_LENGTH || busy}
                isLoading={busy}
                onClick={() => void submitCode()}
              >
                {busy && <Loader className="h-4 w-4" />}
                Confirm my email
              </Button>
              {error && (
                <p className={cn(ERR, "mt-2.5")} role="alert">
                  <Icon icon={P.alert} size={15} className="mt-0.5 flex-none" />
                  {error}
                </p>
              )}
              <p className="mt-3 text-center text-[13.5px] text-bk-ink-2">
                <Button variant="bare"
                  className={cn("cursor-pointer border-none bg-transparent p-0 text-[13.5px] font-medium underline underline-offset-[3px] disabled:cursor-default disabled:opacity-50")}
                  disabled={cooldown > 0 || busy || sending}
                  onClick={() => {
                    setCode("");
                    void sendCode();
                  }}
                >
                  {sending
                    ? "Sending…"
                    : cooldown > 0
                      ? `Send a new code in ${cooldown}s`
                      : "Send a new code"}
                </Button>
              </p>
            </div>
          )}

          {/* Second, and quieter. A password is for the booking after this
              one, so it does not deserve the same weight as the thing that
              makes this one trackable. */}
          <div className="mt-3">
            {pwSent ? (
              <Notice icon={P.mail} tone="plain" title="Check your email">
                The link we sent to {data.email} will let you choose a password.
              </Notice>
            ) : (
              <Button
                surface="booking" variant="ghost" size="lg" block
                onClick={() => {
                  setPwSent(true);
                  void requestPasswordReset(data.email);
                }}
              >
                Email me a link to set a password
              </Button>
            )}
          </div>
        </>
      )}

      <div className={DIVIDER} />

      {/* Preferences live here rather than in the checkout: they are
          genuine choices, and asking for them mid-booking adds friction
          before anything has been committed. Price Review is off by
          default — opting people into an approval step they did not ask
          for would delay their own order. */}
      <h2 className={SEC_H}>Set your preferences</h2>
      <p className={SEC_P}>
        Optional, and changeable any time. We save these to your account and apply them to every
        order.
      </p>
      <div className={CARD}>
        {PREFERENCES.map(([key, title, desc], i) => (
          <div key={key} className={i ? "mt-[18px]" : ""}>
            <label className={TOGGLE}>
              <input
                className={CONTROL_PEER}
                type="checkbox"
                checked={data.prefs[key]}
                onChange={(e) => patch({ prefs: { ...data.prefs, [key]: e.target.checked } })}
              />
              <span className={SWITCH} aria-hidden="true" />
              <span className={TOGGLE_TEXT}>
                <b className={TOGGLE_TITLE}>{title}</b>
                <span className={TOGGLE_SUB}>{desc}</span>
              </span>
            </label>
          </div>
        ))}
      </div>

      <ActionBar more={moreBelow}>
        <Link className={bkBtn({ size: "lg", block: true })} href="/">
          Back to home
        </Link>
      </ActionBar>
    </>
  );
}
