import { cookies } from "next/headers";
import { unauthorized } from "next/navigation";
import { config } from "@/config";

type ApiRequestOptions = {
  endpoint: string;
  isProtected?: boolean;
} & RequestInit;

export async function apiRequest(options: ApiRequestOptions) {
  const { endpoint, isProtected = false, headers: callerHeaders, cache, next, ...restOptions } =
    options;

  /* A Headers instance rather than an object literal, so a caller's headers
     survive whichever of the three HeadersInit shapes they pass. They used to
     be dropped: `headers` was built here and then overwrote the spread. */
  const headers = new Headers(callerHeaders);

  if (isProtected) {
    const token = (await cookies()).get("accessToken")?.value;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  /* `cache: "no-store"` is still the default, because most of what this
     helper will fetch is somebody's own order. But it can no longer be
     forced on a caller that asked for caching: per Next's fetch reference,
     "conflicting options such as { revalidate: 3600, cache: 'no-store' } are
     not allowed, both will be ignored" — so hardcoding it silently discarded
     the revalidate and turned a static page dynamic, with no error to say so.
     Only applied when the caller named neither. */
  const caching: RequestInit =
    cache === undefined && next === undefined
      ? { cache: "no-store" }
      : { ...(cache !== undefined && { cache }), ...(next !== undefined && { next }) };

  const res = await fetch(`${config.apiUrl}${endpoint}`, {
    ...restOptions,
    headers,
    ...caching,
  });

  if (res.status === 401) {
    unauthorized();
  }

  return await res.json();
}
