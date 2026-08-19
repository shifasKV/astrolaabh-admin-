"use client";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";
import { Sidebar, TopBar, MobileTabBar, useSidebar, CommandPalette } from "@/components/ui";
import { SALES_NAV } from "@/lib/nav";
import { T } from "@/lib/theme";
import { useLeads } from "@/lib/store/leads";

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { collapsed } = useSidebar();
  const { salesReviewUpdates } = useLeads();

  const updates = user ? salesReviewUpdates(user.id) : [];
  const orderDot = updates.some((r) => r.kind === "order");
  const consultDot = updates.some((r) => r.kind === "consultation");

  const nav = useMemo(() => SALES_NAV.map((g) => ({
    ...g,
    items: g.items.map((it) => {
      if (it.key === "stone-leads") return { ...it, dot: orderDot };
      if (it.key === "consultation-leads") return { ...it, dot: consultDot };
      return it;
    }),
  })), [orderDot, consultDot]);

  useEffect(() => {
    if (!user || (user.role !== "sales_admin" && user.role !== "sales_exec")) {
      router.push("/");
    }
  }, [user, router]);

  if (!user || (user.role !== "sales_admin" && user.role !== "sales_exec")) {
    return null;
  }

  const allItems = nav.flatMap((g) => g.items);
  const portalLabel = user.role === "sales_admin" ? "Sales Admin" : "Sales Executive";

  return (
    <div className="min-h-dvh md:h-dvh md:overflow-hidden md:py-2.5 md:pr-2.5" style={{ background: T.sidebar, color: T.text }}>
      <Sidebar
        groups={nav}
        orgName="AstroLaabh"
        orgSub={portalLabel}
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
        <div className="px-5 md:px-10 pt-7 pb-[84px] md:pb-7 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
      <MobileTabBar groups={nav} userLabel={user.name} onSignOut={() => { logout(); router.push("/"); }} />
      <CommandPalette groups={SALES_NAV} indexRecords={false} />
    </div>
  );
}
