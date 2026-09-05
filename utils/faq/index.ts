/**
 * The FAQ shape, and the two pieces of logic both accordions need.
 *
 * Deliberately isomorphic — no "use client", no next/headers, nothing that
 * only runs on one side. The homepage gets its questions server-rendered
 * (utils/faq/api.ts) and the checkout modal receives the same array as a
 * prop, so both import the helpers below and neither can reach for the
 * other's half.
 */

export interface FaqItem {
  question: string;
  answer: string;
}

/* First five show by default; the rest sit behind "Show more questions". */
export const FAQ_PREVIEW_COUNT = 5;

/**
 * The trust boundary for `/system-status`'s `faqs`.
 *
 * The copy is no longer ours, so it is validated rather than believed: the
 * field could be absent (production does not serve it yet), it could be a
 * string, or one row could be half-written. Anything that is not a pair of
 * non-empty strings is dropped, and anything that is not an array at all
 * comes back as `[]` for the caller to fall back on. Nothing throws — this
 * runs inside a render, where an exception is a 500 rather than a bad FAQ.
 *
 * `\r\n` is normalised so `faqParagraphs` has one thing to split on.
 */
export function parseFaqs(input: unknown): FaqItem[] {
  if (!Array.isArray(input)) return [];

  const items: FaqItem[] = [];
  for (const row of input) {
    if (!row || typeof row !== "object") continue;
    const { question, answer } = row as { question?: unknown; answer?: unknown };
    if (typeof question !== "string" || typeof answer !== "string") continue;

    const q = question.trim();
    const a = answer.replace(/\r\n/g, "\n").trim();
    if (!q || !a) continue;

    items.push({ question: q, answer: a });
  }
  return items;
}

/**
 * One entry per paragraph.
 *
 * The backend writes multi-paragraph answers with a blank line between them —
 * four of the nine arrive that way. Rendered as a single text node those
 * newlines collapse and two paragraphs read as one run-on sentence, so both
 * accordions split here and emit a <p> each. A single-paragraph answer comes
 * back as a one-entry array, which needs no special case at the call site.
 */
export function faqParagraphs(answer: string): string[] {
  return answer
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}
