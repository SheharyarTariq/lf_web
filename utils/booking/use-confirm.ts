"use client";

/* ══════════════════════════════════════════════════════════════════
   Placing the order, from whichever screen turns out to be last
   ══════════════════════════════════════════════════════════════════

   Confirm order used to live on one screen, so its busy flag, its error line
   and the rule that a failure must not navigate lived there too. It is now on
   four — Payment for anyone who still has to give us a card, Review on a phone
   without one, the Time step itself for a returning customer on a desktop, and
   Details when that customer has reopened it from a summary's Edit link, which
   puts it at the tail of a walk that no longer contains Payment — and those
   four must not drift apart on any of it.

   `before` is the part that genuinely differs: the payment step has a card to
   capture first, and a failure there has to stop the run rather than place an
   order that cannot be charged. Everything after it is identical, so it is
   here rather than copied.

   ── The confirm dialog ────────────────────────────────────────────
   Only on the wide layout. A phone reaches this button after a dedicated
   Review screen it has just read top to bottom, so a second "are you sure"
   on top of that would be confirming the confirmation. Wide never shows that
   screen — the summary sits pinned beside the form instead — so its Confirm
   order button is the one place nothing stands between a tap and the order
   going in, and that is the gap this dialog closes. `wide` is read from the
   same breakpoint the walk itself is built from, so this cannot disagree
   with which screen the button says it is on.
   ══════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { useBooking } from "@/utils/booking/context";
import { useWide } from "@/utils/hooks";

export type ConfirmStep = { ok: true } | { ok: false; message: string };

const FAILED = "We could not place your order. Please try again.";

export function useConfirmSubmit(before?: () => Promise<ConfirmStep>) {
  const { confirmOrder } = useBooking();
  const wide = useWide();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  const place = async () => {
    setBusy(true);
    setError("");

    if (before) {
      const done = await before();
      if (!done.ok) {
        setBusy(false);
        setError(done.message);
        return;
      }
    }

    const placed = await confirmOrder();
    /* `busy` is deliberately left set on success: confirmOrder navigates to the
       confirmation, and clearing it first would flash the form back to its idle
       state under the transition.

       And nothing navigates on failure. A confirmation screen for an order that
       was never created is the one outcome worth any amount of code to avoid,
       which is why confirmOrder reports rejection back rather than throwing. */
    if (!placed.ok) {
      setBusy(false);
      setError(placed.message ?? FAILED);
    }
  };

  const submit = async () => {
    if (busy) return;
    if (wide) {
      setConfirming(true);
      return;
    }
    await place();
  };

  const confirmPlacement = async () => {
    setConfirming(false);
    await place();
  };

  const cancelConfirm = () => setConfirming(false);

  return { busy, error, submit, setError, confirming, confirmPlacement, cancelConfirm };
}
