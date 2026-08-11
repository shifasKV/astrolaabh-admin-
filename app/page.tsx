"use client";
import { useRouter } from "next/navigation";
import { useAuth, type Role } from "@/lib/store/auth";
import { T } from "@/lib/theme";

const ROLES: { key: Role; label: string; note: string }[] = [
  { key: "admin", label: "Admin", note: "Full access — operations, catalogue, affiliation & audit" },
  { key: "expert", label: "Astrologer & Gemologist", note: "Appointments, consultations, recommendations & certification" },
  { key: "affiliate", label: "Affiliated Partner", note: "Referral links, conversions, earnings & payouts" },
];

const ROLE_ROUTES: Record<Role, string> = {
  admin: "/dashboard",
  expert: "/expert-dashboard",
  affiliate: "/aff-dashboard",
};

export default function RoleSelectionPage() {
  const router = useRouter();
  const { selectRole } = useAuth();

  const chooseRole = (role: Role) => {
    selectRole(role);
    router.push(ROLE_ROUTES[role]);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: T.bg }}>
      <div className="w-full max-w-[420px]">
        <div className="flex items-center gap-3 mb-8">
          <span
            className="w-10 h-10 rounded-[10px] flex items-center justify-center text-[15px] font-bold"
            style={{ background: T.accent, color: T.accentInk }}
          >
            A
          </span>
          <div>
            <div className="text-[14.5px] font-semibold" style={{ color: T.text }}>AstroLaabh Operations</div>
            <div className="text-[12px]" style={{ color: T.muted }}>Choose a portal to enter</div>
          </div>
        </div>
        <div className="rounded-[14px] p-5" style={{ background: T.panel, border: `1px solid ${T.border}` }}>
          <p className="text-[12.5px] mb-4" style={{ color: T.muted }}>
            Role-based access — each portal shows only what it may touch. In production a signed-in user carries one role.
          </p>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <button
                key={r.key}
                onClick={() => chooseRole(r.key)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-[10px] text-left transition-colors hover:brightness-125"
                style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }}
              >
                <span>
                  <span className="block text-[13.5px] font-medium">{r.label}</span>
                  <span className="block text-[11.5px] mt-0.5" style={{ color: T.faint }}>{r.note}</span>
                </span>
                <span style={{ color: T.faint }}>→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
