"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { T } from "@/lib/theme";

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
}

interface SidebarProps {
  groups: NavGroup[];
  orgName: string;
  orgSub: string;
  userLabel: string;
  userSub: string;
  onUserClick?: () => void;
}

export function Sidebar({ groups, orgName, orgSub, userLabel, userSub, onUserClick }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
      className="hidden md:flex w-[280px] shrink-0 flex-col fixed inset-y-0 left-0 px-4 py-4 z-30"
      style={{ background: T.panel, borderRight: `1px solid ${T.borderSoft}` }}
    >
      {/* Org card */}
      <div
        className="flex items-center gap-3 rounded-[11px] px-3 py-2.5 mb-6"
        style={{ background: T.card, border: `1px solid ${T.border}` }}
      >
        <span
          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[13px] font-bold shrink-0"
          style={{ background: T.accent, color: T.accentInk }}
        >
          A
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{orgName}</div>
          <div className="text-[11px] truncate" style={{ color: T.muted }}>{orgSub}</div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto no-scrollbar space-y-6">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="px-3 mb-1.5 text-[10px] font-medium tracking-[0.14em] uppercase" style={{ color: T.faint }}>
              {g.label}
            </div>
            {g.items.map((it) => {
              const active = isActive(it.href);
              return (
                <Link
                  key={it.key}
                  href={it.href}
                  className={`relative w-full flex items-center gap-3 h-10 px-3 rounded-[9px] text-[13.5px] transition-all duration-200 ${
                    active ? "" : "hover:bg-[rgba(195,160,88,0.04)]"
                  }`}
                  style={
                    active
                      ? { background: T.card, border: `1px solid ${T.accentBorder}`, color: T.text }
                      : { color: T.muted, border: "1px solid transparent" }
                  }
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                      style={{ background: T.accent }}
                    />
                  )}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-[17px] h-[17px] shrink-0">
                    {it.icon}
                  </svg>
                  {it.label}
                  {it.badge !== undefined && it.badge > 0 && (
                    <span
                      className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: T.accentMuted, color: T.accent }}
                    >
                      {it.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User card */}
      <button
        onClick={onUserClick}
        className="flex items-center gap-3 rounded-[11px] px-3 py-2.5 mt-4 text-left transition-colors hover:brightness-125"
        style={{ borderTop: `1px solid ${T.borderSoft}` }}
      >
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.accent }}
        >
          {userLabel[0]}
        </span>
        <div className="min-w-0">
          <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{userLabel}</div>
          <div className="text-[11px] truncate" style={{ color: T.faint }}>{userSub}</div>
        </div>
      </button>
    </aside>
  );
}
