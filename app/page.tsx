"use client";
import { useRouter } from "next/navigation";
import { useAuth, type Role } from "@/lib/store/auth";
import { T } from "@/lib/theme";

const ROLES: { key: Role; label: string; note: string }[] = [
  { key: "admin", label: "Admin", note: "Full access — operations, catalogue, affiliation & audit" },
  { key: "expert", label: "Astrologer & Gemologist", note: "Appointments, consultations, recommendations & certification" },
  { key: "affiliate", label: "Affiliated Partner", note: "Referral links, conversions, earnings & payouts" },
  { key: "sales_exec", label: "Sales Executive", note: "Your assigned leads — stone & consultation follow-ups" },
];

const ROLE_ROUTES: Record<Role, string> = {
  admin: "/dashboard",
  expert: "/expert-dashboard",
  affiliate: "/aff-dashboard",
  sales_admin: "/sales-dashboard",
  sales_exec: "/sales-dashboard",
};

export default function RoleSelectionPage() {
  const router = useRouter();
  const { selectRole } = useAuth();

  const chooseRole = (role: Role) => {
    selectRole(role);
    router.push(ROLE_ROUTES[role]);
  };

  return (
    <main
      className="min-h-dvh relative overflow-hidden"
      style={{
        background: `url(/login/bg-gem.jpg) center / cover no-repeat, ${T.bg}`,
      }}
    >
      {/* soft wash so type holds on the left, the stone breathes on the right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(90deg, rgba(241,235,220,0.72) 0%, rgba(241,235,220,0.4) 42%, rgba(241,235,220,0) 68%)" }}
      />

      <div className="relative z-10 min-h-dvh flex items-center px-6 md:px-[9vw]">
        <div className="w-full max-w-[440px]">
          <div
            className="rounded-[18px] p-7 backdrop-blur-[8px]"
            style={{
              background: "rgba(250, 246, 236, 0.92)",
              border: "1px solid rgba(255,253,247,0.75)",
              boxShadow: "0 2px 6px rgba(43,42,34,0.06), 0 32px 70px -30px rgba(43,42,34,0.4), inset 0 1px 0 rgba(255,253,247,0.85)",
            }}
          >
            <div className="flex items-center gap-4 mb-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/mark-gold.webp" alt="AstroLaabh" className="w-12 h-12 object-contain drop-shadow-[0_4px_12px_rgba(160,125,56,0.35)]" />
              <div>
                <div className="eyebrow mb-0.5">AstroLaabh</div>
                <div className="font-title text-[22px] font-semibold tracking-[-0.02em] leading-tight" style={{ color: T.text }}>Operations Portal</div>
              </div>
            </div>
            <div className="hairline mb-5" />
            <p className="text-[13px] mb-5 leading-relaxed" style={{ color: T.muted }}>
              Choose a portal to enter. Each role sees only what it may touch — in production a signed-in user carries one role.
            </p>
            <div className="space-y-2.5">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => chooseRole(r.key)}
                  className="group w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-[11px] text-left transition-all duration-300 hover:-translate-y-px hover:border-[rgba(160,125,56,0.4)] hover:shadow-[0_2px_6px_rgba(43,42,34,0.05),0_14px_28px_-16px_rgba(160,125,56,0.4)]"
                  style={{ background: "#fffdf5", border: `1px solid ${T.border}`, color: T.text }}
                >
                  <span>
                    <span className="block text-[14px] font-medium">{r.label}</span>
                    <span className="block text-[12px] mt-0.5" style={{ color: T.faint }}>{r.note}</span>
                  </span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1" style={{ color: T.accent }}>→</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <p className="text-[11.5px] tracking-[0.04em]" style={{ color: "rgba(60,56,40,0.65)" }}>
              Internal console · access is logged and role-scoped
            </p>
            <button
              onClick={() => { selectRole("affiliate"); router.push("/onboarding"); }}
              className="text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-80"
              style={{ color: T.accent }}
            >
              New affiliate? Apply here →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
