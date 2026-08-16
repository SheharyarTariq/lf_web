"use client";

/* ══════════════════════════════════════════════════════════════════
   The pieces every screen shares
   ══════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, type ReactNode } from "react";
import { Icon, P } from "@/components/booking/icons";
import {
  ACTIONS,
  ACTIONS_MORE,
  ERR,
  FIELD,
  HINT,
  LABEL,
  NAV,
  NOTE,
  NOTE_TONE,
} from "@/lib/booking/styles";

/* One recipe, two right margins: the header's button hangs 10px past the
   gutter, the modal's 8px. Both are the same object otherwise. */
const CLOSE_BASE =
  "order-5 flex h-11 w-11 flex-none cursor-pointer items-center justify-center " +
  /* The design names no padding here, so the control keeps the UA's 1px 6px.
     Preflight zeroes it. Inert inside a fixed 44px flex-centred box, but it is
     still a computed difference, and stating it is cheaper than explaining it
     in every audit run. */
  "py-px px-1.5 " +
  "rounded-ctl-lg border-none bg-transparent text-bk-ink " +
  "transition-[background-color] duration-150 ease-[ease] hover:bg-bk-paper-2";

export const CLOSE_BTN = `${CLOSE_BASE} -mr-2.5`;
export const CLOSE_BTN_MODAL = `${CLOSE_BASE} -mr-2`;

/* ── Field ────────────────────────────────────────────────────── */

export function Field({
  label,
  hint,
  error,
  id,
  className = "",
  children,
}: {
  label: ReactNode;
  hint?: string;
  error?: string;
  id: string;
  /** For the paired rows, whose cells share the row's free space. */
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${FIELD} ${className}`.trimEnd()}>
      <label className={LABEL} htmlFor={id}>
        {label}
      </label>
      {children}
      {error ? (
        <p className={ERR} id={`${id}-err`}>
          <Icon d={P.alert} size={16} className="mt-0.5 flex-none" />
          {error}
        </p>
      ) : (
        hint && (
          <p className={HINT} id={`${id}-hint`}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/* ── Notice ───────────────────────────────────────────────────── */

export function Notice({
  tone = "",
  icon = P.info,
  title,
  children,
}: {
  tone?: keyof typeof NOTE_TONE;
  icon?: string;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className={`${NOTE} ${NOTE_TONE[tone]}`}>
      <Icon d={icon} size={19} className="mt-0.5 flex-none" />
      <div>
        {title && <b className="mb-0.5 block">{title}</b>}
        {children}
      </div>
    </div>
  );
}

/* ── Action bar ───────────────────────────────────────────────── */

export function ActionBar({
  more,
  nav = false,
  children,
}: {
  /** Something is still below it, so the top edge earns its shadow. */
  more: boolean;
  /** Back beside Continue rather than a single full-width button. */
  nav?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`${ACTIONS}${nav ? ` ${NAV}` : ""}${more ? ` ${ACTIONS_MORE}` : ""}`}
    >
      {children}
    </div>
  );
}

/* ── Modal ────────────────────────────────────────────────────────
   One shell for every overlay: scroll lock, Escape, click-outside and
   focus all behave the same wherever they appear. */

export function Modal({
  title,
  labelledBy,
  onClose,
  wide = false,
  children,
}: {
  title?: string;
  labelledBy: string;
  onClose: () => void;
  wide?: boolean;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(20,20,15,.5)] p-5"
      role="presentation"
      onClick={onClose}
    >
      <div
        className={
          "flex max-h-full w-full flex-col rounded-card-lg bg-white shadow-lift focus:outline-none " +
          (wide ? "max-w-[620px] px-6 pt-5 pb-6" : "max-w-[400px] p-6")
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        ref={panel}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-4 flex items-center gap-[14px] border-b border-bk-line pb-[14px]">
            <h2 className="flex-auto text-[20px] font-extrabold tracking-[-.4px]" id={labelledBy}>
              {title}
            </h2>
            <button
              type="button"
              className={CLOSE_BTN_MODAL}
              onClick={onClose}
              aria-label={`Close ${title.toLowerCase()}`}
            >
              <Icon d={P.close} size={20} strokeWidth="2.2" />
            </button>
          </div>
        )}
        {/* The list scrolls, the heading does not — nine questions will not
            fit on a phone and losing the title while scrolling loses the
            context. */}
        <div className="overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
          {children}
        </div>
      </div>
    </div>
  );
}

export const MODAL_FOOT = "mt-4 text-[13.5px] text-bk-ink-2";

/* Inside a modal both buttons share the row evenly — the source's
   `.lfb-modal .lfb-nav .lfb-btn` at 0,3,0, which outranks the flow's own
   `.lfb-nav .lfb-btn--lime`. */
export const MODAL_NAV = `${NAV} mt-5`;
export const MODAL_NAV_BTN = "flex-[1_1_0]";
