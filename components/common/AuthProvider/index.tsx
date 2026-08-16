"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AuthModal, { type View as AuthView } from "@/components/auth/auth-modal";
import LogoutConfirm from "@/components/auth/logout-confirm";
import { loadSession, logout as clearSession } from "@/utils/auth";

/**
 * What the modal hands back. Deliberately wider than the JWT's payload: a
 * social sign-in has a name and no token, and a fresh sign-up has an account
 * that exists but an inbox nobody has proved they can read (`verified`).
 * The checkout reads all of these.
 */
export interface AuthedUser {
  /** Needed by the /users/{userId}/* endpoints — change-email and
   *  update-address both take it in the path. login() carries it through and
   *  it used to be dropped here. */
  id?: string | number;
  email: string;
  /** From the sign-up form and from /login-check's JWT. */
  fullName?: string;
  /** From a social provider, which gives one field rather than two. */
  name?: string;
  mobile?: string;
  /** "" for email/password, otherwise "apple" | "google". */
  identity?: string;
  verified?: boolean;
  signedIn?: boolean;
}

/**
 * Holds the auth modal's state for the whole site.
 *
 * In the prototype this lived in App.jsx, above both the landing page and
 * the checkout, so the header, the mobile drawer and the checkout's contact
 * step all drove one dialog. Mounted in the root layout here for the same
 * reason: two modals that can both be open is a bug waiting to be found.
 */

/* Re-exported rather than restated. This was its own two-member union and had
   already drifted — the modal grew `forgot` and `sent` and this never heard
   about it, so openAuth could not reach half the panes that existed. */
export type { AuthView };

interface AuthContextValue {
  user: AuthedUser | null;
  /** True until the stored token has been checked. Consumers that render a
   *  signed-out state need it, or every visit flashes "Log in" before the
   *  session comes back — worse for a returning customer than a brief gap. */
  loading: boolean;
  openAuth: (view?: AuthView) => void;
  closeAuth: () => void;
  /** Raises the confirmation dialog. It does **not** sign anyone out by
   *  itself — nothing does, outside this provider. */
  signOut: () => void;
  /** Re-read /my-status. For anything that changes the session from outside
   *  this provider — the verify-email page promotes a token itself, and the
   *  header would otherwise keep saying signed-out until a full reload. */
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  /* null when shut, otherwise the pane to open on. */
  const [view, setView] = useState<AuthView | null>(null);
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  /* The token outlives the page, so the session has to be rebuilt from it on
     every load — without this, a refresh looks exactly like a sign-out even
     though the credential is still sitting in the cookie.

     Server-rendered markup is always the signed-out header, because the
     cookie is not readable until this runs. That is deliberate: rendering a
     signed-in header on the server would need the token sent with the
     document request, and the `loading` flag above covers the gap. */
  const refreshSession = useCallback(async () => {
    const who = await loadSession();
    setUser(
      who
        ? {
            id: who.id,
            email: who.email,
            fullName: who.name,
            mobile: who.phone,
            identity: "",
            /* Always true by the time it gets here: loadSession only answers
               for a session cookie, and one of those only exists for a proved
               address. Kept as the server's own answer rather than a hardcoded
               true, so it stays right if that ever changes. */
            verified: Boolean(who.emailVerifiedAt),
            signedIn: true,
          }
        : null,
    );
  }, []);

  useEffect(() => {
    let live = true;
    loadSession()
      .then((who) => {
        if (!live || !who) return;
        setUser({
          id: who.id,
          email: who.email,
          fullName: who.name,
          mobile: who.phone,
          identity: "",
          verified: Boolean(who.emailVerifiedAt),
          signedIn: true,
        });
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    /* Guards against a state update after unmount, and against a slow
       response landing on top of a newer one. */
    return () => {
      live = false;
    };
  }, []);

  const openAuth = useCallback((next: AuthView = "login") => setView(next), []);
  const closeAuth = useCallback(() => setView(null), []);

  /* `signOut` asks first — that is what the name means on this context now.
     The immediate version is private on purpose: if the public function were
     the one that signs you out, the next call site added would skip the
     dialog just by reaching for the obvious name. */
  const signOut = useCallback(() => setConfirmingSignOut(true), []);

  const performSignOut = useCallback(() => {
    clearSession();
    setUser(null);
    setConfirmingSignOut(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, openAuth, closeAuth, signOut, refreshSession }),
    [user, loading, openAuth, closeAuth, signOut, refreshSession],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {view && (
        <AuthModal
          view={view}
          onClose={closeAuth}
          onAuthed={(who) => {
            setUser(who);
            setView(null);
          }}
        />
      )}
      {confirmingSignOut && (
        <LogoutConfirm
          onCancel={() => setConfirmingSignOut(false)}
          onConfirm={performSignOut}
        />
      )}
    </AuthContext.Provider>
  );
}
