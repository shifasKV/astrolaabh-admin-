"use client";
import { use, useMemo, useState } from "react";
import Link from "next/link";
import { Card, Chip, GoldBtn, BackLink, Select, Textarea } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_SALES_MEMBERS } from "@/lib/mock";
import type { IncompleteOrderStatus } from "@/lib/mock";
import { useLeads, type ActivityEntry } from "@/lib/store/leads";

const ASSIGN_OPTIONS = [{ value: "", label: "Unassigned" }, ...MOCK_SALES_MEMBERS.filter((m) => m.status === "active").map((m) => ({ value: m.id, label: m.name }))];

const REASON_LABEL: Record<string, string> = {
  payment_failed: "Payment failed",
  abandoned_cart: "Abandoned cart",
  payment_expired: "Payment expired",
  card_declined: "Card declined",
  requested_call: "Requested call",
};
const REASON_TONE: Record<string, "danger" | "gold" | "muted"> = {
  payment_failed: "danger",
  abandoned_cart: "gold",
  payment_expired: "danger",
  card_declined: "danger",
  requested_call: "gold",
};

const STATUS_LABEL: Record<IncompleteOrderStatus, string> = {
  new: "New lead",
  contacted: "Contacted",
  follow_up: "Follow up",
  converted: "Converted",
  lost: "Lost",
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function fmtTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function inr(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

export default function IncompleteOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { orderLeads, assign, setStatus, logActivity } = useLeads();
  const order = orderLeads.find((o) => o.id === id);

  const [activityNote, setActivityNote] = useState("");
  const [toast, setToast] = useState("");

  // Seeded historical entries (remarks / last contact) shown after live store activity.
  const seeded = useMemo<ActivityEntry[]>(() => {
    if (!order) return [];
    const log: ActivityEntry[] = [];
    if (order.remarks) log.push({ text: order.remarks, at: order.lastContactedAt || order.failedAt, type: "note" });
    if (order.lastContactedAt) log.push({ text: `Marked "${STATUS_LABEL[order.leadStatus]}"`, at: order.lastContactedAt, type: "status" });
    return log;
  }, [order]);

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: T.muted }}>Incomplete order not found.</p>
        <div className="mt-3 flex justify-center"><BackLink label="Orders" href="/orders" /></div>
      </div>
    );
  }

  const leadStatus = order.leadStatus;
  const timeline = [...order.activity, ...seeded];

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleStatusChange = (val: string) => {
    const newStatus = val as IncompleteOrderStatus;
    const now = new Date().toISOString();
    setStatus(id, newStatus);
    logActivity(id, { text: `Status changed from "${STATUS_LABEL[leadStatus]}" to "${STATUS_LABEL[newStatus]}"`, at: now, type: "status" });
    flash(`Lead marked as ${STATUS_LABEL[newStatus]}`);
  };

  const handleAssign = (val: string) => {
    assign(id, val);
    flash(val ? `Assigned to ${ASSIGN_OPTIONS.find((o) => o.value === val)?.label}` : "Unassigned");
  };

  const handleLogActivity = () => {
    const now = new Date().toISOString();
    const text = activityNote.trim() || "Call logged";
    logActivity(id, { text, at: now, type: "call" });
    setActivityNote("");
    if (leadStatus === "new") {
      setStatus(id, "contacted");
      logActivity(id, { text: `Status auto-updated to "Contacted"`, at: now, type: "status" });
    }
    flash("Activity logged");
  };

  return (
    <>
      <div className="mb-5">
        <BackLink label="Incomplete orders" href="/orders?tab=incomplete" />
      </div>

      {/* Header */}
      <Card className="mb-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link href={`/customers/${order.customerId}`} className="text-[18px] font-semibold hover:underline" style={{ color: T.text }}>{order.customerName}</Link>
              <span style={{ color: T.faint }}>·</span>
              <a href={`tel:${order.customerPhone.replace(/\s/g, "")}`} className="text-[15px] font-medium tabular-nums hover:underline" style={{ color: T.accent }}>{order.customerPhone}</a>
              <span style={{ color: T.faint }}>·</span>
              <a href={`mailto:${order.customerEmail}`} className="text-[13px] hover:underline" style={{ color: T.accent }}>{order.customerEmail}</a>
            </div>
          </div>
          <Link href="/orders/create" className="shrink-0">
            <GoldBtn>Create order</GoldBtn>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-[13px]" style={{ borderTop: `1px solid ${T.borderSoft}`, paddingTop: 14 }}>
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Drop-off reason</div>
            <Chip tone={REASON_TONE[order.reason]}>{REASON_LABEL[order.reason]}</Chip>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Drop-off date</div>
            <div style={{ color: T.text }}>{fmtDate(order.failedAt)}, {fmtTime(order.failedAt)}</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Lead status</div>
            <div className="w-[140px]">
              <Select value={leadStatus} onChange={handleStatusChange} compact options={[{ value: "new", label: "New lead" }, { value: "contacted", label: "Contacted" }, { value: "follow_up", label: "Follow up" }, { value: "converted", label: "Converted" }, { value: "lost", label: "Lost" }]} />
            </div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Assignee</div>
            <div className="w-[140px]">
              <Select value={order.assignedTo ?? ""} onChange={handleAssign} compact placeholder="Unassigned" options={ASSIGN_OPTIONS} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Left — Activity: composer + timeline together */}
        <Card>
          <div className="text-[15px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Activity</div>
          <Textarea value={activityNote} onChange={setActivityNote} placeholder="What happened? — e.g. 'Spoke to customer, will retry payment tomorrow'" rows={2} />
          <div className="flex justify-end mt-2.5">
            <GoldBtn onClick={handleLogActivity}>Log activity</GoldBtn>
          </div>
          <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
            {timeline.length === 0 ? (
              <p className="text-[13px] py-2" style={{ color: T.faint }}>No activity yet — log a call to get started.</p>
            ) : (
              <div className="relative pl-5">
                <div className="absolute left-[3px] top-1 bottom-1 w-px" style={{ background: T.borderSoft }} />
                {timeline.map((entry, i) => (
                  <div key={i} className="relative pb-4 last:pb-0">
                    <div className="absolute -left-5 top-1.5 w-[7px] h-[7px] rounded-full border-2" style={{
                      borderColor: entry.type === "call" ? T.accent : entry.type === "status" ? T.good : T.faint,
                      background: i === 0 ? (entry.type === "call" ? T.accent : entry.type === "status" ? T.good : T.faint) : T.card,
                    }} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] uppercase tracking-[0.06em] font-semibold" style={{ color: entry.type === "call" ? T.accent : entry.type === "status" ? T.good : T.muted }}>
                          {entry.type === "call" ? "Call" : entry.type === "status" ? "Status" : entry.type === "system" ? "System" : "Note"}
                        </span>
                        <span className="text-[11px] tabular-nums" style={{ color: T.faint }}>{fmtDate(entry.at)} · {fmtTime(entry.at)}</span>
                      </div>
                      <p className="text-[13px] leading-relaxed" style={{ color: T.text }}>{entry.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Right — Product details (sticky) */}
        <aside className="lg:sticky lg:top-4">
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Product</div>
            <div className="text-[14px] font-semibold" style={{ color: T.text }}>{order.itemName}</div>
            <div className="text-[12px] mb-3" style={{ color: T.faint }}>{order.itemSku}</div>
            <div className="rounded-[10px] p-3.5 flex items-center justify-between" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
              <span className="text-[18px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(order.amount)}</span>
              <Link href={`/inventory?q=${encodeURIComponent(order.itemSku)}`} className="text-[12px] font-medium hover:underline" style={{ color: T.accent }}>Inventory ↗</Link>
            </div>
            <Link href="/orders/create" className="block mt-3"><GoldBtn className="w-full">Create order for customer</GoldBtn></Link>
          </Card>
        </aside>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium animate-in"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
