"use client";
import { use, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, GoldBtn, GhostBtn, Input, Textarea, Modal, Timeline, DateInput, TimeInput, Select } from "@/components/ui";
import type { TimelineEvent } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_ENERGISATION, MOCK_ORDERS, MOCK_CUSTOMERS } from "@/lib/mock";

type Action = "schedule" | null;

export default function EnergisationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const task = MOCK_ENERGISATION.find((e) => e.id === id);

  const [action, setAction] = useState<Action>(null);

  const [localStatus, setLocalStatus] = useState(task?.status ?? "pending");
  const [localMethod, setLocalMethod] = useState(task?.method ?? "");
  const [localAssignedTo] = useState(task?.assignedTo ?? "");
  const [localScheduledAt, setLocalScheduledAt] = useState(task?.scheduledAt ?? "");
  const [localLiveLink, setLocalLiveLink] = useState(task?.liveLink ?? "");
  const [localNotes, setLocalNotes] = useState(task?.notes ?? "");

  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleGuruji, setScheduleGuruji] = useState("");
  const [formMethod, setFormMethod] = useState("Vedic Brihaspati Mantra — 108 repetitions");
  const [formNotes, setFormNotes] = useState("");
  const [formLiveLink, setFormLiveLink] = useState("");
  const [editingLinks, setEditingLinks] = useState(false);
  const [toast, setToast] = useState("");
  const [editLiveLink, setEditLiveLink] = useState("");
  const [editProofUrl, setEditProofUrl] = useState("");
  const [editNotes, setEditNotes] = useState("");

  if (!task) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: T.muted }}>Energisation task not found.</p>
        <Link href="/energisation" className="text-[12.5px] mt-2 inline-block" style={{ color: T.accent }}>← Back</Link>
      </div>
    );
  }

  const order = MOCK_ORDERS.find((o) => o.id === task.orderId);
  const customer = MOCK_CUSTOMERS.find((c) => c.id === task.customerId);

  const statusTone = (s: string) => {
    if (s === "completed") return "good" as const;
    if (s === "scheduled" || s === "in_progress") return "gold" as const;
    if (s === "exception") return "danger" as const;
    return "muted" as const;
  };

  const handleScheduleSubmit = () => {
    if (!scheduleDate) return;
    const dateStr = `${scheduleDate} ${scheduleTime || "06:00 AM"}`;
    setLocalScheduledAt(dateStr);
    setLocalMethod(formMethod);
    setLocalStatus("scheduled");
    if (formLiveLink) setLocalLiveLink(formLiveLink);
    if (formNotes) setLocalNotes(formNotes);
    setAction(null);
    setScheduleDate("");
    setScheduleTime("");
    setScheduleGuruji("");
    setFormLiveLink("");
    setFormNotes("");
  };

  const [localProofUrl, setLocalProofUrl] = useState(task?.proofUrl ?? "");

  const startEditingLinks = () => {
    setEditLiveLink(localLiveLink);
    setEditProofUrl(localProofUrl);
    setEditNotes(localNotes);
    setEditingLinks(true);
  };

  const saveLinksEdit = () => {
    setLocalLiveLink(editLiveLink);
    setLocalProofUrl(editProofUrl);
    setLocalNotes(editNotes);
    setEditingLinks(false);
  };

  const timeline: TimelineEvent[] = [
    { id: "t1", title: "Task created", time: task.createdAt, tone: "muted" },
    ...(localScheduledAt ? [{ id: "t2", title: `Scheduled — ${localScheduledAt}`, time: task.createdAt, tone: "gold" as const }] : []),
    ...(task.buyerNotified ? [{ id: "t3", title: "Buyer notified", time: task.updatedAt, tone: "good" as const }] : []),
    ...(localLiveLink ? [{ id: "t4", title: "Live link uploaded", time: new Date().toISOString().split("T")[0], tone: "gold" as const }] : []),
    ...(task.completedAt ? [{ id: "t5", title: "Energisation completed", time: task.completedAt, tone: "good" as const }] : []),
  ];

  return (
    <>
      <PageHeader
        back={{ label: "Energisation", href: "/energisation" }}
      />

      {/* Energisation details card */}
      <Card className="mb-5">
        <div className="rounded-[9px] p-4 mb-4" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[13px] font-semibold" style={{ color: T.accent }}>{localMethod || "Method not assigned"}</div>
            <div className="flex items-center gap-2">
              <Chip tone={statusTone(localStatus)}>{localStatus.replace(/_/g, " ")}</Chip>
              {!localLiveLink && localStatus === "scheduled" && <Chip tone="danger">Link missing</Chip>}
            </div>
          </div>
          <div className="text-[11.5px]" style={{ color: T.muted }}>{task.stoneDescription}</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="grid grid-cols-3 gap-4 text-[12.5px] flex-1">
            <div>
              <div className="text-[10px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Guruji</div>
              <div style={{ color: localAssignedTo ? T.text : T.faint }}>{localAssignedTo || "Unassigned"}</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>
                {task.completedAt ? "Completed" : "Date"}
              </div>
              <div style={{ color: localScheduledAt || task.completedAt ? T.text : T.danger }}>
                {task.completedAt
                  ? new Date(task.completedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
                  : localScheduledAt
                    ? new Date(localScheduledAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
                    : "Not scheduled"}
              </div>
            </div>
            <div>
              <div className="text-[10px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Time</div>
              <div style={{ color: localScheduledAt ? T.text : T.faint }}>
                {localScheduledAt
                  ? new Date(localScheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
                  : "—"}
              </div>
            </div>
          </div>
          {(localStatus === "pending" || localStatus === "scheduled") && (
            <span
              onClick={() => setAction("schedule")}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[11.5px] font-medium cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              style={{ border: `1px solid ${T.border}`, color: T.text }}
            >
              {localStatus === "scheduled" ? "Update" : "Schedule"}
            </span>
          )}
        </div>
      </Card>

      {/* Order + Customer — two columns */}
      <div className="grid md:grid-cols-2 gap-4 mb-5">
        {order && (
          <Link href={`/orders/${order.id}`} className="block group">
            <div
              className="card-interactive rounded-[12px] p-5 h-full cursor-pointer"
              style={{ background: T.card, border: `1px solid ${T.border}` }}
            >
              <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Order</div>
              <div className="space-y-2.5 text-[12.5px]">
                <div className="flex justify-between gap-2">
                  <span style={{ color: T.muted }}>Order ID</span>
                  <span className="font-medium" style={{ color: T.accent }}>{order.id}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span style={{ color: T.muted }}>Payment</span>
                  <Chip tone={order.paymentStatus === "paid" ? "good" : "gold"}>{order.paymentStatus}</Chip>
                </div>
                <div className="flex justify-between gap-2">
                  <span style={{ color: T.muted }}>Status</span>
                  <span style={{ color: T.text }}>{order.operationalStatus.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span style={{ color: T.muted }}>Total</span>
                  <span className="font-semibold tabular-nums" style={{ color: T.text }}>₹{order.total.toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {customer && (
          <Link href={`/customers/${customer.id}`} className="block group">
            <div
              className="card-interactive rounded-[12px] p-5 h-full cursor-pointer"
              style={{ background: T.card, border: `1px solid ${T.border}` }}
            >
              <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Customer</div>
              <div className="space-y-2.5 text-[12.5px]">
                <div className="flex justify-between gap-2">
                  <span style={{ color: T.muted }}>Name</span>
                  <span className="font-medium" style={{ color: T.text }}>{customer.name}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span style={{ color: T.muted }}>Phone</span>
                  <span style={{ color: T.text }}>{customer.phone}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span style={{ color: T.muted }}>Email</span>
                  <span className="text-right" style={{ color: T.text }}>{customer.email}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span style={{ color: T.muted }}>Location</span>
                  <span className="text-right" style={{ color: T.text }}>{customer.birthPlace}</span>
                </div>
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Session section */}
      {editingLinks ? (
        <Card className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Session</div>
            <span className="text-[10.5px] px-2 py-0.5 rounded" style={{ background: "rgba(195,160,88,0.1)", color: T.accent }}>Editing</span>
          </div>
          <div className="space-y-3">
            <Input value={editLiveLink} onChange={setEditLiveLink} label="Session link" type="url" placeholder="https://live.astrolaabh.house/…" />
            <Textarea value={editNotes} onChange={setEditNotes} label="Notes" placeholder="Ritual notes…" rows={2} />
          </div>
          <div className="flex gap-2.5 mt-4">
            <GoldBtn onClick={saveLinksEdit}>Save</GoldBtn>
            <GhostBtn onClick={() => setEditingLinks(false)}>Cancel</GhostBtn>
          </div>
        </Card>
      ) : (
        <Card className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Session</div>
            {localLiveLink ? (
              <span
                onClick={startEditingLinks}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[9px] text-[11px] font-medium cursor-pointer hover:opacity-90 transition-opacity"
                style={{ border: `1px solid ${T.border}`, color: T.muted }}
              >
                Edit link
              </span>
            ) : localStatus !== "pending" ? (
              <GoldBtn onClick={startEditingLinks}>Upload session link</GoldBtn>
            ) : null}
          </div>
          {localLiveLink ? (
            <div className="flex items-center gap-2">
              <a
                href={localLiveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-[9px] p-3 transition-all duration-200 hover:brightness-110 flex-1 min-w-0"
                style={{ background: "rgba(142,160,109,0.06)", border: `1px solid rgba(142,160,109,0.15)` }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(142,160,109,0.15)" }}>
                  <span className="text-[14px]">▶</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium truncate" style={{ color: T.good }}>{localLiveLink}</div>
                  <div className="text-[10.5px] mt-0.5" style={{ color: T.muted }}>Live consultation link</div>
                </div>
              </a>
              <button
                onClick={() => { navigator.clipboard.writeText(localLiveLink); setToast("Link copied to clipboard"); setTimeout(() => setToast(""), 3000); }}
                className="shrink-0 w-9 h-9 rounded-[9px] flex items-center justify-center transition-all duration-150 cursor-pointer hover:brightness-125"
                style={{ background: "rgba(142,160,109,0.06)", border: `1px solid rgba(142,160,109,0.15)` }}
                title="Copy link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: T.good }}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="text-[12.5px] py-2" style={{ color: T.faint }}>No session link uploaded yet</div>
          )}
          {localNotes && (
            <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <div className="text-[10px] tracking-[0.08em] uppercase mb-1.5" style={{ color: T.faint }}>Notes</div>
              <p className="text-[12.5px]" style={{ color: T.text }}>{localNotes}</p>
            </div>
          )}
        </Card>
      )}

      {/* Activity timeline */}
      <Card>
        <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.faint }}>Activity</div>
        <Timeline events={timeline} />
      </Card>

      {/* Schedule / Update modal */}
      <Modal open={action === "schedule"} onClose={() => setAction(null)} title={localStatus === "scheduled" ? "Update energisation" : "Schedule energisation"}>
        <div className="space-y-3">
          <Select
            value={scheduleGuruji}
            onChange={setScheduleGuruji}
            label="Guruji / Pandit"
            placeholder="Select Guruji…"
            options={[
              { value: "guruji_anand", label: "Pandit Anand Sharma" },
              { value: "guruji_raghav", label: "Guruji Raghav Mishra" },
              { value: "guruji_keshav", label: "Acharya Keshav Tripathi" },
              { value: "guruji_sundar", label: "Pandit Sundar Iyer" },
            ]}
          />
          <div className="grid grid-cols-2 gap-3">
            <DateInput value={scheduleDate} onChange={setScheduleDate} label="Date" placeholder="Select date…" />
            <TimeInput value={scheduleTime} onChange={setScheduleTime} label="Time" placeholder="Select time…" />
          </div>
          <Input value={formLiveLink} onChange={setFormLiveLink} label="Streaming / Meeting link" placeholder="https://meet.google.com/..." />
          <Textarea value={formNotes} onChange={setFormNotes} label="Notes (optional)" placeholder="Ritual details, buyer preferences…" />
        </div>
        <div className="flex gap-2.5 mt-5">
          <GoldBtn onClick={handleScheduleSubmit}>{localStatus === "scheduled" ? "Update" : "Schedule"}</GoldBtn>
          <GhostBtn onClick={() => setAction(null)}>Cancel</GhostBtn>
        </div>
      </Modal>

      {toast && (
        <div
          className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13px] font-medium animate-in"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}

    </>
  );
}
