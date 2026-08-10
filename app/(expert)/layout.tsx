"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/store/auth";
import { Sidebar, TopBar } from "@/components/ui";
import { EXPERT_NAV } from "@/lib/nav";
import { T } from "@/lib/theme";

export default function ExpertLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== "expert") {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.role !== "expert") {
    return null;
  }

  const allItems = EXPERT_NAV.flatMap((g) => g.items);

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text }}>
      <Sidebar
        groups={EXPERT_NAV}
        orgName="AstroLaabh"
        orgSub="Expert Portal"
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
