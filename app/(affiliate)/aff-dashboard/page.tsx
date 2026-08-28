"use client";
import { useState, useMemo } from "react";
import { PageHeader, StatCard, Card } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_AFFILIATES, MOCK_REFERRAL_EVENTS, MOCK_PAYOUTS } from "@/lib/mock";
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
  const myReferrals = MOCK_REFERRAL_EVENTS.filter((r) => r.affiliateId === affiliate.id);

  const totalOrders = myReferrals.filter((r) => r.eventType === "order").length;
  const totalConsultations = myReferrals.filter((r) => r.eventType === "booking").length;
  const pendingCommission = myReferrals.filter((r) => r.commissionStatus === "pending").reduce((s, r) => s + (r.commissionAmount || 0), 0);
  const paidCommission = MOCK_PAYOUTS.filter((p) => p.affiliateId === affiliate.id && p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalCommission = paidCommission + pendingCommission;
  const pendingOrders = myReferrals.filter((r) => r.eventType === "order" && r.commissionStatus === "pending").length;
  const pendingConsultations = myReferrals.filter((r) => r.eventType === "booking" && (!r.commissionStatus || r.commissionStatus === "pending")).length;
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
      <PageHeader title="Dashboard" />

      {/* Hero — commission earnings + rates */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4 mb-4 items-stretch">
        {/* Earnings hero */}
        <div className="relative overflow-hidden rounded-[18px] p-6 md:p-7 flex flex-col justify-between" style={{ background: "linear-gradient(150deg, #faf0d8 0%, #efdfb8 100%)", border: "1px solid rgba(160,125,56,0.30)", boxShadow: T.shadow }}>
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 70% at 90% 0%, rgba(160,125,56,0.18), transparent 65%)" }} />
          <div className="relative">
            <div className="text-[11px] font-medium tracking-[0.1em] uppercase" style={{ color: "#8a6a2f" }}>Total commission earned</div>
            <div className="font-title text-[38px] md:text-[46px] font-bold tracking-[-0.03em] leading-none mt-2" style={{ color: "#5a441c" }}>{inr(totalCommission)}</div>
          </div>
          <div className="relative flex items-stretch gap-6 mt-6 pt-5" style={{ borderTop: "1px solid rgba(160,125,56,0.24)" }}>
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.06em] uppercase" style={{ color: "#8a6a2f" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.gold }} /> Pending
              </div>
              <div className="font-title text-[22px] font-bold tabular-nums tracking-[-0.02em] mt-1" style={{ color: "#5a441c" }}>{inr(pendingCommission)}</div>
              <div className="text-[11.5px] mt-0.5" style={{ color: "#8a6a2f" }}>in holding period</div>
            </div>
            <div className="w-px shrink-0" style={{ background: "rgba(160,125,56,0.22)" }} />
            <div className="flex-1">
              <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-[0.06em] uppercase" style={{ color: "#8a6a2f" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.good }} /> Paid out
              </div>
              <div className="font-title text-[22px] font-bold tabular-nums tracking-[-0.02em] mt-1" style={{ color: "#5a441c" }}>{inr(paidCommission)}</div>
              <div className="text-[11.5px] mt-0.5" style={{ color: "#8a6a2f" }}>lifetime</div>
            </div>
          </div>
        </div>

        {/* Commission rates */}
        <Card className="!p-6 flex flex-col">
          <div className="text-[13px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Your commission rates</div>
          <p className="text-[12px] mt-0.5 mb-3" style={{ color: T.muted }}>Applied on every referred sale.</p>
          <div className="flex-1 flex flex-col justify-center">
            {([
              { label: "Consultation", rate: commissionRates.consultation },
              { label: "Stone order", rate: commissionRates.order },
              { label: "Jewellery order", rate: commissionRates.jewellery },
            ] as const).map((c, i) => (
              <div key={c.label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0" style={i > 0 ? { borderTop: `1px solid ${T.borderSoft}` } : undefined}>
                <span className="text-[13.5px]" style={{ color: T.muted }}>{c.label}</span>
                <span className="font-title text-[20px] font-bold tabular-nums tracking-[-0.02em]" style={{ color: T.accent }}>{c.rate}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Customer discount rates */}
      <Card className="!p-6 mb-4">
        <div className="text-[13px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Customer discount rates</div>
        <p className="text-[12px] mt-0.5 mb-3" style={{ color: T.muted }}>Discount your referred customers receive on their first purchase.</p>
        <div className="flex-1 flex flex-col justify-center">
          {([
            { label: "Consultation", rate: 5 },
            { label: "Stone order", rate: 3 },
            { label: "Jewellery order", rate: 2 },
          ] as const).map((c, i) => (
            <div key={c.label} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0" style={i > 0 ? { borderTop: `1px solid ${T.borderSoft}` } : undefined}>
              <span className="text-[13.5px]" style={{ color: T.muted }}>{c.label}</span>
              <span className="font-title text-[20px] font-bold tabular-nums tracking-[-0.02em]" style={{ color: T.good }}>{c.rate}%</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Activity stats */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-4">
        <StatCard label="Total orders" value={totalOrders} />
        <StatCard label="Total consultations" value={totalConsultations} />
        <StatCard label="Pending orders" value={pendingOrders} />
        <StatCard label="Pending consultations" value={pendingConsultations} />
      </div>

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

          {/* Hover layer — one column per day, guide line + tooltip on hover */}
          <div className="absolute flex" style={{ left: 58, top: 0, width: "calc(100% - 58px)", height: chartHeight }}>
            {chartData.map((d, i) => {
              const y = chartHeight - (d.amount / maxVal) * (chartHeight - 10);
              const below = y < 52;
              return (
                <div key={i} className="relative flex-1 group">
                  {/* vertical guide */}
                  <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={{ background: T.accentBorder }} />
                  {/* highlighted point */}
                  <div className="absolute w-[11px] h-[11px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 -translate-x-1/2 -translate-y-1/2" style={{ left: "50%", top: y, background: T.accent, boxShadow: `0 0 0 3px ${T.card}` }} />
                  {/* tooltip */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-20 whitespace-nowrap rounded-[9px] px-2.5 py-1.5 text-center"
                    style={{
                      top: below ? y + 14 : y - 14,
                      transform: below ? "translate(-50%,0)" : "translate(-50%,-100%)",
                      background: T.card,
                      border: `1px solid ${T.borderSoft}`,
                      boxShadow: T.shadowLift,
                    }}
                  >
                    <div className="text-[10px]" style={{ color: T.faint }}>{new Date(d.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</div>
                    <div className="text-[13px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(d.amount)}</div>
                  </div>
                </div>
              );
            })}
          </div>

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
