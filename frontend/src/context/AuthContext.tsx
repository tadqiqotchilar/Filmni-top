import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setAuthToken } from "../api/client";
import type { MeResponse } from "../api/types";
import { getTelegramInitDataRaw, initTelegram } from "../telegram/telegram";

interface AuthContextValue {
  user: MeResponse | null;
  loading: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function resolveInitData(): string {
  const real = getTelegramInitDataRaw();
  if (real) return real;

  if (import.meta.env.DEV) {
    let devId = localStorage.getItem("filmni-top:dev-id");
    if (!devId) {
      devId = String(100000 + Math.floor(Math.random() * 900000));
      localStorage.setItem("filmni-top:dev-id", devId);
    }
    return `DEV:${JSON.stringify({ id: Number(devId), first_name: "Dev", username: `dev${devId}` })}`;
  }

  throw new Error("Telegram initData not available");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initTelegram();

    let cancelled = false;

    async function login() {
      try {
        const initData = resolveInitData();
        const { token, user: authedUser } = await api.auth(initData);
        if (cancelled) return;
        setAuthToken(token);
        setUser(authedUser);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "auth_failed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    login();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshUser() {
    const me = await api.me();
    setUser(me);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
