import type { Metadata } from "next";
import { headers } from "next/headers";
import VerifyEmail from "@/components/verify-email";
import { storeUrlForUserAgent } from "@/utils/device";

/* Was a DeepLinkFallback stub. It is a real page now — the reasoning, and what
   still happens on a phone with the app installed, is in the component.

   noindex stays: every URL that reaches this page for real carries a live
   credential in the query string, and there is nothing here to index. The root
   layout sets index:true, and a page-level override is the only way to undo
   that — the route is not in sitemap.ts and robots.ts allows / broadly. */
export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  /* `code` as an alias, in case a mail client or the app ever rewrites the
     parameter. Repeated keys arrive as an array; take the first rather than
     stringifying the lot into something that could never verify. */
  const raw = params.token ?? params.code;
  const token = (Array.isArray(raw) ? raw[0] : (raw ?? "")).trim();

  /* Reading headers() keeps this dynamic, which is what we want — a per-user
     credential must not be cached — and the UA only decides whether to offer
     the "Open in the app" line. Same helper both other callers use, so the
     three cannot disagree about what counts as a phone. */
  const ua = (await headers()).get("user-agent") ?? "";

  return <VerifyEmail token={token} canOpenApp={storeUrlForUserAgent(ua) !== null} />;
}
