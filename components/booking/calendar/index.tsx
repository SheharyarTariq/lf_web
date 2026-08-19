"use client";

import { cn } from "@/utils/cn";
import Button from "@/components/common/Button";
import { useMemo, useRef } from "react";
import { Icon, P } from "@/components/booking/icons";
import Notice from "@/components/booking/common/Notice";
import {
  MONTHS,
  MONTHS_LONG,
  WEEK,
  addDays,
  dayKey,
  longDate,
  parseDay,
  type Availability,
  type Slot,
} from "@/utils/booking/model";
import { CONTROL_PEER, ECO_TAG } from "@/utils/booking/styles";

/* Short rows, not square cells. A square cell on a 620px column is 48px tall
   and six of those is a wall; 30px keeps the whole picker under 200px while
   staying a comfortable target with the 2px gap included. */
/* Background, border colour and weight are deliberately absent: each is set
   once, by the on/off pair below. A value in the base recipe and another in
   the state recipe are the same property in one class list, and Tailwind
   settles that by its own sort order — which left the selected day white and
   unbordered. */
const CELL =
  "relative flex h-[30px] w-full cursor-pointer items-center justify-center rounded-ctl-md " +
  "border text-[14px] leading-[1.6] text-bk-ink " +
  "transition-[background-color,border-color] duration-[140ms] ease-[ease] " +
  /* Struck through as well as greyed. Colour alone would leave anyone with low
     vision or a poor screen guessing which days they can pick. */
  "disabled:cursor-not-allowed disabled:text-bk-line-2 disabled:hover:border-transparent " +
  "disabled:bg-[linear-gradient(to_bottom_right,transparent_calc(50%-.5px),var(--color-bk-line)_calc(50%-.5px),var(--color-bk-line)_calc(50%+.5px),transparent_calc(50%+.5px))] " +
  "disabled:bg-[length:16px_16px] disabled:bg-center disabled:bg-no-repeat to-720:h-[26px]";

/* Inset shadow rather than a thicker border: a 2px border would shift every
   other cell by half a pixel as the selection moves. */
const CELL_ON =
  "bg-panel border-brand shadow-[inset_0_0_0_1px_var(--color-brand)] font-bold";
const CELL_OFF = "bg-transparent font-semibold hover:border-bk-ink-3";

/* How far each arrow moves, in days. */
const ARROW_STEP: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

export default function Calendar({
  value,
  onChange,
  available,
  today,
  label,
  note,
}: {
  value: string;
  onChange: (key: string) => void;
  available: Availability;
  today: Date;
  label: string;
  note?: string;
}) {
  const showLeafKey = Object.values(available).some((slots) => slots.some((x) => x.eco));
  const gridRef = useRef<HTMLDivElement>(null);
  const keys = useMemo(() => Object.keys(available), [available]);

  /* The range is derived from what is actually on offer, so an empty week at
     the end of the window never gets rendered. */
  const bounds = useMemo(() => {
    if (!keys.length) return null;
    const dates = keys
      .map(parseDay)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());
    if (!dates.length) return null;
    return { min: dates[0], max: dates[dates.length - 1] };
  }, [keys]);

  const cells = useMemo(() => {
    if (!bounds) return [];
    const lead = (bounds.min.getDay() + 6) % 7; // Monday-first
    const out: (Date | null)[] = Array.from({ length: lead }, () => null);
    for (let d = new Date(bounds.min); d <= bounds.max; d = addDays(d, 1)) out.push(new Date(d));
    while (out.length % 7) out.push(null);
    return out;
  }, [bounds]);

  const heading = useMemo(() => {
    if (!bounds) return "";
    const { min, max } = bounds;
    return min.getMonth() === max.getMonth() && min.getFullYear() === max.getFullYear()
      ? `${MONTHS_LONG[min.getMonth()]} ${min.getFullYear()}`
      : `${MONTHS[min.getMonth()]} – ${MONTHS[max.getMonth()]} ${max.getFullYear()}`;
  }, [bounds]);

  /* Arrows skip straight to the next day that can actually be chosen. Landing
     focus on a disabled cell and making people press again is the sort of
     thing that makes keyboard use feel broken. */
  const onKeyDown = (e: React.KeyboardEvent, date: Date) => {
    /* Falls back to 0 for every other key, which the guard below then
       drops — so the arrow branch can only ever run with a real step. */
    const step = ARROW_STEP[e.key] ?? 0;
    if (!step && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const openDates = keys
      .map(parseDay)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());
    if (!openDates.length) return;
    let target: Date;
    if (e.key === "Home") target = openDates[0];
    else if (e.key === "End") target = openDates[openDates.length - 1];
    else {
      const wanted = addDays(date, step);
      target =
        step > 0
          ? openDates.find((d) => d >= wanted) || openDates[openDates.length - 1]
          : [...openDates].reverse().find((d) => d <= wanted) || openDates[0];
    }
    gridRef.current?.querySelector<HTMLElement>(`[data-k="${dayKey(target)}"]`)?.focus();
  };

  if (!bounds) {
    return (
      <Notice tone="plain" icon={P.clock}>
        No windows are being offered at the moment. Please try again shortly or contact us and we
        will sort something out.
      </Notice>
    );
  }

  return (
    <div className="rounded-card-lg border border-bk-line bg-white px-2.5 pb-2 pt-2.5 to-720:pb-1 to-720:pt-2">
      <p className="mb-1.5 text-[12px] font-bold uppercase tracking-[.4px] text-bk-ink-3 to-720:mb-1">
        {heading}
      </p>
      <div className="grid grid-cols-[repeat(7,1fr)] gap-0.5" aria-hidden="true">
        {WEEK.map((w) => (
          <span
            key={w}
            className="pb-0.5 text-center text-[11px] font-bold uppercase tracking-[.6px] text-bk-ink-3"
          >
            {w.slice(0, 1)}
          </span>
        ))}
      </div>
      <div
        className="grid grid-cols-[repeat(7,1fr)] gap-0.5"
        role="group"
        aria-label={label}
        ref={gridRef}
      >
        {cells.map((d, i) => {
          if (!d) return <span className="h-[30px] to-720:h-[26px]" key={`p${i}`} />;
          const k = dayKey(d);
          const open = Boolean(available[k]);
          const hasEco = open && available[k].some((slot) => slot.eco);
          const on = value === k;
          const isToday = dayKey(today) === k;
          return (
            <Button variant="bare"
              key={k}
              data-k={k}
              className={cn(CELL, on ? CELL_ON : CELL_OFF, on ? "" : isToday ? "border-bk-line-2" : "border-transparent")}
              aria-pressed={on}
              disabled={!open}
              onClick={() => onChange(k)}
              onKeyDown={(e) => onKeyDown(e, d)}
            >
              <span aria-hidden="true">{d.getDate()}</span>
              {/* An actual leaf in the corner rather than a colour change — the
                  selected state already owns colour, and a second colour
                  meaning would make the grid ambiguous. It has to be a leaf
                  because the legend underneath says so. */}
              {hasEco && (
                <Icon
                  icon={P.leafSolid}
                  size={9}
                  fill
                  className="absolute right-0.5 top-0.5 text-brand-ink"
                />
              )}
              <span className="visually-hidden">
                {longDate(d)} {d.getFullYear()}
                {open ? ` — ${available[k].length} windows` : " — we do not run this day"}
                {hasEco ? ", includes a greener window" : ""}
              </span>
            </Button>
          );
        })}
      </div>
      {note && (
        <p className="flex items-start gap-1.5 px-0.5 pb-0.5 pt-2 text-[12px] leading-[1.45] text-bk-ink-3 to-720:pb-0 to-720:pt-1.5">
          {showLeafKey && (
            <Icon icon={P.leafSolid} size={11} fill aria-hidden="true" className="mt-0.5 flex-none text-brand-ink" />
          )}
          <span>{note}</span>
        </p>
      )}
    </div>
  );
}

/* Three windows across on a phone, two beside a calendar from 721 — see the
   grid override in TimeScreen. */
export function SlotPicker({
  name,
  value,
  onChange,
  slots,
}: {
  name: string;
  value: string;
  onChange: (slot: Slot) => void;
  slots: Slot[];
}) {
  return (
    <div
      className="grid grid-cols-[repeat(3,1fr)] gap-2 from-721:grid-cols-[repeat(2,1fr)] to-720:gap-1.5 to-360:grid-cols-[repeat(2,1fr)]"
      role="radiogroup"
      aria-label={name}
    >
      {slots.map((slot) => {
        const { label, eco } = slot;
        const on = value === label;
        return (
          <label
            key={label}
            className={
              cn(
                "flex min-h-11 cursor-pointer items-center justify-center rounded-ctl-lg",
                "to-720:min-h-[42px] to-400:text-[13px]",
                "border-[1.5px] px-1.5 py-2 text-center text-[14px] font-semibold text-bk-ink",
                "transition-[border-color,background-color] duration-150 ease-[ease]",
                "has-[input:focus-visible]:outline has-[input:focus-visible]:outline-[3px]",
                "has-[input:focus-visible]:outline-offset-[3px] has-[input:focus-visible]:outline-bk-ink",
                /* Positioned only where something is positioned against it —
                   the Eco pill hangs off the top edge, and nothing else does. */
                eco && "relative",
                /* Border and background are each said once, here, for the same
                   reason as the calendar cell above. */
                on
                  ? "border-brand bg-panel shadow-[inset_0_0_0_1px_var(--color-brand)]"
                  : "border-bk-line-2 bg-white hover:border-bk-ink-3",
              )
            }
          >
            <input
              className={CONTROL_PEER}
              type="radio"
              name={name}
              value={label}
              checked={on}
              onChange={() => onChange(slot)}
            />
            {label}
            {eco && (
              <>
                <span className={cn(ECO_TAG, "absolute -top-2 right-2")} aria-hidden="true">
                  Eco
                </span>
                <span className="visually-hidden"> — greener window</span>
              </>
            )}
          </label>
        );
      })}
    </div>
  );
}
