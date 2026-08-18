"use client";
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Role = "admin" | "expert" | "affiliate" | "sales_admin" | "sales_exec";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/* Demo credential set — the email decides the role, like production SSO would */
export const DEMO_PASSWORD = "astro123";

const DEMO_USERS: Record<Role, AuthUser> = {
  admin: { id: "usr_admin_01", name: "Ops Admin", email: "ops@astrolaabh.house", role: "admin" },
  expert: { id: "usr_expert_01", name: "Pt. Sandeep Kochaar", email: "sandeep@astrolaabh.house", role: "expert" },
  affiliate: { id: "usr_aff_01", name: "Dr. Meenakshi Joshi", email: "meenakshi@astrolaabh.house", role: "affiliate" },
  sales_admin: { id: "sales_01", name: "Priya Sharma", email: "priya.sharma@astrolaabh.com", role: "sales_admin" },
  sales_exec: { id: "sales_02", name: "Rahul Verma", email: "rahul.verma@astrolaabh.com", role: "sales_exec" },
};

export const DEMO_ACCOUNTS: { label: string; email: string; role: Role }[] = [
  { label: "Admin", email: DEMO_USERS.admin.email, role: "admin" },
  { label: "Astro-Gemologist", email: DEMO_USERS.expert.email, role: "expert" },
  { label: "Affiliate partner", email: DEMO_USERS.affiliate.email, role: "affiliate" },
  { label: "Sales executive", email: DEMO_USERS.sales_exec.email, role: "sales_exec" },
];

/* Where each role lands after signing in / activating their account */
export const ROLE_ROUTES: Record<Role, string> = {
  admin: "/dashboard",
  expert: "/expert-dashboard",
  affiliate: "/aff-dashboard",
  sales_admin: "/sales-dashboard",
  sales_exec: "/sales-dashboard",
};

/* Non-admin roles are invited by an admin and set their own password on first sign-in */
export const INVITE_ACCOUNTS: { label: string; email: string; role: Role }[] = [
  { label: "Astro-Gemologist", email: DEMO_USERS.expert.email, role: "expert" },
  { label: "Affiliate partner", email: DEMO_USERS.affiliate.email, role: "affiliate" },
  { label: "Sales executive", email: DEMO_USERS.sales_exec.email, role: "sales_exec" },
];

interface AuthState {
  user: AuthUser | null;
  login: (email: string, password: string) => AuthUser | null;
  loginByEmail: (email: string) => AuthUser | null;
  selectRole: (role: Role) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const login = useCallback((email: string, password: string): AuthUser | null => {
    const match = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!match || password !== DEMO_PASSWORD) return null;
    setUser(match);
    return match;
  }, []);

  const loginByEmail = useCallback((email: string): AuthUser | null => {
    const match = Object.values(DEMO_USERS).find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (match) setUser(match);
    return match ?? null;
  }, []);

  const selectRole = useCallback((role: Role) => {
    setUser(DEMO_USERS[role]);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, loginByEmail, selectRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
