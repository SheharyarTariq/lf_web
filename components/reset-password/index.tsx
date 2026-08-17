"use client";

/* ══════════════════════════════════════════════════════════════════
   /reset-password — the page behind the link in the reset email
   ══════════════════════════════════════════════════════════════════

   Sibling of components/verify-email, and deliberately simpler. Both endpoints
   here are public — probed, they answer without a token — so there is no
   credential to find, nothing to hold in a cookie and no login-then-resume
   dance. The link carries `email` and `token`, which is everything
   /reset-password/confirm needs.

   Nothing happens automatically. Verification submits itself the moment it can,
   because confirming an address is not a decision; setting a password is, so
   this always waits for a deliberate submit.

   As with verify-email, /reset-password* is claimed in the .well-known files,
   so a phone with the app installed opens the app and this never renders. What
   lands here is desktop, phones without the app, and in-app webviews.
   ══════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Smartphone, TriangleAlert } from "lucide-react";
import Button from "@/components/common/Button";
import Input from "@/components/common/Input";
import { btn } from "@/utils/button";
import { useAuth } from "@/components/common/AuthProvider";
import { confirmPasswordReset, login } from "@/utils/auth";
import { CODE_LENGTH, PASSWORD_RULE } from "@/utils/auth/model";
import { AUTH_CODE_INPUT } from "@/utils/auth/styles";
import { validateAndSetErrors } from "@/utils/validation";
import { resetPasswordSchema } from "./schema";
import { routes } from "@/utils/routes";
import { APP_SCHEME } from "@/config";
import { cn } from "@/utils/cn";

const CARD = "mx-auto w-full max-w-[440px]";
const H1 = "text-[clamp(24px,3.2vw,32px)] font-extrabold tracking-[-1px] leading-[1.15] text-ink";
const P = "mt-3 text-[15px] leading-[1.6] text-ink-2";
const LABEL = "mb-[7px] block text-[14px] font-semibold text-ink";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 flex items-start gap-[7px] text-[13px] leading-[1.45] text-danger" id={id}>
      <TriangleAlert size={15} aria-hidden="true" />
      {message}
    </p>
  );
}

export default function ResetPassword({
  email: urlEmail,
  token: urlToken,
  canOpenApp,
}: {
  email: string;
  token: string;
  canOpenApp: boolean;
}) {
  const { openAuth, refreshSession } = useAuth();

  const [form, setForm] = useState({
    email: urlEmail,
    token: urlToken,
    newPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alert, setAlert] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  /* A working link supplies both, so all it should ask for is the new
     password — a prefilled six-digit box is noise on the happy path. They come
     back out the moment the server rejects the code, which is the only time
     anybody needs to edit them. */
  const [showIdentity, setShowIdentity] = useState(!urlEmail || !urlToken);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = k === "token" ? e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH) : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    setErrors((x) => ({ ...x, [k]: "" }));
    setAlert("");
  };

  const submit = async () => {
    if (busy) return;
    if (!(await validateAndSetErrors(resetPasswordSchema, form, setErrors))) {
      /* A bad code cannot be fixed behind a hidden field. */
      if (!showIdentity) setShowIdentity(true);
      return;
    }
    setBusy(true);
    setAlert("");

    const r = await confirmPasswordReset(form.email, form.token, form.newPassword);
    if (!r.ok) {
      setBusy(false);
      /* A dropped connection already toasted from apiCall whatever the flag
         says, so a banner would say it twice. */
      if (r.status === null) return;
      if (r.status === 400 || r.status === 422) {
        setShowIdentity(true);
        setErrors({ token: r.message });
        return;
      }
      setAlert(r.message);
      return;
    }

    /* We just set this password, so we know it — signing them in beats making
       them retype what they chose ten seconds ago. It lands a real session
       rather than the verify screen because a reset also proves the address:
       the backend's own VerificationCodeTest shows an email_verification
       request straight afterwards sends nothing. */
    const l = await login(form.email, form.newPassword);
    if (l.ok && l.verified) {
      await refreshSession();
      setSignedIn(true);
    }
    setBusy(false);
    setDone(true);
  };

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    void submit();
  };

  const appUrl =
    `${APP_SCHEME}://${routes.ui.resetPassword.slice(1)}` +
    `?email=${encodeURIComponent(form.email)}&token=${encodeURIComponent(form.token)}`;

  return (
    <main className="flex-1 w-full px-5 py-[72px] max-[860px]:py-[52px]">
      <div className={CARD}>
        {done ? (
          <div className="text-center" aria-live="polite">
            <CheckCircle2 className="mx-auto text-brand-ink" size={52} aria-hidden="true" />
            <h1 className={cn(H1, "mt-4")}>Your password is updated</h1>
            <p className={P}>
              {signedIn
                ? "You’re signed in and ready to go."
                : "Log in with your new password to continue."}
            </p>
            <div className="mx-auto mt-7 max-w-[300px]">
              {signedIn ? (
                <Link className={btn({ block: true })} href={routes.ui.indexRoute}>
                  Continue
                </Link>
              ) : (
                /* The auto sign-in did not take. Say nothing about why — it
                   changes nothing they can act on — and give them the door,
                   with the address they just used already in it. */
                <Button block onClick={() => openAuth("login", form.email)}>
                  Log in
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <h1 className={H1}>Set a new password</h1>
            <p className={cn(P, "mb-7")}>
              {showIdentity
                ? `Enter the ${CODE_LENGTH}-digit code from your reset email and choose a new password.`
                : "Choose a new password for your account."}
            </p>

            {alert && (
              <p
                className="mb-4 flex items-start gap-[9px] rounded-card-sm bg-danger-bg px-[13px] py-[11px] text-[13.5px] leading-[1.45] text-danger"
                role="alert"
              >
                <TriangleAlert size={16} aria-hidden="true" />
                {alert}
              </p>
            )}

            {showIdentity && (
              <>
                <div className="mb-4">
                  <label className={LABEL} htmlFor="rp-email">
                    Email address
                  </label>
                  <Input surface="auth"
                    id="rp-email"
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    onKeyDown={onEnter}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    aria-invalid={errors.email ? "true" : undefined}
                    aria-describedby={errors.email ? "rp-email-err" : undefined}
                  />
                  <FieldError id="rp-email-err" message={errors.email} />
                </div>

                <div className="mb-4">
                  <label className={LABEL} htmlFor="rp-token">
                    Reset code
                  </label>
                  <Input surface="auth"
                    id="rp-token"
                    className={AUTH_CODE_INPUT}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={CODE_LENGTH}
                    value={form.token}
                    onChange={set("token")}
                    onKeyDown={onEnter}
                    aria-invalid={errors.token ? "true" : undefined}
                    aria-describedby={errors.token ? "rp-token-err" : undefined}
                  />
                  <FieldError id="rp-token-err" message={errors.token} />
                </div>
              </>
            )}

            <div className="mb-4">
              <label className={LABEL} htmlFor="rp-pw">
                New password
              </label>
              {/* Reveal, not a confirm field. Typing a new password blind is how
                  people lock themselves out of the account they are recovering,
                  and the modal's sign-up form settled this the same way. */}
              <span className="relative block">
                <Input surface="auth"
                  id="rp-pw"
                  className="pr-[52px]"
                  type={show ? "text" : "password"}
                  value={form.newPassword}
                  onChange={set("newPassword")}
                  onKeyDown={onEnter}
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                  aria-invalid={errors.newPassword ? "true" : undefined}
                  aria-describedby={errors.newPassword ? "rp-pw-err" : "rp-pw-hint"}
                />
                <Button
                  variant="bare"
                  className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[50%] border-none bg-transparent px-1.5 py-px text-ink-2 hover:text-ink"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {show ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                </Button>
              </span>
              {errors.newPassword ? (
                <FieldError id="rp-pw-err" message={errors.newPassword} />
              ) : (
                <p className="mt-1.5 text-[12.5px] leading-[1.45] text-ink-3" id="rp-pw-hint">
                  {PASSWORD_RULE}
                </p>
              )}
            </div>

            <Button className="mt-2" block isLoading={busy} onClick={submit}>
              Set new password
            </Button>

            <p className="mt-5 text-center text-[14px] text-ink-2">
              Remembered it?{" "}
              <Button
                variant="bare"
                className="inline-flex min-h-11 items-center border-none bg-transparent px-0.5 align-middle text-[14px] font-bold text-ink underline underline-offset-[3px] hover:text-brand-ink"
                onClick={() => openAuth("login", form.email)}
              >
                Log in
              </Button>
            </p>
          </>
        )}

        {/* Passive, and only where a custom-scheme link can do anything. On
            desktop it either does nothing or raises a "no application set to
            open this" dialog. */}
        {canOpenApp && urlToken && !done && (
          <p className="mt-9 text-center">
            <a
              className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-2 underline underline-offset-[3px] hover:text-ink"
              href={appUrl}
            >
              <Smartphone size={15} aria-hidden="true" />
              Open in the Laundry Free app
            </a>
          </p>
        )}
      </div>
    </main>
  );
}
