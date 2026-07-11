"use client";

import { useState } from "react";

// FAQ accordion matching the mobile app's design: large rounded white cards, a
// rotating "+" icon, an animated answer reveal, and single-open behavior.
// Questions/answers come from the caller (app/page.tsx), which also derives the
// FAQPage JSON-LD from the same array — keep the data there, presentation here.

type FaqItem = { q: string; a: string };

// Number of questions shown before the "show more" toggle appears. With fewer
// items than this, the toggle stays hidden (nothing to collapse) — matching the
// app, where it only surfaces for long lists.
const INITIALLY_VISIBLE = 5;

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const visibleItems = showAll ? items : items.slice(0, INITIALLY_VISIBLE);
  const hiddenCount = items.length - INITIALLY_VISIBLE;
  const hasToggle = items.length > INITIALLY_VISIBLE;

  const toggleItem = (index: number) =>
    setOpenIndex((current) => (current === index ? null : index));

  return (
    <div className="max-w-[820px] mx-auto flex flex-col gap-4">
      {visibleItems.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div className="bg-white rounded-[24px] overflow-hidden" key={item.q}>
            <button
              type="button"
              className="w-full flex justify-between items-center gap-4 text-left cursor-pointer px-10 py-[34px] text-[22px] font-bold text-dark max-[860px]:px-6 max-[860px]:py-6 max-[860px]:text-[17px]"
              aria-expanded={isOpen}
              aria-controls={`faq-answer-${index}`}
              onClick={() => toggleItem(index)}
            >
              <span>{item.q}</span>
              <span
                className={`shrink-0 w-10 h-10 inline-flex items-center justify-center text-[28px] font-light leading-none transition-transform duration-200 ${
                  isOpen ? "rotate-45" : ""
                }`}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            <div
              id={`faq-answer-${index}`}
              role="region"
              className={`grid transition-[grid-template-rows] duration-300 ${
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <p
                className={`overflow-hidden m-0 px-10 text-[17px] leading-[1.6] text-muted max-[860px]:px-6 ${
                  isOpen ? "pb-[34px] max-[860px]:pb-6" : ""
                }`}
              >
                {item.a}
              </p>
            </div>
          </div>
        );
      })}

      {hasToggle && (
        <button
          type="button"
          className="flex items-center gap-3 bg-white rounded-[24px] border-none cursor-pointer px-10 py-[34px] text-[22px] font-bold text-[#888888] max-[860px]:px-6 max-[860px]:py-6 max-[860px]:text-[17px]"
          aria-expanded={showAll}
          onClick={() => setShowAll((v) => !v)}
        >
          <span>{showAll ? "Show fewer questions" : "Show more questions"}</span>
          {!showAll && (
            <span className="inline-flex items-center justify-center min-w-[26px] h-[26px] px-2 rounded-[13px] bg-[#F6F6F3] text-[#888888] text-[14px] font-semibold">
              {hiddenCount}
            </span>
          )}
          <span
            className={`ml-auto inline-flex items-center justify-center w-10 h-10 rounded-full bg-lf-bg text-dark transition-transform duration-200 ${
              showAll ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
