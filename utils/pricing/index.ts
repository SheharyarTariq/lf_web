/**
 * The price list, as the API sends it and as the page needs it.
 *
 * `GET /price-combined` is the only source of prices on this site. Before it
 * was wired, `utils/content` carried a hand-written `PRICING` table — five
 * roughly-accurate categories and ten invented ones, added so the pill row
 * would overflow far enough to test the scrolling. That table is gone. Nothing
 * here falls back to it: a wrong price is worse than a missing one, and the
 * section renders nothing at all rather than quote a figure we cannot honour.
 *
 * Everything in this file is pure. The request itself is one `apiCall` in the
 * pricing section — there is no wrapper here, because there is exactly one
 * caller and it would only be indirection.
 *
 * Four properties of the payload drive most of what follows:
 *
 *  - **Money is integer pence.** 1295 is £12.95.
 *  - **Both prices are nullable**, and every live item carries at least one.
 *  - **The labels are nullable too, and vary per category** — "Wash & Press",
 *    "Wash & Dry", "Wash & Iron". This is why `serviceRows` tags each row with
 *    which service it is instead of leaving the label to be recognised later.
 *  - **`priceType` is not always `fixed`.** "Curtains (per pair)" is `from`,
 *    and a page that labels it "Per item" is quoting a price that is not the
 *    price.
 */

/* ── The wire shapes ──────────────────────────────────────────────
   Only the fields we read. The response is JSON-LD, so every node also
   carries `@context` / `@type` and the collection carries `totalItems` —
   which counts *categories* (9), not items (38), and is not used here.
   ───────────────────────────────────────────────────────────────── */

interface WireItem {
  "@id"?: unknown;
  name?: unknown;
  description?: unknown;
  priceType?: unknown;
  priceWashing?: unknown;
  priceDryCleaning?: unknown;
}

interface WireMember {
  category?: {
    "@id"?: unknown;
    name?: unknown;
    washingLabel?: unknown;
    dryCleaningLabel?: unknown;
  };
  items?: unknown;
}

/* ── What the page renders ────────────────────────────────────────
   Normalised: the JSON-LD noise is dropped and the two IRIs we do keep
   are renamed to `id`, because that is all they are used for.
   ───────────────────────────────────────────────────────────────── */

export interface PriceItem {
  /** The item IRI — `/items/<uuid>`. Unique across the whole response, which
   *  the grouped search results rely on: a name is only unique inside one
   *  category. */
  id: string;
  name: string;
  description: string | null;
  /** `fixed` or `from` in live data; `per_kg` is handled by the mobile app and
   *  has not been seen here. Deliberately not a union — a value the backend
   *  adds later must render quietly, not fail to typecheck or crash. */
  priceType: string;
  /** Integer pence, or null when the category does not offer the service. */
  priceWashing: number | null;
  priceDryCleaning: number | null;
}

export interface PriceCategory {
  /** The category IRI — `/item-categories/<uuid>`.
   *
   *  Note this is the *category's* `@id`, not the member's: every member of
   *  the collection carries `@id: "/price-combined"`, so keying or selecting
   *  on that would give all nine rows the same identity. */
  id: string;
  name: string;
  washingLabel: string | null;
  dryCleaningLabel: string | null;
  items: PriceItem[];
}

/** One priced service on one item — the unit the card actually renders. */
export interface ServiceRow {
  /** Which service this is. The dot colour reads this.
   *
   *  It exists because the label cannot be trusted to say: the wash label is
   *  "Wash & Press" in five categories, "Wash & Dry" in Duvet and "Wash &
   *  Iron" in Beddings, so the old `service === WASH` test painted nine wash
   *  rows grey. Identity travels with the row instead of being guessed from
   *  a display string. */
  kind: "washing" | "dryCleaning";
  label: string;
  price: string;
}

/* Used only where the server sends a price with no label to put on it.
   Deliberately naming the *service* rather than a process: the live labels
   vary per category, so promoting one of them to a default would assert
   something specific — pressing a duvet — that we may not do for the category
   in hand. No live row takes this path; it must stay honest rather than
   plausible, on a page whose own subheading promises no surprises. */
const WASH_FALLBACK = "Washing";
const DRY_FALLBACK = "Dry cleaning";

/* ── Reading the response ─────────────────────────────────────────── */

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

/** Integer pence, or null. Rejects NaN and negatives — a price the server
 *  could not express is a price we do not show. */
const pence = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null;

function readItem(raw: WireItem): PriceItem | null {
  const id = str(raw["@id"]);
  const name = str(raw.name);
  if (!id || !name) return null;

  const priceWashing = pence(raw.priceWashing);
  const priceDryCleaning = pence(raw.priceDryCleaning);
  /* A card with a name, a unit and no prices says nothing. None exist today —
     every live item carries at least one — but the two fields are independent
     and this is cheaper than a card that renders blank. */
  if (priceWashing === null && priceDryCleaning === null) return null;

  return {
    id,
    name,
    description: str(raw.description),
    priceType: str(raw.priceType) ?? "",
    priceWashing,
    priceDryCleaning,
  };
}

/**
 * The collection body → the categories to render, or `null`.
 *
 * `null` is the single "we do not know the prices" verdict, and the caller
 * treats it the same as a failed request, because it is the same thing: a body
 * we cannot read tells us no more than no body at all.
 *
 * `member` is what ld+json returns; `hydra:member` is read as a fallback
 * because API Platform emits it under older serializer settings, and a backend
 * config change should not silently empty the landing page. `utils/api`'s
 * `ErrorBody` already accepts both spellings of `violations` for this reason.
 */
export function readCategories(body: unknown): PriceCategory[] | null {
  if (!body || typeof body !== "object") return null;

  const envelope = body as { member?: unknown; "hydra:member"?: unknown };
  const raw = Array.isArray(body)
    ? body
    : Array.isArray(envelope.member)
      ? envelope.member
      : Array.isArray(envelope["hydra:member"])
        ? envelope["hydra:member"]
        : null;
  if (!raw) return null;

  const categories: PriceCategory[] = [];
  for (const entry of raw as WireMember[]) {
    const cat = entry?.category;
    const id = str(cat?.["@id"]);
    const name = str(cat?.name);
    if (!id || !name) continue;

    const items = (Array.isArray(entry.items) ? (entry.items as WireItem[]) : [])
      .map(readItem)
      .filter((i): i is PriceItem => i !== null);
    /* The server already excludes empty categories; doing it again here means
       a pill can never be selected onto an empty grid. */
    if (!items.length) continue;

    categories.push({
      id,
      name,
      washingLabel: str(cat?.washingLabel),
      dryCleaningLabel: str(cat?.dryCleaningLabel),
      items,
    });
  }

  return categories;
}

/* ── Presentation ─────────────────────────────────────────────────── */

/** Pence → `£12.95`. */
export function formatPrice(p: number): string {
  return `£${(p / 100).toFixed(2)}`;
}

/**
 * The small grey line beside the item name.
 *
 * Sentence case: the card uppercases it in CSS, and shouting twice is how you
 * end up with copy that cannot be reused anywhere else.
 *
 * An unrecognised type renders **nothing** rather than a label invented from
 * the token. The mobile app builds one (`PER ${type.toUpperCase()}`); on a
 * page that promises exact prices, "PER SOMETHING_WEIRD" is worse than a card
 * that simply does not claim a unit.
 */
export function unitLabel(priceType: string): string {
  if (priceType === "fixed") return "Per item";
  if (priceType === "from") return "From";
  if (priceType === "per_kg") return "Per kg";
  return "";
}

/**
 * The priced services on one item, washing first.
 *
 * Only services with a price appear, so the card's "border on every row but
 * the first" rule stays right for the 26 of 38 items that offer one service.
 */
export function serviceRows(item: PriceItem, category: PriceCategory): ServiceRow[] {
  const rows: ServiceRow[] = [];
  if (item.priceWashing !== null) {
    rows.push({
      kind: "washing",
      label: category.washingLabel ?? WASH_FALLBACK,
      price: formatPrice(item.priceWashing),
    });
  }
  if (item.priceDryCleaning !== null) {
    rows.push({
      kind: "dryCleaning",
      label: category.dryCleaningLabel ?? DRY_FALLBACK,
      price: formatPrice(item.priceDryCleaning),
    });
  }
  return rows;
}

/* ── Search ───────────────────────────────────────────────────────── */

/** 3 name, 2 description, 1 category name, 0 no match — the mobile app's
 *  ordering, so the two surfaces answer the same query the same way. */
function matchScore(item: PriceItem, categoryName: string, words: string[]): number {
  const has = (s: string) => words.some((w) => s.toLowerCase().includes(w));
  if (has(item.name)) return 3;
  if (item.description && has(item.description)) return 2;
  if (has(categoryName)) return 1;
  return 0;
}

/**
 * Every hit, still grouped by category, most relevant group first.
 *
 * Returns `PriceCategory[]` rather than a shape of its own so the search
 * results and a single selected category render through identical markup.
 * Widens what the site used to search: names only, unranked.
 */
export function searchCategories(categories: PriceCategory[], query: string): PriceCategory[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];

  return categories
    .map((cat) => {
      const scored = cat.items
        .map((item) => ({ item, score: matchScore(item, cat.name, words) }))
        .filter((e) => e.score > 0)
        .sort((a, b) => b.score - a.score);
      return { cat, scored };
    })
    .filter((g) => g.scored.length > 0)
    .sort((a, b) => b.scored[0].score - a.scored[0].score)
    .map((g) => ({ ...g.cat, items: g.scored.map((e) => e.item) }));
}
