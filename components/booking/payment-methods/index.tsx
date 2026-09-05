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
import { useMemo, useState } from "react";
import Button from "@/components/common/Button";
import Loader from "@/components/common/Loader";
import Modal from "@/components/common/Modal";
import { Icon, P } from "@/components/booking/icons";
import { deleteCard, markCardDefault } from "@/utils/booking/api";
import { brandName } from "@/utils/booking/model";
import type { PaymentMethod } from "@/utils/auth";
import {
  CONTROL_PEER,
  ERR,
  INHERIT_FONT,
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

/* The mark is always drawn and always the same size; only its colours change, so
   nothing shifts as the selection moves. It is a tick in a filled circle rather
   than the lime dot this started as: brand on white is 1.35:1, so that dot was
   drawn and invisible, and the row's green got read as decoration instead of as
   state — somebody reported the row "was green" without knowing it was chosen.
   bk-ink on brand is ~13:1. Same trick as the terms checkbox. */
const DOT =
  "flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[50%] border-[1.5px] " +
  "border-bk-line-2 bg-white text-transparent " +
  "transition-[background-color,border-color,color] duration-150 ease-[ease] " +
  "peer-checked:border-brand peer-checked:bg-brand peer-checked:text-bk-ink";

const REMOVE =
  "-my-1.5 -mr-1.5 flex min-h-11 flex-none cursor-pointer items-center justify-center " +
  "rounded-card-sm border-0 bg-transparent px-2 text-[13px] font-semibold leading-[1.6] " +
  "text-bk-ink-2 underline underline-offset-[3px] hover:text-danger";

/* The trailing "add a card" row. Same geometry as a card row so the group reads
   as one control instead of a list with a link loose underneath it — which is
   what it was, and it made the only alternative action on the screen the least
   important-looking thing on it. Never `ROW_ON`: this is an act, not a card
   that could be chosen.

   The focus ring is pulled inwards deliberately. `.lf-book :focus-visible` sets
   `outline-offset: 3px` and the <ul> is `overflow-hidden`, so on a full-width
   row the default ring is clipped to nothing. Same fix, and same reason, as the
   card rows' `has-[input:focus-visible]` treatment above. */
const ADD_ROW =
  "w-full cursor-pointer border-bk-line-2 bg-white text-left hover:border-bk-ink-3 " +
  "focus-visible:outline-offset-[-3px] disabled:cursor-not-allowed";

/* `brandName` moved to utils/booking/model — the two summaries name a card now
   that the step which used to show it can be skipped, and three copies of
   "capitalise the brand" is how they would come to disagree. */

function CardFace({ card, selected }: { card: PaymentMethod; selected: boolean }) {
  const expiry =
    card.expiryMonth && card.expiryYear
      ? `Expires ${String(card.expiryMonth).padStart(2, "0")}/${String(card.expiryYear).slice(-2)}`
      : "";
  return (
    <span className="min-w-0 flex-auto">
      <b className="block text-[14.5px] font-bold">
        {brandName(card.brand)} ending {card.last4 ?? "••••"}
      </b>
      {/* "Selected" rides the expiry line rather than taking one of its own, so
          the row does not change height as the selection moves. */}
      {(selected || expiry) && (
        <span className="block text-[13px] text-bk-ink-3">
          {/* aria-hidden deliberately: the radio already announces "selected",
              and a screen reader saying it twice is worse than the word being
              sighted-only. This is the visible half of that same state. */}
          {selected && (
            /* Hidden, not shrunk, under 481px: the face column is ~113px at
               375px and "Selected · Expires 03/33" wraps there, which would
               make the selected row taller than the others and move them as
               the choice moved. The tick is 12.45:1 and says the same thing. */
            <b className="font-semibold text-bk-ink to-480:hidden" aria-hidden="true">
              Selected{expiry && " · "}
            </b>
          )}
          {expiry}
        </span>
      )}
    </span>
  );
}

export default function PaymentMethods({
  cards,
  onChanged,
  onAdd,
  disabled = false,
}: {
  cards: PaymentMethod[];
  /** Re-read /my-status. Every mutation here ends in one. */
  onChanged: () => Promise<void>;
  /** Opens the caller's card form. When absent the row is not rendered at all,
   *  which is how the payment step hides it while that form is already open —
   *  offering "add a card" above an open card form would be answering a
   *  question nobody is still asking. */
  onAdd?: () => void;
  /** True while the screen is doing something of its own — placing the order,
   *  or saving a new card — so the list cannot be edited underneath it. */
  disabled?: boolean;
}) {
  /* The id being acted on, so a spinner and the disabled state land on the one
     row rather than the whole list. */
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [confirming, setConfirming] = useState<PaymentMethod | null>(null);
  const [error, setError] = useState("");

  /* Newest first, and ours rather than the server's.
     /my-status returns the cards **default-first**, so choosing the second row
     made it jump to the top — the row moving out from under the finger that
     pressed it. Age is a key that never changes, so the positions hold still
     and the selection is left to the only two things that should say it: the
     radio and the highlight. A card just added lands at the top, which is
     where somebody looks for the one they have this second typed in.

     Falls back to the response's own order if any card lacks the field, since
     a half-sorted list would be worse than an unsorted one. */
  const ordered = useMemo(() => {
    if (cards.some((c) => !c.createdAt)) return cards;
    return [...cards].sort((a, b) => (a.createdAt! < b.createdAt! ? 1 : -1));
  }, [cards]);

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

  /* Which row draws the bottom corners. The add row takes them when it is
     there, so the group stays one rounded block either way — the rounding is
     applied per row rather than by the <ul>, and a card row keeping
     `rounded-b-card-md` under a square add row is how that comes apart. */
  const lastRow = onAdd ? ordered.length : ordered.length - 1;

  return (
    <>
      <ul className="overflow-hidden rounded-card-md">
        {ordered.map((card, i) => {
          const busy = busyId === card.id;
          const on = Boolean(card.isDefault);
          return (
            <li key={card.id} className={i ? "-mt-[1.5px]" : ""}>
              <div
                className={cn(
                  ROW,
                  i === 0 && "rounded-t-card-md",
                  i === lastRow && "rounded-b-card-md",
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
                        <Icon icon={P.tick} size={11} strokeWidth={3.25} />
                      </span>
                    </>
                  )}
                  <span
                    className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-card-sm bg-bk-paper-2"
                    aria-hidden="true"
                  >
                    <Icon icon={P.card} size={18} />
                  </span>
                  {/* A list of one is a statement, not a choice, so it gets no
                      "Selected" — the word would imply an alternative. */}
                  <CardFace card={card} selected={!single && on} />
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

        {/* Inside the <ul>, not after it: the rounding and the -1.5px border
            overlap are per-row, so a row appended outside would sit detached
            with a doubled border above it. */}
        {onAdd && (
          <li className={ordered.length ? "-mt-[1.5px]" : ""}>
            {/* Not wrapped in a <label>. There is no input here to name, and a
                control inside one takes that label's text as its accessible
                name — the same bug Remove above is written around. */}
            <Button
              variant="bare"
              className={cn(
                INHERIT_FONT,
                ROW,
                ADD_ROW,
                ordered.length === 0 && "rounded-t-card-md",
                "rounded-b-card-md",
                disabled && "opacity-60",
              )}
              disabled={disabled || busyId !== null}
              onClick={onAdd}
            >
              <span
                className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-card-sm bg-bk-paper-2"
                aria-hidden="true"
              >
                <Icon icon={P.plus} size={18} />
              </span>
              <b className="min-w-0 flex-auto text-[14.5px] font-bold">Add a new card</b>
              <Icon icon={P.chevron} size={18} className="flex-none text-bk-ink-3" />
            </Button>
          </li>
        )}
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
