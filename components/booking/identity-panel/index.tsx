"use client";

/* ══════════════════════════════════════════════════════════════════
   Identity, settled on the contact screen
   ══════════════════════════════════════════════════════════════════

   Identity is settled here rather than at the order, so the account exists
   before anything is booked against it. The panel cannot be dismissed — but
   only because the path through it is a single tap and then six digits, so
   there is nothing to escape from.

   ── One path, in two steps ───────────────────────────────────────

   Registration is `POST /register-as-guest`, which answers 200 with an empty
   body: no password asked for, and no token handed back. So the tap does not
   sign anybody in — it asks the server to put a six-digit code in their inbox,
   and `POST /login-with-code` is what turns that code into a session. Both
   steps are the same panel, one after the other.

   The design's second state — "You already have an account", shown after an
   address is recognised — is gone, along with the question it answered. The
   server recognises the address itself and sends a code either way, so a
   returning customer and a new one see the same two screens and nothing here
   ever has to ask, or tell anybody, which of the two they are.

   The button that redeems the code is the screen's Next, not one of ours: see
   `use-identity.ts`, which holds this panel's state for that reason.
   ══════════════════════════════════════════════════════════════════ */

import { cn } from "@/utils/cn";
import Button from "@/components/common/Button";
import Loader from "@/components/common/Loader";
import { useId } from "react";
import { Icon, P } from "@/components/booking/icons";
import { CODE_LENGTH, type BookingData } from "@/utils/booking/model";
import { BTN_LINK, CODE_INPUT, ERR } from "@/utils/booking/styles";
import type { Identity } from "@/components/booking/identity-panel/use-identity";

const PANEL = "mb-1 rounded-card-lg bg-bk-paper-2 p-4";
const PANEL_H = "mb-1 text-[16px] font-bold leading-[1.3] tracking-[-.3px]";
const PANEL_P = "mb-3 text-[13.5px] leading-[1.5] text-bk-ink-2";
const ALT = "mt-2.5 text-center text-[13.5px] text-bk-ink-2";
const ADDRESS = "font-semibold text-bk-ink [overflow-wrap:anywhere]";

export default function IdentityPanel({
  data,
  identity,
}: {
  data: BookingData;
  /** Owned by the contact screen, because its Next button is what submits the
   *  code. This component only renders it. */
  identity: Identity;
}) {
  const ids = useId();
  const { phase, code, setCode, error, busy, cooldown } = identity;

  const errorLine = error && (
    <p className={ERR} role="alert">
      <Icon icon={P.alert} size={16} className="mt-0.5 flex-none" />
      {error}
    </p>
  );

  if (phase === "code") {
    return (
      <div className={PANEL} aria-live="polite">
        <p className={PANEL_H}>Confirm your email</p>
        <p className={PANEL_P}>
          We sent a {CODE_LENGTH}-digit code to <b className={ADDRESS}>{data.email}</b>.
        </p>

        {/* Full width: the button that used to sit beside it is the screen's
            Next now, so the field has the row to itself. */}
        <input
          id={`${ids}-c`}
          className={cn(CODE_INPUT, "w-full")}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          value={code}
          disabled={busy}
          aria-label={`${CODE_LENGTH}-digit code`}
          aria-invalid={error ? "true" : undefined}
          placeholder="······"
          onChange={(e) => setCode(e.target.value)}
          /* Enter is the same call the Next button makes. The button is where
             the action lives, but nobody who has just typed six digits should
             have to go looking for it. */
          onKeyDown={(e) => {
            if (e.key === "Enter") void identity.submitCode();
          }}
        />
        {errorLine}

        <p className={ALT}>
          <Button
            variant="bare"
            className={cn(BTN_LINK, "disabled:cursor-default disabled:opacity-50")}
            disabled={cooldown > 0 || busy}
            onClick={() => void identity.resend()}
          >
            {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Send a new code"}
          </Button>
        </p>
      </div>
    );
  }

  return (
    <div className={PANEL} aria-live="polite">
      <p className={PANEL_H}>Create your account</p>
      <p className={PANEL_P}>
        Sign up with <b className={ADDRESS}>{data.email}</b> to easily manage all your orders in
        one place.
      </p>

      <Button
        surface="booking"
        size="lg"
        block
        className="gap-2"
        disabled={busy}
        isLoading={busy}
        onClick={() => void identity.register()}
      >
        {busy && <Loader className="h-4 w-4" />}
        {/* "One-click" carries the meaning nothing else does: that this is the
            entire action, not the start of a sign-up. It is also literally
            true — /register-as-guest takes no password. */}
        One-click registration
      </Button>

      {errorLine}

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
