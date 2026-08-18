"use client";
import { useMemo } from "react";
import Link from "next/link";
import { PageHeader, Card, StatCard, Chip } from "@/components/ui";
import { T } from "@/lib/theme";
import { useAuth } from "@/lib/store/auth";
import { MOCK_INCOMPLETE_ORDERS, MOCK_INCOMPLETE_CONSULTATIONS, MOCK_SALES_MEMBERS } from "@/lib/mock";
import { inr } from "@/lib/types";

const REASON_LABEL: Record<string, string> = {
  payment_failed: "Payment failed",
  abandoned_cart: "Abandoned cart",
  payment_expired: "Payment expired",
  card_declined: "Card declined",
  requested_call: "Requested call",
  slot_check: "Slot check",
};
const REASON_TONE: Record<string, "danger" | "gold" | "muted"> = {
  payment_failed: "danger",
  abandoned_cart: "gold",
  payment_expired: "danger",
  card_declined: "danger",
  requested_call: "gold",
  slot_check: "gold",
};
const STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow up",
  converted: "Converted",
  lost: "Lost",
};
const STATUS_TONE: Record<string, "info" | "gold" | "good" | "muted"> = {
  new: "info",
  contacted: "gold",
  follow_up: "gold",
  converted: "good",
  lost: "muted",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function SalesDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === "sales_admin";
  const myId = user?.id;

  const stoneLeads = useMemo(() => {
    if (isAdmin) return MOCK_INCOMPLETE_ORDERS;
    return MOCK_INCOMPLETE_ORDERS.filter((o) => o.assignedTo === myId);
  }, [isAdmin, myId]);

  const conLeads = useMemo(() => {
    if (isAdmin) return MOCK_INCOMPLETE_CONSULTATIONS;
    return MOCK_INCOMPLETE_CONSULTATIONS.filter((c) => c.assignedTo === myId);
  }, [isAdmin, myId]);

  const allLeads = [...stoneLeads, ...conLeads];
  const activeLeads = allLeads.filter((l) => l.leadStatus === "new" || l.leadStatus === "contacted" || l.leadStatus === "follow_up").length;
  const newLeads = allLeads.filter((l) => l.leadStatus === "new").length;
  const converted = allLeads.filter((l) => l.leadStatus === "converted").length;
  const unassigned = isAdmin ? allLeads.filter((l) => !l.assignedTo).length : 0;

  const recentStone = stoneLeads
    .filter((o) => o.leadStatus !== "converted" && o.leadStatus !== "lost")
    .sort((a, b) => new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime())
    .slice(0, 5);

  const recentCon = conLeads
    .filter((c) => c.leadStatus !== "converted" && c.leadStatus !== "lost")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title={isAdmin ? "Sales Dashboard" : "My Dashboard"}
      />

      <div className={`grid grid-cols-2 ${isAdmin ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-3 mb-6`}>
        <StatCard label="Total leads" value={allLeads.length} featured />
        <StatCard label="Active" value={activeLeads} />
        <StatCard label="New" value={newLeads} />
        <StatCard label="Converted" value={converted} />
        {isAdmin && <StatCard label="Unassigned" value={unassigned} />}
      </div>

      {/* Admin: team overview */}
      {isAdmin && (
        <Card className="mb-6">
          <div className="text-[15px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Team performance</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {MOCK_SALES_MEMBERS.filter((m) => m.status === "active").map((m) => {
              const mStone = MOCK_INCOMPLETE_ORDERS.filter((o) => o.assignedTo === m.id);
              const mCon = MOCK_INCOMPLETE_CONSULTATIONS.filter((c) => c.assignedTo === m.id);
              const mActive = [...mStone, ...mCon].filter((l) => l.leadStatus === "new" || l.leadStatus === "contacted" || l.leadStatus === "follow_up").length;
              return (
                <div key={m.id} className="rounded-[10px] p-3.5" style={{ background: T.panel, border: `1px solid ${T.borderSoft}` }}>
                  <div className="text-[13px] font-medium" style={{ color: T.text }}>{m.name}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: T.faint }}>{m.role}</div>
                  <div className="flex items-center gap-3 mt-2 text-[12px]">
                    <span style={{ color: T.text }}><strong>{mStone.length + mCon.length}</strong> leads</span>
                    <span style={{ color: mActive > 0 ? T.accent : T.faint }}>{mActive} active</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent stone leads */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Recent stone leads</div>
            <Link href="/stone-leads" className="text-[12px] font-medium" style={{ color: T.accent }}>View all →</Link>
          </div>
          {recentStone.length === 0 && <div className="text-[13px] py-4" style={{ color: T.muted }}>No active stone leads.</div>}
          <div className="space-y-1">
            {recentStone.map((o) => (
              <Link key={o.id} href={`/stone-leads/${o.id}`}>
                <div className="flex items-center justify-between gap-3 px-2 py-2 rounded-[8px] row-interactive cursor-pointer" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{o.customerName}</div>
                    <div className="text-[11px] truncate" style={{ color: T.faint }}>{o.itemName}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Chip tone={STATUS_TONE[o.leadStatus] || "muted"}>{STATUS_LABEL[o.leadStatus]}</Chip>
                    <span className="text-[12px]" style={{ color: T.muted }}>{fmtDate(o.failedAt)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent consultation leads */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Recent consultation leads</div>
            <Link href="/consultation-leads" className="text-[12px] font-medium" style={{ color: T.accent }}>View all →</Link>
          </div>
          {recentCon.length === 0 && <div className="text-[13px] py-4" style={{ color: T.muted }}>No active consultation leads.</div>}
          <div className="space-y-1">
            {recentCon.map((c) => (
              <Link key={c.id} href={`/consultation-leads/${c.id}`}>
                <div className="flex items-center justify-between gap-3 px-2 py-2 rounded-[8px] row-interactive cursor-pointer" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{c.customerName}</div>
                    <div className="text-[11px] truncate" style={{ color: T.faint }}>{c.expertName} · {c.consultationType}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Chip tone={STATUS_TONE[c.leadStatus] || "muted"}>{STATUS_LABEL[c.leadStatus]}</Chip>
                    <span className="text-[12px]" style={{ color: T.muted }}>{fmtDate(c.date)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
