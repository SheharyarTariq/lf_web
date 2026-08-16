"use client";

import { cn } from "@/utils/cn";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

/**
 * One shell for every overlay: scroll lock, Escape, click-outside and focus
 * all behave the same wherever they appear.
 *
 * Moved here from components/booking/common. It was always generic — only its
 * address and two imports were checkout-bound, and both came away cleanly: the
 * close X reaches lucide directly (`P.close` *is* lucide's X, and the `Icon`
 * wrapper only restated lucide's own defaults), and CLOSE_BTN_MODAL had no
 * other consumer, so it lives below rather than in utils/booking/styles.
 *
 * Still not the only dialog shell in the codebase — AuthModal and the header's
 * mobile drawer each hand-roll their own, and AuthModal's is the better one
 * because it has the Tab trap this lacks. Worth converging eventually; the
 * point of moving this was to stop the count going up.
 */

/* The design gives the close control one recipe and two right margins; the
   header's hangs 10px past the gutter, this one 8px. Only the modal variant
   moved, so the string is written out rather than composed. */
const CLOSE_BTN =
  "order-5 flex h-11 w-11 flex-none cursor-pointer items-center justify-center " +
  /* The design names no padding here, so the control keeps the UA's 1px 6px.
     Preflight zeroes it. Inert inside a fixed 44px flex-centred box, but it is
     still a computed difference, and stating it is cheaper than explaining it
     in every audit run. */
  "py-px px-1.5 " +
  "rounded-ctl-lg border-none bg-transparent text-bk-ink " +
  "transition-[background-color] duration-150 ease-[ease] hover:bg-bk-paper-2 " +
  "-mr-2";

export default function Modal({
  title,
  labelledBy,
  onClose,
  wide = false,
  elevated = false,
  children,
}: {
  title?: string;
  labelledBy: string;
  onClose: () => void;
  wide?: boolean;
  /** Sit above the header's mobile drawer, which is z-[201] — higher than the
   *  z-[200] every dialog in the app uses. Needed by anything the drawer can
   *  raise, or it renders underneath for the 200ms the drawer takes to leave. */
  elevated?: boolean;
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
      className={cn(
        "fixed inset-0 flex items-center justify-center bg-[rgba(20,20,15,.5)] p-5",
        elevated ? "z-[210]" : "z-[200]",
      )}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={
          cn(
            /* lf-controls because this can now be rendered from the document
               root, outside .lf-book. Without it Preflight's `font: inherit`
               on controls makes every button in here about 5px taller — see
               the note in app/globals.css. Harmless where an ancestor already
               sets it, which is every checkout modal. */
            "lf-controls flex max-h-full w-full flex-col rounded-card-lg bg-white shadow-lift focus:outline-none",
            wide ? "max-w-[620px] px-6 pt-5 pb-6" : "max-w-[400px] p-6",
          )
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
              className={CLOSE_BTN}
              onClick={onClose}
              aria-label={`Close ${title.toLowerCase()}`}
            >
              <X size={20} strokeWidth={2.2} aria-hidden="true" />
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
