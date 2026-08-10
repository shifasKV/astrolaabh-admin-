"use client";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Role = "admin" | "expert" | "affiliate";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const DEMO_USERS: Record<Role, AuthUser> = {
  admin: { id: "usr_admin_01", name: "Ops Admin", email: "ops@astrolaabh.house", role: "admin" },
  expert: { id: "usr_expert_01", name: "Pt. Sandeep Kochaar", email: "sandeep@astrolaabh.house", role: "expert" },
  affiliate: { id: "usr_aff_01", name: "Dr. Meenakshi Joshi", email: "meenakshi@astrolaabh.house", role: "affiliate" },
};

interface AuthState {
  user: AuthUser | null;
  selectRole: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const selectRole = useCallback((role: Role) => {
    setUser(DEMO_USERS[role]);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, selectRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
