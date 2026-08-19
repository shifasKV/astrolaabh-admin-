"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Chip, GoldBtn, BackLink, Select, Textarea } from "@/components/ui";
import { T } from "@/lib/theme";
import { useAuth } from "@/lib/store/auth";
import { MOCK_SALES_MEMBERS } from "@/lib/mock";
import type { IncompleteConsultationStatus } from "@/lib/mock";
import { useLeads, type ApprovalStatus, type ActivityEntry } from "@/lib/store/leads";

const APPROVAL_META: Record<ApprovalStatus, { label: string; tone: "gold" | "good" | "danger" | "info" }> = {
  pending: { label: "Admin approval pending", tone: "gold" },
  approved: { label: "Admin approved", tone: "good" },
  completed: { label: "Completed", tone: "good" },
  rejected: { label: "Rejected by admin", tone: "danger" },
  on_hold: { label: "On hold", tone: "info" },
};
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const REASON_LABEL: Record<string, string> = {
  slot_check: "Slot check",
  payment_failed: "Payment failed",
  requested_call: "Requested call",
};
const REASON_TONE: Record<string, "danger" | "gold" | "muted"> = {
  slot_check: "muted",
  payment_failed: "danger",
  requested_call: "gold",
};

const STATUS_LABEL: Record<IncompleteConsultationStatus, string> = {
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

export default function ConsultationLeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "sales_admin";
  const { consultLeads, markReviewSeen, assign, setStatus, logActivity } = useLeads();
  const consultation = consultLeads.find((c) => c.id === id);
  const ff = consultLeads.find((c) => c.id === id)?.fulfillment;
  const ffApproval = ff?.approval;
  const ffReviewedAt = ff?.reviewedAt;
  useEffect(() => {
    if (ffApproval && ffApproval !== "pending") markReviewSeen(id, ffReviewedAt);
  }, [id, ffApproval, ffReviewedAt, markReviewSeen]);

  const [activityNote, setActivityNote] = useState("");
  const [toast, setToast] = useState("");
  const seeded = useMemo<ActivityEntry[]>(() => {
    if (!consultation) return [];
    const log: ActivityEntry[] = [];
    if (consultation.remarks) log.push({ text: consultation.remarks, at: consultation.lastContactedAt || consultation.date, type: "note" });
    if (consultation.lastContactedAt) log.push({ text: `Marked "${STATUS_LABEL[consultation.leadStatus]}"`, at: consultation.lastContactedAt, type: "status" });
    return log;
  }, [consultation]);

  if (!consultation) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: T.muted }}>Lead not found.</p>
        <div className="mt-3 flex justify-center"><BackLink label="Consultation Leads" href="/consultation-leads" /></div>
      </div>
    );
  }

  const leadStatus = consultation.leadStatus;
  const timeline = [...consultation.activity, ...seeded];

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleStatusChange = (val: string) => {
    const newStatus = val as IncompleteConsultationStatus;
    const now = new Date().toISOString();
    setStatus(id, newStatus);
    logActivity(id, { text: `Status changed from "${STATUS_LABEL[leadStatus]}" to "${STATUS_LABEL[newStatus]}"`, at: now, type: "status" });
    flash(`Lead marked as ${STATUS_LABEL[newStatus]}`);
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

  const assigneeOptions = [
    { value: "", label: "Unassigned" },
    ...MOCK_SALES_MEMBERS.filter((m) => m.status === "active").map((m) => ({ value: m.id, label: m.name })),
  ];

  return (
    <>
      <div className="mb-5">
        <BackLink label="Consultation Leads" href="/consultation-leads" />
      </div>

      {ff && (
        <div className="mb-5 flex items-center gap-2.5">
          <Chip tone={APPROVAL_META[ff.approval].tone}>{APPROVAL_META[ff.approval].label}</Chip>
          <span className="text-[12.5px]" style={{ color: T.muted }}>Your fulfilment · {inr(ff.total)}{ff.reviewNote ? ` · ${ff.reviewNote}` : ""}</span>
        </div>
      )}

      {/* Header */}
      <Card className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[18px] font-semibold" style={{ color: T.text }}>{consultation.customerName}</span>
              <span style={{ color: T.faint }}>·</span>
              <a href={`tel:${consultation.customerPhone.replace(/\s/g, "")}`} className="text-[15px] font-medium tabular-nums hover:underline" style={{ color: T.accent }}>{consultation.customerPhone}</a>
              <span style={{ color: T.faint }}>·</span>
              <a href={`mailto:${consultation.customerEmail}`} className="text-[13px] hover:underline" style={{ color: T.accent }}>{consultation.customerEmail}</a>
            </div>
          </div>
          {!ff || ff.approval === "rejected" ? (
            <Link href={`/consultation-leads/create?leadId=${consultation.id}&customerId=${consultation.customerId}&expertId=${consultation.expertId}`}><GoldBtn>{ff?.approval === "rejected" ? "Resubmit consultation" : "+ Create consultation"}</GoldBtn></Link>
          ) : ff.approval === "pending" || ff.approval === "on_hold" ? (
            <span className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-[12.5px] font-medium" style={{ background: "rgba(160,125,56,0.10)", border: "1px solid rgba(160,125,56,0.28)", color: T.gold }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              Awaiting admin review
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-[13px]" style={{ borderTop: `1px solid ${T.borderSoft}`, paddingTop: 14 }}>
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Drop-off reason</div>
            <Chip tone={REASON_TONE[consultation.reason]}>{REASON_LABEL[consultation.reason]}</Chip>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Astrologer requested</div>
            <span style={{ color: T.text }}>{consultation.expertName}</span>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Lead status</div>
            <div className="w-[140px]">
              <Select value={leadStatus} onChange={handleStatusChange} compact options={[{ value: "new", label: "New lead" }, { value: "contacted", label: "Contacted" }, { value: "follow_up", label: "Follow up" }, { value: "converted", label: "Converted" }, { value: "lost", label: "Lost" }]} />
            </div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Assignee</div>
            {isAdmin ? (
              <div className="w-[140px]">
                <Select value={consultation.assignedTo ?? ""} onChange={(v) => { assign(id, v); flash(v ? "Assignee updated" : "Unassigned"); }} compact placeholder="Unassigned" options={assigneeOptions} />
              </div>
            ) : (
              <div style={{ color: T.text }}>{MOCK_SALES_MEMBERS.find((m) => m.id === consultation.assignedTo)?.name || "—"}</div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-[1fr_340px] gap-5">
        {/* Left */}
        <div className="space-y-5">
          <Card>
            <div className="text-[15px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Log activity</div>
            <Textarea value={activityNote} onChange={setActivityNote} placeholder="What happened? — e.g. 'Spoke to customer, wants to book next week'" rows={3} />
            <div className="flex justify-end mt-3">
              <GoldBtn onClick={handleLogActivity}>Log activity</GoldBtn>
            </div>
          </Card>
        </div>

        {/* Right — Activity timeline */}
        <div className="space-y-5">
          <Card>
            <div className="text-[15px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Activity timeline</div>
            {timeline.length === 0 ? (
              <p className="text-[13px] py-4 text-center" style={{ color: T.faint }}>No activity yet — log a call to get started</p>
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
          </Card>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium animate-in" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
