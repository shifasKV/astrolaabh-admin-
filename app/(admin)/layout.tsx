"use client";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";
import { Sidebar, TopBar, useSidebar, CommandPalette } from "@/components/ui";
import { ADMIN_NAV } from "@/lib/nav";
import { T } from "@/lib/theme";
import { MOCK_NOTIFICATIONS } from "@/lib/mock";
import { useLeads } from "@/lib/store/leads";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { collapsed } = useSidebar();

  useEffect(() => {
    if (!user || user.role !== "admin") {
      router.push("/");
    }
  }, [user, router]);

  const unreadCount = useMemo(() => MOCK_NOTIFICATIONS.filter((n) => !n.read).length, []);
  const { pendingApprovals } = useLeads();
  const hasApprovals = pendingApprovals.length > 0;

  const navWithBadge = useMemo(() => ADMIN_NAV.map((g) => ({
    ...g,
    items: g.items.map((it) => {
      if (it.key === "notifications") return { ...it, badge: unreadCount };
      if (it.key === "leads") return { ...it, dot: hasApprovals };
      return it;
    }),
  })), [unreadCount, hasApprovals]);

  if (!user || user.role !== "admin") {
    return null;
  }

  const allItems = navWithBadge.flatMap((g) => g.items);

  return (
    <div className="min-h-dvh md:h-dvh md:overflow-hidden md:py-2.5 md:pr-2.5" style={{ background: T.sidebar, color: T.text }}>
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
      <main
        className={`min-w-0 min-h-dvh md:min-h-0 md:h-full md:overflow-y-auto md:rounded-[20px] transition-[margin-left] duration-300 ${collapsed ? "md:ml-[76px]" : "md:ml-[280px]"}`}
        style={{ backgroundColor: T.bg, backgroundImage: "linear-gradient(rgba(248,245,238,0.22), rgba(248,245,238,0.22)), url(/pattern/damask.png)", backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundPosition: "center", boxShadow: "0 0 0 1px rgba(244,241,229,0.07), 0 24px 60px -30px rgba(0,0,0,0.5)" }}
      >
        <div className="px-5 md:px-10 py-7 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
      <CommandPalette />
    </div>
  );
}
