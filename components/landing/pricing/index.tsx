"use client";

import { cn } from "@/utils/cn";
import Button from "@/components/common/Button";
import { useMemo, useRef, useState } from "react";
import { Check } from "@/components/icons";
import { CATEGORIES, PRICE_NOTES, PRICING, WASH, type Garment } from "@/utils/content";
import { fadeVars, useScrollEdges } from "@/utils/hooks";
import { WRAP } from "@/utils/styles";

function GarmentCard({ name, services }: { name: string; services: Garment[1] }) {
  return (
    <li className="rounded-card-sm bg-white px-3.5 py-3 text-ink">
      <div className="mb-0.5 flex items-baseline justify-between gap-3">
        <strong className="text-[15px] font-bold">{name}</strong>
        <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[.8px] text-ink-3">
          Per item
        </span>
      </div>
      {services.map(([service, price], i) => (
        <div
          className={cn("flex items-center gap-[9px] py-[7px]", i > 0 ? "border-t border-line" : "")}
          key={service}
        >
          <i
            className={cn("h-[7px] w-[7px] flex-none rounded-[50%]", service === WASH ? "bg-brand" : "bg-ink-3")}
            aria-hidden="true"
          />
          <span className="flex-1 text-[13.5px] text-ink-2">{service}</span>
          <b className="whitespace-nowrap text-[14px] font-extrabold">{price}</b>
        </div>
      ))}
    </li>
  );
}

const TAB =
  "flex-none cursor-pointer rounded-pill border-[1.5px] px-[17px] py-2 text-[14px] whitespace-nowrap " +
  "snap-start transition-all duration-150";
const TAB_OFF =
  "border-line-dark bg-transparent font-semibold text-on-dark hover:border-on-dark-2 hover:text-white";
const TAB_ON = "border-brand bg-brand font-bold text-ink";

/**
 * Horizontally scrollable category pills.
 *
 * The native scrollbar is hidden, so the affordances are: a fade on each edge
 * that only appears when there is more to see in that direction, and arrow
 * buttons for desktop users who cannot swipe. Trackpads, shift+wheel, touch
 * and keyboard all still work natively — no mouse drag-to-scroll needed.
 */
/* Declared at module scope, not inside CategoryPills. A component created
   during render is a new type on every pass, so React unmounts and remounts
   it — which throws away focus and any transition mid-flight. */
function ScrollArrow({ dir, onClick }: { dir: number; onClick: () => void }) {
  return (
    <Button
      variant="bare"
      className="flex h-[30px] w-[30px] flex-none cursor-pointer items-center justify-center py-px px-1.5 rounded-[50%] border-[1.5px] border-line-dark bg-surface-dark text-on-dark transition-[background-color,color,border-color] duration-150 ease-[ease] hover:border-brand hover:bg-brand hover:text-ink"
      onClick={onClick}
      aria-label={dir < 0 ? "Scroll categories left" : "Scroll categories right"}
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
        aria-hidden="true"
      >
        <path d={dir < 0 ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </Button>
  );
}

function CategoryPills({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  const edges = useScrollEdges(scroller);

  const nudge = (dir: number) =>
    scroller.current?.scrollBy({ left: dir * 220, behavior: "smooth" });

  /* No mouse drag-to-scroll: desktop has the arrows, shift+wheel and trackpad
     swipe. Touch and pen keep the browser's native scrolling, including
     momentum — nothing to implement. */

  return (
    <div className="flex min-w-0 flex-auto items-center gap-2">
      {edges.left && <ScrollArrow dir={-1} onClick={() => nudge(-1)} />}
      {/* position:relative is load-bearing, not decorative. A scroll container
          only clips absolutely-positioned descendants if it is itself a
          containing block. Left static, the screen-reader spans inside these
          scrollers escape the clip and stretch the document far past the
          viewport — which makes mobile browsers zoom the whole page out. */}
      <div
        className="mask-edge-fade no-scrollbar relative flex min-w-0 flex-auto snap-x snap-proximity gap-[9px] overflow-x-auto scroll-p-2"
        role="group"
        aria-label="Item categories"
        ref={scroller}
        style={fadeVars(edges)}
      >
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            variant="bare"
            className={cn(TAB, value === cat ? TAB_ON : TAB_OFF)}
            aria-pressed={value === cat}
            onClick={(e) => {
              onChange(cat);
              /* Optional call: not every environment implements it. */
              e.currentTarget.scrollIntoView?.({
                block: "nearest",
                inline: "nearest",
                behavior: "smooth",
              });
            }}
          >
            {cat}
          </Button>
        ))}
      </div>
      {edges.right && <ScrollArrow dir={1} onClick={() => nudge(1)} />}
    </div>
  );
}

export default function Pricing() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [query, setQuery] = useState("");
  const searching = query.trim() !== "";

  /* When searching we look across every category and group the hits, the same
     way the app does. */
  const results = useMemo<[string, Garment[]][] | null>(() => {
    if (!searching) return null;
    const q = query.trim().toLowerCase();
    return CATEGORIES.map(
      (cat) =>
        [cat, PRICING[cat].filter(([name]) => name.toLowerCase().includes(q))] as [string, Garment[]],
    ).filter(([, items]) => items.length > 0);
  }, [query, searching]);

  const hitCount = results ? results.reduce((n, [, items]) => n + items.length, 0) : 0;

  return (
    <section
      className="on-dark bg-ink py-12 text-white to-1280:py-[52px] to-1024:py-[46px] to-720:py-12"
      id="pricing"
      aria-labelledby="lf-pricing-h"
    >
      <div className={WRAP}>
        <h2
          id="lf-pricing-h"
          className="mb-1.5 text-[clamp(26px,2.8vw,34px)] font-extrabold leading-[1.12] tracking-[-1px] text-white"
        >
          See exactly what you&apos;ll pay
        </h2>
        {/* max-width is 620px on the shared sub style, which forces this onto
            two lines — widen it so the sentence sits on one line on desktop. */}
        <p className="mb-[26px] max-w-none text-[16.5px] text-on-dark-2 to-1180:text-[15.5px]">
          Once collected, every item is priced from this list. No estimates, no surprises.
        </p>

        {/* Search and category pills share one row so the section fits a
            viewport once the sticky header is accounted for. */}
        <div className="mb-4 flex flex-wrap items-center gap-x-[18px] gap-y-3.5">
          {/* Below 1180 the toolbar wraps, so the field is alone on its row —
              a fixed basis just leaves dead space and truncates the
              placeholder. Fill the row instead; max-width still caps it. */}
          <div className="relative mb-0 max-w-[420px] flex-[0_0_280px] to-1180:flex-[1_1_100%]">
            <svg
              className="pointer-events-none absolute left-[15px] top-1/2 -translate-y-1/2 text-on-dark-2"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.6-3.6" />
            </svg>
            <label className="visually-hidden" htmlFor="lf-price-search">
              Search the price list
            </label>
            <input
              id="lf-price-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for an item"
              autoComplete="off"
              className="h-[42px] w-full rounded-pill border-[1.5px] border-line-dark bg-surface-dark px-[42px] text-[15px] text-white transition-[border-color,box-shadow] duration-150 placeholder:text-on-dark-2 focus:border-brand focus:outline-none focus:shadow-[0_0_0_3px_rgba(193,241,29,.25)]"
            />
            {searching && (
              <Button
                variant="bare"
                className="absolute right-2 top-1/2 flex -translate-y-1/2 cursor-pointer rounded-pill border-none bg-transparent p-2 text-on-dark-2 hover:text-white"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </Button>
            )}
          </div>

          {!searching && <CategoryPills value={category} onChange={setCategory} />}
        </div>

        <p className="mb-[22px] flex items-center gap-[9px] text-[14px] text-on-dark-2">
          <svg
            className="flex-none"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5.5M12 7.6h.01" strokeLinecap="round" />
          </svg>
          All garments cleaned following care label instructions
        </p>

        <div aria-live="polite">
          {searching && results ? (
            <>
              <p className="visually-hidden">
                {hitCount} {hitCount === 1 ? "item" : "items"} found
              </p>
              {results.length === 0 && (
                <p className="px-0 pb-1 pt-2 text-[15.5px] text-on-dark-2">
                  No items match &ldquo;{query.trim()}&rdquo;.
                </p>
              )}
              {results.map(([cat, items]) => (
                <div key={cat}>
                  <p className="m-0 mb-3 text-[12px] font-bold uppercase tracking-[1.4px] text-on-dark-2">
                    {cat}
                  </p>
                  {/* Desktop density: ~250px min column, 14/16px padding,
                      13.5px body. The app's sizing is tuned for a 390px
                      phone and reads oversized here. */}
                  <ul className="mb-[26px] grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3 to-1180:grid-cols-[repeat(auto-fill,minmax(226px,1fr))] to-1024:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] to-720:grid-cols-1">
                    {items.map(([name, services]) => (
                      <GarmentCard key={name} name={name} services={services} />
                    ))}
                  </ul>
                </div>
              ))}
            </>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3 to-1180:grid-cols-[repeat(auto-fill,minmax(226px,1fr))] to-1024:grid-cols-[repeat(auto-fill,minmax(210px,1fr))] to-720:grid-cols-1">
              {PRICING[category].map(([name, services]) => (
                <GarmentCard key={name} name={name} services={services} />
              ))}
            </ul>
          )}
        </div>

        <ul className="mt-6 flex flex-wrap gap-x-[34px] gap-y-3">
          {PRICE_NOTES.map((note) => (
            <li key={note} className="flex items-center gap-[9px] text-[14px] font-semibold text-on-dark">
              <Check className="flex-none text-brand" />
              {note}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
