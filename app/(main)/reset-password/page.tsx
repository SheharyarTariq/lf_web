import type { Metadata } from "next";
import { headers } from "next/headers";
import ResetPassword from "@/components/reset-password";
import { storeUrlForUserAgent } from "@/utils/device";

/* Was a DeepLinkFallback stub that pushed desktop visitors to the app store.
   A real page now, for the same reason verify-email became one: somebody who
   asked for a reset in a browser should be able to finish it in that browser.

   noindex, because a real URL for this page carries a live reset code. The
   root layout sets index:true and a page-level override is the only way to
   undo it — the route is in neither sitemap.ts nor a robots.ts disallow. */
export const metadata: Metadata = {
  title: "Set a new password",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  /* Repeated keys arrive as an array; take the first rather than stringifying
     the lot into something that could never match. `code` is accepted as an
     alias for `token` in case a mail client or the app rewrites it. */
  const first = (v: string | string[] | undefined) =>
    (Array.isArray(v) ? v[0] : (v ?? "")).trim();

  /* searchParams, not useSearchParams: a client page calling that fails
     `next build` with "Missing Suspense boundary" while working fine in dev.
     Reading it here also keeps the route dynamic, which is what we want for a
     URL carrying a credential. */
  const ua = (await headers()).get("user-agent") ?? "";

  return (
    <ResetPassword
      email={first(params.email)}
      token={first(params.token ?? params.code)}
      canOpenApp={storeUrlForUserAgent(ua) !== null}
    />
  );
}
