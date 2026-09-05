"use client";

/* ══════════════════════════════════════════════════════════════════
   Confirming the address, on the contact screen
   ══════════════════════════════════════════════════════════════════

   Identity is settled here rather than at the order, so the account exists
   before anything is booked against it. The panel cannot be dismissed — but
   only because all that is left of it is six digits, so there is nothing to
   escape from.

   ── Why there is only one card ───────────────────────────────────

   There used to be two. The first said "Create your account" over a single
   "One-click registration" button, and it was asked to justify a whole panel
   for one press of one button whose entire job was to send a code. The email
   field sends the code itself now — tapping a domain out of its suggestion
   list, or pressing the arrow inside it — so by the time anything here mounts,
   the code is already in the post and the only question left is what it says.

   Registration is `POST /register-as-guest`, which answers 200 with an empty
   body: no password asked for, and no token handed back. So sending does not
   sign anybody in — the server puts a six-digit code in their inbox, and
   `POST /login-with-code` is what turns that code into a session.

   The design's second state — "You already have an account", shown after an
   address is recognised — is gone, along with the question it answered. The
   server recognises the address itself and sends a code either way, so a
   returning customer and a new one see the same screen and nothing here ever
   has to ask, or tell anybody, which of the two they are.

   The button that redeems the code is the screen's Next, not one of ours: see
   `use-identity.ts`, which holds this panel's state for that reason.
   ══════════════════════════════════════════════════════════════════ */

import { cn } from "@/utils/cn";
import Button from "@/components/common/Button";
import { useEffect, useId, useRef } from "react";
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
  const { code, setCode, error, busy, cooldown } = identity;

  /* This card is the direct answer to a tap somewhere else on the screen, and
     there is nothing on it to press — so the caret starts in the box rather
     than making somebody reach for it. A mount effect is the whole of it now
     that the screen only mounts this in the code phase. */
  const codeRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    codeRef.current?.focus();
  }, []);

  const errorLine = error && (
    <p className={ERR} role="alert">
      <Icon icon={P.alert} size={16} className="mt-0.5 flex-none" />
      {error}
    </p>
  );

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
        ref={codeRef}
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
