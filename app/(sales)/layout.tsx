"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";
import { Sidebar, TopBar } from "@/components/ui";
import { SALES_NAV } from "@/lib/nav";
import { T } from "@/lib/theme";

export default function SalesLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || (user.role !== "sales_admin" && user.role !== "sales_exec")) {
      router.push("/");
    }
  }, [user, router]);

  if (!user || (user.role !== "sales_admin" && user.role !== "sales_exec")) {
    return null;
  }

  const allItems = SALES_NAV.flatMap((g) => g.items);
  const portalLabel = user.role === "sales_admin" ? "Sales Admin" : "Sales Executive";

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>
      <Sidebar
        groups={SALES_NAV}
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
      <div className="md:ml-[280px] min-w-0">
        <div className="px-5 md:px-10 py-7 max-w-[1400px] mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
