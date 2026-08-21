"use client";

/* ══════════════════════════════════════════════════════════════════
   Identity, settled on the contact screen
   ══════════════════════════════════════════════════════════════════

   Identity is settled here rather than at the order, so the account
   exists before anything is booked against it. The panel below cannot be
   dismissed — but only because the recommended path is a single tap, so
   there is nothing to escape from. A panel with no exit and no easy
   option would simply lose people.

   ── Which of the two states shows, and when ──────────────────────

   The design draws two: "Create your account", and "You already have an
   account" with a code box. It assumed an endpoint that answers whether an
   address is a customer. There is none, and there should not be — an
   unauthenticated yes/no on any address anybody types is an account
   enumeration oracle, which is why the mock it replaces was never going to
   ship as written.

   So the panel opens on **Create your account** and flips to the other state
   only when the server says so: `POST /register` answers 422 with
   `email: This email is already taken.`, and that *is* the account check —
   authoritative, rate-limited by whoever rate-limits registration, and only
   ever reachable by somebody who just tried to make an account on that
   address. The code is requested at the same moment, so the flip lands on a
   box with a code already on its way to it.

   Both design states survive intact. Only the moment we learn which one
   applies has moved, from a probe on blur to the press that needed the
   answer.
   ══════════════════════════════════════════════════════════════════ */

import { cn } from "@/utils/cn";
import Button from "@/components/common/Button";
import Loader from "@/components/common/Loader";
import { useEffect, useId, useRef, useState } from "react";
import { Icon, P } from "@/components/booking/icons";
import { toE164 } from "@/utils/api";
import {
  loginWithCode,
  registerAccount,
  requestVerificationCode,
  type AuthUser,
} from "@/utils/auth";
import {
  CODE_LENGTH,
  PASSWORD_RE,
  PASSWORD_RULE,
  RESEND_SECONDS,
  passwordStrength,
  type BookingData,
  type BookingPatch,
} from "@/utils/booking/model";
import { BTN_LINK, CODE_INPUT, ERR } from "@/utils/booking/styles";

const PANEL = "mb-1 rounded-card-lg bg-bk-paper-2 p-4";
const PANEL_H = "mb-1 text-[16px] font-bold leading-[1.3] tracking-[-.3px]";
const PANEL_P = "mb-3 text-[13.5px] leading-[1.5] text-bk-ink-2";
const ALT = "mt-2.5 text-center text-[13.5px] text-bk-ink-2";

/* Sits on the button it recommends, overlapping its top edge.

   White, not ink. A dark tag on a lime button is the highest-contrast
   thing on the panel, so the eye lands on the label instead of the
   button it is labelling — the tag ends up shouting louder than the
   thing it recommends. White reads as a quiet marker and lets the lime
   stay the loudest element.

   The 1px edge is for the panel background (#E9E9E4), which is close
   enough to white that the tag would otherwise have no edge where it
   overhangs the button. Rounded rectangle, not a pill, because it
   belongs to the button it sits on.

   From 721 the badge goes absolute, so the primary block is exactly
   button height and all three items in the row centre cleanly. */
const REC =
  "relative top-2.5 ml-3 inline-flex items-center gap-1 rounded-ctl-sm border border-bk-ink " +
  "bg-white px-2 py-[3px] text-[10px] font-bold uppercase tracking-[.35px] text-bk-ink " +
  "from-721:absolute from-721:-top-[11px] from-721:left-3 from-721:z-[1] from-721:ml-0";

/* The two paths are alternatives, so side by side from 721 reads as a
   choice rather than a sequence — and it saves about 80px of height. */
const CHOOSE = "from-721:mt-[22px] from-721:flex from-721:items-center from-721:gap-[14px]";
const PRIMARY = "block from-721:relative from-721:min-w-0 from-721:flex-[1_1_0]";

/* Just the word from 721. The rules either side are for a stacked
   divider, and across a row they would cut the panel in half.

   12 above, 16 below: the panel's own `margin: 12px 0` and the shared
   divider's `margin-bottom: 16px` are both (0,1,0) in the source and the
   shared one comes later, so it keeps the foot. */
const OR =
  "mb-4 mt-3 flex items-center gap-[14px] text-[13px] text-bk-ink-3 " +
  "before:h-px before:flex-auto before:bg-bk-line before:content-[''] " +
  "after:h-px after:flex-auto after:bg-bk-line after:content-[''] " +
  "from-721:mb-0 from-721:mt-0 from-721:flex-none from-721:text-[13.5px] " +
  "from-721:before:hidden from-721:after:hidden";

/* Field, reveal and submit in one row. A reveal because typing a new
   password blind is how people lock themselves out of the account they
   just made; Confirm inside the row because a second full-width button
   made the alternative look heavier than the recommended path. */
const PWROW =
  "flex items-center gap-0.5 rounded-ctl-lg border-[1.5px] border-bk-line-2 bg-white " +
  "py-1 pl-[15px] pr-1 focus-within:border-bk-ink " +
  "focus-within:shadow-[0_0_0_3px_rgba(20,20,15,.08)] " +
  "from-721:min-w-0 from-721:flex-[1_1_0]";

const RULE = "mt-[7px] text-[12px] leading-[1.45] text-bk-ink-3";

const METER_FILL = {
  weak: "bg-danger",
  ok: "bg-gold",
  strong: "bg-brand-ink",
} as const;

/** What the server calls an address it already holds. Matched on the field
 *  rather than on the sentence, so a reworded message still routes correctly. */
const TAKEN_FIELD = "email";

export default function IdentityPanel({
  data,
  patch,
  onLogin,
  onResolved,
}: {
  data: BookingData;
  patch: (next: BookingPatch) => void;
  onLogin: (prefill?: string) => void;
  /** Handed the account that now exists, because the caller has a booking to
   *  save against it and only the id can address the user endpoints. */
  onResolved?: (user: AuthUser) => void;
}) {
  const ids = useId();
  /* Which of the design's two states is on screen. Starts on "create" for
     everybody: nothing can be known about an address until something is tried
     against it. */
  const [known, setKnown] = useState(false);
  const [password, setPassword] = useState("");
  const [pwOpen, setPwOpen] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const strength = passwordStrength(password);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((n) => (n <= 1 ? 0 : n - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const done = (user: AuthUser) => {
    patch({ verified: true, identity: "" });
    onResolved?.(user);
  };

  /* The code goes out on the flip, and only then — never on sight of an
     address. `purpose: "login"` is the one /login-with-code redeems.

     Fired at most once per address: the panel is keyed on the email upstream,
     so a different address is a different component with its own ref. */
  const sentRef = useRef(false);
  const sendLoginCode = async () => {
    setCooldown(RESEND_SECONDS);
    setCode("");
    await requestVerificationCode(data.email, "login");
  };

  /* Both halves of the design's "Create your account" — the recommended
     one-click button and the password row beside it — are the same request.
     `plainPassword` is genuinely optional on /register, which is the only
     reason one tap can be the whole action. */
  const create = async (withPassword?: string) => {
    if (busy) return;
    setBusy(true);
    setError("");
    const r = await registerAccount({
      email: data.email,
      name: data.fullName,
      phone: toE164(data.mobile),
      password: withPassword,
    });
    if (r.ok) {
      setBusy(false);
      done(r.user);
      return;
    }
    /* The account check, arriving as a refusal. Flip to the other state and
       start the code on its way, so the box they land on is not one they have
       to prime themselves. */
    if (r.fields[TAKEN_FIELD]) {
      setKnown(true);
      setError("");
      if (!sentRef.current) {
        sentRef.current = true;
        await sendLoginCode();
      }
      setBusy(false);
      return;
    }
    setBusy(false);
    /* A violation on any other field is shown as-is: it is the server naming
       something we sent, and the fields it can name — name, phone — are all on
       the form directly above this panel. */
    setError(r.fields.name || r.fields.phone || r.message);
  };

  const submitCode = async () => {
    if (busy || code.length !== CODE_LENGTH) return;
    setBusy(true);
    setError("");
    const r = await loginWithCode(data.email, code);
    setBusy(false);
    if (r.ok) {
      done(r.user);
      return;
    }
    setError(r.message);
  };

  if (known) {
    return (
      <div className={PANEL} aria-live="polite">
        <p className={PANEL_H}>You already have an account</p>
        <p className={PANEL_P}>
          Manage your order by entering the {CODE_LENGTH}-digit code we have sent to{" "}
          <b className="font-semibold text-bk-ink [overflow-wrap:anywhere]">{data.email}</b>.
        </p>

        {/* Code and Log in on one row on anything wider than a phone,
            the same shape as the password row opposite. */}
        <div className="flex items-stretch gap-2.5">
          <input
            id={`${ids}-c`}
            className={cn(CODE_INPUT, "min-w-0 flex-auto")}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            value={code}
            disabled={busy}
            aria-label={`${CODE_LENGTH}-digit code`}
            aria-invalid={error ? "true" : undefined}
            placeholder="······"
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH));
              setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void submitCode();
            }}
          />
          <Button
            surface="booking" size="lg" className="flex-none gap-2"
            disabled={code.length !== CODE_LENGTH || busy}
            isLoading={busy}
            onClick={() => void submitCode()}
          >
            {busy && <Loader className="h-4 w-4" />}
            Log in
          </Button>
        </div>
        {error && (
          <p className={ERR} role="alert">
            <Icon icon={P.alert} size={16} className="mt-0.5 flex-none" />
            {error}
          </p>
        )}
        <p className={ALT}>
          <Button variant="bare"
            className={cn(BTN_LINK, "disabled:cursor-default disabled:opacity-50")}
            disabled={cooldown > 0 || busy}
            onClick={() => {
              setError("");
              void sendLoginCode();
            }}
          >
            {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
          </Button>
        </p>

        <p className={ALT}>
          <Button variant="bare" className={BTN_LINK} onClick={() => onLogin(data.email)}>
            Use a password instead
          </Button>
        </p>
      </div>
    );
  }

  return (
    <div className={PANEL} aria-live="polite">
      <p className={PANEL_H}>Create your account</p>
      <p className={PANEL_P}>
        Sign up with <b className="font-semibold text-bk-ink [overflow-wrap:anywhere]">{data.email}</b> to
        easily manage all your orders in one place.
      </p>

      {/* Stacked on a phone, side by side from 721px. */}
      <div className={CHOOSE}>
        <span className={PRIMARY}>
          <span className={REC}>
            <Icon icon={P.thumb} size={12} fill className="relative -top-[.5px]" />
            Recommended
          </span>
          <Button
            surface="booking" size="lg" block className="gap-2"
            disabled={busy}
            isLoading={busy}
            onClick={() => void create()}
          >
            {busy && <Loader className="h-4 w-4" />}
            {/* "One-click" carries the meaning nothing else does: that
                this is the entire action, not the start of a sign-up.
                It is also literally true — /register takes no password. */}
            One-click registration
          </Button>
        </span>

        <p className={OR}>
          <span>
            or
            {/* The password row is right there beside it from 721; naming
                it again in the middle of the row is 130px spent on a
                label for its neighbour. */}
            <span className="from-721:hidden"> set a password now</span>
          </span>
        </p>

        {/* One row, no label and no second full-width button. The
            placeholder names the field and Confirm sits inside it, so the
            alternative path costs three controls instead of six. */}
        <div className={PWROW}>
          <input
            /* px-0.5 is the UA's own 2px on a text input, which the
               source never resets — it sets the row's 15px lead-in and
               leaves the field's own inset alone. */
            className="h-10 min-w-0 flex-auto border-none bg-transparent px-0.5 text-[15px] leading-[1.6] text-bk-ink placeholder:text-bk-ink-3 focus:outline-none"
            id={`${ids}-pw`}
            type={showPw ? "text" : "password"}
            value={password}
            disabled={busy}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setPwOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && PASSWORD_RE.test(password)) void create(password);
            }}
            /* One word. At 320px the row leaves the field about 96px once
               the eye and Confirm have taken their share, so anything
               longer is read as clipped text rather than a placeholder.
               The rule goes on its own line underneath instead. */
            placeholder="Password"
            /* The rule is not on screen until the field is touched, so it
               has to be here or it is lost to anyone not looking at it. */
            aria-label={`Set a password to register. ${PASSWORD_RULE}`}
            autoComplete="new-password"
          />
          <Button variant="bare"
            className="flex h-10 w-10 flex-none cursor-pointer items-center justify-center border-none bg-transparent text-bk-ink-3 hover:text-bk-ink"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            <Icon icon={showPw ? P.eyeOff : P.eye} size={19} />
          </Button>
          <Button variant="bare"
            className="h-10 flex-none cursor-pointer rounded-ctl-md border-none bg-bk-ink px-4 text-[14px] font-semibold leading-[1.6] text-white disabled:cursor-not-allowed disabled:opacity-35"
            disabled={!PASSWORD_RE.test(password) || busy}
            onClick={() => void create(password)}
          >
            Confirm
          </Button>
        </div>
      </div>

      {error && (
        <p className={ERR} role="alert">
          <Icon icon={P.alert} size={16} className="mt-0.5 flex-none" />
          {error}
        </p>
      )}

      {/* Nothing here until the field is touched. The rule is two lines
          on a phone, and it is guidance for a path most people will not
          take — printed up front it is the tallest thing in the panel and
          it is addressed to almost nobody.

          Then: the meter replaces the rule once there is something to
          measure, because two lines of guidance about one field is one
          too many. */}
      {strength ? (
        <p className="mt-2 text-[12px] text-bk-ink-2">
          <span
            className="mb-1.5 block h-1 overflow-hidden rounded-pill bg-bk-line"
            aria-hidden="true"
          >
            <i
              className={cn("block h-full rounded-[inherit] transition-[width,background-color] duration-200 ease-[ease]", METER_FILL[strength.level])}
              style={{ width: `${strength.pct}%` }}
            />
          </span>
          <span>
            Password strength: <b className="capitalize text-bk-ink">{strength.label}</b>
          </span>
        </p>
      ) : (
        pwOpen && <p className={RULE}>{PASSWORD_RULE}</p>
      )}
      {/* Only once they have stopped short — nagging from the first
          keystroke would flag every password as wrong while it is typed. */}
      {strength && !PASSWORD_RE.test(password) && <p className={RULE}>{PASSWORD_RULE}</p>}

      <p className="mt-2.5 text-[12px] leading-[1.45] text-bk-ink-3">
        By registering you agree to our{" "}
        <a className="underline" href="/terms" target="_blank" rel="noopener noreferrer">
          terms
        </a>{" "}
        and{" "}
        <a className="underline" href="/privacy-policy" target="_blank" rel="noopener noreferrer">
          privacy policy
        </a>
        .
      </p>
    </div>
  );
}
