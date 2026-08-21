"use client";

/* ══════════════════════════════════════════════════════════════════
   /verify-email — the page behind the button in the email
   ══════════════════════════════════════════════════════════════════

   Was a DeepLinkFallback stub that raced a timer to the app store. It is a
   real page now, because someone who signed up on the web and clicked the
   button in their inbox was being told to install an app to finish something
   they had already started in a browser.

   The OS decides before we do. /verify-email* is claimed in the .well-known
   association files, so a phone with the app installed opens the app and this
   never renders. What lands here is desktop, phones without the app, and
   in-app webviews (Gmail, Outlook) which do not honour Universal Links — which
   is the one audience the passive "Open in the app" line at the bottom is for.
   No interstitial, no redirect: both are the pattern this page replaced.

   Verifying needs a Bearer token, so who arrives with what decides everything:

     · same browser they signed up in → the pending cookie is right there and
       this verifies with no interaction at all. The common case, and the
       reason that cookie exists.
     · a different device → nothing to authenticate with, so they log in once
       and the submit resumes by itself. See useBearerToken.
     · already verified → say so rather than posting a spent code and
       reporting a failure.
   ══════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MailWarning, Smartphone, TriangleAlert } from "lucide-react";
import Button from "@/components/common/Button";
import { btn } from "@/utils/button";
import Input from "@/components/common/Input";
import Loader from "@/components/common/Loader";
import { useAuth } from "@/components/common/AuthProvider";
import { useBearerToken } from "@/utils/hooks";
import { fetchStatus, logout, resendVerification, verifyEmail } from "@/utils/auth";
import { CODE_LENGTH, RESEND_SECONDS } from "@/utils/auth/model";
import { AUTH_CODE_INPUT } from "@/utils/auth/styles";
import { validateAndSetErrors } from "@/utils/validation";
import { verifyEmailSchema } from "./schema";
import { routes } from "@/utils/routes";
import { APP_SCHEME } from "@/config";
import { cn } from "@/utils/cn";

/** What the POST settled on. Null means it has not answered yet, and
 *  everything else about what to show is derived rather than stored — a
 *  status that can be worked out from props and context should not also be a
 *  piece of state that can disagree with them. */
type Outcome = "success" | "invalid" | "error" | "alreadyVerified";

type ViewState = Outcome | "checking" | "needsLogin" | "noToken";

const CARD = "mx-auto w-full max-w-[440px] text-center";
const H1 = "text-[clamp(24px,3.2vw,32px)] font-extrabold tracking-[-1px] leading-[1.15] text-dark";
const P = "mt-3 text-[15px] leading-[1.6] text-muted";

export default function VerifyEmail({
  token,
  canOpenApp,
}: {
  token: string;
  canOpenApp: boolean;
}) {
  const bearer = useBearerToken();
  const { user, loading, openAuth, closeAuth, refreshSession } = useAuth();

  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [code, setCode] = useState(token);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [left, setLeft] = useState(0);
  /* Whose address the "already confirmed" pane is talking about. Only set on
     the path that had to ask /my-status to find out; the ordinary path already
     has it from the session. */
  const [confirmedEmail, setConfirmedEmail] = useState<string | null>(null);

  /* Set to the credential it was tried with, not to a boolean: that survives
     StrictMode's double mount while still allowing exactly one more attempt if
     logging in supplies a *different* token. */
  const attemptedFor = useRef<string | null>(null);
  const prompted = useRef(false);

  /* `bearer === undefined` is "the cookie has not been read yet", which is what
     every hydration render sees, and it is deliberately not folded into the
     `!bearer` arm below. That arm opens a login modal, and offering to log in
     someone who is already holding a token is the bug this shape exists to
     prevent — see the auto-open effect. A spinner is the honest answer while
     the answer is unknown, and it costs one commit.

     `!token` stays first: a bare /verify-email renders manual entry with no
     credential involved, so it should not wait on a cookie to say so. */
  const view: ViewState =
    outcome ??
    (!token
      ? "noToken"
      : bearer === undefined
        ? "checking"
        : !bearer
          ? "needsLogin"
          : !loading && user?.verified
            ? "alreadyVerified"
            : "checking");

  const submit = useCallback(
    async (value: string) => {
      const r = await verifyEmail(value);
      if (r.ok) {
        /* Before the await, not after it, or a modal sits over the success
           pane for the length of a /my-status round trip. This is not what
           stops the modal opening — the `undefined` arm in `view` is — it is
           what makes "a login form on top of a page saying you are signed in"
           unreachable from any route, including ones that do not exist yet.
           A no-op on every path we have: nobody is logged out here. */
        closeAuth();
        /* utils/auth has already promoted the pending token, so there is a
           session now — but the header is still rendering the one from before
           it existed. */
        await refreshSession();
        /* Drop the spent code out of the URL and out of history. Without this
           a refresh or a back-tap re-posts a code that has been used, and
           paints "this link didn't work" over a success. */
        window.history.replaceState(null, "", routes.ui.verifyEmail);
        setOutcome("success");
        return;
      }
      if (r.status === 401 || r.status === 403) {
        /* A rejected token is a dead token — the same policy loadSession
           applies. Clearing it is what makes this terminate: `bearer` drops to
           null, `view` becomes needsLogin, and the effect short-circuits.
           Resetting the attempt without clearing the credential would leave
           the effect resubmitting the same dead token forever. */
        logout();
        attemptedFor.current = null;
        setOutcome(null);
        return;
      }
      if (r.status === 400 || r.status === 422) {
        /* 400 is "wrong", "expired" and "already used" all at once, and the
           API does not say which. It used to be reported as a dead link on
           that basis — but two of the ordinary ways to land here are not the
           link's fault at all, and both end with an address that is in fact
           confirmed:

             · the code was already spent, by another tab or an earlier click
             · a leftover pendingtoken from a previous signup posted this code
               under a different account — invisible in the header, because
               loadSession only answers for a session cookie

           So ask what is true before blaming the link. The POST just emptied
           apiCall's GET cache, so this reads fresh.

           Note what this can and cannot know: /my-status describes whoever
           holds the token, which in the second case above is *not* the account
           the code was issued for. So the answer names the address rather than
           asserting a bare "you're all set" — "<addr> is already confirmed" is
           true either way, and makes a mismatch the user's to spot instead of
           ours to get wrong. */
        const who = await fetchStatus();
        if (who?.emailVerifiedAt) {
          closeAuth();
          setConfirmedEmail(who.email ?? null);
          setOutcome("alreadyVerified");
          return;
        }
        /* Genuinely unverified: the code really is wrong or expired, and the
           existing copy is the honest answer. */
        setOutcome("invalid");
        return;
      }
      setOutcome("error");
    },
    [closeAuth, refreshSession],
  );

  /* The automatic path. Nothing is set synchronously here: `view` is derived,
     so the spinner is already on screen and the only writes happen once the
     request answers. */
  useEffect(() => {
    if (!token || !bearer || outcome || loading) return;
    if (user?.verified) return;
    if (attemptedFor.current === bearer) return;
    attemptedFor.current = bearer;
    void submit(token);
  }, [token, bearer, outcome, loading, user?.verified, submit]);

  /* Offered once, not on every render, and never re-opened after a dismiss —
     the page keeps its own Log in button for that.

     This effect is why `view` distinguishes "not read yet" from "no token", so
     do not collapse those two arms back together. It latches `prompted` the
     first time it sees needsLogin and cannot be undone, and on the hydration
     commit it reads a `view` that React has already scheduled a re-render to
     replace: useSyncExternalStore detects the changed snapshot in its own
     passive effect, but scheduling from inside a commit does not flush before
     the rest of that commit's effects run. So a `view` that is merely stale
     here is acted on as though it were settled. */
  useEffect(() => {
    if (view !== "needsLogin" || prompted.current) return;
    prompted.current = true;
    openAuth("login");
  }, [view, openAuth]);

  useEffect(() => {
    if (!resendAt) return;
    const id = setInterval(() => {
      const n = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
      setLeft(n);
      if (n === 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [resendAt]);

  const submitManual = async () => {
    if (busy) return;
    if (!(await validateAndSetErrors(verifyEmailSchema, { code }, setErrors))) return;
    setBusy(true);
    await submit(code.trim());
    setBusy(false);
  };

  const resend = async () => {
    if (left > 0 || busy) return;
    setBusy(true);
    const r = await resendVerification();
    setBusy(false);
    if (!r.ok) return;
    setResendAt(Date.now() + RESEND_SECONDS * 1000);
    setLeft(RESEND_SECONDS);
    setCode("");
    setErrors({});
  };

  /* Rebuilt from the route constant rather than from window.location, so it
     cannot drift if the path changes. */
  const appUrl = `${APP_SCHEME}://${routes.ui.verifyEmail.slice(1)}?token=${encodeURIComponent(token)}`;

  const manualEntry = (
    <div className="mx-auto mt-7 max-w-[300px] text-left">
      <label className="mb-[7px] block text-[14px] font-semibold text-dark" htmlFor="vc">
        Verification code
      </label>
      <Input surface="auth"
        id="vc"
        className={AUTH_CODE_INPUT}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={CODE_LENGTH}
        value={code}
        onChange={(e) => {
          setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH));
          setErrors({});
        }}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          void submitManual();
        }}
        aria-invalid={errors.code ? "true" : undefined}
        aria-describedby={errors.code ? "vc-err" : undefined}
      />
      {errors.code && (
        <p className="mt-1.5 flex items-start gap-[7px] text-[13px] leading-[1.45] text-danger" id="vc-err">
          <TriangleAlert size={15} aria-hidden="true" />
          {errors.code}
        </p>
      )}
      <Button
        className="mt-3.5"
        block
        isLoading={busy}
        disabled={code.length !== CODE_LENGTH}
        onClick={submitManual}
      >
        Verify
      </Button>
    </div>
  );

  return (
    <main className="flex-1 w-full px-5 py-[72px] max-[860px]:py-[52px]">
      <div className={CARD} aria-live="polite">
        {view === "checking" && (
          <>
            <Loader className="mx-auto h-7 w-7" />
            <p className={cn(P, "mt-4")}>Confirming your email&hellip;</p>
          </>
        )}

        {view === "success" && (
          <>
            <CheckCircle2 className="mx-auto text-brand-ink" size={52} aria-hidden="true" />
            <h1 className={cn(H1, "mt-4")}>Your email is confirmed</h1>
            <p className={P}>You&rsquo;re all set, and you&rsquo;re now signed in.</p>
            {/* next/link wearing the button recipe — btn() exists as a class
                string precisely because these are navigations, not actions. */}
            <div className="mx-auto mt-7 flex max-w-[300px] flex-col gap-2.5">
              <Link className={btn({ block: true })} href={routes.ui.indexRoute}>
                Continue
              </Link>
              {/* Secondary, not primary: somebody confirming from a second
                  device has no booking in progress here, and dropping them
                  into the checkout restarts one they may be half through
                  somewhere else. */}
              <Link
                className={btn({ variant: "ghost", block: true })}
                href={routes.ui.book("address")}
              >
                Book a collection
              </Link>
            </div>
          </>
        )}

        {view === "alreadyVerified" && (
          <>
            <CheckCircle2 className="mx-auto text-brand-ink" size={52} aria-hidden="true" />
            <h1 className={cn(H1, "mt-4")}>You&rsquo;re all set</h1>
            {/* Named rather than "this address", because the two are not
                always the same one: a credential left in this browser by an
                earlier sign-up answers for its own account, not for whoever
                the code was sent to. Saying which is what lets somebody
                notice they are signed in as the wrong person. */}
            {confirmedEmail ?? user?.email ? (
              <p className={P}>
                <strong className="font-semibold text-dark">
                  {confirmedEmail ?? user?.email}
                </strong>{" "}
                has already been confirmed.
              </p>
            ) : (
              <p className={P}>This address has already been confirmed.</p>
            )}
            <div className="mx-auto mt-7 max-w-[300px]">
              <Link className={btn({ block: true })} href={routes.ui.indexRoute}>
                Continue
              </Link>
            </div>
          </>
        )}

        {view === "needsLogin" && (
          <>
            <h1 className={H1}>Log in to finish confirming your email</h1>
            {/* Said plainly, because it is the honest reason: confirming is an
                authenticated action, and this browser has nothing to
                authenticate with. */}
            <p className={P}>
              You opened this link somewhere you aren&rsquo;t logged in. Log in and we&rsquo;ll do
              the rest automatically — you won&rsquo;t need to enter the code.
            </p>
            <div className="mx-auto mt-7 max-w-[300px]">
              <Button block onClick={() => openAuth("login")}>
                Log in
              </Button>
            </div>
          </>
        )}

        {view === "invalid" && (
          <>
            <MailWarning className="mx-auto text-muted" size={52} aria-hidden="true" />
            <h1 className={cn(H1, "mt-4")}>This link didn&rsquo;t work</h1>
            <p className={P}>
              It may have expired, or it may have already been used. Send yourself a new code, or
              type the one from your most recent email.
            </p>
            <div className="mx-auto mt-6 max-w-[300px]">
              <Button
                variant="ghost"
                block
                disabled={left > 0 || busy}
                onClick={resend}
              >
                {left > 0 ? `Send a new code in ${left}s` : "Send a new code"}
              </Button>
            </div>
            {manualEntry}
          </>
        )}

        {view === "noToken" && (
          <>
            <h1 className={H1}>Confirm your email</h1>
            <p className={P}>Enter the {CODE_LENGTH}-digit code from your verification email.</p>
            {manualEntry}
          </>
        )}

        {view === "error" && (
          <>
            <TriangleAlert className="mx-auto text-danger" size={52} aria-hidden="true" />
            <h1 className={cn(H1, "mt-4")}>Something went wrong</h1>
            <p className={P}>We couldn&rsquo;t confirm your email just now. Please try again.</p>
            <div className="mx-auto mt-7 max-w-[300px]">
              <Button
                block
                isLoading={busy}
                onClick={() => {
                  attemptedFor.current = null;
                  setOutcome(null);
                }}
              >
                Try again
              </Button>
            </div>
          </>
        )}

        {/* Passive, and only where it can work. On desktop a custom-scheme
            link either does nothing or raises a "no application set to open
            this" dialog, which is worse than not offering it. */}
        {canOpenApp && token && (
          <p className="mt-9">
            <a
              className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-muted underline underline-offset-[3px] hover:text-dark"
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
