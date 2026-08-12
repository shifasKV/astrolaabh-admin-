"use client";
import Link from "next/link";
import { PageHeader, Card, Chip } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_ORDERS, MOCK_CONSULTATIONS, MOCK_ENERGISATION } from "@/lib/mock";
import { inr } from "@/lib/types";

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

  return (
    <>
      <PageHeader title="Dashboard" sub="Operations overview — what needs attention today" />

      {/* Row 1: Status overview */}
      <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Status</div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <Link href="/orders" className="block">
          <div className="card-interactive rounded-[12px] p-5 text-left" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>Active orders</div>
            <div className="text-[22px] font-bold tabular-nums" style={{ color: T.text }}>{activeOrders}</div>
            <div className="text-[11px] mt-1" style={{ color: T.muted }}>In progress</div>
          </div>
        </Link>

        <Link href="/consultations" className="block">
          <div className="card-interactive rounded-[12px] p-5 text-left" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>Consultations</div>
            <div className="text-[22px] font-bold tabular-nums" style={{ color: T.text }}>{upcomingConsultations}</div>
            <div className="text-[11px] mt-1" style={{ color: T.muted }}>Next 7 days</div>
          </div>
        </Link>

        <Link href="/energisation" className="block">
          <div className="card-interactive rounded-[12px] p-5 text-left" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>Energisation</div>
            <div className="text-[22px] font-bold tabular-nums" style={{ color: T.text }}>{upcomingEnergisation}</div>
            <div className="text-[11px] mt-1" style={{ color: T.muted }}>Next 7 days</div>
          </div>
        </Link>
      </div>

      {/* Row 2: Actions needed */}
      <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Actions needed</div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6 items-stretch">
        <Link href="/orders" className="block h-full">
          <div className="card-interactive rounded-[12px] p-4 text-left h-full" style={{ background: T.card, border: `1px solid ${certsMissing > 0 ? "rgba(176,84,84,0.3)" : T.border}` }}>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1.5 truncate" style={{ color: T.faint }}>Cert missing</div>
            <div className="text-[20px] font-bold tabular-nums" style={{ color: certsMissing > 0 ? T.danger : T.text }}>{certsMissing}</div>
            <div className="text-[11px] mt-1" style={{ color: T.muted }}>Stone order</div>
          </div>
        </Link>

        <Link href="/energisation" className="block h-full">
          <div className="card-interactive rounded-[12px] p-4 text-left h-full" style={{ background: T.card, border: `1px solid ${energisationNotScheduled > 0 ? "rgba(176,84,84,0.3)" : T.border}` }}>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1.5 truncate" style={{ color: T.faint }}>Energ missing</div>
            <div className="text-[20px] font-bold tabular-nums" style={{ color: energisationNotScheduled > 0 ? T.danger : T.text }}>{energisationNotScheduled}</div>
            <div className="text-[11px] mt-1" style={{ color: T.muted }}>Stone order</div>
          </div>
        </Link>

        <Link href="/orders" className="block h-full">
          <div className="card-interactive rounded-[12px] p-4 text-left h-full" style={{ background: T.card, border: `1px solid ${notShipped > 0 ? "rgba(176,84,84,0.3)" : T.border}` }}>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1.5 truncate" style={{ color: T.faint }}>Not shipped</div>
            <div className="text-[20px] font-bold tabular-nums" style={{ color: notShipped > 0 ? T.danger : T.text }}>{notShipped}</div>
            <div className="text-[11px] mt-1" style={{ color: T.muted }}>Stone order</div>
          </div>
        </Link>

        <Link href="/consultations" className="block h-full">
          <div className="card-interactive rounded-[12px] p-4 text-left h-full" style={{ background: T.card, border: `1px solid ${rescheduleRequests > 0 ? "rgba(176,84,84,0.3)" : T.border}` }}>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1.5 truncate" style={{ color: T.faint }}>Reschedule request</div>
            <div className="text-[20px] font-bold tabular-nums" style={{ color: rescheduleRequests > 0 ? T.danger : T.text }}>{rescheduleRequests}</div>
            <div className="text-[11px] mt-1" style={{ color: T.muted }}>Consultation</div>
          </div>
        </Link>

        <Link href="/consultations" className="block h-full">
          <div className="card-interactive rounded-[12px] p-4 text-left h-full" style={{ background: T.card, border: `1px solid ${summariesDue > 0 ? "rgba(176,84,84,0.3)" : T.border}` }}>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1.5 truncate" style={{ color: T.faint }}>Reco. missing</div>
            <div className="text-[20px] font-bold tabular-nums" style={{ color: summariesDue > 0 ? T.danger : T.text }}>{summariesDue}</div>
            <div className="text-[11px] mt-1" style={{ color: T.muted }}>Consultation</div>
          </div>
        </Link>
      </div>

      {/* Recent orders */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Recent orders</div>
          <Link href="/orders" className="text-[12px]" style={{ color: T.accent }}>View all →</Link>
        </div>
        {MOCK_ORDERS.slice(0, 5).map((o, i, arr) => (
          <Link
            key={o.id}
            href={`/orders/${o.id}`}
            className="group flex items-center justify-between gap-4 py-3 row-interactive rounded-[9px] px-2 -mx-2"
            style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
          >
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] truncate">
                <span className="font-medium" style={{ color: T.text }}>{o.customerName}</span>
                <span style={{ color: T.muted }}> — {o.items[0]?.name}</span>
                {o.items.length > 1 && <span style={{ color: T.faint }}> +{o.items.length - 1} more</span>}
              </div>
              <div className="flex items-baseline gap-3 text-[12px] mt-0.5" style={{ color: T.muted }}>
                <span>{new Date(o.placedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</span>
                <span className="uppercase tracking-[0.05em] text-[11px]" style={{ color: T.faint }}>{o.id}</span>
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
              <span className="text-[13.5px] font-semibold tabular-nums w-[92px] text-right" style={{ color: T.text }}>{inr(o.total)}</span>
              <span className="transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: T.faint }}>→</span>
            </div>
          </Link>
        ))}
      </Card>
    </>
  );
}
