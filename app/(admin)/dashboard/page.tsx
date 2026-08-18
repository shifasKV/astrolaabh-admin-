"use client";
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

  /* Orders per month, last 6 months — feeds the hero bar chart */
  const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
  const monthlyCounts = months.map(
    (m) =>
      MOCK_ORDERS.filter((o) => {
        const d = new Date(o.placedAt);
        return d.getFullYear() === m.getFullYear() && d.getMonth() === m.getMonth();
      }).length,
  );
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
                  Active orders
                </div>
                <div className="font-title text-[42px] leading-none font-semibold mt-3 tracking-[-0.02em] tabular-nums" style={{ color: T.text }}>
                  {activeOrders}
                </div>
                <div className="text-[12.5px] mt-2.5" style={{ color: T.muted }}>
                  in progress · {inr(monthRevenue)} collected this month
                </div>
              </div>
              <CircleArrow />
            </div>

            {/* Monthly volume, current month in mint */}
            <div className="mt-auto pt-6">
              <div className="flex items-end gap-1.5 h-[56px]">
                {monthlyCounts.map((c, i) => (
                  <div key={i} className="group/bar relative flex-1 h-full flex items-end">
                    <span
                      className="pointer-events-none absolute -top-1.5 left-1/2 -translate-x-1/2 translate-y-1 opacity-0 group-hover/bar:opacity-100 group-hover/bar:translate-y-0 transition-all duration-150 text-[10.5px] font-semibold px-2 py-0.5 rounded-[6px] tabular-nums whitespace-nowrap"
                      style={{ background: "#5e4a20", color: "#faf0d8" }}
                    >
                      {c} {c === 1 ? "order" : "orders"}
                    </span>
                    <div
                      className="w-full rounded-t-[4px] transition-all duration-300 group-hover/bar:brightness-125"
                      style={{
                        height: `${Math.max((c / maxMonthly) * 100, 6)}%`,
                        background: i === monthlyCounts.length - 1 ? "#c3a058" : "rgba(160,125,56,0.20)",
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 mt-1.5">
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
