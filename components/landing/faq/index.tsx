"use client";

import { cn } from "@/utils/cn";
import Button from "@/components/common/Button";
import { useState } from "react";
import { FAQ_PREVIEW_COUNT, faqParagraphs, type FaqItem } from "@/utils/faq";
import { SECTION, SECTION_H2, SECTION_SUB, WRAP } from "@/utils/styles";

/* The + / – badge. Rotating a plus 45° is the cheapest possible close
   affordance and needs no second glyph. */
const SIGN =
  "flex h-[30px] w-[30px] flex-none items-center justify-center rounded-pill text-[17px] leading-none transition-[transform,background-color] duration-200 ease-[ease]";

const ROW =
  "flex w-full items-center justify-between gap-[18px] px-[22px] py-[19px] text-left text-[16.5px] " +
  "to-1024:px-5 to-1024:py-[17px] to-1024:text-[16px]";

/**
 * The questions come from /system-status, fetched by the page that renders
 * this — a prop rather than a fetch of its own, so the answers are in the
 * served HTML where a crawler can match them against the FAQPage schema.
 * Still a client component: it owns which row is open.
 */
export default function Faq({ faqs }: { faqs: FaqItem[] }) {
  const [open, setOpen] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? faqs : faqs.slice(0, FAQ_PREVIEW_COUNT);
  /* How many questions there are is the backend's to decide now. Both of
     these used to be safe against a fixed nine: a shorter payload would
     otherwise render a heading over nothing, and a "Show more questions 0"
     button that reveals nothing. */
  const hiddenCount = Math.max(0, faqs.length - FAQ_PREVIEW_COUNT);

  if (faqs.length === 0) return null;

  return (
    <section className={SECTION} id="faq" aria-labelledby="lf-faq-h">
      <div className={WRAP}>
        {/* Heading and list share one centred column so they line up. */}
        <div className="mx-auto max-w-[840px] to-1024:max-w-none">
          <h2 id="lf-faq-h" className={SECTION_H2}>
            Frequently asked
          </h2>
          <p className={SECTION_SUB}>Everything people ask before their first collection.</p>

          <div className="max-w-none">
            {visible.map(({ question, answer }, i) => {
              const isOpen = open === i;
              return (
                <div
                  className={cn("mb-2.5 overflow-hidden rounded-card-md border bg-white transition-colors duration-150 ease-[ease] hover:border-line-2", isOpen ? "border-line-2" : "border-line")}
                  /* Index included: the list is remote, and two rows sharing
                     a question would otherwise share a React key. */
                  key={`${i}-${question}`}
                >
                  <h3 className="m-0 text-[1.17em] font-bold">
                    <Button
                      variant="bare"
                      className={cn(ROW, "group cursor-pointer border-none bg-transparent font-semibold text-ink")}
                      aria-expanded={isOpen}
                      aria-controls={`lf-fp-${i}`}
                      onClick={() => setOpen(isOpen ? -1 : i)}
                    >
                      {question}
                      {/* No background change on the row itself on hover: it
                          would tint only the question and leave the open
                          answer white, splitting the card into two tones. */}
                      <span
                        className={cn(SIGN, isOpen ? "rotate-45 bg-brand" : "bg-paper-2 group-hover:bg-line")}
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </Button>
                  </h3>
                  {isOpen && (
                    <div
                      className="px-[22px] pb-5 pt-0 text-[15.5px] leading-[1.7] text-ink-2 to-1024:px-5 to-1024:pb-[18px] to-1024:text-[15px]"
                      id={`lf-fp-${i}`}
                    >
                      {/* A <p> per paragraph: the backend writes the longer
                          answers with a blank line in them, which a single
                          text node would swallow. */}
                      {faqParagraphs(answer).map((paragraph, pi) => (
                        <p className={pi > 0 ? "mt-3" : undefined} key={pi}>
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {hiddenCount > 0 && (
              <Button
                variant="bare"
                className={cn(ROW, "group w-full cursor-pointer rounded-card-md border border-line bg-white font-bold text-ink-2 transition-colors duration-150 ease-[ease] hover:border-line-2")}
                aria-expanded={showAll}
                onClick={() => {
                  setShowAll((v) => !v);
                  /* Collapsing while a hidden answer is open would leave an
                     orphaned open index, so reset the accordion. */
                  setOpen(-1);
                }}
              >
                <span>
                  {showAll ? "Show fewer questions" : "Show more questions"}
                  {!showAll && (
                    <span className="ml-[9px] inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-pill bg-paper-2 px-1.5 text-[13px] font-bold text-ink-2">
                      {hiddenCount}
                    </span>
                  )}
                </span>
                <span
                  className={cn(SIGN, "bg-brand text-ink group-hover:bg-brand-hover")}
                  aria-hidden="true"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={cn("transition-transform duration-200 ease-[ease]", showAll ? "rotate-180" : "")}
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
