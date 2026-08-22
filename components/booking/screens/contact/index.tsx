"use client";

/* ══════════════════════════════════════════════════════════════════
   3 · Details
   ══════════════════════════════════════════════════════════════════ */

import { validateFormSync } from "@/utils/validation";
import { contactSchema } from "./schema";
import { cn } from "@/utils/cn";
import Input from "@/components/common/Input";
import PhoneInput from "@/components/common/PhoneInput";
import Button from "@/components/common/Button";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import IdentityPanel from "@/components/booking/identity-panel";
import { useAuth } from "@/components/common/AuthProvider";
import { Icon, P, ProviderMark } from "@/components/booking/icons";
import ActionBar from "@/components/booking/common/ActionBar";
import Field from "@/components/booking/common/Field";
import { useBooking } from "@/utils/booking/context";
import { EMAIL_RE, domainSuggestions } from "@/utils/booking/model";
import { UK_MOBILE_RE } from "@/utils/auth/model";
import {
  BTN_LINK,
  H1,
  LEDE,
  NAV_BACK,
  NAV_FORWARD,
  } from "@/utils/booking/styles";


/* In flow rather than floating over the page. There is nothing under the
   email field but the identity panel, which is shut while an address is
   still being typed, so a dropdown buys only the risk of being clipped
   by a scroll container.

   The scroll margins clear the sticky action bar and the header when it
   is scrolled into view, or the last two options sit behind them. */
const SUG =
  "mt-1.5 rounded-card-md border border-bk-line-2 bg-white p-1 " +
  "shadow-[0_12px_26px_-20px_rgba(20,20,15,.55)] " +
  "scroll-mb-[104px] scroll-mt-[calc(var(--bk-hdr-h)+12px)]";
const SUG_BTN =
  "block min-h-11 w-full cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap " +
  "rounded-card-sm border-0 px-3 py-[11px] text-left text-[14.5px] leading-[1.6] text-bk-ink-3";


export default function ContactScreen() {
  const { data, patch, go, back, wide, moreBelow, openLogin } = useBooking();
  /* A session settles the address. The panel below exists to establish who
     somebody is, and there is nothing left to establish — so for a signed-in
     customer the address is shown rather than asked for, and the panel never
     mounts. */
  const { user, refreshSession } = useAuth();
  const signedIn = Boolean(user);
  const ids = useId();
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [sugIndex, setSugIndex] = useState(-1);
  const [sugDismissed, setSugDismissed] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const emailValid = EMAIL_RE.test(data.email.trim());

  /* One schema drives both the message and the rule. Still gated on `touched`,
     so nothing is flagged before it has been filled in and left — the field
     order of the form is not the order people fill it in. */
  const failed = validateFormSync(contactSchema, data);
  const errors = {
    fullName: touched.fullName ? failed.fullName || "" : "",
    mobile: touched.mobile ? failed.mobile || "" : "",
    email: touched.email ? failed.email || "" : "",
  };

  const restValid = Boolean(data.fullName.trim() && UK_MOBILE_RE.test(data.mobile.trim()));
  const valid = restValid && emailValid;

  /* Everything the panel needs to be worth showing: an address to register,
     somebody who is not already signed in, and nothing settled yet.

     There is no account probe behind this any more. The mock it replaced
     asked an endpoint that does not exist and should not — an unauthenticated
     yes/no on any address typed into a box is an enumeration oracle. The
     panel now opens on "create an account" and finds out the other way, from
     the 422 that /register answers for an address it already holds. See the
     header of IdentityPanel. */
  const showPanel = emailValid && !data.verified && !signedIn;

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  /* The panel opens below the fold on a phone, so the spinner finishes
     and the thing it was fetching is off screen. "nearest" scrolls the
     least it can, and does nothing at all when the panel is already in
     view — which is most of the time on a desktop. */
  const reducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!showPanel || !panelRef.current) return;
    panelRef.current.scrollIntoView({
      block: "nearest",
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  }, [showPanel]);

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    patch({ email: e.target.value, verified: false, identity: "" });
    setSugDismissed(false);
    setSugIndex(-1);
  };

  /* Most people never wait for either pause: they tap a domain. The list
     is the fast path, the timers are the safety net under it. */
  const suggestions = useMemo(() => domainSuggestions(data.email), [data.email]);
  const sugOpen = emailFocus && !sugDismissed && !data.verified && suggestions.length > 0;

  const chooseSuggestion = (addr: string) => {
    patch({ email: addr, verified: false, identity: "" });
    setSugDismissed(true);
    setSugIndex(-1);
  };

  /* Same problem as the panel, worse: the email field sits low, so the
     list opened below the fold and behind the action bar — four options
     offered, two visible, and no reason for anyone to suspect the rest
     were there. Re-runs as the list grows and shrinks with the typing. */
  const sugRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!sugOpen || !sugRef.current) return;
    sugRef.current.scrollIntoView({
      block: "nearest",
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  }, [sugOpen, suggestions.length]);

  const onEmailKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!sugOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSugIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSugIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && sugIndex >= 0) {
      e.preventDefault();
      chooseSuggestion(suggestions[sugIndex]);
    } else if (e.key === "Escape") {
      setSugDismissed(true);
      setSugIndex(-1);
    }
  };

  /* Wide drops the review screen, so Next lands on payment there. */
  const next = () => go(wide ? "payment" : "review");

  /* Registering or logging in is the last thing this screen asks for, so
     once it lands there is nothing left here to do — move on rather than
     making someone hunt for a Next button that just went live.

     Only when the rest is already filled, which is the ordinary case
     since email sits last. If a field is still empty, jumping past it
     would strand the person on Review with a gap they never saw; focus
     the gap instead. Deliberately no error flash — being marked wrong
     immediately after succeeding reads as a punishment. */
  /* Registering or logging in is the last thing this screen asks for, so
     once it lands there is nothing left here to do — move on rather than
     making someone hunt for a Next button that just went live.

     Only when the rest is already filled, which is the ordinary case
     since email sits last. If a field is still empty, jumping past it
     would strand the person on Review with a gap they never saw; focus
     the gap instead. Deliberately no error flash — being marked wrong
     immediately after succeeding reads as a punishment.

     The booking's address is *not* saved here, even though this is the first
     moment there is an account to save it against. It is saved once, in
     confirmOrder — see the note there. Doing it at this point would cover the
     panel and miss every other way a session can appear on this screen: the
     Log in link, the header, another tab. */
  const onResolved = () => {
    void refreshSession();
    if (restValid) {
      /* A beat, so the confirmation registers as a result of the tap
         rather than the screen changing under the finger. */
      advanceTimer.current = setTimeout(next, 400);
      return;
    }
    const gap = data.fullName.trim() ? mobileRef : nameRef;
    gap.current?.focus();
  };

  /* Changing the address un-verifies it, so the card and the panel swap
     back automatically. Pressing Change alone does not — someone who
     opens the field, reads it and leaves it alone is still signed in. */
  const changeEmail = () => {
    setEditingEmail(true);
    requestAnimationFrame(() => {
      emailRef.current?.focus();
      emailRef.current?.select();
    });
  };

  return (
    <>
      <h1 className={H1} tabIndex={-1}>
        Enter contact details
      </h1>
      {!data.verified && (
        <p className={LEDE}>
          Returning customer?{" "}
          <Button variant="bare" className={BTN_LINK} onClick={() => openLogin()}>
            Log in
          </Button>
          .
        </p>
      )}

      {data.verified && (
        <div className="mb-4 flex items-center gap-3 rounded-card-md border border-bk-line bg-white px-[14px] py-3">
          <span
            className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-card-sm bg-bk-paper-2"
            aria-hidden="true"
          >
            {data.identity ? <ProviderMark id={data.identity} /> : <Icon icon={P.tick} size={18} />}
          </span>
          <span className="min-w-0 flex-auto">
            <b className="block text-[14.5px] font-bold">Signed in</b>
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-bk-ink-3">
              {data.email}
            </span>
          </span>
          {/* Sibling of the text, not a child of it: in the source a
              descendant rule there would outrank any class on the
              button.

              Absent for a signed-in customer. The address on the card is the
              one their account is keyed on — changing it here would only
              un-verify the checkout's copy and hand them back to the code
              step, and /users/{id}/change-email refuses a verified address
              anyway. Signing out is the way to book as somebody else. */}
          {!signedIn && (
            <Button variant="bare"
              className="-my-1.5 -mr-1.5 flex min-h-11 min-w-11 flex-none cursor-pointer items-center justify-center rounded-card-sm border-0 bg-transparent px-1.5 text-[13.5px] font-semibold leading-[1.6] text-bk-ink underline underline-offset-[3px] hover:text-brand-ink"
              onClick={changeEmail}
            >
              Change
            </Button>
          )}
        </div>
      )}

      <Field label="Full name" id={`${ids}-fn`} error={errors.fullName}>
        <Input
          id={`${ids}-fn`}
          ref={nameRef}
          value={data.fullName}
          onChange={(e) => patch({ fullName: e.target.value })}
          onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
          placeholder="Full name"
          autoComplete="name"
          aria-invalid={errors.fullName ? "true" : undefined}
          aria-describedby={errors.fullName ? `${ids}-fn-err` : undefined}
        />
      </Field>

      <Field label="Mobile number" id={`${ids}-mb`} error={errors.mobile}>
        {/* Behind a fixed +44, the same field the account form uses. It was a
            free text box, which let somebody type their own +44 in front of the
            one we then added — a correct number, refused. */}
        <PhoneInput
          surface="booking"
          id={`${ids}-mb`}
          ref={mobileRef}
          value={data.mobile}
          onChange={(mobile) => patch({ mobile })}
          onBlur={() => setTouched((t) => ({ ...t, mobile: true }))}
          placeholder="7700 900123"
          error={errors.mobile}
          aria-describedby={errors.mobile ? `${ids}-mb-err` : undefined}
        />
      </Field>
      <Field label="Email address" id={`${ids}-em`} error={errors.email}>
        {/* The spinner sits in the field rather than under it, so the
            wait is attached to the thing being waited on and nothing
            below moves while it runs. Block, not inline, or the
            label-to-field rhythm shifts by the line-height. */}
        <span className="relative block">
          <Input
            id={`${ids}-em`}
            ref={emailRef}
            type="email"
            value={data.email}
            onChange={onEmailChange}
            onFocus={() => setEmailFocus(true)}
            onKeyDown={onEmailKeyDown}
            onBlur={() => {
              setTouched((t) => ({ ...t, email: true }));
              setEmailFocus(false);
              if (data.verified) setEditingEmail(false);
            }}
            placeholder="you@example.com"
            autoComplete="email"
            readOnly={data.verified && !editingEmail}
            role="combobox"
            aria-expanded={sugOpen}
            aria-controls={`${ids}-sug`}
            aria-autocomplete="list"
            aria-activedescendant={sugOpen && sugIndex >= 0 ? `${ids}-sug-${sugIndex}` : undefined}
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? `${ids}-em-err` : undefined}
          />
        </span>
        {sugOpen && (
          <ul className={SUG} id={`${ids}-sug`} ref={sugRef} role="listbox" aria-label="Email suggestions">
            {suggestions.map((s, i) => (
              <li key={s} id={`${ids}-sug-${i}`} role="option" aria-selected={i === sugIndex}>
                {/* mousedown, not click, for the preventDefault: without
                    it the field blurs first, which fires the check for
                    the half-typed address and closes the list before the
                    tap lands on anything. */}
                <Button variant="bare"
                  className={cn(SUG_BTN, i === sugIndex ? "bg-bk-paper-2" : "bg-transparent hover:bg-bk-paper-2")}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => chooseSuggestion(s)}
                  tabIndex={-1}
                >
                  {s.slice(0, s.indexOf("@"))}
                  {/* The domain is the part being chosen, so it is the
                      part in ink. */}
                  <b className="font-semibold text-bk-ink">{s.slice(s.indexOf("@"))}</b>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Field>


      {showPanel && (
        /* The scroll target. These margins are what stop scrollIntoView
           tucking the panel under the sticky header or behind the action
           bar. */
        <div
          className="scroll-mb-[104px] scroll-mt-[calc(var(--bk-hdr-h)+12px)]"
          ref={panelRef}
        >
          <IdentityPanel
            key={data.email}
            data={data}
            patch={patch}
            onLogin={openLogin}
            onResolved={onResolved}
          />
        </div>
      )}

      <ActionBar more={moreBelow} nav>
        <Button
          surface="booking" variant="ghost" size="lg" className={NAV_BACK}
          onClick={back}
        >
          Back
        </Button>
        <Button
          surface="booking" size="lg" className={NAV_FORWARD}
          disabled={!valid || !data.verified}
          onClick={() => {
            setTouched({ fullName: true, mobile: true, email: true });
            if (valid && data.verified) next();
          }}
        >
          Next
        </Button>
      </ActionBar>
    </>
  );
}
