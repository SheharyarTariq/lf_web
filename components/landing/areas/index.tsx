"use client";

import Link from "next/link";
import { useRef } from "react";
import { AREAS } from "@/utils/content";
import { fadeVars, useScrollEdges } from "@/utils/hooks";
import { SECTION, SECTION_H2, SECTION_SUB, WRAP } from "@/utils/styles";

export default function Areas() {
  const scroller = useRef<HTMLUListElement>(null);
  const edges = useScrollEdges(scroller);

  return (
    <section className={SECTION} id="areas" aria-labelledby="lf-areas-h">
      <div className={WRAP}>
        <h2 id="lf-areas-h" className={SECTION_H2}>
          Areas we serve
        </h2>
        {/* The towns are listed in the cards below — no need to name them
            twice. This line only has to say what comes next. */}
        <p className={SECTION_SUB}>Expanding across Surrey — more towns very soon.</p>

        {/* A grid on desktop; a snap scroller on phones, where the next card
            deliberately peeks past the edge so it is obvious there is more.
            The negative inline margin lets cards reach the screen edge; the
            scroller itself clips, so the page cannot overflow.
            position:relative keeps the screen-reader spans clipped inside. */}
        <ul
          className="mask-edge-fade no-scrollbar grid grid-cols-[repeat(6,1fr)] gap-3 to-1024:grid-cols-[repeat(3,1fr)] to-720:relative to-720:flex to-720:snap-x to-720:snap-proximity to-720:gap-2.5 to-720:overflow-x-auto to-720:-mx-5 to-720:px-5 to-720:scroll-px-5"
          ref={scroller}
          style={fadeVars(edges, "28px")}
        >
          {/* Neither half is unique on its own — KT22 covers Leatherhead and
              Fetcham, and Epsom spans KT18 and KT19 — so key on the pair. */}
          {AREAS.map(([code, town, href]) => (
            <li
              key={`${code}-${town}`}
              className="to-720:min-w-[112px] to-720:flex-[0_0_40%] to-720:snap-start"
            >
              {/* Must be a block-level box: it is an <a>, and an inline
                  element wrapping block children fragments into separate line
                  boxes — the background then paints as detached shapes rather
                  than one card. */}
              <Link
                className="flex h-full flex-col items-center justify-center gap-[3px] rounded-card-md border border-line bg-white px-2.5 py-[18px] text-center no-underline transition-[transform,box-shadow,border-color] duration-[160ms] ease-[ease] hover:-translate-y-0.5 hover:border-line-2 hover:shadow-lift"
                href={href}
              >
                <b className="text-[18px] font-extrabold leading-[1.2] tracking-[-.3px]">{code}</b>
                <span className="text-[14px] leading-[1.3] text-ink-2">{town}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
