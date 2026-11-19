import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

export type User = { id: number; email: string; full_name: string; role: "volunteer" | "ngo" | "admin"; is_active?: boolean; created_at?: string };

type AuthCtx = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: { email: string; full_name: string; password: string; role: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("vm_token"));
  const [loading, setLoading] = useState(true);

  const persist = (t: string, u: User) => {
    localStorage.setItem("vm_token", t);
    localStorage.setItem("vm_user", JSON.stringify(u));
    setToken(t); setUser(u);
  };

  const refreshUser = async () => {
    if (!localStorage.getItem("vm_token")) { setUser(null); setLoading(false); return; }
    try {
      const me = await api.get<User>("/auth/me");
      setUser(me);
      localStorage.setItem("vm_user", JSON.stringify(me));
    } catch { logout(); }
    finally { setLoading(false); }
  };

  useEffect(() => { refreshUser(); }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post<any>("/auth/login", { email, password });
    const u: User = { id: res.user_id, email, full_name: res.full_name, role: res.role };
    persist(res.access_token, u);
    // Fetch canonical user
    try { const me = await api.get<User>("/auth/me"); setUser(me); localStorage.setItem("vm_user", JSON.stringify(me)); return me; } catch {}
    return u;
  };

  const register = async (payload: { email: string; full_name: string; password: string; role: string }) => {
    const res = await api.post<any>("/auth/register", payload);
    const u: User = { id: res.user_id, email: payload.email, full_name: res.full_name, role: res.role };
    persist(res.access_token, u);
    try { const me = await api.get<User>("/auth/me"); setUser(me); localStorage.setItem("vm_user", JSON.stringify(me)); return me; } catch {}
    return u;
  };

  const logout = () => {
    localStorage.removeItem("vm_token"); localStorage.removeItem("vm_user");
    setToken(null); setUser(null);
  };

  const value = useMemo(() => ({ user, token, loading, login, register, logout, refreshUser }), [user, token, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
