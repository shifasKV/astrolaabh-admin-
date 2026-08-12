"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { Select } from "./Input";
import type { NavItem } from "./Sidebar";

interface TopBarProps {
  items: NavItem[];
  userLabel: string;
  onUserClick?: () => void;
}

export function TopBar({ items, userLabel, onUserClick }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const currentItem = items.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));

  return (
    <div
      className="md:hidden sticky top-0 z-20 flex items-center gap-3 px-4 h-14"
      style={{ background: T.panel, borderBottom: `1px solid ${T.border}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo/mark-gold.webp" alt="AstroLaabh" className="w-8 h-8 object-contain shrink-0" />
      <Select
        value={currentItem?.href ?? items[0]?.href ?? ""}
        onChange={(val) => router.push(val)}
        compact
        options={items.map((i) => ({ value: i.href, label: i.label }))}
        className="flex-1"
      />
      <button
        onClick={onUserClick}
        className="text-[11px] px-2 py-1.5 rounded-[9px] transition-all duration-200 hover:bg-[rgba(160,125,56,0.10)] cursor-pointer"
        style={{ color: T.muted }}
      >
        {userLabel} ↺
      </button>
    </div>
  );
}
