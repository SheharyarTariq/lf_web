"use client";

import { cn } from "@/utils/cn";
import Button from "@/components/common/Button";
import { useEffect, useState } from "react";
import Stars from "@/components/common/StarsRating";
import { useAuth } from "@/components/common/AuthProvider";
import { AppleGlyph, PlayGlyph } from "@/components/icons";
import { ASSETS, BRAND, HERO_SLOTS, RATING, TOWNS } from "@/utils/content";
import { usePrefersReducedMotion, useStartBooking, useTypewriter } from "@/utils/hooks";
import { WRAP } from "@/utils/styles";

/* How long each photo is held, in ms. The crossfade itself is 1s and runs
   inside this interval, so each frame is roughly 4s still followed by a 1s
   dissolve. */
const FADE_INTERVAL = 5000;

/**
 * Auto crossfade: before → after → repeat. Pauses on hover and focus, and
 * honours prefers-reduced-motion by holding on the "after" frame instead of
 * looping.
 */
function BeforeAfter() {
  const [cycling, setCycling] = useState(false);
  const [paused, setPaused] = useState(false);
  const reduce = usePrefersReducedMotion();
  /* Derived, not stored: under reduced motion the "after" frame is simply
     always the one shown. Writing that into state from the effect would cost
     a second render on mount and say the same thing. */
  const showAfter = reduce || cycling;

  useEffect(() => {
    if (reduce || paused) return undefined;
    const id = setInterval(() => setCycling((v) => !v), FADE_INTERVAL);
    return () => clearInterval(id);
  }, [paused, reduce]);

  const frame =
    "absolute inset-0 block h-full w-full object-cover object-right transition-opacity duration-1000 ease-in-out";

  return (
    /* One role="img" for the pair, so a screen reader gets a single
       description rather than two competing alt texts on a loop.

       Stays inside its grid column — no viewport bleed, so it cannot widen
       the page, add a scrollbar or drive the hero's height. 3:2 matches the
       source, so object-fit never crops. max-height is a guard that keeps it
       shorter than the text column at any width. Width must be explicit:
       every child is absolutely positioned, so a shrink-to-fit box would
       collapse to 0. */
    <div
      className="relative aspect-[3/2] max-h-[400px] w-full to-1024:mx-auto to-1024:max-h-[340px] to-1024:max-w-[560px]"
      role="img"
      aria-label="The same doorstep before and after: a basket of unwashed laundry, then a LaundryFree driver returning it washed and neatly folded."
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      {/* Masks live on the media layer, not the wrapper, so anything above
          them stays crisp at the edges. */}
      <div className="mask-hero-fade absolute inset-0 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={cn(frame, showAfter ? "opacity-0" : "opacity-100")}
          src={ASSETS.heroBefore}
          srcSet={`${ASSETS.heroBeforeSmall} 800w, ${ASSETS.heroBefore} 1600w`}
          sizes="(max-width: 1024px) 92vw, 46vw"
          alt=""
          width="1600"
          height="1067"
          fetchPriority="high"
          decoding="async"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={cn(frame, showAfter ? "opacity-100" : "opacity-0")}
          src={ASSETS.heroAfter}
          srcSet={`${ASSETS.heroAfterSmall} 800w, ${ASSETS.heroAfter} 1600w`}
          sizes="(max-width: 1024px) 92vw, 46vw"
          alt=""
          width="1600"
          height="1067"
          decoding="async"
        />
      </div>
    </div>
  );
}

export default function Hero() {
  const town = useTypewriter(TOWNS);
  /* Signed out is the default and renders straight away, so the server HTML is
     never missing a call to action; only a returning customer sees one frame of
     "Check availability" before their own wording replaces it. The same rule
     the site header follows for "Log in". */
  const { user, status } = useAuth();
  const onSubmit = useStartBooking(status);

  return (
    /* Once the hero stacks there is no second column to balance against, so
       a left-aligned block reads as if it has slipped off centre. */
    <section aria-labelledby="lf-h1" className="to-1024:text-center">
      <div
        className={cn(WRAP, "grid grid-cols-[1.05fr_.95fr] items-center gap-12 pb-14 pt-[60px] to-1280:pb-[46px] to-1280:pt-12 to-1180:gap-9 to-1024:grid-cols-[1fr] to-1024:gap-10 to-720:pb-11 to-720:pt-10")}
      >
        <div>
          {/* Headline is completely static — it is the thing people actually
              read, so nothing moves here. The town rotation lives in the slot
              box below, where motion is lower stakes.

              No geography in the headline: "in Surrey" over-claims when the
              service covers six postcode districts. Coverage is stated
              precisely further down. */}
          <h1
            id="lf-h1"
            className="mb-[30px] text-[clamp(38px,4.4vw,56px)] font-extrabold leading-[1.16] tracking-[-2px] to-1180:tracking-[-1.6px]"
          >
            Laundry &amp; dry cleaning,
            {/* Forces the break only on phones; hidden above 720px so the
                headline still wraps naturally on larger screens. */}
            <br className="hidden to-720:inline" /> collected{" "}
            {/* inline-block + tight line-height keeps the lime box hugging
                "free." instead of painting over the descender on the line
                above. */}
            <mark className="inline-block rounded-[6px] bg-brand px-[.14em] py-[.05em] leading-[.86] text-ink">
              free
            </mark>
          </h1>

          <form
            className="max-w-[470px] rounded-card-lg border border-line bg-white p-[18px] shadow-soft to-1180:p-4 to-1024:mx-auto to-1024:max-w-[520px]"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            {/* Static availability — deliberately not tied to a town, because
                no postcode has been entered yet.

                The rotating town sits last on the line, so nothing after it
                gets pushed around. Hidden from assistive tech — text that
                rewrites itself is hostile to screen readers — which instead
                get the full list of towns once. */}
            <p className="mb-[11px] text-[11px] font-bold uppercase tracking-[.8px] text-ink-2">
              Now collecting in{" "}
              <span className="inline-block min-w-[5.5em] font-extrabold text-ink" aria-hidden="true">
                {town}
              </span>
              <span className="visually-hidden">
                {TOWNS.slice(0, -1).join(", ")} and {TOWNS[TOWNS.length - 1]}
              </span>
            </p>

            <div className="mb-3.5 flex gap-2.5 to-720:flex-col">
              {/* Slots are buttons — they jump straight into the booking flow
                  with that slot preselected, rather than just displaying
                  availability. They keep their own alignment when the hero
                  centres: centring text next to a right-hand chevron looks
                  accidental. */}
              {HERO_SLOTS.map((slot) => (
                <Button
                  key={slot.key}
                  variant="bare"
                  className="group flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-card-sm border border-line bg-paper px-[13px] py-[11px] text-left text-ink transition-[border-color,background-color,transform,box-shadow] duration-150 ease-[ease] hover:-translate-y-px hover:border-ink hover:bg-white hover:shadow-soft to-1180:px-3 to-1180:py-2.5"
                  onClick={() => onSubmit(slot.key)}
                  aria-label={`Book the ${slot.label.toLowerCase()} collection, ${slot.time}`}
                >
                  <span className="min-w-0 flex-1">
                    <em className="mb-0.5 block text-[10px] font-bold uppercase not-italic tracking-[.6px] text-ink-2">
                      {slot.label}
                    </em>
                    <b className="whitespace-nowrap text-[13.5px] font-bold">{slot.time}</b>
                  </span>
                  <svg
                    className="flex-none text-ink-3 transition-[color,transform] duration-150 ease-[ease] group-hover:translate-x-0.5 group-hover:text-ink"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </Button>
              ))}
            </div>

            <div className="flex gap-2.5 to-720:flex-col">
              {/* "Check availability" is the question somebody asks before they
                  have an account. A returning customer has already had it
                  answered — we hold an address we serve — so the button says
                  what it now actually does. */}
              <Button type="submit" block>
                {user ? "Book now" : "Check availability"}
              </Button>
            </div>
          </form>

          <div className="mt-[18px] flex flex-wrap items-center gap-2.5 text-[14px] text-ink-2 to-1024:justify-center">
            <span className="flex gap-[5px]">
              <span
                className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-ink"
                title={`${BRAND.name} reviews`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ASSETS.leafMark}
                  alt=""
                  width="15"
                  height="15"
                  className="h-[15px] w-[15px] object-contain"
                />
              </span>
              <span
                className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-ink"
                title="App Store reviews"
              >
                <AppleGlyph />
              </span>
              <span
                className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-ink"
                title="Google Play reviews"
              >
                <PlayGlyph />
              </span>
            </span>
            <Stars value={RATING.score} />
            <span>
              <strong className="text-ink">{RATING.score}</strong> from {RATING.count} local reviews
            </span>
          </div>
        </div>

        <BeforeAfter />
      </div>
    </section>
  );
}
