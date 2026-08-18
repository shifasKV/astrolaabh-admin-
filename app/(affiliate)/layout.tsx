"use client";
import { useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/store/auth";
import { Sidebar, TopBar, useSidebar, CommandPalette } from "@/components/ui";
import { AFFILIATE_NAV } from "@/lib/nav";
import { usePersistentState } from "@/lib/usePersistentState";
import { T } from "@/lib/theme";

const LOCKED_KEYS = new Set(["links", "referrals", "earnings"]);
const LOCKED_PATHS = ["/links", "/referrals", "/earnings"];

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { collapsed } = useSidebar();
  const pathname = usePathname();

  const [approval, setApproval] = usePersistentState<"pending" | "approved">("aff-approval", "approved");
  const pending = approval === "pending";

  useEffect(() => {
    if (!user || user.role !== "affiliate") router.push("/");
  }, [user, router]);

  // Coming out of onboarding lands here with ?status=pending
  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("status") === "pending") {
      setApproval("pending");
    }
  }, [pathname, setApproval]);

  // While pending, locked feature routes bounce back to the dashboard
  useEffect(() => {
    if (pending && LOCKED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      router.replace("/aff-dashboard");
    }
  }, [pending, pathname, router]);

  const navForState = useMemo(
    () =>
      pending
        ? AFFILIATE_NAV.map((g) => ({ ...g, items: g.items.map((it) => (LOCKED_KEYS.has(it.key) ? { ...it, disabled: true } : it)) }))
        : AFFILIATE_NAV,
    [pending],
  );

  if (!user || user.role !== "affiliate") return null;
  if (pathname === "/onboarding") return <>{children}</>;

  const allItems = navForState.flatMap((g) => g.items);

  return (
    <div className="min-h-dvh md:h-dvh md:overflow-hidden md:py-2.5 md:pr-2.5" style={{ background: T.sidebar, color: T.text }}>
      <Sidebar
        groups={navForState}
        orgName="AstroLaabh"
        orgSub="Affiliate Portal"
        userLabel={user.name}
        userSub="sign out"
        onUserClick={() => { logout(); router.push("/"); }}
      />
      <TopBar items={allItems} userLabel={user.name} onUserClick={() => { logout(); router.push("/"); }} />
      <main
        className={`min-w-0 min-h-dvh md:min-h-0 md:h-full md:overflow-y-auto md:rounded-[20px] transition-[margin-left] duration-300 ${collapsed ? "md:ml-[76px]" : "md:ml-[280px]"}`}
        style={{ background: T.bg, boxShadow: "0 0 0 1px rgba(244,241,229,0.07), 0 24px 60px -30px rgba(0,0,0,0.5)" }}
      >
        <div className="px-5 md:px-10 py-7 max-w-[1400px] mx-auto">
          {pending && (
            <div className="flex flex-wrap items-start gap-3 rounded-[14px] px-4 py-3.5 mb-6" style={{ background: "linear-gradient(160deg, #faf0d8 0%, #efdfb8 100%)", border: "1px solid rgba(160,125,56,0.35)" }}>
              <span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(160,125,56,0.16)", color: "#8a6a2f" }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 2" /></svg>
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold" style={{ color: "#7a5c26" }}>Your application is under review</div>
                <p className="text-[12.5px] mt-0.5 leading-relaxed" style={{ color: "#8a6a2f" }}>
                  Links, referrals, and earnings unlock once the AstroLaabh team approves your account. Typical review time is 1–2 business days.
                </p>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
      <CommandPalette groups={navForState} indexRecords={false} />

      {/* Prototype controller — flip between the pending and approved states */}
      <div className="fixed bottom-5 right-5 z-50">
        <div className="flex items-center gap-1.5 p-1.5 rounded-full" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: "0 6px 20px -6px rgba(43,42,34,0.45)" }}>
          <span className="text-[10px] font-semibold tracking-[0.06em] uppercase pl-2 pr-0.5" style={{ color: T.faint }}>Demo</span>
          {(["pending", "approved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setApproval(s)}
              className="h-7 px-3 rounded-full text-[11.5px] font-medium capitalize cursor-pointer transition-all duration-200"
              style={approval === s ? { background: T.primary, color: T.primaryInk } : { color: T.muted }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
