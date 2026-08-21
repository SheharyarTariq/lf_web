/**
 * Who gets what off their next order, and how it is worded.
 *
 * Two sources, and which one applies depends only on whether anybody is
 * signed in:
 *
 *  - **Signed out** — `GET /system-status` carries the public `orderDiscounts`
 *    table, and the first-order row is the offer a visitor is being shown.
 *  - **Signed in** — `GET /my-status` carries `nextOrderDiscount`, the server's
 *    answer for *this* account. It is the only correct source once we know who
 *    somebody is: the public table's first-order row is a lie to anybody on
 *    their third order, which is the bug this module exists to end.
 *
 * `null` from either means no discount, and callers render nothing at all —
 * the offer bar does not render, the checkout omits its row. A "£0 off" line
 * reads like a bug, and a bar advertising nothing is decoration.
 *
 * The offer bar and the checkout both read this so the two cannot word the
 * same offer differently, or disagree about whether there is one.
 */

/* ── Discount ─────────────────────────────────────────────────────
   The backend sends this; because the order total is not known until items
   are counted, it can only ever be a percentage here — the cash figure
   appears on the invoice. */
export interface Discount {
  label: string;
  value: number;
  unit: string;
}

/** One entry of `/system-status`'s `orderDiscounts`. Confirmed against
 *  staging: `[{forOrder:1,type:"percent",amount:25},
 *             {forOrder:2,type:"percent",amount:15}]`. */
interface OrderDiscount {
  forOrder: number;
  type: string;
  amount: number;
}

/**
 * The one place an offer is put into words.
 *
 * "your first order" is the wording already on the page and in `BRAND.offer`,
 * and it is only true for the first one — everything else is "your next
 * order", which stays right whichever order it is.
 *
 * A non-percent unit renders the bare amount rather than guessing at a
 * currency symbol for a shape nothing has returned yet.
 */
function toDiscount(value: number, unit: string, forOrder?: number): Discount {
  const amount = unit === "percent" ? `${value}%` : `${value}`;
  const which = forOrder === 1 ? "your first order" : "your next order";
  return { label: `${amount} off ${which}`, value, unit };
}

/** The public first-order offer, for a visitor we do not yet know. */
export function firstOrderDiscount(list: unknown): Discount | null {
  if (!Array.isArray(list)) return null;

  const first = (list as OrderDiscount[]).find((d) => d?.forOrder === 1);
  if (!first || typeof first.amount !== "number") return null;

  return toDiscount(first.amount, first.type, 1);
}

/* `/my-status`'s `nextOrderDiscount` is documented only as "discount coupon
   applied to their next order, or null" — the brief never named its fields, so
   the spellings below are the plausible ones rather than a contract.

   A real staging account was read on 22/08/26 and returned `null`, which
   confirms the null path and nothing else. Deliberately tolerant, and
   deliberately temporary: the first time a populated one is seen, collapse
   these to the fields that actually come back and tighten
   `MyStatus.nextOrderDiscount` in utils/auth from `Record<string, unknown>`
   to a named interface. */
const AMOUNT_KEYS = ["amount", "value", "percentage", "percent"] as const;
const UNIT_KEYS = ["type", "unit"] as const;

function readNumber(raw: Record<string, unknown>): number | null {
  for (const key of AMOUNT_KEYS) {
    const v = raw[key];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    /* A coupon amount arriving as a string is likelier than it looks —
       Doctrine decimals serialise that way. */
    if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
      return Number(v);
    }
  }
  return null;
}

function readUnit(raw: Record<string, unknown>): string {
  for (const key of UNIT_KEYS) {
    const v = raw[key];
    if (typeof v === "string" && v) return v;
  }
  /* The table on /system-status has only ever returned percentages, and a
     percentage is the only thing that can be stated before items are counted. */
  return "percent";
}

/**
 * This account's next-order discount, from `/my-status`.
 *
 * `null` when the server sent none, and also when it sent something this
 * cannot read — see the note above. Both mean the same thing to callers: show
 * no offer. Showing a wrong figure to a returning customer is the failure this
 * whole module is here to prevent, so an unreadable payload fails that way too.
 */
export function nextOrderDiscount(
  raw: Record<string, unknown> | null | undefined,
): Discount | null {
  if (!raw || typeof raw !== "object") return null;

  const value = readNumber(raw);
  if (value === null || value <= 0) return null;

  /* Carried through when the payload names it, so a first-order coupon still
     reads "your first order" rather than the generic wording. */
  const forOrder = typeof raw.forOrder === "number" ? raw.forOrder : undefined;

  return toDiscount(value, readUnit(raw), forOrder);
}
