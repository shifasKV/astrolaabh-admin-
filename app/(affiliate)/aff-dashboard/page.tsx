"use client";
import { useState, useMemo } from "react";
import { PageHeader, StatCard, Card } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES, MOCK_AFFILIATE_LINKS, MOCK_REFERRAL_EVENTS, MOCK_PAYOUTS } from "@/lib/mock";
import { inr } from "@/lib/types";

const WINDOW = 14;

const generateEarningsData = () => {
  const data: { date: string; amount: number }[] = [];
  const now = new Date();
  for (let i = 41; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({ date: d.toISOString().slice(0, 10), amount: Math.floor(Math.random() * 5000) + 500 });
  }
  return data;
};

const fmtShort = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function AffiliateDashboard() {
  const affiliate = MOCK_AFFILIATES[0];
  const myLinks = MOCK_AFFILIATE_LINKS.filter((l) => l.affiliateId === affiliate.id);
  const myReferrals = MOCK_REFERRAL_EVENTS.filter((r) => r.affiliateId === affiliate.id);

  const totalOrders = myReferrals.filter((r) => r.eventType === "order").length;
  const totalConsultations = myReferrals.filter((r) => r.eventType === "consultation" || r.eventType === "click" || r.eventType === "booking").length;
  const pendingCommission = myReferrals.filter((r) => r.commissionStatus === "pending").reduce((s, r) => s + (r.commissionAmount || 0), 0);
  const paidCommission = MOCK_PAYOUTS.filter((p) => p.affiliateId === affiliate.id && p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalCommission = paidCommission + pendingCommission;
  const pendingOrders = myReferrals.filter((r) => r.eventType === "order" && r.commissionStatus === "pending").length;
  const pendingConsultations = myReferrals.filter((r) => (r.eventType === "consultation" || r.eventType === "booking") && (!r.commissionStatus || r.commissionStatus === "pending")).length;
  const linksGenerated = myLinks.length;

  const [chartOffset, setChartOffset] = useState(0);
  const earningsData = useMemo(() => generateEarningsData(), []);

  const totalWindows = Math.ceil(earningsData.length / WINDOW);
  const windowIdx = totalWindows - 1 - chartOffset;
  const sliceStart = Math.max(0, windowIdx * WINDOW);
  const sliceEnd = Math.min(sliceStart + WINDOW, earningsData.length);
  const chartData = earningsData.slice(sliceStart, sliceEnd);

  const canGoBack = windowIdx > 0;
  const canGoForward = windowIdx < totalWindows - 1;

  const rangeStart = chartData.length > 0 ? fmtShort(chartData[0].date) : "";
  const rangeEnd = chartData.length > 0 ? fmtShort(chartData[chartData.length - 1].date) : "";

  const maxVal = Math.max(...chartData.map((d) => d.amount), 1);
  const chartHeight = 200;

  const commissionRates = {
    consultation: affiliate.commissionRate || 5,
    order: affiliate.commissionRate || 5,
    jewellery: (affiliate.commissionRate || 5) - 2,
  };

  return (
    <>
      <PageHeader title="Dashboard" sub={`Welcome back, ${affiliate.name} · ${affiliate.code}`} />

      {/* Row 1: Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
        <StatCard label="Total orders" value={totalOrders} />
        <StatCard label="Total consultations" value={totalConsultations} />
        <StatCard label="Commission pending" value={inr(pendingCommission)} />
        <StatCard label="Commission paid" value={inr(paidCommission)} />
        <StatCard label="Commission total" value={inr(totalCommission)} />
      </div>

      {/* Row 2: Secondary stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Pending orders" value={pendingOrders} />
        <StatCard label="Pending consultations" value={pendingConsultations} />
        <StatCard label="Links generated" value={linksGenerated} />
      </div>

      {/* Row 3: Commission rates */}
      <Card className="mb-5">
        <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Commission rates</div>
        <div className="grid grid-cols-3 gap-4">
          {([
            { label: "Consultation", rate: commissionRates.consultation },
            { label: "Stone order", rate: commissionRates.order },
            { label: "Jewellery order", rate: commissionRates.jewellery },
          ] as const).map((c) => (
            <div key={c.label} className="rounded-[10px] p-4 text-center" style={{ background: T.panel, border: `1px solid ${T.borderSoft}` }}>
              <div className="font-title text-[28px] font-semibold tracking-[-0.02em]" style={{ color: T.accent }}>{c.rate}%</div>
              <div className="text-[12px] mt-1" style={{ color: T.muted }}>{c.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Row 4: Earnings chart */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Earnings</div>
            <div className="text-[13px] font-medium mt-0.5" style={{ color: T.text }}>{rangeStart} – {rangeEnd}</div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setChartOffset((o) => o + 1)}
              disabled={!canGoBack}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[14px] transition-all cursor-pointer disabled:opacity-30"
              style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, color: T.muted }}
              title="Previous 14 days"
            >‹</button>
            <button
              onClick={() => setChartOffset((o) => Math.max(0, o - 1))}
              disabled={!canGoForward}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[14px] transition-all cursor-pointer disabled:opacity-30"
              style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, color: T.muted }}
              title="Next 14 days"
            >›</button>
          </div>
        </div>

        {/* Line chart */}
        <div className="relative" style={{ height: chartHeight + 30 }}>
          {/* Y-axis guide lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
            <div key={pct} className="absolute left-0 flex items-center gap-2 w-full" style={{ top: chartHeight - pct * chartHeight }}>
              <span className="text-[10px] tabular-nums w-[50px] text-right shrink-0" style={{ color: T.faint }}>{inr(Math.round(maxVal * pct))}</span>
              <div className="flex-1 h-px" style={{ background: T.borderSoft }} />
            </div>
          ))}

          {/* SVG line */}
          <svg
            viewBox={`0 0 ${chartData.length * 60} ${chartHeight}`}
            className="absolute"
            style={{ left: 58, top: 0, width: `calc(100% - 58px)`, height: chartHeight }}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.accent} stopOpacity="0.15" />
                <stop offset="100%" stopColor={T.accent} stopOpacity="0.01" />
              </linearGradient>
            </defs>
            <path
              d={
                `M 0 ${chartHeight} ` +
                chartData.map((d, i) => `L ${i * 60 + 30} ${chartHeight - (d.amount / maxVal) * (chartHeight - 10)}`).join(" ") +
                ` L ${(chartData.length - 1) * 60 + 30} ${chartHeight} Z`
              }
              fill="url(#earningsFill)"
            />
            <polyline
              points={chartData.map((d, i) => `${i * 60 + 30},${chartHeight - (d.amount / maxVal) * (chartHeight - 10)}`).join(" ")}
              fill="none"
              stroke={T.accent}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {chartData.map((d, i) => (
              <circle
                key={i}
                cx={i * 60 + 30}
                cy={chartHeight - (d.amount / maxVal) * (chartHeight - 10)}
                r="3.5"
                fill={T.card}
                stroke={T.accent}
                strokeWidth="2"
              />
            ))}
          </svg>

          {/* X-axis labels */}
          <div className="absolute flex justify-between" style={{ left: 58, bottom: 0, width: `calc(100% - 58px)` }}>
            {chartData.map((d, i) => (
              <div key={i} className="text-[10px] text-center tabular-nums" style={{ color: T.faint, width: 60 }}>
                {fmtShort(d.date)}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}
