"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import AuthModal from "@/components/auth/auth-modal";
import { loadSession, logout as clearSession } from "@/utils/auth";

/**
 * What the modal hands back. Deliberately wider than the JWT's payload: a
 * social sign-in has a name and no token, and a fresh sign-up has an account
 * that exists but an inbox nobody has proved they can read (`verified`).
 * The checkout reads all of these.
 */
export interface AuthedUser {
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

export type AuthView = "login" | "signup";

interface AuthContextValue {
  user: AuthedUser | null;
  /** True until the stored token has been checked. Consumers that render a
   *  signed-out state need it, or every visit flashes "Log in" before the
   *  session comes back — worse for a returning customer than a brief gap. */
  loading: boolean;
  openAuth: (view?: AuthView) => void;
  closeAuth: () => void;
  signOut: () => void;
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

  /* The token outlives the page, so the session has to be rebuilt from it on
     every load — without this, a refresh looks exactly like a sign-out even
     though the credential is still sitting in the cookie.

     Server-rendered markup is always the signed-out header, because the
     cookie is not readable until this runs. That is deliberate: rendering a
     signed-in header on the server would need the token sent with the
     document request, and the `loading` flag above covers the gap. */
  useEffect(() => {
    let live = true;
    loadSession()
      .then((who) => {
        if (!live || !who) return;
        setUser({
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
  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, openAuth, closeAuth, signOut }),
    [user, loading, openAuth, closeAuth, signOut],
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
    </AuthContext.Provider>
  );
}
