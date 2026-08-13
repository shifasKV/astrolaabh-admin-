"use client";
import { use, useState } from "react";
import Link from "next/link";
import { Card, Chip, GoldBtn, GhostBtn, BackLink, Select, Textarea } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_INCOMPLETE_CONSULTATIONS, EXPERT_PROFILES } from "@/lib/mock";
import type { IncompleteConsultationStatus } from "@/lib/mock";

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
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function IncompleteConsultationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const consultation = MOCK_INCOMPLETE_CONSULTATIONS.find((c) => c.id === id);
  const expert = consultation ? EXPERT_PROFILES.find((e) => e.id === consultation.expertId) : null;

  const [leadStatus, setLeadStatus] = useState<IncompleteConsultationStatus>(consultation?.leadStatus ?? "new");
  const [assignee, setAssignee] = useState("");
  const [activityNote, setActivityNote] = useState("");
  const [activityType, setActivityType] = useState<"call" | "email" | "whatsapp" | "note">("call");
  const [toast, setToast] = useState("");
  const [activityLog, setActivityLog] = useState<{ text: string; at: string; type: "status" | "remark" | "call" }[]>(() => {
    const log: { text: string; at: string; type: "status" | "remark" | "call" }[] = [];
    if (consultation?.lastContactedAt) log.push({ text: `Status updated to "${STATUS_LABEL[consultation.leadStatus]}"`, at: consultation.lastContactedAt, type: "status" });
    if (consultation?.remarks) log.push({ text: consultation.remarks, at: consultation.lastContactedAt || consultation.date, type: "remark" });
    return log;
  });

  if (!consultation) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: T.muted }}>Incomplete consultation not found.</p>
        <div className="mt-3 flex justify-center"><BackLink label="Consultations" href="/consultations" /></div>
      </div>
    );
  }

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleStatusChange = (val: string) => {
    const newStatus = val as IncompleteConsultationStatus;
    const prev = leadStatus;
    setLeadStatus(newStatus);
    const now = new Date().toISOString();
    setActivityLog((p) => [{ text: `Status changed from "${STATUS_LABEL[prev]}" to "${STATUS_LABEL[newStatus]}"`, at: now, type: "status" }, ...p]);
    flash(`Lead marked as ${STATUS_LABEL[newStatus]}`);
  };

  const ACTIVITY_TYPE_LABEL: Record<string, string> = { call: "Call", email: "Email", whatsapp: "WhatsApp", note: "Note" };

  const handleLogActivity = () => {
    const now = new Date().toISOString();
    const label = ACTIVITY_TYPE_LABEL[activityType];
    const text = activityNote.trim() ? `${label} — ${activityNote.trim()}` : `${label} logged`;
    setActivityLog((prev) => [{ text, at: now, type: activityType === "note" ? "remark" : "call" }, ...prev]);
    setActivityNote("");
    if (leadStatus === "new" && activityType !== "note") {
      setLeadStatus("contacted");
      setActivityLog((prev) => [{ text: `Status auto-updated to "Contacted"`, at: now, type: "status" }, ...prev]);
    }
    flash(`${label} logged`);
  };

  return (
    <>
      <div className="mb-5">
        <BackLink label="Incomplete bookings" href="/consultations?tab=incomplete" />
      </div>

      {/* Header */}
      <Card className="mb-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link href={`/customers/${consultation.customerId}`} className="text-[18px] font-semibold hover:underline" style={{ color: T.text }}>{consultation.customerName}</Link>
              <span style={{ color: T.faint }}>·</span>
              <a href={`tel:${consultation.customerPhone.replace(/\s/g, "")}`} className="text-[15px] font-medium tabular-nums hover:underline" style={{ color: T.accent }}>{consultation.customerPhone}</a>
              <span style={{ color: T.faint }}>·</span>
              <a href={`mailto:${consultation.customerEmail}`} className="text-[13px] hover:underline" style={{ color: T.accent }}>{consultation.customerEmail}</a>
            </div>
          </div>
          <Link href="/consultations/create" className="shrink-0">
            <GhostBtn>Book consultation</GhostBtn>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 text-[13px]" style={{ borderTop: `1px solid ${T.borderSoft}`, paddingTop: 14 }}>
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Drop-off reason</div>
            <Chip tone={REASON_TONE[consultation.reason]}>{REASON_LABEL[consultation.reason]}</Chip>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Astrologer requested</div>
            <Link href={`/astro-gemologists/${consultation.expertId}`} className="hover:underline" style={{ color: T.accent }}>{consultation.expertName}</Link>
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
              <Select value={assignee} onChange={setAssignee} compact placeholder="Unassigned" options={[{ value: "", label: "Unassigned" }, { value: "admin_01", label: "Priya Sharma" }, { value: "admin_02", label: "Rahul Verma" }, { value: "admin_03", label: "Sneha Gupta" }]} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-[1fr_340px] gap-5">
        {/* Left — Log a call */}
        <div className="space-y-5">
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Log activity</div>
            <Textarea value={activityNote} onChange={setActivityNote} placeholder="What happened? — e.g. 'Spoke to customer, wants to book next week'" rows={3} />
            <div className="flex justify-end mt-3">
              <GoldBtn onClick={handleLogActivity}>Log activity</GoldBtn>
            </div>
          </Card>

        </div>

        {/* Right — Activity timeline */}
        <div className="space-y-5">
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Activity timeline</div>
            {activityLog.length === 0 ? (
              <p className="text-[13px] py-4 text-center" style={{ color: T.faint }}>No activity yet — log a call to get started</p>
            ) : (
              <div className="relative pl-5">
                <div className="absolute left-[3px] top-1 bottom-1 w-px" style={{ background: T.borderSoft }} />
                {activityLog.map((entry, i) => (
                  <div key={i} className="relative pb-4 last:pb-0">
                    <div className="absolute -left-5 top-1.5 w-[7px] h-[7px] rounded-full border-2" style={{
                      borderColor: entry.type === "call" ? T.accent : entry.type === "status" ? T.good : T.faint,
                      background: i === 0 ? (entry.type === "call" ? T.accent : entry.type === "status" ? T.good : T.faint) : T.card,
                    }} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] uppercase tracking-[0.06em] font-semibold" style={{ color: entry.type === "call" ? T.accent : entry.type === "status" ? T.good : T.muted }}>
                          {entry.type === "call" ? "Call" : entry.type === "status" ? "Status" : "Note"}
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

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium animate-in"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
