"use client";
import { usePathname } from "next/navigation";
import { T } from "@/lib/theme";
import type { NavItem } from "./Sidebar";

interface TopBarProps {
  items: NavItem[];
  userLabel: string;
  onUserClick?: () => void;
}

/* Mobile app header — shows the current page title. Navigation lives in the
   bottom tab bar (MobileTabBar); account/sign-out lives in its "More" sheet. */
export function TopBar({ items }: TopBarProps) {
  const pathname = usePathname();
  const currentItem = items.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
  const title = currentItem?.label ?? "AstroLaabh";

  return (
    <div
      className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 h-14"
      style={{ background: "rgba(248,245,238,0.82)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${T.borderSoft}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo/mark-gold.webp" alt="AstroLaabh" className="w-8 h-8 object-contain shrink-0" />
      <h1 className="text-[16px] font-semibold tracking-[-0.01em] truncate flex-1" style={{ color: T.text }}>{title}</h1>
    </div>
  );
}
