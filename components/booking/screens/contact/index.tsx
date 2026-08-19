"use client";

/* ══════════════════════════════════════════════════════════════════
   3 · Details
   ══════════════════════════════════════════════════════════════════ */

import { validateFormSync } from "@/utils/validation";
import { contactSchema } from "./schema";
import { cn } from "@/utils/cn";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import IdentityPanel from "@/components/booking/identity-panel";
import { useAuth } from "@/components/common/AuthProvider";
import { Icon, P, ProviderMark } from "@/components/booking/icons";
import ActionBar from "@/components/booking/common/ActionBar";
import Field from "@/components/booking/common/Field";
import { useBooking } from "@/utils/booking/context";
import { checkAccount, mobileHasAccount } from "@/utils/booking/mocks";
import {
  EMAIL_RE,
  UK_MOBILE_RE,
  domainComplete,
  domainSuggestions,
} from "@/utils/booking/model";
import {
  BTN_LINK,
  H1,
  LEDE,
  NAV_BACK,
  NAV_FORWARD,
  } from "@/utils/booking/styles";

/* The link must not outweigh the sentence it sits in — at 600 it read as
   a heading and pushed the whole thing onto two lines. */
const NUDGE = "-mt-2 mb-[14px] text-[13px] leading-[1.5] text-bk-ink-2";
const NUDGE_LINK =
  "cursor-pointer border-none bg-transparent p-0 text-[13px] font-medium leading-[1.5] " +
  "text-bk-ink-2 underline underline-offset-[3px] hover:text-bk-ink";

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

/* Type states the union outright rather than leaving it inferred: the
   screen has to tell "not asked yet" from "asked and it failed". */
type Check = { exists: boolean } | "failed" | null;

/* Three ways an address arrives, and blur only catches one of them.
   Autofill leaves the cursor sitting in the field, so waiting for blur
   meant the panel never opened and Next stayed disabled with nothing
   on screen saying why — a dead end, and the disabled button gives no
   feedback to explain it.

   Autofill and paste deliver the whole value in one go, so there is
   nothing to wait for. Chrome reports no inputType for autofill;
   Safari and Firefox use insertReplacementText. Typing still waits,
   but now on a pause rather than on blur, so someone who types their
   address and simply stops is not stranded either.

   Two pauses, because "still typing" is not one state. An address
   already ending in a domain we know in full has nothing left to come,
   so it goes almost at once. Anything else waits longer, since firing
   early on an unfamiliar domain wastes a round trip and drops a
   spinner on an address still being written. */
const WHOLE_VALUE = ["insertReplacementText", "insertFromPaste"];
const PAUSE_KNOWN_MS = 350;
const PAUSE_MS = 1200;

export default function ContactScreen() {
  const { data, patch, go, back, wide, moreBelow, openLogin } = useBooking();
  /* A session settles the address. The account-check and the code below both
     exist to establish who somebody is, and there is nothing left to
     establish — so for a signed-in customer the address is shown, not asked
     for, and neither the check nor the code is reachable. */
  const { user } = useAuth();
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

  const mobileTaken =
    !signedIn && UK_MOBILE_RE.test(data.mobile.trim()) && mobileHasAccount(data.mobile);
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

  /* null while nothing has been asked, then { exists } or "failed". */
  const [check, setCheck] = useState<Check>(null);
  const [checking, setChecking] = useState(false);
  const checkId = useRef(0);

  /* The answer, once there is one and it is not the failure. Held as its
     own value so the panel below is guarded by the thing it reads from
     rather than by a boolean that only implies it. */
  const account = check && check !== "failed" ? check : null;
  const showPanel = Boolean(account) && emailValid && !data.verified && !signedIn;

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(advanceTimer.current);
      clearTimeout(settleTimer.current);
    },
    [],
  );

  /* Every settled address is a request, so the answers can arrive out of
     order — a slow first call landing after a fast second would describe
     the wrong address. Only the latest id is allowed to write. */
  const runCheck = (email: string) => {
    const id = ++checkId.current;
    setChecking(true);
    setCheck(null);
    checkAccount(email)
      .then((r) => {
        if (id !== checkId.current) return;
        setChecking(false);
        setCheck(r);
      })
      .catch(() => {
        if (id !== checkId.current) return;
        setChecking(false);
        /* Not silently treated as "no account". Registering a second
           account on an address that already has one is worse than
           asking someone to press a button again. */
        setCheck("failed");
      });
  };

  /* The address the answer on screen belongs to.
     Without this, blurring the field asked again for an address already
     answered — and after autofill the cursor is still in the field, so
     the first thing tapped is the panel's own button. The blur fires on
     mousedown, the panel unmounts before the click lands, and the tap is
     swallowed. Nothing happens, twice. */
  const checkedFor = useRef("");

  const settle = (value: string) => {
    const v = value.trim().toLowerCase();
    clearTimeout(settleTimer.current);
    if (!EMAIL_RE.test(v) || checkedFor.current === v) return;
    checkedFor.current = v;
    runCheck(value);
  };

  /* Coming back to this screen — from Back, from an Edit link, from the
     browser's own back button — remounts it, and the answer to the last
     check went with it. The address is still in the field, so nothing
     will ever ask again: no panel, Next disabled, no way forward and
     nothing on screen saying why. Ask on arrival instead. */
  useEffect(() => {
    if (!data.verified) settle(data.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const value = e.target.value;
    const type = (e.nativeEvent as InputEvent).inputType;
    patch({ email: value, verified: false, identity: "" });
    clearTimeout(settleTimer.current);
    setSugDismissed(false);
    setSugIndex(-1);
    /* Whatever was known about the old address no longer applies, and a
       check still in flight for it must not be allowed to land. */
    checkId.current += 1;
    checkedFor.current = "";
    setChecking(false);
    setCheck(null);

    if (!EMAIL_RE.test(value.trim())) return;
    if (!type || WHOLE_VALUE.includes(type)) {
      settle(value);
      return;
    }
    settleTimer.current = setTimeout(
      () => settle(value),
      domainComplete(value) ? PAUSE_KNOWN_MS : PAUSE_MS,
    );
  };

  /* Most people never wait for either pause: they tap a domain. The list
     is the fast path, the timers are the safety net under it. */
  const suggestions = useMemo(() => domainSuggestions(data.email), [data.email]);
  const sugOpen = emailFocus && !sugDismissed && !data.verified && suggestions.length > 0;

  const chooseSuggestion = (addr: string) => {
    patch({ email: addr, verified: false, identity: "" });
    clearTimeout(settleTimer.current);
    checkId.current += 1;
    checkedFor.current = "";
    setChecking(false);
    setCheck(null);
    setSugDismissed(true);
    setSugIndex(-1);
    /* Straight to the check. Picking from the list is as settled as an
       address gets — there is nothing left to wait for. */
    settle(addr);
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
  const onResolved = () => {
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
        <Input
          id={`${ids}-mb`}
          ref={mobileRef}
          type="tel"
          inputMode="tel"
          value={data.mobile}
          onChange={(e) => patch({ mobile: e.target.value })}
          onBlur={() => setTouched((t) => ({ ...t, mobile: true }))}
          placeholder="07xxx xxxxxx"
          autoComplete="tel"
          aria-invalid={errors.mobile ? "true" : undefined}
          aria-describedby={errors.mobile ? `${ids}-mb-err` : undefined}
        />
      </Field>
      {mobileTaken && !data.verified && (
        <p className={NUDGE} aria-live="polite">
          This number already has an account.{" "}
          <Button variant="bare" className={NUDGE_LINK} onClick={() => openLogin()}>
            Log in
          </Button>
        </p>
      )}

      <Field label="Email address" id={`${ids}-em`} error={errors.email}>
        {/* The spinner sits in the field rather than under it, so the
            wait is attached to the thing being waited on and nothing
            below moves while it runs. Block, not inline, or the
            label-to-field rhythm shifts by the line-height. */}
        <span className="relative block">
          <Input
            id={`${ids}-em`}
            ref={emailRef}
            className={checking ? "pr-[46px]" : ""}
            type="email"
            value={data.email}
            onChange={onEmailChange}
            onFocus={() => setEmailFocus(true)}
            onKeyDown={onEmailKeyDown}
            onBlur={() => {
              setTouched((t) => ({ ...t, email: true }));
              setEmailFocus(false);
              if (data.verified) setEditingEmail(false);
              if (!data.verified) settle(data.email);
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
          {checking && (
            <span
              className="pointer-events-none absolute right-4 top-1/2 -mt-[9px] h-[18px] w-[18px] rounded-[50%] border-2 border-bk-line-2 border-t-bk-ink-2 animate-spin-fast motion-reduce:animate-none motion-reduce:border-r-bk-ink-2 motion-reduce:border-b-bk-ink-2 motion-reduce:border-t-bk-line-2"
              aria-hidden="true"
            />
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
      {/* Announced, not just drawn, or the wait is silent to a screen
          reader while the button they want stays disabled. */}
      <span className="visually-hidden" role="status">
        {checking ? "Checking your email address" : ""}
      </span>

      {check === "failed" && (
        <p className={NUDGE} aria-live="polite">
          {/* Never assumed to mean "no account". Registering a second
              account on an address that already has one is the worse
              outcome, so this stops rather than guesses. */}
          We could not check that address just now.{" "}
          <Button variant="bare" className={NUDGE_LINK} onClick={() => runCheck(data.email)}>
            Try again
          </Button>
        </p>
      )}

      {showPanel && account && (
        /* The scroll target. These margins are what stop scrollIntoView
           tucking the panel under the sticky header or behind the action
           bar. */
        <div
          className="scroll-mb-[104px] scroll-mt-[calc(var(--bk-hdr-h)+12px)]"
          ref={panelRef}
        >
          <IdentityPanel
            key={data.email}
            known={account.exists}
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
