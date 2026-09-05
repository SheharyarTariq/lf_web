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
import { useIdentity } from "@/components/booking/identity-panel/use-identity";
import { useAuth } from "@/components/common/AuthProvider";
import { Icon, P, ProviderMark } from "@/components/booking/icons";
import ActionBar from "@/components/booking/common/ActionBar";
import Field from "@/components/booking/common/Field";
import { useBooking } from "@/utils/booking/context";
import { useConfirmSubmit } from "@/utils/booking/use-confirm";
import { EMAIL_RE, domainSuggestions } from "@/utils/booking/model";
import { UK_MOBILE_RE, isValidName } from "@/utils/auth/model";
import {
  BTN_LINK,
  ERR,
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
  const { data, patch, forward, back, isLast, moreBelow, openLogin } = useBooking();
  /* This screen can be the last one in the walk, which it never used to be:
     a returning customer whose card is on file skips Payment, and on a wide
     window that leaves Details at the tail whenever its Edit link has put the
     step back. Then this press places the order rather than moving on — the
     same rule, and the same hook, as Time and Review. */
  const { busy, error: confirmError, submit } = useConfirmSubmit();
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

  /* One schema drives both the message and the rule. The messages themselves
     are assembled below, after the identity hook, because the server can name
     these same fields and its answer belongs under the same boxes. */
  const failed = validateFormSync(contactSchema, data);

  /* The name is rule-tested rather than merely non-empty, the same way the
     mobile beside it is. It used to be a `.trim()` truthiness check, which is
     how "3" got as far as lighting up the Next button and being sent to Stripe
     as a billing name — the schema knew it was wrong, but nothing that could
     stop anybody was asking the schema. */
  const restValid = Boolean(isValidName(data.fullName) && UK_MOBILE_RE.test(data.mobile.trim()));
  const valid = restValid && emailValid;

  /* Everything the panel needs to be worth showing: an address to register,
     somebody who is not already signed in, and nothing settled yet.

     There is no account probe behind this, and none is wanted — an
     unauthenticated yes/no on any address typed into a box is an enumeration
     oracle. The panel opens on "create an account" for everybody, and the
     server quietly does the right thing for an address it already holds. See
     the header of IdentityPanel. */
  const showPanel = emailValid && !data.verified && !signedIn;

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  const reducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const panelRef = useRef<HTMLDivElement>(null);

  const onEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    patch({ email: e.target.value, verified: false, identity: "" });
    setSugDismissed(false);
    setSugIndex(-1);
  };

  /* Most people never wait for either pause: they tap a domain. The list
     is the fast path, the timers are the safety net under it. */
  const suggestions = useMemo(() => domainSuggestions(data.email), [data.email]);
  const sugOpen = emailFocus && !sugDismissed && !data.verified && suggestions.length > 0;

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

  /* Wide drops the review screen, so Next lands on payment there — but that is
     the shell's answer to give, not this screen's. `forward` walks the route
     list the flow is actually using, which is the same list the stepper and the
     Back button read. */
  const next = forward;

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
    const gap = isValidName(data.fullName) ? mobileRef : nameRef;
    gap.current?.focus();
  };

  /* The panel's button is a submit of the two fields above it, so it reveals
     their gaps the way any submit does, and refuses rather than sending a name
     or a number the API will only refuse itself.

     Marking them touched is the point of it. A mobile seeded from /my-status
     has never been blurred, so a bad one that arrived with the session had
     never had cause to render its error — the field looked accepted, and the
     only sign anything was wrong came back from the server, in the wrong words
     and under the wrong control. */
  const guard = () => {
    setTouched((t) => ({ ...t, fullName: true, mobile: true }));
    if (restValid) return true;
    /* Same first-gap idiom as `onResolved`: land in the field that is wrong
       rather than at the top of the form. */
    const gap = isValidName(data.fullName) ? mobileRef : nameRef;
    gap.current?.focus();
    return false;
  };

  /* Held here rather than in the panel because the code is submitted by the
     Next button below, not by anything inside the panel. Declared after
     `onResolved` for the plain reason that it takes it. */
  const identity = useIdentity({ data, patch, onResolved, guard });

  /* Waiting on the six digits: Next redeems them instead of moving on, and
     only moves on if they are right. `data.verified` is the far side of that —
     once it is set there is nothing left for this screen to settle. */
  const codeStep = !data.verified && showPanel && identity.phase === "code";

  /* The address is good, nobody is signed in, and no code has gone out yet:
     the one state in which something still has to ask for one. Both doors that
     do so — the arrow in the field and the Next button — read this. */
  const sendStep = showPanel && identity.phase === "create";

  /* The code card opens below the fold on a phone, so the send finishes and
     the box it was asking for is off screen. "nearest" scrolls the least it
     can, and does nothing at all when the card is already in view — which is
     most of the time on a desktop. Keyed on the code step rather than on the
     panel's old visibility: it is the one moment the card appears. */
  useEffect(() => {
    if (!codeStep || !panelRef.current) return;
    panelRef.current.scrollIntoView({
      block: "nearest",
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  }, [codeStep]);

  /* Still gated on `touched`, so nothing is flagged before it has been filled
     in and left — the field order of the form is not the order people fill it
     in. The server's answer needs no such gate: it is only ever the reply to a
     button somebody pressed. The live rule wins where both have something to
     say, being the more current statement about what is in the box. */
  const errors = {
    fullName: (touched.fullName ? failed.fullName : "") || identity.fieldErrors.fullName || "",
    mobile: (touched.mobile ? failed.mobile : "") || identity.fieldErrors.mobile || "",
    /* A refusal the server pinned on no field used to have the panel's own
       line to live on, under the button that caused it. That button is in the
       email field now, so its answer belongs under the email field — but only
       while we are still asking for a code. In the code phase this same string
       is the wrong-code message, and it belongs in the panel beside the box it
       is about, not up here against an address that is fine. */
    email:
      (touched.email ? failed.email || "" : "") ||
      (identity.phase === "create" ? identity.error : "") ||
      "",
  };

  /* Whether this press places the order. Neither of the other two can overlap
     with it in practice — the walk only ends here for a signed-in account with
     a card on file, and `showPanel` is false for exactly those — but the
     button reads this once rather than asking three times, so each step keeps
     its own answer whatever the walk is doing. */
  const placing = isLast && !codeStep && !sendStep;

  const chooseSuggestion = (addr: string) => {
    patch({ email: addr, verified: false, identity: "" });
    setSugDismissed(true);
    setSugIndex(-1);
    /* The tap is the send. Picking a domain settles the address, and there is
       nothing further to ask about it, so the code goes out on the tap rather
       than behind a card that would only have restated what was just chosen.

       Only when the two fields `register` guards on are already good, which is
       the ordinary case since email sits last. Answering a tap on a domain by
       throwing the focus out of the address just chosen reads as a rejection
       of the tap; leave the arrow in the field instead and let them press it
       once the gap above is filled.

       The address goes with the call because `patch` is a render behind — see
       the note on `register`. */
    if (restValid) void identity.register(addr);
  };

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

      {/* Said out loud, because the fields below look like account settings and
          are not. Nothing here is saved to the account: POST /orders carries no
          contact fields, and there is no endpoint to update a name or a number
          — see docs/ENDPOINTS.md. An edit lasts as long as this booking and is
          replaced by /my-status on the next load. Only for a signed-in
          customer, who is the only one with an account to be confused about;
          for a guest these fields are the whole record. */}
      {signedIn && (
        <p className="-mt-2 mb-4 text-[12.5px] leading-[1.5] text-bk-ink-3">
          Changes here apply to this order only — your account details stay as they are.
        </p>
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
        {/* The send button sits in the field rather than under it, so the
            action is attached to the thing it acts on and nothing below
            moves when it appears. Block, not inline, or the label-to-field
            rhythm shifts by the line-height. */}
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
            /* INPUT already carries px-[15px]; a single-side utility sorts
               after it, so this is what clears the button. Same trick
               TEXTAREA documents in utils/booking/styles.ts. */
            className={cn(sendStep && "pr-[52px]")}
            role="combobox"
            aria-expanded={sugOpen}
            aria-controls={`${ids}-sug`}
            aria-autocomplete="list"
            aria-activedescendant={sugOpen && sugIndex >= 0 ? `${ids}-sug-${sugIndex}` : undefined}
            aria-invalid={errors.email ? "true" : undefined}
            aria-describedby={errors.email ? `${ids}-em-err` : undefined}
          />
          {/* For the address typed out in full, which never touches the
              suggestion list and so never gets the tap that would have sent
              the code. A sibling of the field rather than a child, so it
              stays outside the combobox wiring above.

              Deliberately no tabIndex={-1}, unlike the password eye this
              borrows its shape from: that toggle only restates what is
              already on screen, while this is the action the screen is
              waiting for, and a keyboard has to be able to reach it. */}
          {sendStep && (
            <Button
              variant="bare"
              className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer
                         items-center justify-center rounded-[50%] border-none bg-brand
                         text-bk-ink hover:bg-brand-hover"
              /* Not a hand-rolled spinner: <Button> owns that treatment, and
                 the last time this screen assembled its own the button grew by
                 the spinner's width mid-press. It also disables itself while
                 busy, so the double-send guard is not this call site's to
                 write. */
              isLoading={identity.busy}
              aria-label="Send verification code"
              /* Same reason the suggestion options do it: without the
                 preventDefault the field blurs first and the click lands on
                 nothing. */
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void identity.register()}
            >
              <Icon icon={P.chevron} size={18} />
            </Button>
          )}
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


      {/* Only once a code is actually in the post. The "Create your account"
          card that used to stand here is gone — the field above sends the
          code, so a panel whose whole content was a button to send one had
          nothing left to say.

          Its terms-and-privacy line went with it, and is not missed: the
          Payment step carries a required "I agree to the terms and privacy
          policy" box that gates Confirm order, and `skipPayment` is only ever
          set for an account with a saved card — which nobody registering here
          for the first time has. So every new account still passes that box
          before an order is placed, and one tick is enough. */}
      {codeStep && (
        /* The scroll target. These margins are what stop scrollIntoView
           tucking the panel under the sticky header or behind the action
           bar. */
        <div
          className="scroll-mb-[104px] scroll-mt-[calc(var(--bk-hdr-h)+12px)]"
          ref={panelRef}
        >
          {/* No `key` on the address any more: the state it used to reset now
              lives in useIdentity, which drops it on a change of email
              itself. */}
          <IdentityPanel data={data} identity={identity} />
        </div>
      )}

      {/* The order's own failure, not a field's, so it sits with the button
          that caused it rather than under any box. Only ever reachable when
          this screen is the last one. */}
      {confirmError && (
        <p className={cn(ERR, "mt-3")} role="alert">
          <Icon icon={P.alert} size={15} className="mt-0.5 flex-none" />
          {confirmError}
        </p>
      )}

      <ActionBar more={moreBelow} nav>
        <Button
          surface="booking" variant="ghost" size="lg" className={NAV_BACK}
          onClick={back}
          disabled={busy}
        >
          Back
        </Button>
        {/* Four jobs, one button. On the send step it asks for the code — the
            same call the arrow in the email field makes, because the arrow is
            easy to miss and a Next that is dead with every box filled in is
            worse than one that says what it wants. On the code step it is the
            submit: it redeems the six digits and the screen moves on by itself
            when they are accepted (onResolved, above), or shows the refusal in
            the panel when they are not. At the tail of the walk it places the
            order. Everywhere else it is just Next.

            The label names where the press lands, the same rule Time and
            Review follow: nothing may promise a screen the walk does not
            contain. */}
        <Button
          surface="booking" size="lg" className={NAV_FORWARD}
          disabled={
            !valid ||
            (codeStep ? !identity.canSubmitCode : sendStep ? identity.busy : !data.verified)
          }
          isLoading={codeStep || sendStep ? identity.busy : placing ? busy : undefined}
          onClick={() => {
            setTouched({ fullName: true, mobile: true, email: true });
            if (!valid) return;
            /* Before the code step, and they cannot both be true — they are
               the two halves of `phase`. `valid` implies the name and mobile
               `register` guards on are good, so this door and the arrow can
               never disagree about whether the send is allowed. */
            if (sendStep) {
              void identity.register();
              return;
            }
            if (codeStep) {
              void identity.submitCode();
              return;
            }
            if (!data.verified) return;
            if (placing) {
              void submit();
              return;
            }
            next();
          }}
        >
          {sendStep ? "Send code" : placing ? "Confirm order" : "Next"}
        </Button>
      </ActionBar>
    </>
  );
}
