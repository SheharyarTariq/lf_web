"use client";

/* ══════════════════════════════════════════════════════════════════
   The pinned summary, wide layouts only
   ══════════════════════════════════════════════════════════════════

   The same content as the Review screen, in a column that stays beside
   the form the whole way through. It is a preview and a progress meter
   at once: every row starts as a placeholder and fills as its screen is
   answered, so the panel is never blank on step 1 and never a surprise
   at the end.

   Sized to fit, not to scroll. The whole point of pinning it is that it
   is always readable without moving, so the content is cut to the bone
   instead: date and window on one line, one line of reassurance, a
   discount card at tag scale rather than banner scale. About 460px full,
   which clears any window over roughly 580px tall. The scroll on the
   rows is a last resort for windows shorter than that, where the
   alternative is a panel whose foot cannot be reached at all.

   Horizontal padding sits on the bands rather than the card, so the
   scrollbar rides the inside edge and the rules still span full width.
   ══════════════════════════════════════════════════════════════════ */

import Button from "@/components/common/Button";
import type { ReactNode } from "react";
import { Icon, P } from "@/components/booking/icons";
import { useBooking } from "@/utils/booking/context";
import { REPEAT_EVERY, longDate, parseDay } from "@/utils/booking/model";
import { ECO_TAG } from "@/utils/booking/styles";
import type { Route } from "@/utils/booking/flow";

/* Capped to what is left of the window below the header, so the panel is
   never taller than the screen and never scrolls out of reach. Any
   overflow is taken by the rows inside it. Only ever rendered at 1024
   and up — the shell drops it below that — so these need no breakpoint
   of their own. */
const ASIDE =
  "sticky top-[calc(var(--bk-hdr-h)+28px)] flex w-[328px] flex-[0_0_328px] self-start " +
  "max-h-[calc(100dvh-var(--bk-hdr-h)-52px)]";

const PANEL =
  "flex w-full min-h-0 flex-col rounded-card-lg border border-bk-line bg-white pb-[13px] pt-[15px]";

/* No bare element selectors below. `.lfb-sum-v span` already cost us an
   Eco tag stretched into a lime bar once, so every line here is
   addressed by class. */
const ROW = "border-b border-b-bk-line py-2.5 last-of-type:border-b-0 last-of-type:pb-0.5";
const ROW_K =
  "mb-0.5 flex items-baseline gap-2 text-[11px] font-bold uppercase tracking-[.5px] text-bk-ink-3";
const ROW_EDIT =
  "ml-auto cursor-pointer border-0 bg-transparent p-0 text-[11px] font-bold normal-case " +
  "leading-[1.6] tracking-[.3px] text-bk-ink underline underline-offset-2 hover:text-brand-ink";
const ROW_1 = "block text-[13.5px] font-semibold leading-[1.4]";
const ROW_2 = "block text-[12.5px] leading-[1.45] text-bk-ink-2 [overflow-wrap:anywhere]";

/* Tag scale, not banner scale. It is a fact worth keeping on screen, not
   the loudest thing in a column whose job is checking an order. */
const DISC_TAG =
  "mx-[17px] mt-[11px] flex flex-none items-center gap-[9px] rounded-card-sm bg-brand " +
  "px-[11px] py-2 text-bk-ink";

function AsideRow({
  label,
  lines,
  onEdit,
  editLabel,
  tag,
}: {
  label: string;
  lines: string[];
  onEdit?: () => void;
  editLabel?: string;
  tag?: ReactNode;
}) {
  /* Nothing yet means no row. A list of "Not chosen yet" is four lines
     restating the steps the indicator already shows, and it makes the
     panel longest at the moment it has least to say. */
  if (!lines.some(Boolean)) return null;
  return (
    <div className={ROW}>
      <span className={ROW_K}>
        {label}
        {onEdit && (
          <Button variant="bare" className={ROW_EDIT} onClick={onEdit}>
            Edit<span className="visually-hidden"> {editLabel}</span>
          </Button>
        )}
      </span>
      <span className="block min-w-0">
        <span className={ROW_1}>
          {lines[0]}
          {tag}
        </span>
        {lines.slice(1).filter(Boolean).map((line, i) => (
          <span className={ROW_2} key={i}>
            {line}
          </span>
        ))}
      </span>
    </div>
  );
}

const oneLine = (day: Date | null, slot: string) =>
  [day ? longDate(day) : "", slot].filter(Boolean).join(" · ");

export default function SummaryPanel() {
  const { data, discount, go } = useBooking();
  const collection = parseDay(data.collectionDay);
  const delivery = parseDay(data.deliveryDay);
  const every = REPEAT_EVERY.find(([id]) => id === data.repeatEvery);
  const repeat = data.repeat && every ? `Repeats every ${every[1].toLowerCase()}` : "";
  const onEdit = (route: Route) => () => go(route);

  return (
    <aside className={ASIDE} aria-label="Your order so far">
      <div className={PANEL}>
        <p className="mb-0.5 flex-none border-b border-b-bk-line-2 px-[17px] pb-2.5 text-[15px] font-bold tracking-[-.2px]">
          Your order
        </p>

        {/* In the order they get answered, not the order the Review screen
            lists them. Rows then only ever append to the bottom; sorted any
            other way, choosing a time would insert two rows above the
            address and shove it down the panel. */}
        <div className="min-h-0 flex-auto overflow-y-auto px-[17px] [overscroll-behavior:contain] [scrollbar-width:thin]">
          <AsideRow
            label="Address"
            editLabel="address"
            onEdit={onEdit("address")}
            lines={[
              [data.line1, data.line2, data.line3].filter(Boolean).join(", "),
              [data.town, data.county, data.postcode].filter(Boolean).join(", "),
            ]}
          />
          {/* Day and window on one line. Two lines each for collection and
              delivery is 40px of the panel's height spent on a middot. */}
          <AsideRow
            label="Collection"
            editLabel="collection time"
            onEdit={onEdit("time")}
            lines={[oneLine(collection, data.collectionSlot)]}
          />
          <AsideRow
            label="Delivery"
            editLabel="delivery time"
            onEdit={onEdit("time")}
            lines={[oneLine(delivery, data.deliverySlot), repeat]}
            tag={
              data.deliveryEco ? (
                <span className={`${ECO_TAG} static ml-2 w-auto align-[1px]`} aria-label="Greener window">
                  Eco
                </span>
              ) : null
            }
          />
          <AsideRow
            label="Contact"
            editLabel="contact details"
            onEdit={onEdit("contact")}
            lines={[data.fullName, data.mobile, data.email]}
          />
        </div>

        {discount && (
          <div className={DISC_TAG}>
            <Icon d={P.spark} size={16} fill className="flex-none" />
            <span>
              <b className="block text-[13px] font-bold leading-[1.35]">{discount.label}</b>
              <span className="block text-[11.5px] leading-[1.35]">Applied automatically.</span>
            </span>
          </div>
        )}

        {/* One line. The full explanation is on the payment screen and
            behind "How billing works" — this only has to hold the worry
            off until then. */}
        <p className="mt-2.5 flex-none border-t border-t-bk-line px-[17px] pt-2.5 text-[12px] leading-[1.45] text-bk-ink-3">
          Nothing is charged today.
        </p>
      </div>
    </aside>
  );
}
