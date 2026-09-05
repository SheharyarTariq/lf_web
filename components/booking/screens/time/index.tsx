"use client";

/* ══════════════════════════════════════════════════════════════════
   2 · Time
   ══════════════════════════════════════════════════════════════════ */

import { cn } from "@/utils/cn";
import Textarea from "@/components/common/Textarea";
import Button from "@/components/common/Button";
import Loader from "@/components/common/Loader";
import { useEffect, useId, useMemo, useState } from "react";
import Calendar, { SlotPicker } from "@/components/booking/calendar";
import { Icon, P } from "@/components/booking/icons";
import ActionBar from "@/components/booking/common/ActionBar";
import Field from "@/components/booking/common/Field";
import Notice from "@/components/booking/common/Notice";
import { useAuth } from "@/components/common/AuthProvider";
import { useBooking } from "@/utils/booking/context";
import { useConfirmSubmit } from "@/utils/booking/use-confirm";
import { fetchDropoffSlots, fetchPickupSlots } from "@/utils/booking/api";
import {
  DAY_FULL,
  MONTHS,
  NOTE_MAX,
  REPEAT_EVERY,
  firstEcoSlot,
  markEcoWindows,
  parseDay,
  repeatSentence,
  type Availability,
  type Leg,
  type Slot,
} from "@/utils/booking/model";
import {
  CARD,
  CONTROL_PEER,
  DIVIDER,
  ERR,
  H1,
  INHERIT_FONT,
  LEDE_MD,
  NAV_BACK,
  NAV_FORWARD,
  SWITCH,
  TOGGLE,
  TOGGLE_SUB,
  TOGGLE_TEXT,
  TOGGLE_TITLE,
  } from "@/utils/booking/styles";

/* ── Leg tabs ─────────────────────────────────────────────────────
   One calendar serving both legs rather than two stacked pickers. Two
   full calendars on one screen is the thing that overwhelms; a segmented
   control keeps the page short and the choice one at a time. */
const LEGS =
  "mb-[14px] flex gap-1.5 rounded-ctl-lg bg-bk-paper-2 p-1 to-720:mb-2 to-720:min-h-0";

/* Colour, border and background are set once each — in the on/off pair
   below — because a base value and a state value in one class list are
   resolved by Tailwind's sort order rather than by authoring order. */
const LEG =
  "flex min-h-12 min-w-0 flex-[1_1_0] cursor-pointer flex-col items-center justify-center " +
  `gap-0 rounded-ctl-md border px-2.5 py-1.5 ${INHERIT_FONT} ` +
  "transition-[background-color] duration-[160ms] ease-[ease] " +
  "disabled:cursor-not-allowed disabled:opacity-50 to-720:min-h-[42px]";
const LEG_ON = "border-bk-line bg-white text-bk-ink shadow-soft";
const LEG_OFF = "border-transparent bg-transparent text-bk-ink-2";

/* Side by side from tablet up: the calendar is only ~300px wide, so
   stacking the windows underneath wasted a screenful of empty space to
   its right and pushed Continue out of an ordinary desktop window.
   Stacks again on phones, where two columns would be unreadable. */
const WHEN =
  "grid [align-items:start] gap-[14px] from-721:grid-cols-[1fr_1fr] from-721:gap-4 to-720:gap-2.5";

/* ── Choice chips ─────────────────────────────────────────────────
   Three across, always. These are short and mutually exclusive, so the
   full-width stacking that suits the payment chips would waste 120px of
   height on a phone — the exact height this screen is short of. That
   override is (0,2,0) in the source and beats the 480 rule, so there is
   no stacked variant here at all. */
const CHIP =
  "inline-flex min-h-[46px] min-w-0 flex-[1_1_0] cursor-pointer items-center justify-center " +
  "gap-2 rounded-ctl-lg border-[1.5px] px-2 py-2 text-[14.5px] font-semibold text-bk-ink " +
  "transition-[border-color,background-color] duration-150 ease-[ease] " +
  "has-[input:focus-visible]:outline has-[input:focus-visible]:outline-[3px] " +
  "has-[input:focus-visible]:outline-offset-[3px] has-[input:focus-visible]:outline-bk-ink";
const CHIP_ON = "border-brand bg-panel shadow-[inset_0_0_0_1px_var(--color-brand)]";
const CHIP_OFF = "border-bk-line-2 bg-white hover:border-bk-ink-3";

export default function TimeScreen() {
  /* The open leg lives on the context, not here. The summary panel and the
     Review screen each carry an Edit link per leg and have to be able to open
     the one they name — and from the wide layout the panel is on screen while
     this very step is, so a link that only navigated would do nothing at all.

     It being held above this screen also means it is no longer re-guessed from
     the data on every mount: returning to this step lands on the tab it was
     left on. */
  const {
    data,
    patch,
    forward,
    back,
    wide,
    skipContact,
    isLast,
    moreBelow,
    timeLeg: legWanted,
    setTimeLeg: setLeg,
  } = useBooking();
  /* For a returning customer on a desktop this is the whole checkout: the
     address and the card are already on the account, the pinned summary is the
     review, and so the order is placed from here. `isLast` is derived from the
     walk rather than asserted, so this screen never has to know why. */
  const { busy, error: orderError, submit } = useConfirmSubmit();
  /* Non-null is the whole test — the brief defines `recurring` as the active
     subscription or null, and documents no fields inside it. */
  const { status } = useAuth();
  const hasRecurring = Boolean(status?.recurring);
  const ids = useId();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  /* Both legs come from the server now, so both can be in flight or fail.
     `null` means "not asked yet or still asking", which is what keeps the
     calendar from rendering an empty grid as though nothing were offered. */
  const [collectionAvailability, setCollectionAvailability] = useState<Availability | null>(null);
  const [deliveryAvailability, setDeliveryAvailability] = useState<Availability | null>(null);
  const [collectionError, setCollectionError] = useState("");
  const [deliveryError, setDeliveryError] = useState("");

  /* Bumped by the Try again buttons to re-run the fetch effects below. */
  const [pickupTick, setPickupTick] = useState(0);
  const [dropoffTick, setDropoffTick] = useState(0);

  /* Fetched in the effect rather than through a useCallback the effect then
     calls: react-hooks/set-state-in-effect follows the call through and flags
     the second shape, and it is right to — a write reachable synchronously
     from an effect body is a cascading render. Here every write sits in an
     async continuation behind `live`.

     `live` also replaces a request counter. Cleanup runs before the next
     effect, so a response for a collection the person has already changed is
     discarded by construction — the same guard AuthProvider uses on mount. */
  useEffect(() => {
    let live = true;
    void (async () => {
      const r = await fetchPickupSlots(data.postcode);
      if (!live) return;
      if (!r.ok) {
        setCollectionError(r.message);
        return;
      }
      setCollectionError("");
      setCollectionAvailability(r.availability);
    })();
    return () => {
      live = false;
    };
    /* The postcode is a dependency because it is now what the endpoint
       resolves the area from — for a signed-out visitor it is the *only*
       thing it has. Changing the address and coming back re-asks, rather than
       offering the previous area's windows under a new address. */
  }, [pickupTick, data.postcode]);

  /* Keyed on the chosen slot's id, because the endpoint needs the IRI — and a
     different window genuinely changes which days come back, not just which
     ones are near enough. */
  useEffect(() => {
    const slotId = data.collectionSlotId;
    const day = data.collectionDay;
    const chosen = data.collectionSlot;
    if (!slotId || !day) return undefined;

    let live = true;
    void (async () => {
      const r = await fetchDropoffSlots(slotId, day, data.postcode);
      if (!live) return;
      if (!r.ok) {
        setDeliveryError(r.message);
        return;
      }
      setDeliveryError("");
      /* Marked here rather than in the wrapper: it is a rule about the round
         schedule, not a property of the response. */
      setDeliveryAvailability(markEcoWindows(r.availability, day, chosen));
    })();
    return () => {
      live = false;
    };
  }, [dropoffTick, data.collectionSlotId, data.collectionDay, data.collectionSlot, data.postcode]);

  /* Retries are event handlers, so they may clear state outright — and a tick
     is what re-runs the effect above without duplicating the fetch here. */
  const retryPickup = () => {
    setCollectionError("");
    setCollectionAvailability(null);
    setPickupTick((t) => t + 1);
  };

  const retryDropoff = () => {
    setDeliveryError("");
    setDeliveryAvailability(null);
    setDropoffTick((t) => t + 1);
  };

  const collectionSlots = collectionAvailability?.[data.collectionDay] || [];
  const deliverySlots = deliveryAvailability?.[data.deliveryDay] || [];

  const eco = useMemo(
    () => (deliveryAvailability ? firstEcoSlot(deliveryAvailability) : null),
    [deliveryAvailability],
  );
  const ecoChosen = Boolean(
    eco && data.deliveryDay === eco.day && data.deliverySlot === eco.slot,
  );

  /* Preselected rather than merely highlighted. Left to chance most
     people take the earliest slot, which is usually a dedicated trip;
     defaulting to the round we are already running is the difference
     between a nudge and an actual saving. Fully changeable — every other
     window stays one tap away. */
  useEffect(() => {
    if (eco && !data.deliveryDay) {
      patch({
        deliveryDay: eco.day,
        deliverySlot: eco.slot,
        deliverySlotId: eco.id,
        deliveryEco: true,
      });
    }
  }, [eco, data.deliveryDay, patch]);

  const collectionDone = Boolean(data.collectionDay && data.collectionSlot);
  const deliveryDone = Boolean(data.deliveryDay && data.deliverySlot);
  const ready = collectionDone && deliveryDone;

  /* If collection gets cleared while the delivery tab is open, put the
     person back where the decision actually is. Derived here rather than
     corrected in an effect: an effect renders the delivery panel once,
     empty, before swapping it — and the tab it swaps to is the one the
     source's own guard chose anyway. */
  const leg: Leg = legWanted === "delivery" && !collectionDone ? "collection" : legWanted;

  /* Delivery is derived from collection, so any change upstream drops
     it. Carrying a delivery slot the backend may no longer offer would
     fail at submit — long after the person stopped looking at it. */
  const setCollectionDay = (k: string) => {
    patch({
      collectionDay: k,
      collectionSlot: "",
      collectionSlotId: "",
      deliveryDay: "",
      deliverySlot: "",
      deliverySlotId: "",
      deliveryEco: false,
    });
    setDeliveryAvailability(null);
  };

  const setCollectionSlot = (s: Slot) => {
    patch({
      collectionSlot: s.label,
      collectionSlotId: s.id,
      deliveryDay: "",
      deliverySlot: "",
      deliverySlotId: "",
      deliveryEco: false,
    });
    setDeliveryAvailability(null);
    setLeg("delivery");
  };

  /* The eco flag is stored with the choice rather than recomputed later:
     the review screen has no availability data, and by then the answer
     could have changed anyway. */
  const setDeliverySlot = (s: Slot) => {
    patch({ deliverySlot: s.label, deliverySlotId: s.id, deliveryEco: s.eco });
  };

  const summary = (day: string, slot: string, fallback: string) => {
    if (!(day && slot)) return fallback;
    const d = parseDay(day);
    if (!d) return fallback;
    return `${d.getDate()} ${MONTHS[d.getMonth()]} · ${slot}`;
  };

  const isCollection = leg === "collection";
  const legError = isCollection ? collectionError : deliveryError;
  /* Only the leg on screen. The delivery request is deliberately not started
     until a collection window exists, so "no data and no error" is its
     resting state, not a spinner. */
  const legLoading = isCollection
    ? !collectionAvailability && !collectionError
    : collectionDone && !deliveryAvailability && !deliveryError;
  const collectDay = parseDay(data.collectionDay);
  const sentence = repeatSentence(data);

  const tabs: [id: Leg, title: string, sub: string, enabled: boolean, done: boolean][] = [
    [
      "collection",
      "Collection",
      summary(data.collectionDay, data.collectionSlot, "Pick a day"),
      true,
      collectionDone,
    ],
    [
      "delivery",
      "Delivery",
      summary(
        data.deliveryDay,
        data.deliverySlot,
        collectionDone ? "Pick a day" : "Set collection first",
      ),
      collectionDone,
      deliveryDone,
    ],
  ];

  return (
    <>
      <h1 className={H1} tabIndex={-1}>
        {isCollection ? "When shall we collect?" : "When shall we return?"}
      </h1>
      <p className={LEDE_MD}>Free to change up to two hours before.</p>

      <div className={LEGS} role="tablist" aria-label="Collection and delivery">
        {tabs.map(([id, title, sub, enabled, done]) => (
          <Button variant="bare"
            key={id}
            role="tab"
            id={`${ids}-tab-${id}`}
            aria-selected={leg === id}
            aria-controls={`${ids}-panel-${id}`}
            className={cn(LEG, leg === id ? LEG_ON : LEG_OFF)}
            disabled={!enabled}
            onClick={() => setLeg(id)}
          >
            <b className="text-[14px] font-bold">
              {title}
              {done && " ✓"}
            </b>
            <span
              className={cn("max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px]", leg === id ? "text-bk-ink-2" : "text-bk-ink-3")}
            >
              {sub}
            </span>
          </Button>
        ))}
      </div>

      <div id={`${ids}-panel-${leg}`} role="tabpanel" aria-labelledby={`${ids}-tab-${leg}`}>
        {/* Loading and failure are distinct from "nothing offered". The
            calendar's own empty state says we have no windows, which would be
            a lie while the request is still going or after it fell over. */}
        {legError ? (
          <div className={CARD}>
            <p className={cn(ERR, "mb-3")} role="alert">
              <Icon icon={P.alert} size={15} />
              {legError}
            </p>
            <Button
              surface="booking" variant="ghost" block
              onClick={isCollection ? retryPickup : retryDropoff}
            >
              Try again
            </Button>
          </div>
        ) : legLoading ? (
          <p className="flex items-center gap-2.5 py-6 text-[14px] text-bk-ink-2" aria-live="polite">
            <Loader className="h-4 w-4" />
            Finding the windows we have left&hellip;
          </p>
        ) : (
        <div className={WHEN}>
          <Calendar
            key={leg}
            value={isCollection ? data.collectionDay : data.deliveryDay}
            onChange={(k) =>
              isCollection
                ? setCollectionDay(k)
                : patch({ deliveryDay: k, deliverySlot: "", deliverySlotId: "", deliveryEco: false })
            }
            available={(isCollection ? collectionAvailability : deliveryAvailability) ?? {}}
            today={today}
            label={isCollection ? "Collection date" : "Delivery date"}
            note={
              isCollection
                ? "We run set days in your area — more as we expand across Surrey."
                : "A leaf marks our greener windows."
            }
          />
          {(isCollection ? data.collectionDay : data.deliveryDay) ? (
            <SlotPicker
              name={isCollection ? "Collection window" : "Delivery window"}
              value={isCollection ? data.collectionSlot : data.deliverySlot}
              onChange={(s) => (isCollection ? setCollectionSlot(s) : setDeliverySlot(s))}
              slots={isCollection ? collectionSlots : deliverySlots}
            />
          ) : (
            /* The hint recipe with its top margin dropped — it is a grid
               cell here, not something following a field. */
            <p className="text-[13px] text-bk-ink-3">
              Pick a day to see the windows we have left.
            </p>
          )}
        </div>
        )}
        {!isCollection && ecoChosen && (
          <p className="mt-3 flex items-center gap-[9px] rounded-card-md bg-panel px-[13px] py-2.5 text-[13.5px] leading-[1.45] text-bk-ink-2 to-720:mt-2 to-720:gap-2 to-720:px-[11px] to-720:py-2 to-720:text-[13px]">
            <Icon icon={P.leaf} size={17} className="flex-none text-brand-ink" />
            {/* Says nothing about who chose it, because it is shown
                whether the window was preselected or picked by hand.
                One line, and no claim we cannot stand behind. */}
            <span>A greener window — fewer separate journeys.</span>
          </p>
        )}
      </div>

      {/* Belongs to the delivery leg and only shows there: on the
          collection tab it would be asking about a schedule whose second
          half is not on screen. Also needs both legs settled, or its
          subtitle has no day to name. */}
      {ready && !isCollection && (
        <>
          <div className={DIVIDER} />

          {/* One schedule per account. Offering the toggle to somebody who
              already has one is offering a control that cannot work: the
              server refuses a second `frequency` outright, and it does so as a
              500 rather than as anything we could turn into a sentence. So the
              check happens here, against `recurring` on /my-status, which the
              brief defines as the active subscription or null.

              Deliberately no "manage it in the app" — there is no endpoint for
              editing or cancelling a recurring order and no screen to send
              anyone to, so that would be a second dead end rather than a way
              out of the first. */}
          {hasRecurring ? (
            <Notice tone="plain" icon={P.repeat} title="You already have a repeating collection">
              This one is booked as a one-off.
            </Notice>
          ) : (
          <div className={CARD}>
            <label className={TOGGLE}>
              <input
                className={CONTROL_PEER}
                type="checkbox"
                checked={data.repeat}
                onChange={(e) => patch({ repeat: e.target.checked })}
                aria-controls={`${ids}-every`}
                aria-expanded={data.repeat}
              />
              <span className={SWITCH} aria-hidden="true" />
              <Icon icon={P.repeat} size={20} className="flex-none text-bk-ink" />
              <span className={TOGGLE_TEXT}>
                <b className={TOGGLE_TITLE}>Repeat this order</b>
                <span className={TOGGLE_SUB}>
                  {data.repeat && collectDay
                    ? `Every ${DAY_FULL[collectDay.getDay()]}`
                    : "Same pickup, on a schedule"}
                </span>
              </span>
            </label>
            {/* Divider rather than a nested card: the frequency belongs to
                the toggle above it, and a second card would read as a
                separate decision. */}
            {data.repeat && (
              <div id={`${ids}-every`} className="mt-4 border-t border-t-bk-line pt-4">
                <p className="mb-2.5 block text-[14px] font-semibold" id={`${ids}-every-l`}>
                  Repeat every
                </p>
                <div
                  className="flex flex-wrap gap-2.5"
                  role="radiogroup"
                  aria-labelledby={`${ids}-every-l`}
                >
                  {REPEAT_EVERY.map(([id, label]) => {
                    const on = data.repeatEvery === id;
                    return (
                      <label key={id} className={cn(CHIP, on ? CHIP_ON : CHIP_OFF)}>
                        <input
                          className={CONTROL_PEER}
                          type="radio"
                          name="repeatEvery"
                          value={id}
                          checked={on}
                          onChange={() => patch({ repeatEvery: id })}
                        />
                        {label}
                      </label>
                    );
                  })}
                </div>
                {sentence && (
                  <p
                    className="mt-3 flex gap-[9px] rounded-card-md bg-bk-paper-2 px-3 py-[11px] text-[13px] leading-[1.5] text-bk-ink-2"
                    aria-live="polite"
                  >
                    <Icon icon={P.repeat} size={16} className="mt-0.5 flex-none text-bk-ink-3" />
                    <span>{sentence}</span>
                  </p>
                )}
              </div>
            )}
          </div>
          )}
        </>
      )}

      {/* Belongs with the collection it describes, not with the card. */}
      {ready && (
        <>
          <div className={DIVIDER} />
          <Field label="Anything else we should know? (optional)" id={`${ids}-note`}>
            {/* 400 is the backend's cap on `note` in POST /orders. Enforced
                here as well as in the wrapper, so the limit is felt as the
                field refusing another character rather than as a validation
                error two screens later. */}
            <Textarea
              id={`${ids}-note`}
              value={data.access}
              onChange={(e) => patch({ access: e.target.value })}
              maxLength={NOTE_MAX}
              placeholder="Buzzer 12, side gate is unlocked until 8pm"
            />
          </Field>
        </>
      )}

      {orderError && (
        <p className={cn(ERR, "mt-3")} role="alert">
          <Icon icon={P.alert} size={15} className="mt-0.5 flex-none" />
          {orderError}
        </p>
      )}

      <ActionBar more={moreBelow} nav>
        <Button
          surface="booking" variant="ghost" size="lg" className={NAV_BACK}
          onClick={back}
          disabled={busy}
        >
          Back
        </Button>
        <Button
          surface="booking" size="lg" className={cn(NAV_FORWARD, isLast && "gap-2")}
          disabled={!ready}
          isLoading={isLast ? busy : undefined}
          onClick={isLast ? submit : forward}
        >
          {/* The button names where it lands, so it cannot promise a details
              step that an account with its details already on file will never
              see — nor a payment step that a returning customer skips, where
              this press is the order. `forward` works out the route; this only
              has to match it. */}
          {isLast && busy && <Loader className="h-4 w-4" />}
          {isLast
            ? "Confirm order"
            : skipContact
              ? wide
                ? "Continue to payment"
                : "Continue to review"
              : "Continue to your details"}
        </Button>
      </ActionBar>
    </>
  );
}
