/* ══════════════════════════════════════════════════════════════════
   The auth modal's field recipe
   ══════════════════════════════════════════════════════════════════

   Deliberately not the checkout's INPUT. The modal is its own surface — in
   the design it carries the `.lfa` token scope — and the two differ in five
   properties: 52px tall rather than 48, `rounded-card-md` rather than
   `rounded-ctl-lg`, 16px horizontal padding rather than 15, 15.5px text
   rather than 16, and its own placeholder grey. It also has no border
   transition, where the checkout's field animates.

   Lifted out of the component so <Input surface="auth"> can reach it. Nothing
   about the values changed.
   ══════════════════════════════════════════════════════════════════ */

/* Height is separate so the phone field can override it without two
   competing `h-*` utilities on one element — which resolve by Tailwind's sort
   order, not by authoring order, and left the tel row 2px too tall. */
export const AUTH_INPUT_BASE =
  "autofill-white w-full px-4 py-0 bg-white rounded-card-md " +
  "text-[15.5px] leading-[1.6] text-bk-ink placeholder:text-[#9A9A94] focus:outline-none " +
  "focus:border-bk-ink focus:shadow-[0_0_0_3px_rgba(20,20,15,.08)] aria-invalid:border-danger";

/* The border lives outside the base so the phone field, which has none, does
   not have to fight a colour it never asked for. */
export const AUTH_INPUT = `h-[52px] border-[1.5px] border-bk-line-2 ${AUTH_INPUT_BASE}`;

/* The verification code field. Bigger, bolder and widely tracked, because six
   digits copied from an email get checked against the email — which is much
   easier when the characters are not crowded.

   The same treatment as the checkout's code inputs (booking/overlays), kept
   identical on purpose: two screens in one product that ask for the same six
   digits should not look like two different fields. Applied on top of
   AUTH_INPUT, so it only has to say what differs. */
export const AUTH_CODE_INPUT = "text-center text-[19px] font-bold tracking-[.45em]";
