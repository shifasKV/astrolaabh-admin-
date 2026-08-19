"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { useAuth } from "@/lib/store/auth";
import { useSidebar } from "./SidebarState";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { GoldBtn, GhostBtn } from "./Button";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrator",
  expert: "Astro-Gemologist",
  affiliate: "Affiliate partner",
  sales_admin: "Sales admin",
  sales_exec: "Sales executive",
};

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  dot?: boolean;
  disabled?: boolean;
}

export interface SidebarNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  linkTo?: string;
}

interface SidebarProps {
  groups: NavGroup[];
  orgName: string;
  orgSub: string;
  userLabel: string;
  userSub: string;
  onUserClick?: () => void;
  notifications?: SidebarNotification[];
}

export function Sidebar({ groups, orgName, orgSub, userLabel, userSub, onUserClick, notifications }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { collapsed, toggle } = useSidebar();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const unreadNotifs = notifications?.filter((n) => !n.read).length ?? 0;
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwToast, setPwToast] = useState("");

  const savePassword = () => {
    if (!pw.current || !pw.next) { setPwToast("Fill in your current and new password."); return; }
    if (pw.next !== pw.confirm) { setPwToast("New passwords don't match."); return; }
    if (pw.next.length < 6) { setPwToast("Use at least 6 characters."); return; }
    setPw({ current: "", next: "", confirm: "" });
    setPwToast("");
    setPwOpen(false);
    setProfileOpen(false);
  };

  const isActive = (href: string) => {
    const [path, query] = href.split("?");
    if (query) {
      const params = new URLSearchParams(query);
      if (pathname !== path) return false;
      for (const [key, value] of params.entries()) {
        const currentVal = searchParams.get(key);
        if (currentVal === value) continue;
        if (currentVal === null && value === "stones") continue;
        return false;
      }
      return true;
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className={`hidden md:flex shrink-0 flex-col fixed inset-y-0 left-0 py-4 z-30 transition-all duration-300 ${collapsed ? "w-[76px] px-3" : "w-[280px] px-4"}`}
      style={{ background: T.sidebar }}
    >
      {/* Brand — bare logo + name, ChatGPT-style panel toggle */}
      {!collapsed ? (
        <div className="flex items-center gap-2.5 px-1.5 mb-5 h-9">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/mark-gold.webp" alt="AstroLaabh" className="w-7 h-7 object-contain shrink-0" />
          <span className="text-[14px] font-semibold truncate" style={{ color: T.sidebarText }}>{orgName}</span>
          <button
            onClick={toggle}
            aria-label="Close sidebar"
            title="Close sidebar"
            className="ml-auto w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 transition-colors hover:bg-[rgba(244,241,229,0.10)]"
            style={{ color: T.sidebarFaint, cursor: "w-resize" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]">
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="M9.5 4v16" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={toggle}
          aria-label="Open sidebar"
          title="Open sidebar"
          className="group/logo mx-auto mb-5 w-9 h-9 rounded-[9px] flex items-center justify-center transition-colors hover:bg-[rgba(244,241,229,0.10)]"
          style={{ cursor: "e-resize" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/mark-gold.webp" alt="AstroLaabh" className="w-7 h-7 object-contain group-hover/logo:hidden" />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[17px] h-[17px] hidden group-hover/logo:block"
            style={{ color: T.sidebarText }}
          >
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <path d="M9.5 4v16" />
          </svg>
        </button>
      )}

      {/* Notifications */}
      {notifications && notifications.length > 0 && (
        <div className="relative mb-4">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            title={collapsed ? "Notifications" : undefined}
            className={`w-full flex items-center rounded-[10px] cursor-pointer transition-colors hover:bg-[rgba(244,241,229,0.09)] ${collapsed ? "justify-center h-10 mx-auto w-10" : "gap-2.5 h-9 px-2.5"}`}
            style={{ color: T.sidebarText }}
          >
            <span className="relative shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              {unreadNotifs > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: T.gold, border: `1.5px solid ${T.sidebar}` }} />}
            </span>
            {!collapsed && (
              <>
                <span className="text-[13px]">Notifications</span>
                {unreadNotifs > 0 && <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums" style={{ background: T.gold, color: "#2b2a22" }}>{unreadNotifs}</span>}
              </>
            )}
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div
                className={`absolute z-50 rounded-[12px] overflow-hidden ${collapsed ? "left-full ml-2 top-0 w-[300px]" : "left-0 right-0 top-full mt-1.5"}`}
                style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}
              >
                <div className="flex items-center justify-between px-3.5 h-11" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <span className="text-[13px] font-semibold" style={{ color: T.text }}>Notifications</span>
                  {unreadNotifs > 0 && <span className="text-[11px] font-medium" style={{ color: T.muted }}>{unreadNotifs} new</span>}
                </div>
                <div className="max-h-[340px] overflow-y-auto py-1">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => { setNotifOpen(false); if (n.linkTo) router.push(n.linkTo); }}
                      className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: n.read ? "transparent" : T.gold, border: n.read ? `1.5px solid ${T.borderSoft}` : "none" }} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-medium" style={{ color: T.text }}>{n.title}</span>
                        <span className="block text-[11.5px] mt-0.5 leading-snug" style={{ color: T.muted }}>{n.description}</span>
                        <span className="block text-[10.5px] mt-1" style={{ color: T.faint }}>{n.time}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto no-scrollbar space-y-5">
        {groups.map((g) => (
          <div key={g.label} className="space-y-0.5">
            {!collapsed && (
              <div className="px-2.5 mb-1.5 text-[11px] font-medium tracking-[0.08em] uppercase" style={{ color: T.sidebarFaint }}>
                {g.label}
              </div>
            )}
            {g.items.map((it) => {
              const active = isActive(it.href);
              const iconEl = (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px] shrink-0" style={{ color: active ? T.sidebarText : T.sidebarFaint }}>
                  {it.icon}
                </svg>
              );
              if (it.disabled) {
                return (
                  <div
                    key={it.key}
                    title={collapsed ? `${it.label} — locked until approved` : undefined}
                    className={`relative w-full flex items-center rounded-[8px] text-[13.5px] cursor-not-allowed opacity-45 ${collapsed ? "justify-center h-10" : "gap-2.5 h-9 px-2.5"}`}
                    style={{ color: T.sidebarMuted }}
                  >
                    {iconEl}
                    {!collapsed && it.label}
                    {!collapsed && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="ml-auto w-3.5 h-3.5 shrink-0" style={{ color: T.sidebarFaint }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={it.key}
                  href={it.href}
                  title={collapsed ? it.label : undefined}
                  className={`relative w-full flex items-center rounded-[8px] text-[13.5px] transition-colors duration-150 ${
                    collapsed ? "justify-center h-10" : "gap-2.5 h-9 px-2.5"
                  } ${active ? "font-semibold" : "hover:bg-[rgba(244,241,229,0.09)]"}`}
                  style={
                    active
                      ? { background: T.sidebarActive, color: T.sidebarText }
                      : { color: T.sidebarMuted }
                  }
                >
                  {iconEl}
                  {!collapsed && it.label}
                  {!collapsed && it.badge !== undefined && it.badge > 0 && (
                    <span
                      className="ml-auto text-[11px] font-semibold tabular-nums min-w-[20px] h-5 px-1.5 rounded-full inline-flex items-center justify-center"
                      style={{ background: T.gold, color: T.accentInk }}
                    >
                      {it.badge}
                    </span>
                  )}
                  {!collapsed && it.dot && (it.badge === undefined || it.badge === 0) && (
                    <span className="ml-auto w-2 h-2 rounded-full" style={{ background: T.gold, boxShadow: `0 0 0 3px ${T.sidebar}` }} />
                  )}
                  {collapsed && ((it.badge !== undefined && it.badge > 0) || it.dot) && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ background: T.gold }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer — click to open account menu */}
      <div className="relative pt-3 mt-3" style={{ borderTop: `1px solid ${T.sidebarDivider}` }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          title={collapsed ? userLabel : undefined}
          className={`w-full flex items-center rounded-[10px] cursor-pointer transition-colors hover:bg-[rgba(244,241,229,0.09)] ${collapsed ? "justify-center py-2" : "gap-2.5 px-2 py-2"}`}
          style={menuOpen ? { background: "rgba(244,241,229,0.09)" } : undefined}
        >
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
            style={{ background: "rgba(244,241,229,0.12)", border: "1px solid rgba(244,241,229,0.35)", color: T.sidebarText }}
          >
            {userLabel[0]}
          </span>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1 text-left">
                <div className="text-[13px] font-medium truncate" style={{ color: T.sidebarText }}>{userLabel}</div>
                <div className="text-[11px] truncate" style={{ color: T.sidebarFaint }}>{user ? ROLE_LABEL[user.role] ?? userSub : userSub}</div>
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0" style={{ color: T.sidebarFaint }}>
                <path d="m8 9 4-4 4 4M8 15l4 4 4-4" />
              </svg>
            </>
          )}
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
            <div
              className="absolute bottom-full left-0 right-0 mb-2 z-50 rounded-[12px] p-1.5"
              style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}
            >
              <button
                onClick={() => { setMenuOpen(false); setProfileOpen(true); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] font-medium text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.10)]"
                style={{ color: T.text }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" style={{ color: T.muted }}>
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
                </svg>
                My profile
              </button>
              <div className="my-1 mx-1" style={{ borderTop: `1px solid ${T.borderSoft}` }} />
              <button
                onClick={() => { setMenuOpen(false); setSignOutOpen(true); }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[13px] font-medium text-left cursor-pointer transition-colors hover:bg-[rgba(163,73,63,0.08)]"
                style={{ color: T.danger }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Sign out
              </button>
            </div>
          </>
        )}
      </div>

      {/* Profile modal */}
      <Modal open={profileOpen} onClose={() => { setProfileOpen(false); setPwOpen(false); }} title="My profile">
        <div className="flex items-center gap-3.5 mb-5">
          <span
            className="w-14 h-14 rounded-[16px] flex items-center justify-center text-[18px] font-semibold shrink-0"
            style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}
          >
            {userLabel[0]}
          </span>
          <div className="min-w-0">
            <div className="text-[16px] font-semibold" style={{ color: T.text }}>{userLabel}</div>
            <div className="text-[12.5px] mt-0.5" style={{ color: T.muted }}>{user ? ROLE_LABEL[user.role] ?? user.role : userSub}</div>
          </div>
        </div>

        <div className="space-y-3">
          {[
            ["Name", user?.name ?? userLabel],
            ["Email", user?.email ?? "—"],
            ["Role", user ? ROLE_LABEL[user.role] ?? user.role : "—"],
          ].map(([k, v], i, arr) => (
            <div key={k} className={`flex items-baseline justify-between gap-3 ${i < arr.length - 1 ? "pb-3" : ""}`} style={i < arr.length - 1 ? { borderBottom: `1px solid ${T.borderSoft}` } : undefined}>
              <span className="text-[11px] font-medium tracking-[0.06em] uppercase shrink-0" style={{ color: T.faint }}>{k}</span>
              <span className="text-[13px] font-medium text-right" style={{ color: T.text }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Change password */}
        <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${T.border}` }}>
          {!pwOpen ? (
            <button
              onClick={() => setPwOpen(true)}
              className="inline-flex items-center gap-2 text-[13px] font-medium cursor-pointer hover:underline underline-offset-4"
              style={{ color: T.accent }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Change password
            </button>
          ) : (
            <div className="space-y-3">
              <h3 className="text-[13.5px] font-semibold" style={{ color: T.text }}>Change password</h3>
              <Input value={pw.current} onChange={(v) => { setPw((p) => ({ ...p, current: v })); setPwToast(""); }} label="Current password" type="password" placeholder="••••••••" />
              <Input value={pw.next} onChange={(v) => { setPw((p) => ({ ...p, next: v })); setPwToast(""); }} label="New password" type="password" placeholder="At least 6 characters" />
              <Input value={pw.confirm} onChange={(v) => { setPw((p) => ({ ...p, confirm: v })); setPwToast(""); }} label="Confirm new password" type="password" placeholder="Repeat new password" />
              {pwToast && <p className="text-[12px]" style={{ color: T.danger }}>{pwToast}</p>}
              <div className="flex gap-2.5 pt-1">
                <GoldBtn onClick={savePassword}>Update password</GoldBtn>
                <GhostBtn onClick={() => { setPwOpen(false); setPw({ current: "", next: "", confirm: "" }); setPwToast(""); }}>Cancel</GhostBtn>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Sign-out confirmation */}
      <Modal open={signOutOpen} onClose={() => setSignOutOpen(false)} title="Sign out?">
        <p className="text-[13.5px] leading-relaxed" style={{ color: T.muted }}>
          You’ll be returned to the sign-in screen and will need to log in again to continue.
        </p>
        <div className="flex items-center justify-end gap-2.5 mt-6">
          <GhostBtn onClick={() => setSignOutOpen(false)}>Cancel</GhostBtn>
          <button
            onClick={() => { setSignOutOpen(false); onUserClick?.(); }}
            className="h-10 px-5 rounded-[9px] text-[13px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110"
            style={{ background: T.danger, color: "#fdf6ea" }}
          >
            Sign out
          </button>
        </div>
      </Modal>
    </aside>
  );
}
