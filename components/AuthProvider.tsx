"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import AuthModal from "@/components/auth/AuthModal";
import { logout as clearSession } from "@/lib/api";

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

  const openAuth = useCallback((next: AuthView = "login") => setView(next), []);
  const closeAuth = useCallback(() => setView(null), []);
  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, openAuth, closeAuth, signOut }),
    [user, openAuth, closeAuth, signOut],
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
