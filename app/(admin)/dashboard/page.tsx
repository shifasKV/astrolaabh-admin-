"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_ORDERS, MOCK_CONSULTATIONS, MOCK_ENERGISATION } from "@/lib/mock";
import { inr } from "@/lib/types";

/* Single tertiary affordance for card actions — quiet circle, diagonal arrow,
   lifts on hover. Replaces the repeated "text →" links. */
function CircleArrow({ dark }: { dark?: boolean }) {
  return (
    <span
      className="w-7 h-7 rounded-full inline-flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      style={
        dark
          ? { border: "1px solid rgba(244,241,229,0.22)", color: "#f4f1e5", background: "rgba(244,241,229,0.07)" }
          : { border: `1px solid ${T.border}`, color: T.muted, background: T.card }
      }
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
        <path d="M7 17L17 7M17 7H9M17 7v8" />
      </svg>
    </span>
  );
}

export default function AdminDashboard() {
  const [chartHover, setChartHover] = useState(false);
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const activeOrders = MOCK_ORDERS.filter((o) => o.paymentStatus === "paid" && o.stage < 7).length;

  const upcomingConsultations = MOCK_CONSULTATIONS.filter((c) => {
    if (c.status !== "scheduled") return false;
    const d = new Date(c.scheduledAt);
    return d >= now && d <= in7Days;
  }).length;

  const upcomingEnergisation = MOCK_ENERGISATION.filter((e) => {
    if (e.status !== "scheduled") return false;
    if (!e.scheduledAt) return false;
    const d = new Date(e.scheduledAt);
    return d >= now && d <= in7Days;
  }).length;

  const certsMissing = MOCK_ORDERS.filter((o) => o.certificateStatus === "missing" && o.paymentStatus === "paid").length;
  const energisationNotScheduled = MOCK_ENERGISATION.filter((e) => e.status === "pending").length;
  const notShipped = MOCK_ORDERS.filter((o) => o.paymentStatus === "paid" && o.shopifyStatus !== "fulfilled" && !o.tracking).length;
  const rescheduleRequests = MOCK_CONSULTATIONS.filter((c) => c.status === "reschedule_requested").length;
  const summariesDue = MOCK_CONSULTATIONS.filter((c) => c.status === "summary_pending").length;
  const noShows = MOCK_CONSULTATIONS.filter((c) => c.status === "no_show").length;

  /* Orders per month, last 6 months — feeds the hero bar chart with fulfillment breakdown */
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
  const monthlyBreakdown = months.map((m) => {
    const inMonth = MOCK_ORDERS.filter((o) => {
      const d = new Date(o.placedAt);
      return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
    });
    return {
      total: inMonth.length,
      completed: inMonth.filter((o) => o.operationalStatus === "completed").length,
      inTransit: inMonth.filter((o) => o.stage === 7 && o.operationalStatus !== "completed").length,
      notShipped: inMonth.filter((o) => o.stage < 7 && o.operationalStatus !== "completed").length,
    };
  });
  const monthlyCounts = monthlyBreakdown.map((b) => b.total);
  const maxMonthly = Math.max(...monthlyCounts, 1);
  const monthRevenue = MOCK_ORDERS.filter((o) => {
    const d = new Date(o.placedAt);
    return o.paymentStatus === "paid" && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).reduce((sum, o) => sum + o.total, 0);

  const attention = [
    { label: "Certificates missing", scope: "Stone orders", count: certsMissing, href: "/orders" },
    { label: "Energisation not scheduled", scope: "Stone orders", count: energisationNotScheduled, href: "/energisation" },
    { label: "Not shipped", scope: "Stone orders", count: notShipped, href: "/orders" },
    { label: "Reschedule requests", scope: "Consultations", count: rescheduleRequests, href: "/consultations" },
    { label: "No-shows", scope: "Consultations", count: noShows, href: "/consultations" },
    { label: "Recommendations missing", scope: "Consultations", count: summariesDue, href: "/consultations" },
  ].sort((a, b) => b.count - a.count);
  const attentionTotal = attention.reduce((s, a) => s + a.count, 0);

  return (
    <>
      <PageHeader
        title="Dashboard"
        action={
          <span className="text-[12.5px] tabular-nums" style={{ color: T.faint }}>
            {now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        }
      />

      {/* Hero band — one dark anchor card, two supporting KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-6 items-stretch">
        <Link href="/orders" className="lg:col-span-7 block group">
          <div
            className="rounded-[18px] p-6 h-full flex flex-col transition-all duration-300 group-hover:-translate-y-[2px]"
            style={{ background: "linear-gradient(160deg, #faf0d8 0%, #efdfb8 100%)", border: "1px solid rgba(160,125,56,0.35)", boxShadow: T.shadow }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-medium tracking-[0.09em] uppercase" style={{ color: "#8a6a2f" }}>
                  All active orders
                </div>
                <div className="font-title text-[42px] leading-none font-semibold mt-3 tracking-[-0.02em] tabular-nums transition-all duration-150" style={{ color: T.text, textDecoration: chartHover ? "none" : undefined, textDecorationColor: "rgba(160,125,56,0.35)" }}>
                  <span className={`underline-offset-4 decoration-2 ${chartHover ? "" : "group-hover:underline"}`} style={{ textDecorationColor: "rgba(160,125,56,0.35)" }}>{activeOrders}</span>
                </div>
              </div>
              <CircleArrow />
            </div>

            {/* Monthly volume — simple bar chart (all orders) */}
            <div className="mt-auto pt-4" onMouseEnter={() => setChartHover(true)} onMouseLeave={() => setChartHover(false)}>
              <div className="flex items-end gap-2 h-[64px]">
                {monthlyBreakdown.map((b, i) => {
                  const isCurrent = i === monthlyBreakdown.length - 1;
                  return (
                    <div key={i} className="group/bar relative flex-1 h-full flex items-end">
                      {/* Tooltip */}
                      <div
                        className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150 z-10"
                      >
                        <div className="rounded-[10px] px-3 py-2.5 min-w-[90px] text-center" style={{ background: "rgba(41,38,23,0.92)", backdropFilter: "blur(8px)", boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}>
                          <div className="text-[10px] mb-1" style={{ color: "rgba(250,246,236,0.55)" }}>
                            {months[i].toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                          </div>
                          <div className="text-[18px] font-bold tabular-nums leading-none" style={{ color: "#faf6ec" }}>{b.total}</div>
                          <div className="text-[10px] mt-0.5" style={{ color: "rgba(250,246,236,0.5)" }}>orders</div>
                        </div>
                        <div className="w-2 h-2 rotate-45 mx-auto -mt-1" style={{ background: "rgba(41,38,23,0.92)" }} />
                      </div>
                      {/* Bar — single solid color */}
                      <div
                        className="w-full rounded-[5px] transition-all duration-300 group-hover/bar:scale-x-105"
                        style={{ height: `${Math.max((b.total / maxMonthly) * 100, 8)}%`, background: isCurrent ? "#c3a058" : "rgba(160,125,56,0.22)", minHeight: 3 }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-1.5">
                {months.map((m, i) => (
                  <div key={i} className="flex-1 text-center text-[10px] tabular-nums" style={{ color: i === months.length - 1 ? "#8a6a2f" : T.faint }}>
                    {m.toLocaleDateString("en-IN", { month: "short" })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Link>

        <div className="lg:col-span-5 flex flex-col gap-3">
          {[
            { href: "/consultations", label: "Consultations", value: upcomingConsultations, sub: "scheduled in the next 7 days" },
            { href: "/energisation", label: "Energisation", value: upcomingEnergisation, sub: "rituals in the next 7 days" },
          ].map((k) => (
            <Link key={k.href} href={k.href} className="flex-1 block group">
              <div
                className="card-interactive rounded-[18px] p-6 h-full flex items-center justify-between gap-4"
                style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }}
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-medium tracking-[0.09em] uppercase" style={{ color: T.faint }}>{k.label}</div>
                  <div className="flex items-baseline gap-2.5 mt-2">
                    <span className="font-title text-[34px] leading-none font-semibold tracking-[-0.02em] tabular-nums" style={{ color: T.text }}>{k.value}</span>
                    <span className="text-[12.5px]" style={{ color: T.muted }}>{k.sub}</span>
                  </div>
                </div>
                <CircleArrow />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Work band — attention list beside recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
        <div className="lg:col-span-5">
          <Card className="!p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>
                Needs attention
              </h2>
              {attentionTotal > 0 ? (
                <span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-full tabular-nums" style={{ background: "rgba(163,73,63,0.12)", color: T.danger }}>
                  {attentionTotal} open
                </span>
              ) : (
                <span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(95,112,64,0.13)", color: T.good }}>
                  All clear
                </span>
              )}
            </div>
            <div className="text-[12.5px] mb-2" style={{ color: T.muted }}>
              Blocking items across orders and consultations
            </div>
            {attention.map((a, i, arr) => (
              <Link
                key={a.label}
                href={a.href}
                className="group flex items-center gap-3 py-3 px-2 -mx-2 row-interactive rounded-[10px]"
                style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium truncate" style={{ color: a.count > 0 ? T.text : T.muted }}>
                    {a.label}
                  </div>
                  <div className="text-[11.5px] mt-0.5" style={{ color: T.faint }}>
                    {a.scope}
                  </div>
                </div>
                <span
                  className="text-[12.5px] font-semibold tabular-nums shrink-0 min-w-[28px] h-7 px-2 rounded-full inline-flex items-center justify-center"
                  style={
                    a.count > 0
                      ? { background: "rgba(163,73,63,0.10)", color: T.danger }
                      : { background: "rgba(89,82,54,0.06)", color: T.faint }
                  }
                >
                  {a.count}
                </span>
              </Link>
            ))}
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card className="!p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>
                Recent orders
              </h2>
              <Link href="/orders" className="text-[12.5px] font-medium hover:underline underline-offset-4" style={{ color: T.accent }}>
                View all
              </Link>
            </div>
            <div className="text-[12.5px] mb-2" style={{ color: T.muted }}>
              Latest activity across stone orders
            </div>
            {MOCK_ORDERS.slice(0, 5).map((o, i, arr) => (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="group flex items-center justify-between gap-4 py-3 row-interactive rounded-[10px] px-2 -mx-2"
                style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span
                    className="w-9 h-9 rounded-[11px] inline-flex items-center justify-center text-[12px] font-semibold shrink-0"
                    style={{ background: T.accentFaint, border: `1px solid ${T.borderSoft}`, color: T.accent }}
                  >
                    {o.customerName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-semibold truncate" style={{ color: T.text }}>
                      {o.customerName}
                    </div>
                    <div className="text-[12.5px] mt-0.5 truncate" style={{ color: T.muted }}>
                      {o.items[0]?.name}
                      {o.items.length > 1 && <span style={{ color: T.faint }}> +{o.items.length - 1} more</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {o.paymentStatus === "pending" ? (
                    <Chip tone="gold">Payment pending</Chip>
                  ) : o.certificateStatus === "missing" ? (
                    <Chip tone="danger">Cert missing</Chip>
                  ) : o.stage === 7 ? (
                    <Chip tone="good">Delivered</Chip>
                  ) : o.tracking ? (
                    <Chip tone="info">In transit</Chip>
                  ) : (
                    <Chip tone="muted">In progress</Chip>
                  )}
                  <div className="text-right w-[110px]">
                    <div className="text-[13.5px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(o.total)}</div>
                    <div className="text-[11px] mt-0.5 tabular-nums" style={{ color: T.faint }}>
                      {new Date(o.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {o.id.replace("AL-ORD-", "#")}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </Card>
        </div>
      </div>
    </>
  );
}
