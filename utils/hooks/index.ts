"use client";

/**
 * Shared client hooks ported from the design prototype.
 * The comments record why each is shaped the way it is — read them before
 * simplifying.
 */

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type RefObject,
} from "react";
import { DELETE_SPEED, HOLD_EMPTY, HOLD_FULL, TYPE_SPEED } from "@/utils/content";

/**
 * Enter the booking flow, optionally with a slot preselected.
 *
 * The landing page passes a slot key when someone taps a specific window
 * rather than the generic button. It is carried as a query string so the
 * URL stays shareable — /book/time reads it back.
 *
 * Guarded against being wired straight to onClick, which would otherwise
 * pass a click event in as the slot.
 */
export function useStartBooking(): (slot?: string) => void {
  const router = useRouter();
  return useCallback(
    (slot?: string) => {
      const preset = typeof slot === "string" ? slot : undefined;
      router.push(`/book/address${preset ? `?slot=${encodeURIComponent(preset)}` : ""}`);
    },
    [router],
  );
}

/**
 * Subscribe to a media query.
 *
 * useSyncExternalStore rather than useState+useEffect: the effect version has
 * to call setState synchronously in the effect body to pick up the initial
 * match, which costs a second render pass on every mount and is what
 * react-hooks/set-state-in-effect is warning about. The server snapshot is
 * `false`, which keeps the first client render identical to the markup and so
 * cannot cause a hydration mismatch — the same behaviour the old initial
 * state gave, without the extra pass.
 */
function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** Types each word out, holds, backspaces it, then moves on. Loops. */
export function useTypewriter(words: string[]): string {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState(words[0]);
  const [deleting, setDeleting] = useState(false);
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    if (reduce) return undefined;
    const word = words[index];
    const atFull = !deleting && text === word;
    const atEmpty = deleting && text === "";

    const delay = atFull ? HOLD_FULL : atEmpty ? HOLD_EMPTY : deleting ? DELETE_SPEED : TYPE_SPEED;

    const id = setTimeout(() => {
      if (atFull) {
        setDeleting(true);
      } else if (atEmpty) {
        setDeleting(false);
        setIndex((i) => (i + 1) % words.length);
      } else {
        setText(word.slice(0, text.length + (deleting ? -1 : 1)));
      }
    }, delay);

    return () => clearTimeout(id);
  }, [text, deleting, index, reduce, words]);

  return reduce ? words[0] : text;
}

export interface ScrollEdges {
  left: boolean;
  right: boolean;
}

/**
 * Tracks whether a horizontal scroller has more content either side, so an
 * edge only fades when there is actually something beyond it. Returns
 * {left:false,right:false} when the content fits, which makes the fades
 * disappear by themselves on wider screens.
 */
export function useScrollEdges(ref: RefObject<HTMLElement | null>): ScrollEdges {
  const [edges, setEdges] = useState<ScrollEdges>({ left: false, right: false });

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ left: el.scrollLeft > 2, right: el.scrollLeft < max - 2 });
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => {
      el.removeEventListener("scroll", measure);
      ro?.disconnect();
    };
  }, [ref, measure]);

  return edges;
}

/**
 * Inline style for the mask-edge-fade utility. The widths have to be custom
 * properties rather than a class toggle: the mask interpolates between them,
 * so the fade grows and shrinks instead of snapping on.
 */
export function fadeVars(edges: ScrollEdges, size = "34px"): React.CSSProperties {
  return {
    "--fade-l": edges.left ? size : "0px",
    "--fade-r": edges.right ? size : "0px",
  } as React.CSSProperties;
}

/** True at >=1024px, where the checkout switches to the split layout and
 *  drops its Review step for a pinned summary panel. */
export function useWide(): boolean {
  return useMediaQuery("(min-width: 1024px)");
}

/**
 * Body-scroll lock that restores whatever was there before, rather than
 * assuming "". Two overlapping locks (drawer over modal) would otherwise
 * leave the page unscrollable after the inner one closes.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

/** Escape-to-close, attached only while the surface is open. */
export function useEscapeKey(active: boolean, onEscape: () => void): void {
  /* The latest callback is kept in a ref so the listener does not have to be
     torn down and re-attached whenever the caller passes a new closure. Written
     in an effect, not during render — a ref mutated while rendering is not
     safe under concurrent rendering. */
  const handler = useRef(onEscape);
  useEffect(() => {
    handler.current = onEscape;
  });
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handler.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);
}
