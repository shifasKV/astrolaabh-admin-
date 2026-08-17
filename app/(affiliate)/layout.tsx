"use client";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/store/auth";
import { Sidebar, TopBar } from "@/components/ui";
import { AFFILIATE_NAV } from "@/lib/nav";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES } from "@/lib/mock";

function PendingApprovalScreen({ name, onLogout }: { name: string; onLogout: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: T.bg }}>
      <div className="text-center max-w-[440px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo/mark-gold.webp" alt="AstroLaabh" className="w-14 h-14 object-contain mx-auto mb-6 drop-shadow-[0_4px_12px_rgba(160,125,56,0.35)]" />
        <div className="rounded-[16px] p-8" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(43,42,34,0.06)" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "rgba(197,155,56,0.1)", border: `2px solid rgba(197,155,56,0.25)` }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c59b38" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <h1 className="font-title text-[22px] font-semibold tracking-[-0.02em] mb-2" style={{ color: T.text }}>Pending Review</h1>
          <p className="text-[14px] leading-relaxed mb-6" style={{ color: T.muted }}>
            Hi {name}, your application is being reviewed by the AstroLaabh team. You&apos;ll receive an email notification once your account is approved.
          </p>
          <div className="rounded-[10px] p-4 mb-6 text-left space-y-2.5" style={{ background: T.panel, border: `1px solid ${T.borderSoft}` }}>
            {[
              { label: "Application submitted", done: true },
              { label: "Documents under review", done: false, active: true },
              { label: "Commission configured", done: false },
              { label: "Account activated", done: false },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{
                  background: s.done ? T.good : s.active ? `${T.accent}20` : "transparent",
                  border: `1.5px solid ${s.done ? T.good : s.active ? T.accent : T.border}`,
                }}>
                  {s.done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                  {s.active && <span className="w-2 h-2 rounded-full" style={{ background: T.accent }} />}
                </span>
                <span className="text-[13px]" style={{ color: s.done ? T.good : s.active ? T.text : T.muted, fontWeight: s.active ? 500 : 400 }}>{s.label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={onLogout}
            className="text-[13px] font-medium cursor-pointer transition-colors hover:opacity-80"
            style={{ color: T.accent }}
          >
            ← Sign out
          </button>
        </div>
        <p className="text-[12px] mt-4" style={{ color: T.faint }}>Typical review time: 1–2 business days</p>
      </div>
    </div>
  );
}

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user || user.role !== "affiliate") {
      router.push("/");
    }
  }, [user, router]);

  if (!user || user.role !== "affiliate") {
    return null;
  }

  if (pathname === "/onboarding") {
    return <>{children}</>;
  }

  const affiliate = MOCK_AFFILIATES.find((a) => a.email === user.email);
  const isPending = affiliate?.status === "under_review";

  if (isPending) {
    return <PendingApprovalScreen name={user.name.split(" ")[0]} onLogout={() => { logout(); router.push("/"); }} />;
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
