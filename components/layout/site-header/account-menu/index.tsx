"use client";

/* ══════════════════════════════════════════════════════════════════
   The signed-in control
   ══════════════════════════════════════════════════════════════════

   One button where there used to be two things: the address printed in the
   bar and a bare "Log out" beside it. Both were wrong in the same way — the
   header had to spend horizontal space on an account, and the header has none
   to spend. It is why the address was hidden below 1024px, which left "Log
   out" sitting there with no indication of whose account it would end.

   So: identity is the control, and the destructive action lives one deliberate
   click inside it. The full address moves into the panel, where nothing has to
   be truncated to fit.

   Not a modal, and not built like one. Tab must be able to leave a menu, so
   there is no focus trap here and no scroll lock — the page stays live behind
   it, which is what tells you this is a menu and not a dialog.
   ══════════════════════════════════════════════════════════════════ */

import { cn } from "@/utils/cn";
import Button from "@/components/common/Button";
import { ChevronDown, LogOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AuthedUser } from "@/components/common/AuthProvider";
import { displayName, initials } from "@/utils/auth";
import { useEscapeKey } from "@/utils/hooks";

const TRIGGER_ID = "lf-account-trigger";
const MENU_ID = "lf-account-menu";

/* The name in the bar. Truncated rather than wrapped, and with the same widths
   the address had: the header is a tight 1fr/auto/1fr grid below 900px and a
   label of any length would otherwise push "Get the app" into the wordmark.
   The untruncated value is in the panel, so nothing is actually hidden.

   Below 1024 the trigger is the avatar alone. That is not a loss — the address
   was `hidden` there too — and a 32px circle is a better account control at
   that width than a word that has to be cut in half. */
const TRIGGER_NAME =
  "hidden max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap from-1024:inline to-1180:max-w-[130px]";

const MENU_ITEM =
  "flex w-full min-h-11 cursor-pointer items-center gap-2.5 rounded-ctl-md border-none " +
  "bg-transparent px-2.5 py-2 text-left text-[15px] font-semibold text-ink " +
  "transition-colors duration-150 hover:bg-paper-2";

export default function AccountMenu({
  user,
  onSignOut,
}: {
  user: AuthedUser;
  /** The provider's `signOut`, which raises the confirmation dialog rather
   *  than signing anyone out. Passed in rather than read from useAuth() here,
   *  so the session has one owner and this stays a presentational component. */
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const label = displayName(user);
  /* Only worth a second line when it is not already the first one. */
  const showEmail = label !== user.email;

  const close = useCallback(() => setOpen(false), []);

  /* Escape returns focus as well as closing. Without it a keyboard user is
     dropped at the top of the document, which is the same trap the drawer
     avoids at site-header's focus effect. */
  const closeAndReturn = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEscapeKey(open, closeAndReturn);

  /* Four ways out, because a menu that only closes on its own button is a menu
     people leave open. Escape is above; the other three are here.

     pointerdown rather than click: a click fires after the mouse comes back up,
     so a press that starts outside and drags in would leave it open, and a
     scrollbar drag counts as outside. No focus return on these two — the point
     of clicking elsewhere is to be elsewhere. */
  useEffect(() => {
    if (!open) return undefined;
    /* Read once and closed over, so the listener comes off the same node it
       went on even if the ref has moved on by cleanup. */
    const wrap = wrapRef.current;

    const onPointerDown = (e: PointerEvent) => {
      if (!wrap?.contains(e.target as Node)) setOpen(false);
    };
    /* How Tab out closes it. focusout, not blur — blur does not bubble, so it
       would never hear about the item inside losing focus. relatedTarget is
       null when focus leaves the document entirely (alt-tab), which should not
       close anything: coming back to a menu you did not dismiss is right. */
    const onFocusOut = (e: FocusEvent) => {
      const next = e.relatedTarget as Node | null;
      if (next && !wrap?.contains(next)) setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    wrap?.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      wrap?.removeEventListener("focusout", onFocusOut);
    };
  }, [open]);

  /* Focus the first item on open, so the keyboard path and the pointer path
     land in the same place. Runs on every open rather than once. */
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
  }, [open]);

  /* Arrow keys cycle whatever items exist rather than a hardcoded list, so the
     day a second one is added this needs no edit. Home/End included because a
     menu with one item today may not have one tomorrow. */
  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    if (!items.length) return;
    const at = items.indexOf(document.activeElement as HTMLElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(at + 1) % items.length].focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(at - 1 + items.length) % items.length].focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0].focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1].focus();
    }
  };

  /* Down and Up both open from the trigger — the pattern every native menu
     follows, and the one a screen reader user will try first. Enter and Space
     are the button's own doing and need no help. */
  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div className="relative" ref={wrapRef}>
      <Button
        variant="bare"
        ref={triggerRef}
        id={TRIGGER_ID}
        className={cn(
          "inline-flex min-h-11 cursor-pointer items-center gap-2 whitespace-nowrap rounded-ctl-lg",
          "border-none bg-transparent px-1.5 py-0 text-[15px] font-semibold text-ink",
          "transition-colors duration-150 hover:bg-paper-2",
          open && "bg-paper-2",
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        /* Only while the panel exists — pointing at an id that is not in the
           document is worse than saying nothing. */
        aria-controls={open ? MENU_ID : undefined}
        onClick={() => setOpen((was) => !was)}
        onKeyDown={onTriggerKeyDown}
      >
        {/* aria-hidden: the initials are a picture of the name, and the name
            itself is right beside them — or in the label below when it is
            not. Read out, they are two letters of noise. */}
        <span
          className="grid h-8 w-8 flex-none place-items-center rounded-pill bg-brand text-[13px] font-bold tracking-[.2px] text-ink"
          aria-hidden="true"
        >
          {initials(user)}
        </span>
        <span className={TRIGGER_NAME}>{label}</span>
        {/* The only thing marking this as a menu rather than a link, so it
            stays at every width — including the one where the name does not. */}
        <ChevronDown
          size={16}
          className={cn("flex-none transition-transform duration-150", open && "rotate-180")}
          aria-hidden="true"
        />
        {/* Below 1024 the trigger is a circle of initials and nothing else.
            Something has to say what it is. */}
        <span className="visually-hidden">Account menu</span>
      </Button>

      {open && (
        <div
          id={MENU_ID}
          ref={panelRef}
          role="menu"
          aria-labelledby={TRIGGER_ID}
          onKeyDown={onMenuKeyDown}
          /* z-10 within the header's own stacking context is all it needs: the
             header is z-[60], so this already clears the page and still sits
             under the mobile drawer at z-[201]. */
          className="animate-fade-in absolute right-0 top-full z-10 mt-2 min-w-[240px] max-w-[calc(100vw-32px)] rounded-card-md border border-line bg-white p-1.5 shadow-lift"
        >
          {/* Not a menuitem — there is nothing to do with it. It is here
              because it is the one place the address fits whole. */}
          <div className="px-2.5 pb-2.5 pt-1.5" role="none">
            <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-semibold text-ink">
              {label}
            </p>
            {showEmail && (
              <p
                className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] text-ink-2"
                title={user.email}
              >
                {user.email}
              </p>
            )}
          </div>

          <div className="border-t border-line" role="none" />

          <div className="pt-1.5">
            <Button
              variant="bare"
              role="menuitem"
              className={MENU_ITEM}
              onClick={() => {
                /* Close first, then ask. The other way round leaves the
                   confirmation dialog stacked over an open menu — the same
                   ordering the mobile drawer uses for its Log out row. */
                close();
                onSignOut();
              }}
            >
              <LogOut size={17} aria-hidden="true" />
              Log out
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
