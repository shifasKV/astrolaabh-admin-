"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { T } from "@/lib/theme";
import { Select } from "./Input";
import { Modal } from "./Modal";
import { GhostBtn } from "./Button";
import type { NavItem } from "./Sidebar";

interface TopBarProps {
  items: NavItem[];
  userLabel: string;
  onUserClick?: () => void;
}

export function TopBar({ items, userLabel, onUserClick }: TopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signOutOpen, setSignOutOpen] = useState(false);
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
        onClick={() => setSignOutOpen(true)}
        className="text-[11px] px-2 py-1.5 rounded-[9px] transition-all duration-200 hover:bg-[rgba(119,123,98,0.10)] cursor-pointer"
        style={{ color: T.muted }}
      >
        {userLabel} ↺
      </button>

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
    </div>
  );
}
