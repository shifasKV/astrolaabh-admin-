"use client";
import Link from "next/link";
import { PageHeader, StatCard, Card, Chip } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES, MOCK_AFFILIATE_LINKS, MOCK_REFERRAL_EVENTS, MOCK_PAYOUTS } from "@/lib/mock";
import { inr } from "@/lib/types";

export default function AffiliateDashboard() {
  const affiliate = MOCK_AFFILIATES[0];
  const myLinks = MOCK_AFFILIATE_LINKS.filter((l) => l.affiliateId === affiliate.id);
  const myReferrals = MOCK_REFERRAL_EVENTS.filter((r) => r.affiliateId === affiliate.id);
  const myPayouts = MOCK_PAYOUTS.filter((p) => p.affiliateId === affiliate.id);
  const totalClicks = myLinks.reduce((s, l) => s + l.clicks, 0);
  const totalConversions = myLinks.reduce((s, l) => s + l.conversions, 0);
  const pendingCommission = myReferrals.filter((r) => r.commissionStatus === "pending").reduce((s, r) => s + (r.commissionAmount || 0), 0);
  const approvedCommission = myReferrals.filter((r) => r.commissionStatus === "approved").reduce((s, r) => s + (r.commissionAmount || 0), 0);

  return (
    <>
      <PageHeader title="Dashboard" sub={`Welcome back, ${affiliate.name} · ${affiliate.code}`} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard label="Total clicks" value={totalClicks.toLocaleString()} />
        <StatCard label="Conversions" value={totalConversions} sub={`${((totalConversions / totalClicks) * 100).toFixed(1)}% rate`} />
        <StatCard label="Pending commission" value={inr(pendingCommission)} />
        <StatCard label="Approved" value={inr(approvedCommission)} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total paid" value={inr(affiliate.totalPaid)} />
        <StatCard label="Active links" value={myLinks.filter((l) => l.active).length} />
        <StatCard label="Commission rate" value={`${affiliate.commissionRate}%`} />
        <StatCard label="Member since" value={affiliate.joinedAt} />
      </div>

      {/* Attribution policy */}
      <Card className="mb-4">
        <div className="text-[11px] tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>Your attribution policy</div>
        <p className="text-[13px]" style={{ color: T.muted }}>
          First-touch attribution · 30-day cookie window · {affiliate.commissionRate}% net order value · Commissions held for 14 days after delivery · Returns and refunds claw back.
        </p>
      </Card>

      {/* Recent conversions */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Recent conversions</div>
          <Link href="/referrals" className="text-[12px]" style={{ color: T.accent }}>View all →</Link>
        </div>
        {myReferrals.filter((r) => r.eventType === "order").slice(0, 4).map((r) => (
          <div key={r.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            <div>
              <span className="text-[13px]" style={{ color: T.text }}>{r.maskedCustomer}</span>
              <span className="text-[12px] ml-2" style={{ color: T.muted }}>{r.eventDate} · {r.campaign || "direct"}</span>
            </div>
            <div className="flex items-center gap-2">
              {r.commissionStatus && (
                <Chip tone={r.commissionStatus === "paid" ? "good" : r.commissionStatus === "approved" ? "gold" : "muted"}>
                  {r.commissionStatus}
                </Chip>
              )}
              {r.commissionAmount && <span className="text-[13px] font-semibold tabular-nums" style={{ color: T.accent }}>{inr(r.commissionAmount)}</span>}
            </div>
          </div>
        ))}
      </Card>

      {/* Payout status */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Payouts</div>
          <Link href="/earnings" className="text-[12px]" style={{ color: T.accent }}>View all →</Link>
        </div>
        {myPayouts.slice(0, 3).map((p) => (
          <div key={p.id} className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            <div>
              <span className="text-[13px]" style={{ color: T.text }}>{p.period}</span>
              {p.reference && <span className="text-[11px] ml-2" style={{ color: T.faint }}>{p.reference}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Chip tone={p.status === "paid" ? "good" : "gold"}>{p.status}</Chip>
              <span className="text-[13.5px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(p.amount)}</span>
            </div>
          </div>
        ))}
      </Card>
    </>
  );
}
