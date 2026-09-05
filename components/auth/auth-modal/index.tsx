"use client";

/* ══════════════════════════════════════════════════════════════════
   Log in · Sign up · Forgot password · Verify email
   ══════════════════════════════════════════════════════════════════

   One component, seven panes, opened from the site header and from the
   checkout. Rendered by AuthProvider at the root so there is only ever one.

   Signing up or logging in with an address nobody has proved lands on the
   `verify` pane instead of closing, and no session is written until the code
   comes back good — see the note at the top of utils/auth. So `onAuthed` here
   means "there is now a cookie", not "a request succeeded", and three of the
   panes exist to get from one to the other.

   Full screen on a phone, a centred dialog from 560px. The phone treatment
   is the one in the app: nothing but the form, no chrome competing with it.

   It uses the checkout's neutral palette (bk-*), not the landing page's warm
   one — it belongs to the product, not the marketing page.
   ══════════════════════════════════════════════════════════════════ */

import {
  Check,
  ChevronLeft,
  Eye,
  EyeOff,
  Mail,
  MailCheck,
  Pencil,
  TriangleAlert,
  X,
} from "lucide-react";
import { validateAndSetErrors } from "@/utils/validation";
import {
  changeEmailSchema,
  codeSchema,
  EMAIL_RE,
  forgotSchema,
  PASSWORD_RE,
  PASSWORD_RULE,
  signupSchema,
  UK_MOBILE_RE,
  isValidName,
} from "./schema";
import { cn } from "@/utils/cn";
import { AUTH_CODE_INPUT } from "@/utils/auth/styles";
import Input from "@/components/common/Input";
import PhoneInput from "@/components/common/PhoneInput";
import Button from "@/components/common/Button";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { routes } from "@/utils/routes";
import { register as apiRegister, toNationalUk } from "@/utils/api";
import {
  changeEmailAddress,
  login as apiLogin,
  requestPasswordReset,
  resendVerification,
  verifyEmail,
  type AuthUser,
} from "@/utils/auth";
import { CODE_LENGTH, RESEND_SECONDS } from "@/utils/auth/model";
import type { AuthedUser } from "@/components/common/AuthProvider";
import { SOCIAL_AUTH_ENABLED } from "@/config";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* STILL A MOCK, and now unreachable: everything from here down to `Divider` is
   rendered only behind SOCIAL_AUTH_ENABLED, which is false. Read the note on
   the flag in config.ts before flipping it — this fabricates an account and
   returns no token, so it is not the thing to switch on. */
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

/* The quiet twin of BTN_LIME, for a pane whose only action is a secondary one
   — "Update email" sits alone on the verify screen, and putting it in lime
   would read as the thing to do next, which it is not. */
const BTN_OUTLINE = `${BTN} font-semibold bg-white border-bk-line-2 text-bk-ink enabled:hover:bg-[#F4F4F0]`;

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
          <TriangleAlert size={15} aria-hidden="true" />
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
        {show ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
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

export type View =
  | "login"
  | "signup"
  | "forgot"
  | "sent"
  | "verify"
  | "code"
  | "change-email";

/* Where the chevron goes, and whether there is one at all. Was a hardcoded
   two-view test that always returned to `login`, which cannot express
   change-email → verify.

   `verify` is deliberately absent. By the time it shows, the account exists
   and a token is held; a route back to a pane that looks signed-out would
   strand both. The X still closes the dialog — the pending cookie outlives it
   on purpose, so closing and clicking the link in the email still works. */
const BACK: Partial<Record<View, View>> = {
  forgot: "login",
  sent: "login",
  code: "verify",
  "change-email": "verify",
};

const BACK_LABEL: Partial<Record<View, string>> = {
  login: "Back to log in",
  verify: "Back to email verification",
};

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

  /* `email` is the address the account currently has; `newEmail` is the draft
     on the change-email pane. Separate keys, so typing a correction does not
     rewrite the address the verify pane is telling them to check. */
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email,
    password: "",
    code: "",
    newEmail: "",
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((x) => ({ ...x, [k]: "" }));
    setAlert("");
  };
  /* <PhoneInput> hands back the normalised national number rather than the
     event, so it cannot go through `set`. Same clearing behaviour otherwise. */
  const setPhone = (phone: string) => {
    setForm((f) => ({ ...f, phone }));
    setErrors((x) => ({ ...x, phone: "" }));
    setAlert("");
  };

  /* The account behind an unverified sign-in. Never becomes an AuthedUser —
     that is the whole point — but change-email needs its id, and the id is
     dropped everywhere downstream of login(). */
  const [held, setHeld] = useState<AuthUser | null>(null);

  /* A deadline, not a counter. Ticking a number down means re-creating the
     interval on every tick, which drifts and stops dead in a backgrounded tab;
     recomputing from the wall clock does neither. It also survives switching
     panes, since `go` touches only the alert and the errors — so verify → code
     → verify picks the countdown up where it was rather than restarting it. */
  const [resendAt, setResendAt] = useState(0);
  const [left, setLeft] = useState(0);

  /* The seed is set by startCooldown rather than by the effect, so nothing
     here writes state during the effect body — that causes a cascading render,
     and react-hooks/set-state-in-effect is right to refuse it. The interval
     only ever writes from its own callback. */
  useEffect(() => {
    if (!resendAt) return;
    const id = setInterval(() => {
      const n = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
      setLeft(n);
      if (n === 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [resendAt]);

  const startCooldown = useCallback(() => {
    setResendAt(Date.now() + RESEND_SECONDS * 1000);
    setLeft(RESEND_SECONDS);
  }, []);

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

  /* Only ever called once a session cookie exists — see the header note. */
  const finish = useCallback(
    (who: AuthUser | null, fallbackEmail: string) => {
      onAuthed?.({
        id: who?.id,
        email: who?.email || fallbackEmail,
        fullName: who?.name,
        /* The server holds E.164; `mobile` is what <PhoneInput> shows behind a
           fixed +44, so the country code comes off on the way across. */
        mobile: toNationalUk(who?.phone),
        identity: "",
        verified: true,
        signedIn: true,
      });
    },
    [onAuthed],
  );

  /* An address nobody has proved. Hold the account, start the clock, show the
     code screen. /login-check has already sent the email by this point, so
     landing here must not fire a resend of its own. */
  const awaitVerification = useCallback(
    (who: AuthUser) => {
      setHeld(who);
      setForm((f) => ({ ...f, email: who.email || f.email, code: "", newEmail: "" }));
      startCooldown();
      go("verify");
    },
    [go, startCooldown],
  );

  /* apiCall toasts a dropped connection whatever showErrorToast says, because
     nothing else would report it — so a banner for the same thing says it
     twice. status === null is that case. */
  const showFailure = (r: { message: string; status: number | null }) => {
    if (r.status !== null) setAlert(r.message);
  };

  /* The held token died. Resending would only mail a code they still could not
     submit, so send them back to the start. setAlert after go, which clears it. */
  const sessionExpired = () => {
    go("login");
    setAlert("Your session timed out. Log in again to finish verifying.");
  };

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
    /* Having the password does not prove the inbox — the account can exist
       with the address unconfirmed. emailVerifiedAt is the server's answer and
       the only one that counts, and it is why the response body is read
       instead of the JWT. An unverified answer stops here: utils/auth has
       written no cookie, so from the app's point of view nobody logged in. */
    if (!r.verified) {
      awaitVerification(r.user);
      return;
    }
    finish(r.user, form.email.trim());
  };

  /* ── Sign up ── */
  /* Every field here is tested against its own rule, the name included — a
     button that goes live on a value the schema will refuse a moment later is
     just a slower way of showing the same error. */
  const signupReady = Boolean(
    isValidName(form.name) &&
      UK_MOBILE_RE.test(form.phone.trim()) &&
      EMAIL_RE.test(form.email.trim()) &&
      PASSWORD_RE.test(form.password),
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
    /* 201 gives no token, and proving the address needs one, so sign them
       straight in with what they just typed. Two calls, one action, and the
       busy state covers both. */
    const l = await apiLogin(form.email, form.password);
    setBusy(false);
    if (!l.ok) {
      /* The account is real but no token came back, so there is nothing to
         verify with. Saying so beats parking them on a code screen that
         cannot work. */
      go("login");
      setAlert("Your account is created. Log in to finish setting it up.");
      return;
    }
    /* Registering never returns a proved address today. The check costs
       nothing and keeps this honest if that ever changes. */
    if (!l.verified) {
      awaitVerification({ ...l.user, name: l.user.name || form.name.trim() });
      return;
    }
    finish(l.user, form.email.trim());
  };

  /* ── Verify ── */
  const submitCode = async () => {
    if (busy) return;
    if (!(await validateAndSetErrors(codeSchema, form, setErrors))) return;
    setBusy(true);
    setAlert("");
    const r = await verifyEmail(form.code);
    setBusy(false);
    if (!r.ok) {
      if (r.status === 401 || r.status === 403) return sessionExpired();
      if (r.status === null) return;
      /* Under the field rather than above the form: it names the one thing
         they have to retype, and a banner up top makes people hunt for it. */
      setErrors({ code: r.message });
      return;
    }
    /* The cookie exists now. /my-status is the better source, but it can come
       back empty, and the held account is a good enough fallback. */
    finish(r.user ?? held, form.email.trim());
  };

  const resend = async () => {
    if (left > 0 || busy) return;
    setBusy(true);
    setAlert("");
    const r = await resendVerification();
    setBusy(false);
    if (!r.ok) {
      if (r.status === 401 || r.status === 403) return sessionExpired();
      showFailure(r);
      return;
    }
    setForm((f) => ({ ...f, code: "" }));
    setErrors({});
    startCooldown();
  };

  /* ── Change email ── */
  const openChangeEmail = () => {
    setForm((f) => ({ ...f, newEmail: f.email }));
    go("change-email");
  };

  const changeReady =
    EMAIL_RE.test(form.newEmail.trim()) &&
    form.newEmail.trim().toLowerCase() !== form.email.trim().toLowerCase();

  const submitChangeEmail = async () => {
    if (busy || !changeReady) return;
    if (!(await validateAndSetErrors(changeEmailSchema, form, setErrors))) return;
    if (!held?.id) {
      setAlert("We could not tell which account to update. Log in again.");
      return;
    }
    setBusy(true);
    setAlert("");
    const r = await changeEmailAddress(held.id, form.newEmail);
    setBusy(false);
    if (!r.ok) {
      if (r.status === 401 || r.status === 403) return sessionExpired();
      if (r.status === null) return;
      /* The server calls this field `email`; the form calls it `newEmail`.
         Remapped here rather than in utils/api's global alias table, because
         `email` means `email` on every other pane. */
      const field = r.fields.email ?? Object.values(r.fields)[0];
      if (field) setErrors({ newEmail: field });
      else setAlert(r.message);
      return;
    }
    /* They proved the address somewhere else while this pane sat open, and
       utils/auth has already turned that into a session. */
    if (r.promoted) {
      finish(r.promoted, form.email.trim());
      return;
    }
    const next = form.newEmail.trim();
    setForm((f) => ({ ...f, email: next, code: "" }));
    setHeld((h) => (h ? { ...h, email: next } : h));
    /* A fresh code goes to the new address, so the clock starts again. */
    startCooldown();
    go("verify");
  };

  /* ── Forgot ── */
  const submitForgot = async () => {
    if (busy) return;
    if (!(await validateAndSetErrors(forgotSchema, form, setErrors))) return;
    setBusy(true);
    setAlert("");
    const r = await requestPasswordReset(form.email);
    setBusy(false);
    /* Only a transport failure can land here — the endpoint answers 200 even
       for an address with no account, on purpose. Anything else and we would
       be telling whoever asked whether somebody is a customer. */
    if (!r.ok) {
      if (r.status !== null) setAlert(r.message);
      return;
    }
    go("sent");
  };

  const onEnter = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fn();
    }
  };

  const titleId = `${ids}-t`;
  const back = BACK[view];

  const setCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, code: e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH) }));
    setErrors((x) => ({ ...x, code: "" }));
    setAlert("");
  };

  /* Disabled reads as "not yet", so it keeps the underline off and does not
     dim to the point of looking broken. */
  const RESEND_BTN = cn(LINK_BTN, "disabled:cursor-default disabled:no-underline disabled:opacity-60");

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
          {back ? (
            <Button variant="bare"
              className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center py-px px-1.5 rounded-[50%] border-none bg-transparent text-bk-ink hover:bg-[#E9E9E4]"
              onClick={() => go(back)}
              aria-label={BACK_LABEL[back] ?? "Back"}
            >
              <ChevronLeft size={22} strokeWidth={2} aria-hidden="true" />
            </Button>
          ) : (
            <span />
          )}
          <Button variant="bare"
            className="flex h-11 w-11 flex-none cursor-pointer items-center justify-center py-px px-1.5 rounded-[50%] border-none bg-transparent text-bk-ink hover:bg-[#E9E9E4]"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} strokeWidth={2.2} aria-hidden="true" />
          </Button>
        </div>

        {alert && (
          <p
            className="flex items-start gap-[9px] rounded-card-sm bg-danger-bg px-[13px] py-[11px] text-[13.5px] leading-[1.45] text-danger"
            role="alert"
          >
            <TriangleAlert size={16} aria-hidden="true" />
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

            {SOCIAL_AUTH_ENABLED && (
              <>
                <Divider />
                <Social onPick={social} busy={busy} />
              </>
            )}

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

            {/* "Mobile number", the same label the checkout uses, because the
                rule is a UK mobile and "Phone" invites a landline. No longer
                optional: a complete account is what lets the checkout skip its
                Details step. */}
            <Field label="Mobile number" id={`${ids}-tel`} error={errors.phone}>
              <PhoneInput
                surface="auth"
                id={`${ids}-tel`}
                value={form.phone}
                onChange={setPhone}
                placeholder="7700 900000"
                error={errors.phone}
              />
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

            {SOCIAL_AUTH_ENABLED && (
              <>
                <Divider />
                <Social onPick={social} busy={busy} />
              </>
            )}

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

            <Field label="Email" id={`${ids}-fe`} error={errors.email}>
              <Input surface="auth"
                id={`${ids}-fe`}
                ref={firstField}
                type="email"
                value={form.email}
                onChange={set("email")}
                onKeyDown={onEnter(submitForgot)}
                placeholder="Enter your email address"
                autoComplete="email"
                aria-invalid={errors.email ? "true" : undefined}
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
              <Mail size={28} aria-hidden="true" />
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
              <Check size={18} strokeWidth={2.2} aria-hidden="true" />
              Done
            </Button>
            {/* The email carries a code as well as a link, and the code is the
                path that works when the link opens somewhere awkward — a
                webmail preview, or a browser that is not this one. */}
            <p className="mt-[18px]">
              <Link
                className={LINK_BTN}
                href={`${routes.ui.resetPassword}?email=${encodeURIComponent(form.email.trim())}`}
                onClick={onClose}
              >
                Enter code manually
              </Link>
            </p>
          </div>
        )}

        {/* ── Verify your email ──────────────────────────────── */}
        {view === "verify" && (
          <div className="px-0 pb-1 pt-1.5 text-center">
            <span
              className="mx-auto mb-[18px] flex h-16 w-16 items-center justify-center rounded-[50%] bg-brand text-bk-ink"
              aria-hidden="true"
            >
              <MailCheck size={28} aria-hidden="true" />
            </span>
            <h2
              className="text-[26px] font-extrabold leading-[1.12] tracking-[-1px]"
              id={titleId}
            >
              Verify your email
            </h2>
            {/* Named, not "your email". Half the reason this screen has an
                Update email button is that people mistype the address, and
                they cannot spot that unless it is in front of them. */}
            <p className="text-[15px] text-bk-ink-2">
              We&rsquo;ve sent a verification link to
              <b className="mt-1 block break-words text-[15.5px] text-bk-ink">
                {form.email.trim()}
              </b>
            </p>
            <p className="mb-6 mt-3 text-[13.5px] leading-[1.5] text-bk-ink-3">
              Can&rsquo;t find it? Check the address above is right, and look in your spam or junk
              folder.
            </p>

            <Button variant="bare" className={BTN_OUTLINE} onClick={openChangeEmail}>
              <Pencil size={17} aria-hidden="true" />
              Update email
            </Button>

            <p className="mt-[18px]">
              <Button variant="bare" className={LINK_BTN} onClick={() => go("code")}>
                Enter code manually
              </Button>
            </p>

            <p className="text-[14px] text-bk-ink-2">
              Didn&rsquo;t get it?{" "}
              <Button
                variant="bare"
                className={RESEND_BTN}
                disabled={left > 0 || busy}
                onClick={resend}
              >
                {busy ? "Sending" : left > 0 ? `Resend link in ${left}s` : "Resend link"}
              </Button>
            </p>
          </div>
        )}

        {/* ── Enter the code ─────────────────────────────────── */}
        {view === "code" && (
          <>
            <h2
              className="text-[30px] font-extrabold leading-[1.12] tracking-[-1px] to-559:text-[33px]"
              id={titleId}
            >
              Enter verification code
            </h2>
            <p className="text-[15px] text-bk-ink-2">
              Enter the code from your verification email.
            </p>

            <Field label="Verification code" id={`${ids}-vc`} error={errors.code}>
              <Input surface="auth"
                id={`${ids}-vc`}
                ref={firstField}
                className={AUTH_CODE_INPUT}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={CODE_LENGTH}
                value={form.code}
                onChange={setCode}
                onKeyDown={onEnter(submitCode)}
                aria-invalid={errors.code ? "true" : undefined}
              />
            </Field>

            <Button variant="bare"
              className={cn(BTN_LIME, "mt-1.5")}
              disabled={form.code.length !== CODE_LENGTH || busy}
              onClick={submitCode}
            >
              {busy ? <Spinner /> : null}
              {busy ? "Verifying" : "Verify"}
            </Button>

            <p className="text-center text-[14px] text-bk-ink-2">
              <Button
                variant="bare"
                className={RESEND_BTN}
                disabled={left > 0 || busy}
                onClick={resend}
              >
                {left > 0 ? `Resend code in ${left}s` : "Resend code"}
              </Button>
            </p>
          </>
        )}

        {/* ── Change email ───────────────────────────────────── */}
        {view === "change-email" && (
          <>
            <h2
              className="text-[30px] font-extrabold leading-[1.12] tracking-[-1px] to-559:text-[33px]"
              id={titleId}
            >
              Change email
            </h2>
            <p className="text-[15px] text-bk-ink-2">
              Enter the correct address. We&rsquo;ll send a new verification code to it.
            </p>

            <Field label="Email address" id={`${ids}-ne`} error={errors.newEmail}>
              <Input surface="auth"
                id={`${ids}-ne`}
                ref={firstField}
                type="email"
                value={form.newEmail}
                onChange={set("newEmail")}
                onKeyDown={onEnter(submitChangeEmail)}
                placeholder="Enter your email address"
                autoComplete="email"
                aria-invalid={errors.newEmail ? "true" : undefined}
              />
            </Field>

            {/* Dead until the address is both valid and actually different —
                sending the same one again would look like it worked and change
                nothing, which is the worst answer available. */}
            <Button variant="bare"
              className={cn(BTN_LIME, "mt-1.5")}
              disabled={!changeReady || busy}
              onClick={submitChangeEmail}
            >
              {busy ? <Spinner /> : null}
              {busy ? "Updating" : "Update & resend code"}
            </Button>

            <p className="text-center text-[14px] text-bk-ink-2">
              <Button variant="bare" className={LINK_BTN} onClick={() => go("verify")}>
                Cancel
              </Button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
