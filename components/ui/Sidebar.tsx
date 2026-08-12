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
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-2 pt-1 pb-5 mb-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/mark-gold.webp" alt="AstroLaabh" className="w-7 h-7 object-contain shrink-0" />
        <div className="min-w-0 flex items-baseline gap-1.5">
          <span className="text-[14px] font-semibold truncate" style={{ color: T.text }}>{orgName}</span>
          <span className="text-[11.5px] truncate" style={{ color: T.faint }}>{orgSub}</span>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto no-scrollbar space-y-5">
        {groups.map((g) => (
          <div key={g.label} className="space-y-0.5">
            <div className="px-2.5 mb-1.5 text-[11px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>
              {g.label}
            </div>
            {g.items.map((it) => {
              const active = isActive(it.href);
              return (
                <Link
                  key={it.key}
                  href={it.href}
                  className={`relative w-full flex items-center gap-2.5 h-9 px-2.5 rounded-[8px] text-[13.5px] transition-colors duration-150 ${
                    active ? "font-semibold" : "hover:bg-[rgba(89,82,54,0.06)]"
                  }`}
                  style={
                    active
                      ? { background: T.accentMuted, color: T.text }
                      : { color: T.muted }
                  }
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="w-4 h-4 shrink-0"
                    style={{ color: active ? T.accent : T.faint }}
                  >
                    {it.icon}
                  </svg>
                  {it.label}
                  {it.badge !== undefined && it.badge > 0 && (
                    <span
                      className="ml-auto text-[11px] font-semibold tabular-nums min-w-[20px] h-5 px-1.5 rounded-full inline-flex items-center justify-center"
                      style={{ background: T.accent, color: T.accentInk }}
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

      {/* User footer */}
      <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
        <button
          onClick={onUserClick}
          className="group w-full flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left transition-colors hover:bg-[rgba(89,82,54,0.06)] cursor-pointer"
        >
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
            style={{ background: `${T.accent}18`, border: `1px solid ${T.accent}35`, color: T.accent }}
          >
            {userLabel[0]}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{userLabel}</div>
            <div className="text-[11px] truncate capitalize" style={{ color: T.faint }}>{userSub}</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: T.faint }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
