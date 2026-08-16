"use client";

/* ══════════════════════════════════════════════════════════════════
   Log in · Sign up · Forgot password
   ══════════════════════════════════════════════════════════════════

   One component, four panes, opened from the site header and from the
   checkout. Rendered by AuthProvider at the root so there is only ever one.

   Full screen on a phone, a centred dialog from 560px. The phone treatment
   is the one in the app: nothing but the form, no chrome competing with it.

   It uses the checkout's neutral palette (bk-*), not the landing page's warm
   one — it belongs to the product, not the marketing page.
   ══════════════════════════════════════════════════════════════════ */

import { validateAndSetErrors } from "@/utils/validation";
import { EMAIL_RE, PASSWORD_RE, PASSWORD_RULE, signupSchema } from "./schema";
import { cn } from "@/utils/cn";
import { AUTH_INPUT_BASE } from "@/utils/auth/styles";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { useCallback, useEffect, useId, useRef, useState, type SVGProps } from "react";
import { register as apiRegister } from "@/utils/api";
import { login as apiLogin } from "@/utils/auth";
import type { AuthedUser } from "@/components/common/AuthProvider";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* STILL A MOCK. There is no reset endpoint yet.
     POST /password/reset { email } → 202, whatever the address
   202 regardless is the point: any other answer tells whoever asks whether
   an address belongs to a customer.

   Note for the integration phase: the link this would email points at
   /reset-password, which today is a deep-link fallback that hands off to the
   native app. Web password reset needs that path resolved first. */
async function requestPasswordReset(): Promise<{ ok: true }> {
  await wait(700);
  return { ok: true };
}

/* STILL A MOCK. No OAuth endpoints yet — this returns a plausible account so
   the signed-in states can be seen and reviewed. */
function signInWith(provider: "apple" | "google") {
  return provider === "apple"
    ? { name: "Shahzaib Tariq Butt", email: "sx8k2p9qmt@privaterelay.appleid.com" }
    : { name: "Shahzaib Tariq Butt", email: "shahzaib.tariq@gmail.com" };
}

/* ── Rules ────────────────────────────────────────────────────── */


const SOCIAL: [id: "google" | "apple", label: string][] = [
  ["google", "Google"],
  ["apple", "Apple"],
];

/* ── Icons ────────────────────────────────────────────────────── */

const EYE =
  "M1.7 10S4.6 4.8 10 4.8 18.3 10 18.3 10 15.4 15.2 10 15.2 1.7 10 1.7 10Zm8.3 2.4a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z";
const EYE_OFF =
  "M3 3l14 14M8.1 8.2a2.4 2.4 0 0 0 3.4 3.4M6.3 6.4C3.6 7.9 1.7 10 1.7 10s2.9 5.2 8.3 5.2c1.6 0 3-.5 4.1-1.1M16 12.4c1.5-1.2 2.3-2.4 2.3-2.4S15.4 4.8 10 4.8c-.7 0-1.3.1-1.9.2";
const CLOSE = "M5 5l10 10M15 5L5 15";
const BACK = "M12 4 6 10l6 6";
const TICK = "m4 10.5 4 4 8-9";
const MAIL = "M2 5h16v10H2Zm0 .5 8 5.5 8-5.5";
const WARN = "M10 7v4m0 3v.1M10 2 1.8 17h16.4Z";

function Icon({
  d,
  size = 20,
  sw = 1.7,
  ...rest
}: { d: string; size?: number; sw?: number | string } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

function ProviderMark({ id }: { id: "google" | "apple" }) {
  if (id === "apple") {
    return (
      <svg width="16" height="19" viewBox="0 0 20 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M16.6 12.7c0-2.9 2.4-4.3 2.5-4.4-1.4-2-3.5-2.3-4.2-2.3-1.8-.2-3.5 1.1-4.4 1.1-.9 0-2.3-1-3.8-1-1.9 0-3.7 1.1-4.7 2.9-2 3.5-.5 8.7 1.5 11.5 1 1.4 2.1 3 3.6 2.9 1.4-.1 2-.9 3.8-.9s2.2.9 3.8.9 2.5-1.4 3.5-2.8c1.1-1.6 1.5-3.2 1.6-3.2 0 0-3.1-1.2-3.2-4.7M13.8 4.2c.8-1 1.3-2.3 1.2-3.7-1.2 0-2.5.8-3.4 1.7-.7.9-1.4 2.2-1.2 3.5 1.3.1 2.6-.6 3.4-1.5"
        />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="#4285F4"
        d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.64h6.2a5.3 5.3 0 0 1-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.57Z"
      />
      <path
        fill="#34A853"
        d="M12 23.5c3.1 0 5.7-1.03 7.62-2.78l-3.72-2.9c-1.03.7-2.35 1.1-3.9 1.1-2.98 0-5.5-2.01-6.4-4.72H1.75v2.99A11.5 11.5 0 0 0 12 23.5Z"
      />
      <path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4V6.8H1.75a11.5 11.5 0 0 0 0 10.4L5.6 14.2Z" />
      <path
        fill="#EA4335"
        d="M12 4.75c1.68 0 3.19.58 4.38 1.72l3.28-3.28C17.7 1.3 15.1.25 12 .25 7.5.25 3.6 2.84 1.75 6.8L5.6 9.8c.9-2.71 3.42-4.72 6.4-4.72Z"
      />
    </svg>
  );
}

/* ── Class recipes ────────────────────────────────────────────── */


const BTN =
  "inline-flex w-full min-h-[52px] items-center justify-center gap-2.5 px-5 py-2 " +
  "border rounded-card-md text-[15.5px] leading-[1.6] cursor-pointer " +
  "transition-[background-color,border-color] duration-[160ms] ease-[ease] " +
  /* The lime at 45%, not a grey. A disabled button should read as the button
     it is about to become. */
  "disabled:opacity-45 disabled:cursor-not-allowed";

const BTN_LIME =
  `${BTN} font-semibold bg-brand border-brand text-bk-ink enabled:hover:bg-brand-hover enabled:hover:border-brand-hover`;

/* Both companies specify the treatment. Google is white with a hairline and
   their own mark; Apple is black. Neither may be restyled. */
const BTN_GOOGLE = `${BTN} font-medium bg-white border-[#747775] text-[#1f1f1f]`;
const BTN_APPLE = `${BTN} font-medium bg-black border-black text-white`;

/* Inline-flex with a real minimum, not padding on a text button. Both of
   these are ordinary taps on a phone and 34px is not a target. */
const LINK_BTN =
  "inline-flex items-center min-h-11 px-0.5 align-middle bg-transparent border-none " +
  "text-[14px] leading-[1.6] font-bold text-bk-ink underline underline-offset-[3px] " +
  "cursor-pointer hover:text-brand-ink";

/* ── Shared bits ──────────────────────────────────────────────── */

function Field({
  label,
  hint,
  error,
  id,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  id: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3.5">
      <label className="mb-[7px] block text-[14px] font-semibold" htmlFor={id}>
        {label}
        {optional && <span className="font-normal text-bk-ink-3"> (optional)</span>}
      </label>
      {children}
      {error ? (
        <p
          className="flex items-start gap-[7px] text-[13px] leading-[1.45] text-danger"
          id={`${id}-err`}
        >
          <Icon d={WARN} size={15} />
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12.5px] leading-[1.45] text-bk-ink-3">{hint}</p>
      ) : null}
    </div>
  );
}

/* Reveal, because typing a new password blind is how people lock themselves
   out of the account they are creating. */
function Password({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  invalid,
  onKeyDown,
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  invalid?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative">
      <Input surface="auth"
        id={id}
        className="pr-[52px]"
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid ? "true" : undefined}
      />
      <Button variant="bare"
        className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center py-px px-1.5 rounded-[50%] border-none bg-transparent text-bk-ink-2 hover:text-bk-ink"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        <Icon d={show ? EYE_OFF : EYE} size={19} />
      </Button>
    </span>
  );
}

function Social({ onPick, busy }: { onPick: (id: "google" | "apple") => void; busy: boolean }) {
  return (
    <div className="grid gap-2.5">
      {SOCIAL.map(([id, label]) => (
        <Button variant="bare"
          key={id}
          className={id === "apple" ? BTN_APPLE : BTN_GOOGLE}
          disabled={busy}
          onClick={() => onPick(id)}
        >
          <ProviderMark id={id} />
          Continue with {label}
        </Button>
      ))}
    </div>
  );
}

const Spinner = () => (
  <span className="inline-block h-[17px] w-[17px] animate-spin-fast rounded-full border-2 border-[rgba(20,20,15,.25)] border-t-bk-ink motion-reduce:animate-none motion-reduce:border-t-[rgba(20,20,15,.25)] motion-reduce:border-r-bk-ink" />
);

const Divider = () => (
  <p className="flex items-center gap-3.5 text-[13.5px] text-bk-ink-3 before:h-px before:flex-auto before:bg-bk-line-2 before:content-[''] after:h-px after:flex-auto after:bg-bk-line-2 after:content-['']">
    <span>or</span>
  </p>
);

/* ══════════════════════════════════════════════════════════════════
   The modal
   ══════════════════════════════════════════════════════════════════ */

type View = "login" | "signup" | "forgot" | "sent";

export default function AuthModal({
  view: initialView = "login",
  email = "",
  onClose,
  onAuthed,
}: {
  view?: View;
  email?: string;
  onClose: () => void;
  onAuthed?: (user: AuthedUser) => void;
}) {
  const ids = useId();
  const [view, setView] = useState<View>(initialView);
  const [busy, setBusy] = useState(false);
  const [alert, setAlert] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({ name: "", phone: "", email, password: "" });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: "" }));
    setAlert("");
  };

  const panel = useRef<HTMLDivElement>(null);
  const firstField = useRef<HTMLInputElement>(null);

  /* Escape closes, the page behind does not scroll, and Tab stays inside —
     the three things a dialog has to do and the three most often left out. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const f = panel.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]),[href],input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])',
      );
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  /* Focus the first empty field rather than the panel: on a phone this is a
     full screen, and landing on the heading means an extra tap before anyone
     can type. */
  useEffect(() => {
    const t = setTimeout(() => firstField.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [view]);

  const go = useCallback((next: View) => {
    setView(next);
    setAlert("");
    setErrors({});
  }, []);

  const social = async (provider: "google" | "apple") => {
    setBusy(true);
    const who = signInWith(provider);
    await wait(300);
    setBusy(false);
    onAuthed?.({ ...who, identity: provider, verified: true });
  };

  /* ── Log in ── */
  const loginReady = Boolean(form.email.trim() && form.password);
  const submitLogin = async () => {
    if (!loginReady || busy) return;
    setBusy(true);
    setAlert("");
    const r = await apiLogin(form.email, form.password);
    setBusy(false);
    if (!r.ok) {
      setAlert(r.message);
      return;
    }
    onAuthed?.({
      email: r.user.email,
      fullName: r.user.name,
      mobile: r.user.phone,
      identity: "",
      /* Having the password does not prove the inbox — the account can exist
         with the address unconfirmed. emailVerifiedAt is the server's answer
         and the only one that counts, and it is why the response body is read
         instead of the JWT. */
      verified: Boolean(r.user.emailVerifiedAt),
      signedIn: true,
    });
  };

  /* ── Sign up ── */
  const signupReady = Boolean(
    form.name.trim() && EMAIL_RE.test(form.email.trim()) && PASSWORD_RE.test(form.password),
  );
  const submitSignup = async () => {
    /* The schema is the only place the rules and the copy live now. */
    if (!(await validateAndSetErrors(signupSchema, form, setErrors))) return;
    if (busy) return;
    setBusy(true);
    setAlert("");
    const r = await apiRegister(form);
    if (!r.ok) {
      setBusy(false);
      /* Field-level where the server said which field; a banner only when it
         did not. A message about the email shown above the form makes people
         hunt for what to change. */
      if (Object.keys(r.fields).length) setErrors(r.fields);
      else setAlert(r.message);
      return;
    }
    /* 201 gives no token, so sign them straight in with what they just typed.
       Two calls, one action, and the busy state covers both. */
    const l = await apiLogin(form.email, form.password);
    setBusy(false);
    onAuthed?.({
      email: form.email.trim(),
      fullName: form.name.trim(),
      mobile: form.phone.trim(),
      identity: "",
      /* The account exists but nobody has proved they can read that inbox. */
      verified: false,
      signedIn: l.ok,
    });
  };

  /* ── Forgot ── */
  const submitForgot = async () => {
    if (!EMAIL_RE.test(form.email.trim()) || busy) return;
    setBusy(true);
    await requestPasswordReset();
    setBusy(false);
    go("sent");
  };

  const onEnter = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fn();
    }
  };

  const titleId = `${ids}-t`;

  return (
    /* Phones get the app treatment: the form and nothing else. A dialog
       floating in a 40px margin on a 390px screen wastes the only dimension
       that is short. */
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(20,20,15,.45)] p-6 antialiased to-559:items-stretch to-559:p-0"
      role="presentation"
      onClick={onClose}
    >
      {/* No negative inline margins anywhere inside. The panel scrolls on the
          y axis, which forces the x axis to auto as well, so anything hanging
          past the padding box buys a horizontal scrollbar. */}
      <div
        className="lf-controls box-content relative max-h-full w-full max-w-[460px] overflow-y-auto overscroll-contain rounded-card-lg bg-bk-paper px-[26px] pb-[30px] pt-[26px] text-[16px] leading-[1.6] text-bk-ink shadow-[0_30px_70px_-30px_rgba(20,20,15,.6)] to-559:min-h-full to-559:max-w-none to-559:rounded-none to-559:px-[22px] to-559:pb-[calc(30px+env(safe-area-inset-bottom,0px))] to-559:pt-3.5 to-559:shadow-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panel}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="-mt-2 mb-[18px] flex min-h-11 items-center justify-between gap-3">
          {view === "forgot" || view === "sent" ? (
            <Button variant="bare"
              className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center py-px px-1.5 rounded-[50%] border-none bg-transparent text-bk-ink hover:bg-[#E9E9E4]"
              onClick={() => go("login")}
              aria-label="Back to log in"
            >
              <Icon d={BACK} size={22} sw="2" />
            </Button>
          ) : (
            <span />
          )}
          <Button variant="bare"
            className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center py-px px-1.5 rounded-[50%] border-none bg-transparent text-bk-ink hover:bg-[#E9E9E4]"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon d={CLOSE} size={20} sw="2.2" />
          </Button>
        </div>

        {alert && (
          <p
            className="flex items-start gap-[9px] rounded-card-sm bg-danger-bg px-[13px] py-[11px] text-[13.5px] leading-[1.45] text-danger"
            role="alert"
          >
            <Icon d={WARN} size={16} />
            {alert}
          </p>
        )}

        {/* ── Log in ─────────────────────────────────────────── */}
        {view === "login" && (
          <>
            <h2
              className="text-[30px] font-extrabold leading-[1.12] tracking-[-1px] to-559:text-[33px]"
              id={titleId}
            >
              Welcome back
            </h2>
            <p className="text-[15px] text-bk-ink-2">Enter your details below to log in</p>

            <Field label="Email" id={`${ids}-e`}>
              <Input surface="auth"
                id={`${ids}-e`}
                ref={firstField}
                type="email"
                value={form.email}
                onChange={set("email")}
                onKeyDown={onEnter(submitLogin)}
                placeholder="Enter your email address"
                autoComplete="email"
              />
            </Field>

            <Field label="Password" id={`${ids}-p`}>
              <Password
                id={`${ids}-p`}
                value={form.password}
                onChange={set("password")}
                onKeyDown={onEnter(submitLogin)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </Field>

            <Button variant="bare"
              className="-mt-2 mb-3 ml-auto flex min-h-11 cursor-pointer items-center border-none bg-transparent p-0 text-[13.5px] leading-[1.6] font-semibold text-bk-ink underline underline-offset-[3px] hover:text-brand-ink"
              onClick={() => go("forgot")}
            >
              Forgot password?
            </Button>

            <Button variant="bare"
              className={BTN_LIME}
              disabled={!loginReady || busy}
              onClick={submitLogin}
            >
              {busy ? <Spinner /> : null}
              {busy ? "Logging in" : "Log in"}
            </Button>

            <Divider />
            <Social onPick={social} busy={busy} />

            <p className="text-center text-[14px] text-bk-ink-2">
              Don&rsquo;t have an account?{" "}
              <Button variant="bare" className={LINK_BTN} onClick={() => go("signup")}>
                Sign up
              </Button>
            </p>
          </>
        )}

        {/* ── Sign up ────────────────────────────────────────── */}
        {view === "signup" && (
          <>
            <h2
              className="text-[30px] font-extrabold leading-[1.12] tracking-[-1px] to-559:text-[33px]"
              id={titleId}
            >
              Create account
            </h2>
            <p className="text-[15px] text-bk-ink-2">Enter your details to get started</p>

            <Field label="Full name" id={`${ids}-n`} error={errors.name}>
              <Input surface="auth"
                id={`${ids}-n`}
                ref={firstField}
                value={form.name}
                onChange={set("name")}
                placeholder="Enter your full name"
                autoComplete="name"
                aria-invalid={errors.name ? "true" : undefined}
              />
            </Field>

            <Field label="Phone" id={`${ids}-tel`} optional error={errors.phone}>
              <span className="flex items-stretch gap-0 overflow-hidden rounded-card-md border-[1.5px] border-bk-line-2 bg-white focus-within:border-bk-ink focus-within:shadow-[0_0_0_3px_rgba(20,20,15,.08)]">
                <span
                  className="flex flex-none items-center border-r border-r-bk-line-2 pl-4 pr-3 text-[15.5px] font-semibold text-bk-ink"
                  aria-hidden="true"
                >
                  +44
                </span>
                <input
                  id={`${ids}-tel`}
                  className={cn("h-[50px]", AUTH_INPUT_BASE, "rounded-none border-none shadow-none focus:shadow-none")}
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="7700 900000"
                  autoComplete="tel-national"
                  aria-describedby={`${ids}-cc`}
                  aria-invalid={errors.phone ? "true" : undefined}
                />
              </span>
              <span className="visually-hidden" id={`${ids}-cc`}>
                United Kingdom, plus four four
              </span>
            </Field>

            <Field label="Email" id={`${ids}-se`} error={errors.email}>
              <Input surface="auth"
                id={`${ids}-se`}
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="Enter your email address"
                autoComplete="email"
                aria-invalid={errors.email ? "true" : undefined}
              />
            </Field>

            <Field label="Password" id={`${ids}-sp`} error={errors.password} hint={PASSWORD_RULE}>
              <Password
                id={`${ids}-sp`}
                value={form.password}
                onChange={set("password")}
                onKeyDown={onEnter(submitSignup)}
                placeholder="Enter your password"
                autoComplete="new-password"
                invalid={Boolean(errors.password)}
              />
            </Field>

            <Button variant="bare"
              className={cn(BTN_LIME, "mt-1.5")}
              disabled={!signupReady || busy}
              onClick={submitSignup}
            >
              {busy ? <Spinner /> : null}
              {busy ? "Creating your account" : "Sign up"}
            </Button>

            <Divider />
            <Social onPick={social} busy={busy} />

            {/* New tab, always. People tap the sentence to reach the button
                under it; landing on a link would take the whole half-filled
                form with it. */}
            <p className="text-center text-[12.5px] leading-[1.5] text-bk-ink-3">
              By signing up, you agree to our{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-bk-ink-2"
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-bk-ink-2"
              >
                Privacy Policy
              </a>
              .
            </p>

            <p className="text-center text-[14px] text-bk-ink-2">
              Already have an account?{" "}
              <Button variant="bare" className={LINK_BTN} onClick={() => go("login")}>
                Log in
              </Button>
            </p>
          </>
        )}

        {/* ── Forgot password ────────────────────────────────── */}
        {view === "forgot" && (
          <>
            <h2
              className="text-[30px] font-extrabold leading-[1.12] tracking-[-1px] to-559:text-[33px]"
              id={titleId}
            >
              Reset your password
            </h2>
            <p className="text-[15px] text-bk-ink-2">
              Enter the address on your account and we will send you a link to set a new password.
            </p>

            <Field label="Email" id={`${ids}-fe`}>
              <Input surface="auth"
                id={`${ids}-fe`}
                ref={firstField}
                type="email"
                value={form.email}
                onChange={set("email")}
                onKeyDown={onEnter(submitForgot)}
                placeholder="Enter your email address"
                autoComplete="email"
              />
            </Field>

            <Button variant="bare"
              className={cn(BTN_LIME, "mt-1.5")}
              disabled={!EMAIL_RE.test(form.email.trim()) || busy}
              onClick={submitForgot}
            >
              {busy ? <Spinner /> : null}
              {busy ? "Sending" : "Send reset link"}
            </Button>

            <p className="text-center text-[14px] text-bk-ink-2">
              Remembered it?{" "}
              <Button variant="bare" className={LINK_BTN} onClick={() => go("login")}>
                Log in
              </Button>
            </p>
          </>
        )}

        {/* ── Sent ───────────────────────────────────────────── */}
        {view === "sent" && (
          <div className="px-0 pb-1 pt-1.5 text-center">
            <span
              className="mx-auto mb-[18px] flex h-16 w-16 items-center justify-center rounded-[50%] bg-brand text-bk-ink"
              aria-hidden="true"
            >
              <Icon d={MAIL} size={28} />
            </span>
            <h2
              className="text-[26px] font-extrabold leading-[1.12] tracking-[-1px]"
              id={titleId}
            >
              Check your email
            </h2>
            {/* Worded so it says the same thing whether or not the address has
                an account. Confirming one exists would turn this into a way of
                testing who our customers are. */}
            <p className="mb-6 text-[15px] text-bk-ink-2">
              If there is an account for{" "}
              <b className="block break-words text-[15.5px]">{form.email.trim()}</b>, a link to set
              a new password is on its way.
            </p>
            <Button variant="bare" className={BTN_LIME} onClick={onClose}>
              <Icon d={TICK} size={18} sw="2.2" />
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
