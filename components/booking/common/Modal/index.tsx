"use client";

import { cn } from "@/utils/cn";
import { useEffect, useRef, type ReactNode } from "react";
import { Icon, P } from "@/components/booking/icons";
import { CLOSE_BTN_MODAL } from "@/utils/booking/styles";

/**
 * One shell for every overlay: scroll lock, Escape, click-outside and focus
 * all behave the same wherever they appear.
 */
export default function Modal({
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
          cn(
            "flex max-h-full w-full flex-col rounded-card-lg bg-white shadow-lift focus:outline-none",
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
