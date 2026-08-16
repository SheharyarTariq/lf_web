"use client";

import Button from "@/components/common/Button";
import { useId, useState } from "react";
import ActionBar from "@/components/booking/common/ActionBar";
import Field from "@/components/booking/common/Field";
import Notice from "@/components/booking/common/Notice";
import { Icon, P } from "@/components/booking/icons";
import { useBooking } from "@/utils/booking/context";
import { lookupAddresses } from "@/utils/booking/mocks";
import {
  ADDRESS_FIELDS,
  POSTCODE_RE,
  SERVED,
  districtOf,
  normalisePostcode,
  type AddressKey,
  type AddressResult,
} from "@/utils/booking/model";
import {
  BTN_LINK,
  CARD,
  INHERIT_FONT,
  H1,
  INPUT,
  LABEL,
  LEDE,
  ROW,
  ROW_CELL,
  SEC_H,
  SEC_P,
  } from "@/utils/booking/styles";

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
  const ids = useId();

  const [postcode, setPostcode] = useState(data.postcode || "");
  /* The postcode the visible results belong to. Reading the live input
     instead meant the list re-labelled itself with half-typed postcodes as
     soon as someone started editing. */
  const [searched, setSearched] = useState(data.postcode || "");
  const [results, setResults] = useState<AddressResult[] | "out" | null>(null);
  const [error, setError] = useState("");
  const [waitlisted, setWaitlisted] = useState(false);
  const [waitEmail, setWaitEmail] = useState("");
  const [touched, setTouched] = useState<Partial<Record<AddressKey, boolean>>>({});

  const district = districtOf(searched || postcode);
  const outOfArea = results === "out";
  /* Confirmed means the postcode passed the area check and the person has
     moved on to the address itself — either by picking a result or by
     choosing to type it. */
  const [confirmed, setConfirmed] = useState(Boolean(data.postcode && data.line1));

  const search = () => {
    const pc = normalisePostcode(postcode);
    setPostcode(pc);
    if (!POSTCODE_RE.test(pc)) {
      setError("Enter a valid UK postcode, for example KT227HH.");
      setResults(null);
      return;
    }
    setError("");
    setSearched(pc);
    if (!SERVED[districtOf(pc)]) {
      setResults("out");
      return;
    }
    patch({ postcode: pc });
    setResults(lookupAddresses(pc));
  };

  /* Results belong to the postcode that produced them, so the moment the
     field is edited they are stale — clear them rather than leave a list
     that no longer matches what is in the box. */
  const editPostcode = (v: string) => {
    setPostcode(v.toUpperCase());
    if (results !== null) setResults(null);
    if (error) setError("");
    setWaitlisted(false);
  };

  const choose = (a: AddressResult) => {
    patch({
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
    patch({ postcode: searched, town: SERVED[district] || "", county: "Surrey" });
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
    patch({ line1: "", line2: "", line3: "", town: "", county: "" });
  };

  const errors: Partial<Record<AddressKey, string>> = {
    line1: touched.line1 && !data.line1.trim() ? "We need at least the first line." : "",
    town: touched.town && !data.town.trim() ? "We need the town." : "",
  };
  const ready = Boolean(data.postcode && data.line1.trim() && data.town.trim());

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
            <input
              id={`${ids}-pc`}
              className={`${INPUT} min-w-0 flex-auto`}
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
            <Button surface="booking" variant="ink" className="flex-none" onClick={search}>
              Find address
            </Button>
          </div>
        </Field>
      )}

      {/* Out of area is a lead, not a rejection — the only wrong move here is
          a dead end that loses the address entirely. */}
      {outOfArea && !waitlisted && (
        <div className={CARD}>
          <p className={SEC_H}>We are not in {district} yet</p>
          <p className={SEC_P}>
            We are expanding across Surrey. Leave your email and we will tell you the day we reach
            you — no other mail, ever.
          </p>
          <Field label="Email address" id={`${ids}-wl`}>
            <input
              id={`${ids}-wl`}
              className={INPUT}
              type="email"
              value={waitEmail}
              onChange={(e) => setWaitEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
          <Button
            surface="booking" block
            disabled={!waitEmail.includes("@")}
            onClick={() => setWaitlisted(true)}
          >
            Tell me when you arrive
          </Button>
        </div>
      )}

      {waitlisted && (
        <Notice icon={P.tick} title="You are on the list">
          We will email {waitEmail} as soon as we collect from {district}.
        </Notice>
      )}

      {Array.isArray(results) && (
        <>
          <p className={LABEL} id={`${ids}-res`}>
            {results.length} addresses found
          </p>
          <ul
            className="overflow-hidden rounded-card-md border border-bk-line bg-white"
            aria-labelledby={`${ids}-res`}
          >
            {results.map((a) => (
              <li key={a.id} className="[&:not(:first-child)]:border-t [&:not(:first-child)]:border-t-bk-line">
                <Button variant="bare"
                  className={`${INHERIT_FONT} flex w-full cursor-pointer items-center justify-between gap-3.5 border-none bg-transparent px-4 py-[13px] text-left transition-colors duration-[140ms] ease-[ease] hover:bg-bk-paper-2`}
                  onClick={() => choose(a)}
                >
                  <AddressLines a={a} postcode={searched} />
                  <Icon d={P.chevron} size={17} className="flex-none text-bk-ink-3" />
                </Button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-bk-ink-3">
            Not listed?{" "}
            <Button variant="bare" className={BTN_LINK} onClick={enterManually}>
              Enter it manually
            </Button>
          </p>
        </>
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
              <Icon d={P.chevron} size={15} />
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
                <input
                  id={`${ids}-${key}`}
                  className={INPUT}
                  value={data[key]}
                  onChange={(e) => patch({ [key]: e.target.value })}
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

      <ActionBar more={moreBelow}>
        <Button
          surface="booking" size="lg" block
          disabled={!ready}
          onClick={() => {
            setTouched({ line1: true, town: true });
            if (ready) go("time");
          }}
        >
          Continue to times
        </Button>
      </ActionBar>
    </>
  );
}
