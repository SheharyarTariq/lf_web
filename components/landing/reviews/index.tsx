"use client";

import { cn } from "@/utils/cn";
import { useRef } from "react";
import Stars from "@/components/common/StarsRating";
import { AppleGlyph, PlayGlyph } from "@/components/icons";
import { RATING, REVIEWS, REVIEW_SOURCES } from "@/utils/content";
import { fadeVars, useScrollEdges } from "@/utils/hooks";
import { SECTION, SECTION_H2, SECTION_SUB, WRAP } from "@/utils/styles";

export default function Reviews() {
  const scroller = useRef<HTMLDivElement>(null);
  const edges = useScrollEdges(scroller);

  return (
    <section className={cn(SECTION, "bg-panel")} aria-labelledby="lf-rev-h">
      <div className={WRAP}>
        <h2 id="lf-rev-h" className={SECTION_H2}>
          What our customers say
        </h2>
        {/* Same wording as the hero trust line. The source is carried by the
            mark on each card, not spelled out. RATING is still placeholder. */}
        <p className={SECTION_SUB}>
          Rated {RATING.score} from {RATING.count} local reviews.
        </p>

        {/* Reviews scroll horizontally at every width, not only on phones. A
            grid caps the section at whatever fits in one row, so the fourth
            review would either wrap into a ragged second row or force the
            cards narrower. As a scroller the set just keeps going. The basis
            is a third of the row so three fill it exactly and a fourth peeks
            in — the peek is the scroll affordance.

            On phones they gain the edge bleed so cards reach the screen edge,
            one at a time. scroll-padding matches the padding, otherwise the
            snapport starts at the border box and the first card boots half
            under the gutter at scrollLeft:20. */}
        <div
          className="mask-edge-fade no-scrollbar relative flex snap-x snap-proximity gap-3.5 overflow-x-auto to-720:-mx-5 to-720:gap-3 to-720:px-5 to-720:scroll-px-5"
          ref={scroller}
          style={fadeVars(edges, "28px")}
        >
          {REVIEWS.map((r) => (
            <figure
              className="flex flex-[0_0_32%] snap-start flex-col rounded-card-md border border-line bg-white p-5 to-1024:flex-[0_0_46%] to-720:flex-[0_0_82%]"
              key={r.author}
            >
              <h3 className="mb-2.5 text-[17px] font-bold tracking-[-.2px]">{r.title}</h3>
              <Stars value={5} className="mb-2" />
              <figcaption className="mb-3 flex items-center gap-2 text-[13px] text-ink-3">
                <span
                  className="flex h-[22px] w-[22px] flex-none items-center justify-center rounded-[6px] bg-ink text-white [&_svg]:h-3 [&_svg]:w-3"
                  title={REVIEW_SOURCES[r.source].label}
                >
                  {r.source === "apple" ? <AppleGlyph /> : <PlayGlyph />}
                  <span className="visually-hidden">{REVIEW_SOURCES[r.source].label}</span>
                </span>
                {r.date} · {r.author}
              </figcaption>
              <blockquote className="flex-1 text-[15px] leading-[1.6]">{r.body}</blockquote>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
