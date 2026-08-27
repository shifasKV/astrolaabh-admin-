"use client";
import { createContext, useContext, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/store/auth";
import { Sidebar, TopBar, MobileTabBar, useSidebar, CommandPalette } from "@/components/ui";
import { AFFILIATE_NAV } from "@/lib/nav";
import { usePersistentState } from "@/lib/usePersistentState";
import { T } from "@/lib/theme";

export type ApprovalState = "pending" | "rejected" | "revision_requested" | "approved";

const LOCKED_KEYS = new Set(["dashboard", "links", "referrals", "earnings"]);
const LOCKED_PATHS = ["/links", "/referrals", "/earnings", "/aff-dashboard"];

type ApprovalCtx = { approval: ApprovalState; reviewReason: string; setApproval: (s: ApprovalState) => void; setReviewReason: (r: string) => void };
const ApprovalContext = createContext<ApprovalCtx>({ approval: "approved", reviewReason: "", setApproval: () => {}, setReviewReason: () => {} });
export function useApproval() { return useContext(ApprovalContext); }

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { collapsed } = useSidebar();
  const pathname = usePathname();

  const [approval, setApproval] = usePersistentState<ApprovalState>("aff-approval-v2", "approved");
  const [reviewReason, setReviewReason] = usePersistentState<string>("aff-review-reason", "");
  const notApproved = approval !== "approved";

  useEffect(() => {
    if (!user || user.role !== "affiliate") router.push("/");
  }, [user, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("status") === "pending") setApproval("pending");
    }
  }, [pathname, setApproval]);

  useEffect(() => {
    if (notApproved && pathname !== "/profile" && pathname !== "/onboarding") {
      router.replace("/profile");
    }
  }, [notApproved, pathname, router]);

  const navForState = useMemo(
    () =>
      notApproved
        ? AFFILIATE_NAV.map((g) => ({ ...g, items: g.items.map((it) => (LOCKED_KEYS.has(it.key) ? { ...it, disabled: true } : it)) }))
        : AFFILIATE_NAV,
    [notApproved],
  );

  if (!user || user.role !== "affiliate") return null;
  if (pathname === "/onboarding") return <>{children}</>;

  const allItems = navForState.flatMap((g) => g.items);

  return (
    <ApprovalContext.Provider value={{ approval, reviewReason, setApproval, setReviewReason }}>
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
          style={{ backgroundColor: T.bg, backgroundImage: "linear-gradient(rgba(248,245,238,0.22), rgba(248,245,238,0.22)), url(/pattern/damask.png)", backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundPosition: "center", boxShadow: "0 0 0 1px rgba(244,241,229,0.07), 0 24px 60px -30px rgba(0,0,0,0.5)" }}
        >
          <div className="px-5 md:px-10 pt-7 pb-[84px] md:pb-7 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
        <MobileTabBar groups={navForState} userLabel={user.name} onSignOut={() => { logout(); router.push("/"); }} />
        <CommandPalette groups={navForState} indexRecords={false} />

        {/* Prototype controller */}
        <div className="fixed bottom-5 right-5 z-50">
          <div className="flex items-center gap-1.5 p-1.5 rounded-full" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: "0 6px 20px -6px rgba(43,42,34,0.45)" }}>
            <span className="text-[10px] font-semibold tracking-[0.06em] uppercase pl-2 pr-0.5" style={{ color: T.faint }}>Demo</span>
            {(["pending", "revision_requested", "rejected", "approved"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setApproval(s); if (s === "rejected") setReviewReason("The PAN card document uploaded is unclear and cannot be verified. Please re-upload a clear, high-resolution copy."); if (s === "revision_requested") setReviewReason("Your bank account IFSC code doesn't match the bank name provided. Also, please upload a clearer PAN card image."); if (s === "pending" || s === "approved") setReviewReason(""); }}
                className="h-7 px-2.5 rounded-full text-[10.5px] font-medium capitalize cursor-pointer transition-all duration-200"
                style={approval === s ? { background: T.accent, color: T.accentInk } : { color: T.muted }}
              >
                {s === "revision_requested" ? "Revision" : s}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ApprovalContext.Provider>
  );
}
