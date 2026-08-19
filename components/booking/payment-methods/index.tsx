"use client";

/* ══════════════════════════════════════════════════════════════════
   The saved cards
   ══════════════════════════════════════════════════════════════════

   `POST /orders` charges the **default** card and carries no card field of
   its own, so "use this one" and "make it the default" are the same act.
   That is why choosing a card is a write rather than local state, and why
   the list always re-reads /my-status afterwards instead of patching itself:
   what is on screen should be the server's answer, since the server is what
   the charge will follow.

   Extracted from PaymentScreen so that screen stays about placing an order.
   ══════════════════════════════════════════════════════════════════ */

import { cn } from "@/utils/cn";
import { useState } from "react";
import Button from "@/components/common/Button";
import Loader from "@/components/common/Loader";
import Modal from "@/components/common/Modal";
import { Icon, P } from "@/components/booking/icons";
import { deleteCard, markCardDefault } from "@/utils/booking/api";
import type { PaymentMethod } from "@/utils/auth";
import {
  CONTROL_PEER,
  ERR,
  MODAL_NAV,
  MODAL_NAV_BTN,
  SEC_H,
  SEC_P,
} from "@/utils/booking/styles";

/* The row is a container, and Remove is its **sibling**, not its child.
   That is load-bearing rather than tidy: a <button> inside a <label> takes the
   label's text as its accessible name, so nested, Remove announced itself as
   "Mastercard ending 4444 Expires 12/30" — the card, not the act. Caught by an
   aria snapshot; it looks identical on screen either way. Outside the label it
   also stops needing a preventDefault to avoid selecting the card it deletes. */
const ROW =
  "flex items-center gap-3 border-[1.5px] px-[14px] py-3 " +
  "transition-[border-color,background-color] duration-150 ease-[ease] " +
  "has-[input:focus-visible]:outline has-[input:focus-visible]:outline-[3px] " +
  "has-[input:focus-visible]:outline-offset-[-3px] has-[input:focus-visible]:outline-bk-ink";
/* The selectable part. Stretches so the whole row bar the Remove control is
   the target — these are 44px-plus already, and a radio-sized hit area would
   be the only small thing on the screen. */
const ROW_PICK = "flex min-w-0 flex-auto items-center gap-3";
const ROW_ON = "border-brand bg-panel";
const ROW_OFF = "border-bk-line-2 bg-white hover:border-bk-ink-3";
/* Single card: not a choice, so not a control — no border colour that implies
   one, and no hover. */
const ROW_ONLY = "border-bk-line bg-white";

/* The dot is always drawn and always the same size; only its fill changes, so
   nothing shifts as the selection moves. */
const DOT =
  "flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[50%] border-[1.5px] " +
  "border-bk-line-2 bg-white transition-[border-color] duration-150 ease-[ease] " +
  "peer-checked:border-brand";
const DOT_IN = "h-2.5 w-2.5 rounded-[50%] bg-transparent peer-checked:bg-brand";

const REMOVE =
  "-my-1.5 -mr-1.5 flex min-h-11 flex-none cursor-pointer items-center justify-center " +
  "rounded-card-sm border-0 bg-transparent px-2 text-[13px] font-semibold leading-[1.6] " +
  "text-bk-ink-2 underline underline-offset-[3px] hover:text-danger";

/** `"visa"` on the wire. Capitalised here rather than at the source, because
 *  the raw value is what the server calls it and other readers may want it. */
const brandName = (b?: string | null) =>
  b ? b.charAt(0).toUpperCase() + b.slice(1) : "Card";

function CardFace({ card }: { card: PaymentMethod }) {
  return (
    <span className="min-w-0 flex-auto">
      <b className="block text-[14.5px] font-bold">
        {brandName(card.brand)} ending {card.last4 ?? "••••"}
      </b>
      {card.expiryMonth && card.expiryYear && (
        <span className="block text-[13px] text-bk-ink-3">
          Expires {String(card.expiryMonth).padStart(2, "0")}/
          {String(card.expiryYear).slice(-2)}
        </span>
      )}
    </span>
  );
}

export default function PaymentMethods({
  cards,
  onChanged,
  disabled = false,
}: {
  cards: PaymentMethod[];
  /** Re-read /my-status. Every mutation here ends in one. */
  onChanged: () => Promise<void>;
  /** True while the screen is doing something of its own — placing the order,
   *  or saving a new card — so the list cannot be edited underneath it. */
  disabled?: boolean;
}) {
  /* The id being acted on, so a spinner and the disabled state land on the one
     row rather than the whole list. */
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [confirming, setConfirming] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState("");

  const choose = async (card: PaymentMethod) => {
    if (card.isDefault || busyId !== null || disabled) return;
    setBusyId(card.id);
    setError("");
    const r = await markCardDefault(card.id);
    if (r.ok) await onChanged();
    else setError(r.message);
    setBusyId(null);
  };

  const remove = async (card: PaymentMethod) => {
    setConfirming(null);
    setBusyId(card.id);
    setError("");
    const r = await deleteCard(card.id);
    /* 409 while an order is active is the one to expect, and it is a 4xx, so
       the server's own wording is worth showing — it explains a refusal we
       would otherwise have to guess at. */
    if (r.ok) await onChanged();
    else setError(r.message);
    setBusyId(null);
  };

  const single = cards.length === 1;

  return (
    <>
      <ul className="overflow-hidden rounded-card-md">
        {cards.map((card, i) => {
          const busy = busyId === card.id;
          const on = Boolean(card.isDefault);
          return (
            <li key={card.id} className={i ? "-mt-[1.5px]" : ""}>
              <div
                className={cn(
                  ROW,
                  i === 0 && "rounded-t-card-md",
                  i === cards.length - 1 && "rounded-b-card-md",
                  single ? ROW_ONLY : on ? ROW_ON : ROW_OFF,
                  (busy || disabled) && "opacity-60",
                )}
              >
                {/* A list of one is not a choice, so it renders as a statement
                    rather than as a radio nobody can move — but it keeps its
                    Remove control, which is the only act still available. */}
                <label className={cn(ROW_PICK, single ? "cursor-default" : "cursor-pointer")}>
                  {!single && (
                    <>
                      <input
                        className={CONTROL_PEER}
                        type="radio"
                        name="lf-card"
                        checked={on}
                        disabled={busy || disabled}
                        onChange={() => choose(card)}
                      />
                      <span className={DOT} aria-hidden="true">
                        <span className={DOT_IN} />
                      </span>
                    </>
                  )}
                  <span
                    className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-card-sm bg-bk-paper-2"
                    aria-hidden="true"
                  >
                    <Icon icon={P.card} size={18} />
                  </span>
                  <CardFace card={card} />
                </label>
                {busy && <Loader className="h-4 w-4 flex-none" />}
                <Button
                  variant="bare"
                  className={REMOVE}
                  disabled={busy || disabled}
                  onClick={() => setConfirming(card)}
                >
                  Remove<span className="visually-hidden"> {brandName(card.brand)} ending {card.last4}</span>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      {error && (
        <p className={cn(ERR, "mt-2.5")} role="alert">
          <Icon icon={P.alert} size={15} className="mt-0.5 flex-none" />
          {error}
        </p>
      )}

      {confirming && (
        /* onClose is Cancel deliberately: Escape and a stray backdrop click are
           both ways people dismiss things, and neither should delete a card. */
        <Modal onClose={() => setConfirming(null)} labelledBy="lf-rm-card-t">
          <h2 className={SEC_H} id="lf-rm-card-t">
            Remove this card?
          </h2>
          <p className={SEC_P}>
            {brandName(confirming.brand)} ending {confirming.last4} will be taken off your
            account. You can add it again later.
          </p>
          <div className={MODAL_NAV}>
            <Button
              surface="booking" variant="ghost" size="lg" className={MODAL_NAV_BTN}
              onClick={() => remove(confirming)}
            >
              Remove card
            </Button>
            <Button
              surface="booking" variant="lime" size="lg" className={MODAL_NAV_BTN}
              onClick={() => setConfirming(null)}
            >
              Keep it
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
