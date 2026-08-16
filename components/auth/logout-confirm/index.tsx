"use client";

/* ══════════════════════════════════════════════════════════════════
   Log out?
   ══════════════════════════════════════════════════════════════════

   Both "Log out" controls sit in the header — the desktop bar and the mobile
   drawer — where they are one tap from things people actually meant to press.
   Signing out costs an email and a password to undo, which is enough to be
   worth asking about first.

   Same shape as the checkout's ExitConfirm: no title bar and no close cross,
   because the two buttons *are* the exits. Palette is bk-*, matching AuthModal
   — a dialog raised from the marketing header but belonging to the account is
   the same category of object, and these two alternate on screen.
   ══════════════════════════════════════════════════════════════════ */

import Modal from "@/components/common/Modal";
import Button from "@/components/common/Button";
import { MODAL_NAV, MODAL_NAV_BTN, SEC_H, SEC_P } from "@/utils/booking/styles";

export default function LogoutConfirm({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    /* onClose is the *safe* action deliberately. Escape and a stray click on
       the backdrop are both things people do to dismiss something, and neither
       should be a way to log out by accident. */
    <Modal onClose={onCancel} labelledBy="lf-logout-t" elevated>
      <h2 className={SEC_H} id="lf-logout-t">
        Log out?
      </h2>
      {/* Nothing is lost by logging out — the checkout keeps its own state and
          this header is not even mounted during /book — so the copy must not
          imply otherwise. */}
      <p className={SEC_P}>You will need your email and password to log back in.</p>
      <div className={MODAL_NAV}>
        <Button
          surface="booking"
          variant="ghost"
          size="lg"
          className={MODAL_NAV_BTN}
          onClick={onConfirm}
        >
          Log out
        </Button>
        <Button
          surface="booking"
          variant="lime"
          size="lg"
          className={MODAL_NAV_BTN}
          onClick={onCancel}
        >
          Stay logged in
        </Button>
      </div>
    </Modal>
  );
}
