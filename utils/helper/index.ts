/* ══════════════════════════════════════════════════════════════════
   Cookies
   ══════════════════════════════════════════════════════════════════

   The auth token lives in a cookie because that is what `apiCall` reads
   (utils/api-call reads `authtoken` and attaches it as a Bearer token).
   Anything stored anywhere else leaves every authenticated request —
   /my-status, /find-addresses, /slots, /orders — going out unauthenticated.

   These cannot set httpOnly: only a Set-Cookie header from the server can do
   that. So the token stays reachable from script, exactly as it was in
   sessionStorage before. The real fix is for the backend to set the cookie
   itself; it is on the list in docs/STATUS.md.
   ══════════════════════════════════════════════════════════════════ */

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  /* The leading "; " makes the first cookie match the same way as the rest,
     so no special case for position 0. */
  const parts = `; ${document.cookie}`.split(`; ${name}=`);
  if (parts.length !== 2) return null;
  const raw = parts.pop()?.split(";").shift();
  if (raw === undefined) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    /* A value that was not encoded by setCookie. Better to hand back what is
       actually there than to throw. */
    return raw;
  }
}

export function setCookie(
  name: string,
  value: string,
  options: { maxAge?: number; path?: string; sameSite?: "Lax" | "Strict" | "None" } = {},
): void {
  if (typeof document === "undefined") return;
  const { maxAge, path = "/", sameSite = "Lax" } = options;

  const bits = [`${name}=${encodeURIComponent(value)}`, `path=${path}`, `SameSite=${sameSite}`];
  /* Omitted rather than zero when there is no expiry: a cookie with no
     Max-Age is a session cookie, which is the right fallback for a token
     whose lifetime we could not read. Max-Age=0 would delete it instead. */
  if (typeof maxAge === "number" && maxAge > 0) bits.push(`Max-Age=${Math.floor(maxAge)}`);
  /* Conditional so localhost over http still works. On https it is always on. */
  if (location.protocol === "https:") bits.push("Secure");

  document.cookie = bits.join("; ");
}

export function deleteCookie(name: string, path = "/"): void {
  if (typeof document === "undefined") return;
  /* Path has to match the one it was written with, or the browser treats it
     as a different cookie and the original survives. */
  document.cookie = `${name}=; path=${path}; Max-Age=0`;
}
