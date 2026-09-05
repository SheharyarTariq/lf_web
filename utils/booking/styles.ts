/* ══════════════════════════════════════════════════════════════════
   Class recipes for the checkout
   ══════════════════════════════════════════════════════════════════

   The design shipped these as single CSS classes reused across six
   screens. As loose utilities they would be copy-pasted, which is how
   two screens end up with different field spacing. One constant each.

   Two rules the whole file depends on:

   1. Never a bare font-size utility. `text-sm` also emits a line-height
      the design does not have, and the half-pixel sizes are deliberate.
   2. Never `max-[Npx]:`. Tailwind compiles that to `width < N`, while
      the design's `@media (max-width:N)` includes N. The `to-*` variants
      in globals.css restore the inclusive bound.
   ══════════════════════════════════════════════════════════════════ */

/**
 * What `font: inherit` means inside the checkout root.
 *
 * Preflight gives every control `font: inherit`, and the `.lf-controls`
 * base rule rolls that back to the UA's metrics — which is right for the
 * controls the design left alone. But a dozen of them say `font: inherit`
 * outright, and there the value tracks the root: 16px/1.6, stepping to
 * 15.5px at 720. Spell it out rather than leaving it to the UA.
 *
 * Controls whose source rule only says `font-family: inherit`
 * (.lfb-fbtn, .lfb-faq-more) or nothing at all (.lfb-input, .lfb-sum-edit)
 * are deliberately NOT given this — they keep line-height: normal, which
 * is what `.lf-controls` already restores.
 */
export const INHERIT_FONT = "text-[16px] leading-[1.6] to-720:text-[15.5px]";

/* ── Type ─────────────────────────────────────────────────────── */

export const H1 =
  "mb-2 text-[clamp(25px,3.4vw,31px)] font-extrabold leading-[1.18] tracking-[-.8px] " +
  "focus:outline-none to-720:mb-1.5 to-720:text-[24px]";

/* The 720 block sets margin-bottom twice — 16px, then 22px further down.
   The later one wins, so the lede does not actually change at 720. Left
   as one value rather than reproducing a rule that cancels itself. */
export const LEDE = "mb-[22px] text-[15.5px] text-bk-ink-2";

/** Hidden below 720: the one-line explanation is a nicety, the headline
 *  carries it. */
export const LEDE_MD = `${LEDE} to-720:hidden`;

export const SEC_H = "mb-1.5 text-[19px] font-bold tracking-[-.3px]";
export const SEC_P = "mb-4 text-[14.5px] text-bk-ink-2";

/* The 720 block also sets this twice — 16px then 14px. 14 wins. */
export const DIVIDER = "my-[22px] h-px bg-bk-line to-720:my-[14px]";

/* ── Surfaces ─────────────────────────────────────────────────── */

/* The 720 block sets padding three times: 14px, then 12px 14px, then
   17px. The last wins. */
export const CARD = "rounded-card-lg border border-bk-line bg-white p-5 to-720:p-[17px]";

/* ── Fields ───────────────────────────────────────────────────── */

export const FIELD = "mb-[14px] to-720:mb-2.5";
export const LABEL = "mb-[7px] block text-[14px] font-semibold";
export const HINT = "mt-1.5 text-[13px] text-bk-ink-3";
export const ERR =
  "mt-[7px] flex items-start gap-[7px] text-[13.5px] font-medium text-danger";

export const INPUT =
  "autofill-white h-12 w-full rounded-ctl-lg border-[1.5px] border-bk-line-2 bg-white " +
  "px-[15px] text-[16px] text-bk-ink transition-[border-color,box-shadow] duration-150 " +
  "ease-[ease] placeholder:text-bk-ink-3 focus:border-bk-ink focus:outline-none " +
  "focus:shadow-[0_0_0_3px_rgba(20,20,15,.08)] aria-invalid:border-danger";

/* Wide tracking so six digits read as six digits and a mistyped one is
   easy to spot. */
export const CODE_INPUT = `${INPUT} text-center text-[19px] font-bold tracking-[.45em]`;

/* pl/pr rather than px: INPUT already carries `px-[15px]`, and two
   padding-inline utilities in one class list are settled by Tailwind's
   sort order — which kept the 15px. The single-side utilities sort after
   it, so 16px wins the way the source's `textarea.lfb-input` does. */
export const TEXTAREA =
  `${INPUT} h-auto min-h-[92px] resize-y pl-4 pr-4 py-[14px] leading-[1.5]`;

/* Pairs of fields. Each child carries its own margin-bottom, which is why
   the stacked variant sets gap:0. Only below 360 is a paired field
   genuinely too narrow to read. */
export const ROW = "flex gap-3 to-480:gap-2 to-360:flex-col to-360:gap-0";
export const ROW_CELL = "min-w-0 flex-[1_1_0]";

/* ── Buttons ──────────────────────────────────────────────────── */

/* No border-colour here. The source's `border:1px solid transparent` is
   overridden by every one of the six variants below, and a colour in the
   base plus a colour in the variant is one property set twice in one
   class list — which Tailwind resolves by its own sort order, not by
   authoring order. It resolved to transparent, which is how the ink
   button lost its edge. */
const BTN_BASE =
  "inline-flex items-center justify-center overflow-hidden rounded-ctl-lg border " +
  "whitespace-nowrap no-underline cursor-pointer " +
  "transition-[background-color,border-color,transform] duration-[160ms] ease-[ease] " +
  "disabled:cursor-not-allowed disabled:opacity-45";

/* 48, not 54. At 54 with a 16px radius the corners stop reading as
   rounded and the whole thing looks like a slab — and it sat 6px taller
   than the inputs it lines up with and 10px taller than every button on
   the landing page. 48 matches the fields, so a button beside one is the
   same object at the same weight.
   Sizes are exclusive rather than layered: `min-h-11` and `min-h-12` are
   the same property, so relying on one to beat the other in a single
   class list would depend on Tailwind's internal sort order. */
const BTN_SIZE = {
  md: "min-h-11 gap-2 px-[18px] py-2 text-[15px] font-medium leading-5",
  lg: "min-h-12 gap-2 px-[22px] py-2 text-[15.5px] font-semibold leading-5",
  /* The mobile app's button, to the pixel — 56px tall, 16px radius, Poppins
     500 at 16/20, 12px of horizontal padding (its `spacing.sm`). Used by the
     confirmation screen, which is drawn from the app rather than from the
     prototype every other screen here follows. Not a bigger `lg`: sizes in
     this map are exclusive, so a screen picks one and gets all of it. */
  xl: "min-h-14 gap-2 px-3 py-3 text-[16px] font-medium leading-5",
  /* Provider buttons follow Apple's and Google's published specs, not
     our own button style — people recognise these by their own
     appearance, and both companies' guidelines constrain them.
     One rule knowingly broken: Google asks for Roboto Medium. Their
     guidelines permit the platform font where Roboto is unavailable, and
     this site is Poppins-only, so Poppins 500 at the specified 14px. */
  oauth: "w-full min-h-12 gap-3 px-[14px] py-2 text-[14px] font-medium leading-5",
} as const;

const BTN_VARIANT = {
  lime: "bg-brand border-brand text-bk-ink hover:bg-brand-hover hover:border-brand-hover",
  /* `enabled:` rather than a bare hover: the source cancels the lift with
     `transform:none` on :disabled, declared after the variant so it wins.
     Tailwind v4 moves translate onto its own property, where `transform`
     no longer reaches it, so the condition is said outright instead. */
  ink: "bg-bk-ink border-bk-ink text-white enabled:hover:-translate-y-px",
  ghost: "bg-white border-bk-line-2 text-bk-ink hover:border-bk-ink",
  /* Apple: black fill, white mark and label at the leading edge. */
  apple: "bg-black border-black text-white hover:bg-[#1a1a1a] hover:border-[#1a1a1a]",
  /* Google light theme: white fill, #747775 stroke, #1F1F1F label. */
  google: "bg-white border-[#747775] text-[#1f1f1f] hover:bg-[#f7f8f8]",
  /* Ours, not a provider's — so it keeps our own button style rather than
     borrowing a look that belongs to someone else. */
  email: "bg-white border-bk-line-2 text-bk-ink font-semibold text-[15px] hover:border-bk-ink",
} as const;

export function bkBtn({
  variant = "lime",
  size = "md",
  block = false,
  className = "",
}: {
  variant?: keyof typeof BTN_VARIANT;
  size?: keyof typeof BTN_SIZE;
  block?: boolean;
  className?: string;
} = {}): string {
  return [BTN_BASE, BTN_SIZE[size], BTN_VARIANT[variant], block ? "w-full" : "", className]
    .filter(Boolean)
    .join(" ");
}

/* `font: inherit` then `font-size: 14.5px` in the source, so only the
   line-height is actually inherited — 1.6 as a number, against the link's
   own size. INHERIT_FONT cannot be used here: its `text-[16px]` and the
   14.5px below are the same property in one class list, and the 720
   variant in it beat the 14.5 outright, which is how every inline link
   on a phone came out a point too large. */
export const BTN_LINK =
  "cursor-pointer border-none bg-transparent p-0 text-[14.5px] leading-[1.6] " +
  "font-semibold text-bk-ink underline underline-offset-[3px]";

/* ── The action bar ───────────────────────────────────────────────
   Pinned to the bottom of the viewport while there is still page below,
   and sitting in normal flow once the end is reached — sticky rather
   than fixed, so nothing has to be padded to compensate and the bar can
   never cover the last field. The ::before bleeds the background to the
   window edges without the element itself overflowing; from 1024 it is
   pulled back to the form's gutters, because left at the viewport bleed
   it would paint across the pinned panel and cut off its foot. */
export const ACTIONS =
  "sticky bottom-0 z-40 mt-auto flex-none px-0 pt-4 " +
  "pb-[calc(16px+env(safe-area-inset-bottom,0px))] " +
  "before:absolute before:inset-y-0 before:-z-10 before:left-[calc(-50vw+50%)] " +
  "before:right-[calc(-50vw+50%)] before:bg-bk-paper before:transition-shadow " +
  "before:duration-[180ms] before:ease-[ease] before:content-[''] " +
  "from-1024:before:left-[-24px] from-1024:before:right-[-24px]";

/** Only while something is still hidden below the bar. Once the end of
 *  the page is reached the bar is just the last thing on it. */
export const ACTIONS_MORE = "before:shadow-[0_-8px_22px_-14px_rgba(20,20,15,.55)]";

/* The header arrow is easy to miss once you have scrolled to the bottom
   of a long screen, which is exactly where the decision to go back gets
   made. Back sits beside Continue as well, never instead of it.
   Below 360, "Continue to your details" loses its fight with Back and
   clips inside the button's overflow:hidden — so stack, forward action
   first, since that is the one being reached for. */
export const NAV = "flex items-stretch gap-3 to-360:flex-col-reverse";
export const NAV_FORWARD = "flex-auto";
export const NAV_BACK = "flex-none to-360:w-full";

/* ── Notices ──────────────────────────────────────────────────── */

export const NOTE = "flex gap-3 rounded-card-md p-4 text-[14.5px] leading-[1.55]";
export const NOTE_TONE = {
  "": "bg-panel",
  warn: "bg-danger-bg text-danger",
  plain: "bg-bk-paper-2",
} as const;

/* ── Discount ─────────────────────────────────────────────────── */

export const DISC =
  "flex items-center gap-3 rounded-card-md bg-brand px-4 py-[14px] text-bk-ink";

/* ── Eco tag ──────────────────────────────────────────────────────
   In the source this is `.lfb-eco-tag` at 0,1,0, which lost to
   `.lfb-sum-v span` at 0,2,0 and stretched into a lime bar. Utilities
   are applied per element, so the fight cannot happen here — but the
   inline variant is still spelled out where it is used, because the
   absolute one is the default on a slot. */
export const ECO_TAG =
  "inline-flex items-center rounded-pill bg-brand px-1.5 py-px text-[10.5px] " +
  "font-bold uppercase leading-[1.5] tracking-[.3px] text-bk-ink";
export const ECO_TAG_INLINE = `${ECO_TAG} static ml-2 w-auto align-[1px]`;

/* ── The hidden radio/checkbox inside a chip, slot, toggle or box ── */
export const CONTROL_PEER = "peer absolute h-0 w-0 opacity-0";

/* ── Toggle ───────────────────────────────────────────────────────
   Shared by the repeat switch on the time screen and the three
   preference switches on the confirmation.

   iOS proportions — 51x31 with a 27px knob — because a true native
   control is not available here: Safari 17.4+ supports
   <input type="checkbox" switch> but Chrome and Firefox do not, so a
   native switch would look right on one browser and wrong on the rest.
   Sized and eased to match instead. `order` matters: the switch is
   written first in the markup so it can be the peer of the input, and
   sent to the end of the row so it lands on the right. */
export const TOGGLE = "flex cursor-pointer items-center gap-3";
export const SWITCH =
  "relative order-2 ml-auto h-[31px] w-[51px] flex-none rounded-pill bg-bk-line-2 " +
  "transition-[background-color] duration-200 ease-[ease] peer-checked:bg-brand " +
  "after:absolute after:left-0.5 after:top-0.5 after:h-[27px] after:w-[27px] " +
  "after:rounded-[50%] after:bg-white after:shadow-[0_1px_3px_rgba(20,20,15,.25)] " +
  "after:transition-transform after:duration-200 after:ease-[ease] after:content-[''] " +
  "peer-checked:after:translate-x-5 " +
  /* In flight. The preference toggles on the confirmation screen save on the
     flip, and the switch is disabled for as long as its own request is out —
     so this is the only thing on screen saying why a second tap does nothing.
     The repeat switch on the time screen is never disabled and never sees it. */
  "peer-disabled:opacity-60 " +
  "peer-focus-visible:outline peer-focus-visible:outline-[3px] " +
  "peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-bk-ink";
export const TOGGLE_TEXT = "order-1 min-w-0 flex-auto";
export const TOGGLE_TITLE = "block text-[15px] font-semibold";
export const TOGGLE_SUB = "mt-0.5 block text-[13.5px] text-bk-ink-2";

/* ── Recipes lifted out of components/booking/parts.tsx ───────────
   They arrived here when parts.tsx was split into one folder per
   component: a class string is a style, not a component, and leaving
   them beside the JSX meant every screen importing a "component"
   module to get a string. */

/* One recipe, two right margins: the header's button hangs 10px past the
   gutter, the modal's 8px. Both are the same object otherwise. */
const CLOSE_BASE =
  "order-5 flex h-11 w-11 flex-none cursor-pointer items-center justify-center " +
  /* The design names no padding here, so the control keeps the UA's 1px 6px.
     Preflight zeroes it. Inert inside a fixed 44px flex-centred box, but it is
     still a computed difference, and stating it is cheaper than explaining it
     in every audit run. */
  "py-px px-1.5 " +
  "rounded-ctl-lg border-none bg-transparent text-bk-ink " +
  "transition-[background-color] duration-150 ease-[ease] hover:bg-bk-paper-2";

export const CLOSE_BTN = `${CLOSE_BASE} -mr-2.5`;
/* The -mr-2 variant went with components/common/Modal, which was its only
   consumer. The recipe is written out there rather than imported back across
   the boundary — a shared component should not reach into the checkout's
   stylesheet. Keep the two in step if this base ever changes. */

export const MODAL_FOOT = "mt-4 text-[13.5px] text-bk-ink-2";

/* Inside a modal both buttons share the row evenly — the source's
   `.lfb-modal .lfb-nav .lfb-btn` at 0,3,0, which outranks the flow's own
   `.lfb-nav .lfb-btn--lime`. */
export const MODAL_NAV = `${NAV} mt-5`;
export const MODAL_NAV_BTN = "flex-[1_1_0]";
