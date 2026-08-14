"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, StatCard, Chip, GoldBtn, SearchFilter } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES, MOCK_REFERRAL_EVENTS, MOCK_CUSTOMERS, MOCK_ORDERS, MOCK_CONSULTATIONS } from "@/lib/mock";
import { inr } from "@/lib/types";

function getAffiliateStats(affiliate: typeof MOCK_AFFILIATES[number]) {
  const referredCustomers = MOCK_CUSTOMERS.filter((c) => c.affiliateCode === affiliate.code);
  const customerIds = new Set(referredCustomers.map((c) => c.id));
  const orders = MOCK_ORDERS.filter((o) => customerIds.has(o.customerId));
  const consultations = MOCK_CONSULTATIONS.filter((c) => customerIds.has(c.customerId));
  const rate = affiliate.commissionRate / 100;
  const totalCommission =
    orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + Math.round(o.total * rate), 0) +
    consultations.filter((c) => c.paymentStatus === "paid").reduce((s, c) => s + Math.round(c.fee * rate), 0);

  return {
    purchases: orders.length,
    consultations: consultations.length,
    registrations: referredCustomers.length,
    pendingCommission: totalCommission,
  };
}

export default function AffiliatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const totalAccrued = MOCK_AFFILIATES.reduce((s, a) => s + a.totalAccrued, 0);
  const totalRegs = MOCK_AFFILIATES.reduce((s, a) => s + a.totalRegistrations, 0);
  const totalPurchases = MOCK_AFFILIATES.reduce((s, a) => s + a.totalPurchases, 0);

  const filtered = MOCK_AFFILIATES.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
  });

  return (
    <>
      <PageHeader
        title="Affiliate operations"
        sub="Manage affiliates, attribution, commissions, and payouts"
        action={<GoldBtn onClick={() => router.push("/affiliates/create")}>+ New Affiliate</GoldBtn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Active affiliates" value={MOCK_AFFILIATES.filter((a) => a.status === "active").length} />
        <StatCard label="Referred registrations" value={totalRegs} />
        <StatCard label="Referred purchases" value={totalPurchases} />
        <StatCard label="Commission accrued" value={inr(totalAccrued)} />
      </div>

      <div className="mb-4">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search name, code, email…" />
      </div>

      <div className="grid gap-4">
        {filtered.map((a) => {
          const stats = getAffiliateStats(a);
          return (
            <Link key={a.id} href={`/affiliates/${a.id}`}>
              <Card className="card-interactive cursor-pointer">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <span
                      className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-semibold shrink-0"
                      style={{ background: `${T.accent}18`, border: `1.5px solid ${T.accent}40`, color: T.accent }}
                    >
                      {a.name[0]}
                    </span>
                    <div>
                      <div className="text-[14px] font-semibold" style={{ color: T.text }}>{a.name}</div>
                      <div className="text-[13px] mt-0.5" style={{ color: T.muted }}>{a.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Chip tone={a.status === "active" ? "good" : a.status === "under_review" ? "gold" : "danger"}>
                      {a.status.replace(/_/g, " ")}
                    </Chip>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  {[
                    { label: "Purchases", value: stats.purchases, status: "completed", tone: T.good },
                    { label: "Consultations", value: stats.consultations, status: "completed", tone: T.good },
                    { label: "Registrations", value: stats.registrations, status: "completed", tone: T.good },
                    { label: "Commission", value: inr(stats.pendingCommission), status: "due", tone: stats.pendingCommission > 0 ? T.accent : T.good },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>{s.label}</div>
                      <div className="text-[15px] font-semibold mt-0.5 tabular-nums" style={{ color: T.text }}>{s.value}</div>
                      <div className="text-[10px] font-medium mt-0.5" style={{ color: s.tone }}>{s.status}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-[13.5px] text-center py-8" style={{ color: T.muted }}>No affiliates found.</p>
        )}
      </div>
    </>
  );
}
