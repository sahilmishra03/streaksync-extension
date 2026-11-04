"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SITE } from "@/lib/site";
import type { Stats, UsersResponse } from "./types";

// Admin session. The password is kept in localStorage for 7 days, so a reload or a new tab
// stays signed in. While the saved session is being checked, a loading screen shows (never the login form).

const SESSION_KEY = "streaksync-admin-session";
const SESSION_DAYS = 7;

type Saved = { token: string; expiresAt: number };

function readSession(): Saved | null {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as Saved | null;
    if (!s?.token || !s.expiresAt || s.expiresAt < Date.now()) return null;
    return s;
  } catch {
    return null;
  }
}

class Unauthorized extends Error {}

async function get<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${SITE.apiUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (res.status === 401) throw new Unauthorized("Wrong password");
  if (!res.ok) throw new Error(`Server returned HTTP ${res.status}`);
  return res.json();
}

export type SessionState =
  | { status: "restoring" }
  | { status: "signed-out"; error?: string }
  | { status: "signed-in"; stats: Stats; users: UsersResponse };

type Ctx = {
  state: SessionState;
  loading: boolean;
  error: string;
  signIn: (password: string) => Promise<void>;
  signOut: () => void;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<Ctx | null>(null);

export function useAdmin() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useAdmin must be used inside <AdminSession>");
  return ctx;
}

// Signed-in data for pages (the shell only renders pages when signed in)
export function useAdminData() {
  const { state, ...rest } = useAdmin();
  if (state.status !== "signed-in") throw new Error("Not signed in");
  return { stats: state.stats, users: state.users, ...rest };
}

export function AdminSession({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "restoring" });
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (t: string, remember: boolean) => {
    setLoading(true);
    setError("");
    try {
      const [stats, users] = await Promise.all([
        get<Stats>("/admin/stats", t),
        get<UsersResponse>("/admin/users", t),
      ]);
      setToken(t);
      setState({ status: "signed-in", stats, users });
      if (remember) {
        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({ token: t, expiresAt: Date.now() + SESSION_DAYS * 86400000 }),
        );
      }
    } catch (e) {
      if (e instanceof Unauthorized) {
        localStorage.removeItem(SESSION_KEY);
        setToken(null);
        setState({ status: "signed-out", error: "Wrong password" });
      } else {
        const message = e instanceof Error ? e.message : "Could not load data";
        // Keep showing the last data if a refresh fails; otherwise fall back to sign-in
        setState((s) => (s.status === "signed-in" ? s : { status: "signed-out", error: message }));
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = readSession();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the saved session once on mount
    if (saved) load(saved.token, false);
    else setState({ status: "signed-out" });
  }, [load]);

  const value: Ctx = {
    state,
    loading,
    error,
    signIn: (password) => load(password, true),
    signOut: () => {
      localStorage.removeItem(SESSION_KEY);
      setToken(null);
      setState({ status: "signed-out" });
    },
    refresh: async () => {
      if (token) await load(token, false);
    },
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
