"use client";

import { validateFormSync } from "@/utils/validation";
import { addressSchema, postcodeSchema } from "./schema";
import { cn } from "@/utils/cn";
import Input from "@/components/common/Input";
import Button from "@/components/common/Button";
import { useId, useRef, useState } from "react";
import ActionBar from "@/components/booking/common/ActionBar";
import Field from "@/components/booking/common/Field";
import Notice from "@/components/booking/common/Notice";
import Loader from "@/components/common/Loader";
import { Icon, P } from "@/components/booking/icons";
import { useBooking } from "@/utils/booking/context";
import { WaitlistModal } from "@/components/booking/overlays";
import { useAuth } from "@/components/common/AuthProvider";
import { findAddresses, updateAddress } from "@/utils/booking/api";
import {
  ADDRESS_FIELDS,
  formatPostcode,
  normalisePostcode,
  type AddressKey,
  type AddressResult,
} from "@/utils/booking/model";
import {
  BTN_LINK,
  CARD,
  ERR,
  INHERIT_FONT,
  H1,
  LABEL,
  LEDE,
  ROW,
  ROW_CELL,
  SEC_H,
  SEC_P,
  } from "@/utils/booking/styles";

/* `postcode` is the one that was searched, shown against every row. Each row
   also carries its own `postcodeString`, which is deliberately not used: it is
   what we would save, and saving a postcode the coverage check never ran
   against is how the address step started 500ing. Showing one and saving
   another would be worse still. */
function AddressLines({ a, postcode }: { a: AddressResult; postcode: string }) {
  const head = [a.line1, a.line2].filter(Boolean).join(", ");
  return (
    /* Scoped to this wrapper, never a `.lfb-pick b` descendant rule — that
       would be (0,1,1) in the source and start outranking component classes
       inside it. */
    <span className="min-w-0 flex-auto text-left">
      <b className="block text-[15px] font-semibold leading-[1.35]">{head}</b>
      {a.line3 && <b className="block text-[15px] font-semibold leading-[1.35]">{a.line3}</b>}
      <span className="mt-0.5 block text-[13.5px] text-bk-ink-3">
        {[a.town, postcode].filter(Boolean).join(", ")}
      </span>
    </span>
  );
}

export default function AddressScreen() {
  const { data, patch, go, moreBelow } = useBooking();
  const { user } = useAuth();
  const ids = useId();

  const [postcode, setPostcode] = useState(data.postcode || "");
  /* The postcode the visible results belong to. Reading the live input
     instead meant the list re-labelled itself with half-typed postcodes as
     soon as someone started editing. */
  const [searched, setSearched] = useState(data.postcode || "");
  /* "out" is the served-nowhere answer, "failed" is not having got an answer.
     Keeping them apart matters: telling somebody we do not cover their area
     when the truth is our request fell over would lose the booking on a lie. */
  const [results, setResults] = useState<AddressResult[] | "out" | "failed" | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [waitlisted, setWaitlisted] = useState(false);
  const [waitEmail, setWaitEmail] = useState("");
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<AddressKey, boolean>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveErrors, setSaveErrors] = useState<Partial<Record<AddressKey, string>>>({});

  /* Monotonic, so a slow response cannot land on top of a newer one. Same
     guard the contact screen uses for its account check. */
  const reqId = useRef(0);

  const clearSaveErrors = () => {
    setSaveError("");
    setSaveErrors({});
  };

  /* Spaced for reading, since `searched` is stored exactly as typed and
     "KT211PV" printed back reads as a typo. `searched` is only ever set once
     POSTCODE_RE has passed, so this always takes formatPostcode's spacing
     branch; the `|| postcode` covers the render before the first search. */
  const searchedPostcode = formatPostcode(searched || postcode);
  const outOfArea = results === "out";
  const list = Array.isArray(results) ? results : null;
  /* Confirmed means the postcode passed the area check and the person has
     moved on to the address itself — either by picking a result or by
     choosing to type it. */
  const [confirmed, setConfirmed] = useState(Boolean(data.postcode && data.line1));

  const search = async () => {
    const pc = normalisePostcode(postcode);
    setPostcode(pc);
    /* Checked here rather than at the server, because POSTCODE_RE is
       character-for-character the backend's own — so a round trip could only
       ever come back agreeing. */
    const bad = validateFormSync(postcodeSchema, { postcode: pc }).postcode;
    if (bad) {
      setError(bad);
      setResults(null);
      return;
    }
    setError("");
    setSearched(pc);

    const id = ++reqId.current;
    setSearching(true);
    setResults(null);
    /* A new search invalidates the previous answer, the same rule
       editPostcode applies on a keystroke. Without it, pressing Find
       address again on a postcode already joined reopens the empty form
       to somebody who is on the list. */
    setWaitlisted(false);

    const r = await findAddresses(pc);
    if (id !== reqId.current) return;
    setSearching(false);

    if (!r.ok) {
      /* Not read as "no addresses". Somebody who is told there is nothing at
         their postcode edits it or gives up; somebody told the check failed
         presses the button again. */
      setResults("failed");
      return;
    }
    if (!r.isActive) {
      setResults("out");
      setWaitlistOpen(true);
      return;
    }
    /* Only written once the postcode is known to be servable — an out-of-area
       one in BookingData would let furthestAllowed wave the flow past a
       collection we cannot make. */
    patch({ postcode: pc });
    setResults(r.addresses);
  };

  /* Results belong to the postcode that produced them, so the moment the
     field is edited they are stale — clear them rather than leave a list
     that no longer matches what is in the box. */
  const editPostcode = (v: string) => {
    setPostcode(v.toUpperCase());
    if (results !== null) setResults(null);
    if (error) setError("");
    setWaitlisted(false);
    setWaitlistOpen(false);
    /* A failed save belongs to the address that failed. Leaving it up while
       somebody types a different postcode reads as a complaint about the new
       one — which is what happened after Change. */
    clearSaveErrors();
  };

  const choose = (a: AddressResult) => {
    patch({
      /* The postcode that was searched, deliberately — not the row's own
         `postcodeString`, which this briefly used.

         `isActive` is decided for the searched postcode, and it is the one the
         server can resolve to a Postcode entity; saving a row's differing
         postcode 500s on update-address. They agree in real data, so this only
         matters where they do not — and there, the coverage-checked one is the
         only one we know is servable. */
      postcode: searched,
      line1: a.line1,
      line2: a.line2,
      line3: a.line3,
      town: a.town,
      county: a.county,
    });
    setResults(null);
    setConfirmed(true);
  };

  const enterManually = () => {
    /* Prefill the town from what the lookup itself said, when it said
       anything — better than a district table even where the table is right,
       and there is nothing to fall back on when the list came back empty. */
    const first = list?.[0];
    patch({
      postcode: searched,
      town: first?.town ?? "",
      county: first?.county ?? "",
    });
    setResults(null);
    setConfirmed(true);
  };

  /* Back to the postcode step. The address lines are cleared with it —
     keeping a Leatherhead street under a new Epsom postcode would be worse
     than making them pick again. */
  const changePostcode = () => {
    setConfirmed(false);
    setResults(null);
    setTouched({});
    clearSaveErrors();
    patch({ line1: "", line2: "", line3: "", town: "", county: "" });
  };

  const failed = validateFormSync(addressSchema, data);
  /* Server-side violations sit alongside the local ones and win, because they
     are the reason the save just failed — a stale "we need the town" under a
     field the server rejected for another reason helps nobody. */
  const errors: Partial<Record<AddressKey, string>> = {
    line1: saveErrors.line1 || (touched.line1 ? failed.line1 || "" : ""),
    town: saveErrors.town || (touched.town ? failed.town || "" : ""),
  };
  const ready = Boolean(data.postcode && data.line1.trim() && data.town.trim());

  const continueToTime = async () => {
    setTouched({ line1: true, town: true });
    if (!ready || saving) return;
    clearSaveErrors();

    /* Signed out, this is skipped rather than blocking: the endpoint needs a
       token and a guest has neither one nor an account to hang it on. Nothing
       downstream minds — the slot endpoints take the postcode directly, which
       is what lets this step come first for everybody — and the address itself
       is saved later, once at confirmOrder, where every route through the
       checkout passes with an id in hand.

       Kept here for a signed-in customer even so, because it is the only
       screen that can put a violation under the field that caused it. The save
       at confirm time is the guarantee; this one is the good error message. */
    if (user?.id) {
      setSaving(true);
      const r = await updateAddress(user.id, {
        line1: data.line1,
        line2: data.line2,
        line3: data.line3,
        town: data.town,
        county: data.county,
        postcode: data.postcode,
      });
      setSaving(false);
      if (!r.ok) {
        const fieldErrors: Partial<Record<AddressKey, string>> = {};
        if (r.fields.line1) fieldErrors.line1 = r.fields.line1;
        if (r.fields.town) fieldErrors.town = r.fields.town;
        setSaveErrors(fieldErrors);
        /* Only banner what could not be pinned to a field, so the same
           complaint never appears twice on one screen. */
        if (!Object.keys(fieldErrors).length) setSaveError(r.message);
        return;
      }
    }
    go("time");
  };

  const groups: (typeof ADDRESS_FIELDS)[number][][] = [
    [ADDRESS_FIELDS[0]],
    [ADDRESS_FIELDS[1]],
    [ADDRESS_FIELDS[2]],
    ADDRESS_FIELDS.slice(3),
  ];

  return (
    <>
      <h1 className={H1} tabIndex={-1}>
        Where are we collecting from?
      </h1>
      {!confirmed && (
        <p className={LEDE}>
          We collect and deliver free across Epsom, Ewell, Ashtead, Leatherhead and Fetcham.
        </p>
      )}

      {!confirmed && (
        <Field label="Postcode" id={`${ids}-pc`} error={error}>
          {/* An input plus a button, not two fields, so it never uses ROW:
              stacked it would inherit that recipe's gap:0 and weld the two
              controls together. It also never needs to stack — the input
              shrinks and the button is only ~124px wide, which still leaves
              a usable field at 320px. */}
          <div className="flex items-stretch gap-2.5">
            <Input
              id={`${ids}-pc`}
              className="min-w-0 flex-auto"
              value={postcode}
              /* Uppercased on every keystroke rather than on blur, so it never
                 briefly shows lowercase. The length is unchanged, so the caret
                 stays where it was mid-edit. */
              onChange={(e) => editPostcode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  search();
                }
              }}
              placeholder="KT227HH"
              autoCapitalize="characters"
              autoComplete="postal-code"
              spellCheck="false"
              aria-invalid={error ? "true" : undefined}
              aria-describedby={error ? `${ids}-pc-err` : undefined}
            />
            {/* The label stays put and the spinner joins it, rather than
                replacing it — this button is flex-none, so a swap would
                resize it mid-search. */}
            <Button
              surface="booking" variant="ink"
              className="flex-none gap-2"
              isLoading={searching}
              onClick={search}
            >
              {searching && <Loader className="h-4 w-4" />}
              Find address
            </Button>
          </div>
        </Field>
      )}

      {/* The offer itself is a modal — a card the size of the form pushed the
          page down and read as a wall. What stays here is the answer to the
          search plus the way back into it, so dismissing the modal is not a
          dead end and nobody has to search again to reach the offer. */}
      {outOfArea && !waitlisted && (
        <p className={SEC_P}>
          We are not in {searchedPostcode} yet.{" "}
          <Button variant="bare" className={BTN_LINK} onClick={() => setWaitlistOpen(true)}>
            Tell me when you arrive
          </Button>
        </p>
      )}

      {/* Not while the modal is up: it is showing this same sentence, and the
          backdrop is only half opaque. */}
      {waitlisted && !waitlistOpen && (
        <Notice icon={P.tick} title="You are on the list">
          We will email {waitEmail} as soon as we collect from {searchedPostcode}.
        </Notice>
      )}

      {/* Not reachable before: the lookup was synchronous and could not fail.
          Deliberately says nothing about coverage — we do not know. */}
      {results === "failed" && (
        <div className={CARD}>
          <p className={SEC_H}>We could not check that postcode</p>
          <p className={SEC_P}>
            Something went wrong at our end, not yours. Try again, or type your address in
            yourself.
          </p>
          <Button surface="booking" variant="ghost" block onClick={search}>
            Try again
          </Button>
        </div>
      )}

      {list && list.length > 0 && (
        <>
          <p className={LABEL} id={`${ids}-res`}>
            {list.length} {list.length === 1 ? "address" : "addresses"} found
          </p>
          <ul
            className="overflow-hidden rounded-card-md border border-bk-line bg-white"
            aria-labelledby={`${ids}-res`}
          >
            {/* Keyed by position: the server sends no id, and the whole list is
                replaced on every search, so position is stable for as long as
                a given list is on screen. */}
            {list.map((a, i) => (
              <li key={`${i}-${a.line1}`} className="[&:not(:first-child)]:border-t [&:not(:first-child)]:border-t-bk-line">
                <Button variant="bare"
                  className={cn(INHERIT_FONT, "flex w-full cursor-pointer items-center justify-between gap-3.5 border-none bg-transparent px-4 py-[13px] text-left transition-colors duration-[140ms] ease-[ease] hover:bg-bk-paper-2")}
                  onClick={() => choose(a)}
                >
                  <AddressLines a={a} postcode={searched} />
                  <Icon icon={P.chevron} size={17} className="flex-none text-bk-ink-3" />
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Covered, but the lookup has nothing on file. A real case the mock
          could not produce, and the one where typing it yourself is the only
          way through. */}
      {list && list.length === 0 && (
        <div className={CARD}>
          <p className={SEC_H}>No addresses listed for {searched}</p>
          <p className={SEC_P}>
            We do collect from there — our lookup just has nothing on file for that postcode.
            Type your address in and we will take it from here.
          </p>
        </div>
      )}

      {/* Outside the list block, so it is reachable from the empty result too.
          Inside it, the one state where somebody most needs to type an address
          by hand was the one state that never offered it. */}
      {list && (
        <p className="mt-3 text-[13px] text-bk-ink-3">
          {list.length > 0 && "Not listed? "}
          <Button variant="bare" className={BTN_LINK} onClick={enterManually}>
            Enter it manually
          </Button>
        </p>
      )}

      {confirmed && (
        <>
          {/* Postcode reads back as a locked row with its own way out, the
              same as the app. It anchored the lookup, so changing it is a
              deliberate act rather than another editable box. */}
          <div className="mb-[22px] flex items-center justify-between gap-3.5 rounded-card-lg border border-bk-line bg-white px-[18px] py-[14px] to-720:mb-3.5 to-720:px-3.5 to-720:py-2.5">
            <span className="min-w-0">
              <b className="block text-[12px] font-bold uppercase tracking-[1px] text-bk-ink-3">
                Postcode
              </b>
              <b className="mt-0.5 block text-[18px] font-bold tracking-[-.2px] to-720:text-[16px]">
                {data.postcode}
              </b>
            </span>
            <Button variant="bare"
              className="inline-flex min-h-11 flex-none cursor-pointer items-center gap-1 border-none bg-transparent px-1 py-0 text-[15px] font-bold leading-[1.6] text-bk-ink hover:underline hover:underline-offset-[3px]"
              onClick={changePostcode}
            >
              Change
              <Icon icon={P.chevron} size={15} />
            </Button>
          </div>

          {/* The three address lines each get a full row — they hold street
              names that do not survive being cut in half. Town and county are
              short enough to share one. */}
          {groups.map((group, gi) => {
            const inputs = group.map(([key, label, required, autoComplete, placeholder]) => (
              <Field
                key={key}
                className={group.length > 1 ? ROW_CELL : ""}
                label={
                  <>
                    {label}
                    {required && (
                      <>
                        {" "}
                        <span className="font-bold text-danger" aria-hidden="true">
                          *
                        </span>
                        <span className="visually-hidden"> (required)</span>
                      </>
                    )}
                  </>
                }
                id={`${ids}-${key}`}
                error={errors[key]}
              >
                <Input
                  id={`${ids}-${key}`}
                  value={data[key]}
                  onChange={(e) => {
                    patch({ [key]: e.target.value });
                    /* The server's complaint was about the old value. Clear it
                       on the first keystroke rather than leaving it under a
                       field they have already started fixing. */
                    if (saveErrors[key]) setSaveErrors((s) => ({ ...s, [key]: "" }));
                    if (saveError) setSaveError("");
                  }}
                  onBlur={() => setTouched((t) => ({ ...t, [key]: true }))}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  required={required}
                  aria-invalid={errors[key] ? "true" : undefined}
                  aria-describedby={errors[key] ? `${ids}-${key}-err` : undefined}
                />
              </Field>
            ));
            return group.length > 1 ? (
              <div className={ROW} key={`g${gi}`}>
                {inputs}
              </div>
            ) : (
              inputs
            );
          })}
        </>
      )}

      {saveError && (
        <p className={cn(ERR, "mt-3")} role="alert">
          <Icon icon={P.alert} size={15} />
          {saveError}
        </p>
      )}

      <ActionBar more={moreBelow}>
        <Button
          surface="booking" size="lg" block
          className="gap-2"
          disabled={!ready}
          isLoading={saving}
          onClick={continueToTime}
        >
          {saving && <Loader className="h-4 w-4" />}
          Continue to times
        </Button>
      </ActionBar>

      {/* Last, the way the shell mounts its own overlays. Position in the tree
          does not matter — Modal is fixed inset-0 at z-200 and nothing here
          uses a portal — but keeping it out of the flow keeps the flow
          readable. */}
      {waitlistOpen && (
        <WaitlistModal
          postcode={searchedPostcode}
          onClose={() => setWaitlistOpen(false)}
          onJoined={(email) => {
            setWaitEmail(email);
            setWaitlisted(true);
          }}
        />
      )}
    </>
  );
}
