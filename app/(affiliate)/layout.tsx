"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";
import { Sidebar, TopBar } from "@/components/ui";
import { AFFILIATE_NAV } from "@/lib/nav";
import { T } from "@/lib/theme";

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "affiliate") {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.role !== "affiliate") {
    return null;
  }

  const allItems = AFFILIATE_NAV.flatMap((g) => g.items);

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>
      <Sidebar
        groups={AFFILIATE_NAV}
        orgName="AstroLaabh"
        orgSub="Affiliate Portal"
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
