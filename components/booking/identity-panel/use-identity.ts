"use client";

/* ══════════════════════════════════════════════════════════════════
   The identity panel's state, held one level up
   ══════════════════════════════════════════════════════════════════

   All of this used to live inside the panel. It moved out because the button
   that redeems the code is no longer in the panel: the contact screen's Next
   is what submits it, so the screen needs to know whether there is a code
   waiting and whether it is long enough to send.

   The panel is the view of this hook, and the screen owns it. Nothing else
   should call it — it patches the booking and hands the account back through
   `onResolved`, both of which only make sense on the contact screen.
   ══════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { toE164 } from "@/utils/api";
import { loginWithCode, registerGuest, requestVerificationCode, type AuthUser } from "@/utils/auth";
import { CODE_LENGTH, RESEND_SECONDS, type BookingData, type BookingPatch } from "@/utils/booking/model";

/** "create" is the one-click button; "code" is the six-digit box that confirms
 *  the address and, in doing so, signs the person in. */
export type IdentityPhase = "create" | "code";

export interface Identity {
  phase: IdentityPhase;
  code: string;
  setCode: (next: string) => void;
  error: string;
  busy: boolean;
  cooldown: number;
  /** What the screen's Next reads to decide whether pressing it can do
   *  anything. Six digits and nothing already in flight. */
  canSubmitCode: boolean;
  register: () => Promise<void>;
  submitCode: () => Promise<void>;
  resend: () => Promise<void>;
}

export function useIdentity({
  data,
  patch,
  onResolved,
}: {
  data: BookingData;
  patch: (next: BookingPatch) => void;
  /** Handed the account that now exists, because the caller has a booking to
   *  save against it and only the id can address the user endpoints. */
  onResolved?: (user: AuthUser) => void;
}): Identity {
  const [phase, setPhase] = useState<IdentityPhase>("create");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  /* A different address is a different question, so everything asked about the
     last one is dropped. The panel used to get this from `key={data.email}`,
     which cannot reach state that lives up here — adjusting during render is
     the equivalent, and unlike an effect it leaves no frame showing a code box
     belonging to an address that has been typed over. */
  const [lastEmail, setLastEmail] = useState(data.email);
  if (data.email !== lastEmail) {
    setLastEmail(data.email);
    setPhase("create");
    setCode("");
    setError("");
    setCooldown(0);
  }

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setInterval(() => setCooldown((n) => (n <= 1 ? 0 : n - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const done = (user: AuthUser) => {
    patch({ verified: true, identity: "" });
    onResolved?.(user);
  };

  /* `purpose: "login"` is the one /login-with-code redeems — the same kind the
     server sends of its own accord on registration, so the resend replaces
     rather than competes with it. Always answers 200, even for an address with
     no account, so it can report nothing and is not asked to. */
  const resend = async () => {
    setCooldown(RESEND_SECONDS);
    setCode("");
    await requestVerificationCode(data.email, "login");
  };

  /* One tap, and the whole of it: /register-as-guest takes no password and
     answers with no token, so all this can do is put a code in the post and
     move the panel to the box that redeems it. */
  const register = async () => {
    if (busy) return;
    setBusy(true);
    setError("");
    const r = await registerGuest({
      email: data.email,
      name: data.fullName,
      phone: toE164(data.mobile),
    });
    setBusy(false);

    if (r.ok) {
      setPhase("code");
      /* The clock starts as the consequence of a send, and this 200 *is* the
         send — the server posts the code before it answers. Nothing is
         requested here on top of that, or the code they are reading in their
         inbox would be the one we just replaced. */
      setCooldown(RESEND_SECONDS);
      return;
    }

    /* Defensive only. The server is meant to recognise an address it already
       holds and send a code to it rather than refuse it. If it ever does
       refuse, the code step is still where that person belongs — there is an
       account and the code logs into it — so ask for the code ourselves and
       carry on rather than stopping them at a dead end. */
    if (r.fields.email) {
      setPhase("code");
      void resend();
      return;
    }

    /* A violation on any other field is shown as-is: it is the server naming
       something we sent, and the fields it can name — name, phone — are all on
       the form directly above the panel. */
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

  return {
    phase,
    code,
    setCode: (next: string) => {
      setCode(next.replace(/\D/g, "").slice(0, CODE_LENGTH));
      setError("");
    },
    error,
    busy,
    cooldown,
    canSubmitCode: code.length === CODE_LENGTH && !busy,
    register,
    submitCode,
    resend,
  };
}
