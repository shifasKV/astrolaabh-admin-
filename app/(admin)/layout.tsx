"use client";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";
import { Sidebar, TopBar } from "@/components/ui";
import { ADMIN_NAV } from "@/lib/nav";
import { T } from "@/lib/theme";
import { MOCK_NOTIFICATIONS } from "@/lib/mock";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.role !== "admin") {
    return null;
  }

  const unreadCount = useMemo(() => MOCK_NOTIFICATIONS.filter((n) => !n.read).length, []);

  const navWithBadge = useMemo(() => ADMIN_NAV.map((g) => ({
    ...g,
    items: g.items.map((it) => it.key === "notifications" ? { ...it, badge: unreadCount } : it),
  })), [unreadCount]);

  const allItems = navWithBadge.flatMap((g) => g.items);

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>
      <Sidebar
        groups={navWithBadge}
        orgName="AstroLaabh"
        orgSub="Operations"
        userLabel={user.name}
        userSub="sign out"
        onUserClick={() => { logout(); router.push("/"); }}
      />
      <TopBar
        items={allItems}
        userLabel={user.name}
        onUserClick={() => { logout(); router.push("/"); }}
      />
      <div className="md:ml-[232px] min-w-0">
        <div className="px-5 md:px-8 py-7 max-w-[1080px]">
          {children}
        </div>
      </div>
    </div>
  );
}
