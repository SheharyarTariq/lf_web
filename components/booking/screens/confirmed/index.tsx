"use client";

/* ══════════════════════════════════════════════════════════════════
   5 · Confirmed
   ══════════════════════════════════════════════════════════════════ */

import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import Link from "next/link";
import { useId, useState } from "react";
import { Icon, P } from "@/components/booking/icons";
import ActionBar from "@/components/booking/common/ActionBar";
import Field from "@/components/booking/common/Field";
import Notice from "@/components/booking/common/Notice";
import { useBooking } from "@/utils/booking/context";
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
  const ids = useId();
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const collection = parseDay(data.collectionDay);

  /* The discount only earns a mention here if there is one — a sentence
     about a discount that does not exist is worse than no sentence. */
  const steps = NEXT_STEPS.map(([title, body]) =>
    title === "We price and charge"
      ? ([
          title,
          `Each item is priced from our published list${
            discount ? ", your first-order discount comes off" : ""
          }, then your saved card is charged. Full breakdown by email.`,
        ] as [string, string])
      : ([title, body] as [string, string]),
  );

  return (
    <>
      <div className="pt-2 text-center">
        <div className="mx-auto mb-[22px] flex h-[76px] w-[76px] items-center justify-center rounded-[50%] bg-brand">
          <Icon d={P.tick} size={38} strokeWidth="2.4" />
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
            className={`flex gap-[14px] py-[14px] text-left${i ? " border-t border-t-bk-line" : ""}`}
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
            We created an account for {data.email} with this booking. Set a password to track the
            order and skip the form next time.
          </p>
          {saved ? (
            <Notice icon={P.tick} title="Password set">
              You can sign in with {data.email} any time.
            </Notice>
          ) : (
            <div className={CARD}>
              <Field label="Choose a password" id={`${ids}-np`} hint="At least 8 characters.">
                <Input
                  id={`${ids}-np`}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </Field>
              <Button
                surface="booking" variant="ink" block
                disabled={password.length < 8}
                onClick={() => setSaved(true)}
              >
                Save password
              </Button>
            </div>
          )}
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
