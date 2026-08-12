"use client";
import { use, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Timeline, GoldBtn, GhostBtn, Modal, Input, Textarea, BackLink } from "@/components/ui";
import type { TimelineEvent } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CONSULTATIONS, MOCK_CUSTOMERS, MOCK_STONE_RECOMMENDATIONS, MOCK_REMEDY_RECOMMENDATIONS, EXPERT_PROFILES, getExpertDates, getExpertSlots } from "@/lib/mock";
import type { ExpertProfile, TimeSlot } from "@/lib/mock";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function ConsultationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const consultation = MOCK_CONSULTATIONS.find((c) => c.id === id);

  const [showReschedule, setShowReschedule] = useState(false);
  const [showSendLinkModal, setShowSendLinkModal] = useState(false);
  const [meetingLinkInput, setMeetingLinkInput] = useState("");
  const [localMeetingLink, setLocalMeetingLink] = useState(consultation?.meetingLink ?? "");
  const [editingMeetLink, setEditingMeetLink] = useState(false);

  // Reschedule flow state
  const [rescheduleStep, setRescheduleStep] = useState<1 | 2 | 3>(1);
  const [rsExpert, setRsExpert] = useState<ExpertProfile | null>(null);
  const [rsDate, setRsDate] = useState("");
  const [rsSlot, setRsSlot] = useState("");
  const [rsReason, setRsReason] = useState("");
  const [rsViewYear, setRsViewYear] = useState(new Date().getFullYear());
  const [rsViewMonth, setRsViewMonth] = useState(new Date().getMonth());
  const [toast, setToast] = useState("");

  if (!consultation) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: T.muted }}>Consultation not found.</p>
        <div className="mt-3 flex justify-center"><BackLink label="Back to consultations" href="/consultations" /></div>
      </div>
    );
  }

  const customer = MOCK_CUSTOMERS.find((c) => c.id === consultation.customerId);
  const recommendation = MOCK_STONE_RECOMMENDATIONS.find((r) => r.consultationId === consultation.id);
  const remedy = MOCK_REMEDY_RECOMMENDATIONS.find((r) => r.consultationId === consultation.id);

  const timeline: TimelineEvent[] = [
    { id: "t1", title: "Consultation created", time: consultation.createdAt, tone: "muted" },
    { id: "t2", title: `Scheduled for ${new Date(consultation.scheduledAt).toLocaleDateString("en-IN")}`, time: consultation.createdAt, tone: "gold" },
    ...(consultation.status === "completed" || consultation.status === "closed" ? [{ id: "t3", title: "Consultation completed", time: consultation.updatedAt, tone: "good" as const }] : []),
    ...(consultation.summarySubmittedAt ? [{ id: "t4", title: "Summary submitted", time: consultation.summarySubmittedAt, tone: "good" as const }] : []),
    ...(consultation.rescheduleReason ? [{ id: "t5", title: `Reschedule requested: ${consultation.rescheduleReason}`, time: consultation.updatedAt, tone: "danger" as const }] : []),
  ];

  const openRescheduleModal = () => {
    const currentExpert = EXPERT_PROFILES.find((e) => e.id === consultation.expertId) ?? EXPERT_PROFILES[0];
    setRsExpert(currentExpert);
    setRsDate("");
    setRsSlot("");
    setRsReason("");
    setRescheduleStep(1);
    setShowReschedule(true);
  };

  // Reschedule calendar helpers
  const rsDates = rsExpert ? getExpertDates(rsExpert.id) : [];
  const rsSlots = rsExpert && rsDate ? getExpertSlots(rsExpert.id, rsDate) : [];

  const rsFirstDay = new Date(rsViewYear, rsViewMonth, 1).getDay();
  const rsOffset = rsFirstDay === 0 ? 6 : rsFirstDay - 1;
  const rsDaysInMonth = new Date(rsViewYear, rsViewMonth + 1, 0).getDate();

  const rsIsAvailable = (day: number) => {
    const iso = `${rsViewYear}-${String(rsViewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return rsDates.includes(iso);
  };

  const rsSelectDay = (day: number) => {
    const iso = `${rsViewYear}-${String(rsViewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (!rsDates.includes(iso)) return;
    setRsDate(iso);
    setRsSlot("");
    setRescheduleStep(3);
  };

  const handleRescheduleSubmit = () => {
    setShowReschedule(false);
    setToast("Consultation rescheduled");
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <>
      <PageHeader
        back={{ label: "Consultations", href: "/consultations" }}
        title={consultation.customerName}
        sub={`${consultation.id} · with ${consultation.expertName}`}
      />

      {/* Consultation details card */}
      <Card className="mb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {consultation.status === "reschedule_requested" && <Chip tone="danger">Reschedule request</Chip>}
            {consultation.status === "summary_pending" && <Chip tone="danger">Summary due</Chip>}
          </div>
        </div>

        <div className="rounded-[9px] p-4 mb-4" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[13.5px] font-semibold mb-1" style={{ color: T.accent }}>{consultation.type.replace(/_/g, " ")}</div>
              <div className="text-[12px]" style={{ color: T.muted }}>{consultation.customerName} · {consultation.expertName}</div>
            </div>
            {consultation.paymentStatus === "pending" ? (
              <Chip tone="gold">Payment pending</Chip>
            ) : (consultation.status === "closed" || consultation.status === "completed") ? (
              <Chip tone="good">Completed</Chip>
            ) : (
              <Chip tone="gold">Scheduled</Chip>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="grid grid-cols-3 gap-4 text-[13px] flex-1">
            <div>
              <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Expert</div>
              <div style={{ color: T.text }}>{consultation.expertName}</div>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Date</div>
              <div style={{ color: T.text }}>{new Date(consultation.scheduledAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</div>
            </div>
            <div>
              <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Time</div>
              <div style={{ color: T.text }}>{new Date(consultation.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</div>
            </div>
          </div>
          {(consultation.status === "scheduled" || consultation.status === "reschedule_requested") && (
            <span
              onClick={openRescheduleModal}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[12px] font-medium cursor-pointer hover:opacity-90 transition-opacity shrink-0"
              style={{ border: `1px solid ${T.border}`, color: T.text }}
            >
              Update
            </span>
          )}
        </div>
      </Card>

      {/* Meeting link section — like energisation session */}
      {editingMeetLink ? (
        <Card className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Meeting</div>
            <span className="text-[11px] px-2 py-0.5 rounded" style={{ background: "rgba(160,125,56,0.15)", color: T.accent }}>Editing</span>
          </div>
          <div className="space-y-3">
            <Input value={meetingLinkInput} onChange={setMeetingLinkInput} label="Meeting link" type="url" placeholder="https://meet.google.com/..." />
          </div>
          <div className="flex gap-2.5 mt-4">
            <GoldBtn onClick={() => { if (meetingLinkInput) setLocalMeetingLink(meetingLinkInput); setEditingMeetLink(false); }}>Save</GoldBtn>
            <GhostBtn onClick={() => setEditingMeetLink(false)}>Cancel</GhostBtn>
          </div>
        </Card>
      ) : (
        <Card className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Meeting</div>
            {localMeetingLink ? (
              consultation.status !== "closed" && consultation.status !== "completed" ? (
                <span
                  onClick={() => { setMeetingLinkInput(localMeetingLink); setEditingMeetLink(true); }}
                  className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[9px] text-[11px] font-medium cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ border: `1px solid ${T.border}`, color: T.muted }}
                >
                  Edit link
                </span>
              ) : null
            ) : null}
          </div>
          {localMeetingLink ? (
            <div className="flex items-center gap-2">
              <a
                href={localMeetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-[9px] p-3 transition-all duration-200 hover:brightness-[0.97] flex-1 min-w-0"
                style={{ background: "rgba(95,112,64,0.08)", border: `1px solid rgba(95,112,64,0.18)` }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(95,112,64,0.18)" }}>
                  <span className="text-[14px]">▶</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium truncate" style={{ color: T.good }}>{localMeetingLink}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>Google Meet link</div>
                </div>
              </a>
              <button
                onClick={() => { navigator.clipboard.writeText(localMeetingLink); setToast("Link copied to clipboard"); setTimeout(() => setToast(""), 3000); }}
                className="shrink-0 w-9 h-9 rounded-[9px] flex items-center justify-center transition-all duration-150 cursor-pointer hover:brightness-[0.97]"
                style={{ background: "rgba(95,112,64,0.08)", border: `1px solid rgba(95,112,64,0.18)` }}
                title="Copy link"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: T.good }}>
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          ) : null}
        </Card>
      )}

      {/* Reschedule Request Section */}
      {consultation.status === "reschedule_requested" && consultation.rescheduleReason && (
        <div
          className="rounded-[12px] p-5 mb-5"
          style={{ background: "rgba(176,84,84,0.06)", border: `1px solid rgba(176,84,84,0.25)` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] tracking-[0.08em] uppercase mb-2 font-medium" style={{ color: T.danger }}>Reschedule requested</div>
              <p className="text-[13.5px]" style={{ color: T.text }}>{consultation.rescheduleReason}</p>
            </div>
            <GoldBtn onClick={openRescheduleModal}>Accept & reschedule</GoldBtn>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {/* Customer context — clickable to customer page */}
        {customer ? (
          <Link href={`/customers/${customer.id}`} className="block group">
            <div
              className="card-interactive rounded-[12px] p-5 h-full cursor-pointer"
              style={{ background: T.card, border: `1px solid ${T.border}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Customer context</div>
                <span className="text-[11px]" style={{ color: T.muted }}>View profile →</span>
              </div>
              <div className="space-y-2 text-[13px]">
                {[
                  ["Name", customer.name],
                  ["Birth", `${customer.birthDate} · ${customer.birthTime} · ${customer.birthPlace}`],
                  ["Rashi", customer.rashi || "—"],
                  ["Nakshatra", customer.nakshatra || "—"],
                  ["Chart ref", customer.chartRef || "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span style={{ color: T.muted }}>{k}</span>
                    <span className="text-right" style={{ color: T.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ) : (
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Customer context</div>
            <p className="text-[13px]" style={{ color: T.muted }}>Customer record not found.</p>
          </Card>
        )}

        {/* Consultation details */}
        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Consultation details</div>
          <div className="space-y-2 text-[13px]">
            {[
              ["Type", consultation.type.replace(/_/g, " ")],
              ["Expert", consultation.expertName],
              ["Scheduled", new Date(consultation.scheduledAt).toLocaleString("en-IN")],
              ["Fee", consultation.fee ? `₹${consultation.fee.toLocaleString("en-IN")}` : "—"],
              ["Payment", consultation.paymentStatus === "paid" ? "Paid" : "Pending"],
              ["Problem", consultation.problemStatement || "—"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span style={{ color: T.muted }}>{k}</span>
                <span className="text-right max-w-[60%]" style={{ color: k === "Payment" && v === "Pending" ? T.accent : T.text }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recommendation */}
      {(consultation.summary || recommendation || remedy) && (
        <Card className="mb-4">
          <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.faint }}>Recommendation</div>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Consultation Summary */}
            <div className="rounded-[9px] p-4" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
              <div className="text-[11px] tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>Consultation summary</div>
              {consultation.summary ? (
                <>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: T.text }}>{consultation.summary}</p>
                  {consultation.summarySubmittedAt && (
                    <p className="text-[11px] mt-3" style={{ color: T.faint }}>Submitted {new Date(consultation.summarySubmittedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</p>
                  )}
                </>
              ) : (
                <p className="text-[13px]" style={{ color: T.faint }}>Summary not submitted yet.</p>
              )}
            </div>

            {/* Recommended stone */}
            <div className="rounded-[9px] p-4" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
              <div className="text-[11px] tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>Recommended stone</div>
              {recommendation ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Link href="/inventory" className="text-[14px] font-semibold hover:underline" style={{ color: T.accent }}>{recommendation.gemstone}</Link>
                    <Link href="/inventory" style={{ color: T.accent }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                    </Link>
                  </div>
                  <div className="space-y-1.5 text-[12px] mb-3">
                    {[
                      ["Weight", recommendation.weightRange],
                      ["Purpose", recommendation.purpose ?? "—"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span style={{ color: T.muted }}>{k}</span>
                        <span className="text-right" style={{ color: T.text }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {recommendation.status === "converted_to_order" && recommendation.orderId ? (
                    <Link href={`/orders/${recommendation.orderId}`} className="text-[12px] font-medium hover:underline" style={{ color: T.accent }}>View order →</Link>
                  ) : (
                    <GoldBtn onClick={() => setShowSendLinkModal(true)}>Resend payment link to customer</GoldBtn>
                  )}
                </div>
              ) : (
                <p className="text-[13px]" style={{ color: T.faint }}>No stone recommended yet.</p>
              )}
            </div>
          </div>

          {/* Other Remedy */}
          {remedy && (
            <div className="rounded-[9px] p-4 mt-4" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
              <div className="text-[11px] tracking-[0.08em] uppercase mb-2" style={{ color: T.faint }}>Other remedy</div>
              <p className="text-[13.5px] leading-relaxed" style={{ color: T.text }}>
                <span className="font-medium capitalize">{remedy.type}</span> — {remedy.instructions}
                {remedy.frequency && ` (${remedy.frequency})`}
                {remedy.duration && `. Duration: ${remedy.duration}`}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.faint }}>Activity</div>
        <Timeline events={timeline} />
      </Card>

      {/* Send Payment Link Confirmation */}
      <Modal open={showSendLinkModal} onClose={() => setShowSendLinkModal(false)} title="Send payment link">
        <p className="text-[13.5px] mb-2" style={{ color: T.text }}>
          A payment link for the recommended stone will be sent to <strong>{consultation.customerName}</strong>.
        </p>
        {recommendation && (
          <div className="rounded-[9px] p-3 mb-4" style={{ background: T.panel, border: `1px solid ${T.borderSoft}` }}>
            <div className="text-[13px] font-medium" style={{ color: T.accent }}>{recommendation.gemstone}</div>
            <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{recommendation.weightRange} · {recommendation.qualityCriteria}</div>
          </div>
        )}
        <div className="flex gap-2.5">
          <GoldBtn onClick={() => { setShowSendLinkModal(false); setToast("Payment link sent to customer"); setTimeout(() => setToast(""), 3000); }}>Send link</GoldBtn>
          <GhostBtn onClick={() => setShowSendLinkModal(false)}>Cancel</GhostBtn>
        </div>
      </Modal>

      {/* Reschedule / Reassign Modal */}
      <Modal open={showReschedule} onClose={() => setShowReschedule(false)} title="Reschedule consultation">
        {/* Step 1: Expert selection */}
        {rescheduleStep === 1 && (
          <div>
            <div className="text-[12px] mb-3" style={{ color: T.muted }}>Select expert</div>
            <div className="space-y-2">
              {EXPERT_PROFILES.map((ep) => (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => { setRsExpert(ep); setRsDate(""); setRsSlot(""); setRescheduleStep(2); }}
                  className="w-full text-left rounded-[9px] p-3.5 transition-all"
                  style={{
                    background: rsExpert?.id === ep.id ? "rgba(160,125,56,0.13)" : T.panel,
                    border: `1px solid ${rsExpert?.id === ep.id ? T.accent : T.border}`,
                  }}
                >
                  <div className="text-[13.5px] font-medium" style={{ color: T.text }}>{ep.name}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>{ep.specialization} · ₹{ep.fee.toLocaleString("en-IN")}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Date selection */}
        {rescheduleStep === 2 && rsExpert && (
          <div>
            <div className="text-[12px] mb-3" style={{ color: T.muted }}>
              Select date for <span style={{ color: T.text }}>{rsExpert.name}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={() => { if (rsViewMonth === 0) { setRsViewMonth(11); setRsViewYear((y) => y - 1); } else setRsViewMonth((m) => m - 1); }} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ color: T.muted }}>‹</button>
              <span className="text-[13px] font-medium" style={{ color: T.text }}>{MONTHS[rsViewMonth]} {rsViewYear}</span>
              <button type="button" onClick={() => { if (rsViewMonth === 11) { setRsViewMonth(0); setRsViewYear((y) => y + 1); } else setRsViewMonth((m) => m + 1); }} className="w-7 h-7 rounded-full flex items-center justify-center" style={{ color: T.muted }}>›</button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {DAYS.map((d) => <div key={d} className="text-center text-[9px] py-1" style={{ color: T.faint }}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: rsOffset }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: rsDaysInMonth }).map((_, i) => {
                const day = i + 1;
                const avail = rsIsAvailable(day);
                const sel = rsDate === `${rsViewYear}-${String(rsViewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                return (
                  <button
                    key={day} type="button"
                    onClick={() => rsSelectDay(day)}
                    disabled={!avail}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] disabled:cursor-not-allowed"
                    style={{
                      background: sel ? T.accent : avail ? "rgba(160,125,56,0.10)" : "transparent",
                      color: sel ? T.accentInk : avail ? T.text : T.faint,
                      opacity: avail ? 1 : 0.35,
                      fontWeight: sel ? 700 : 400,
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => setRescheduleStep(1)} className="text-[11px] mt-3" style={{ color: T.accent }}>← Change expert</button>
          </div>
        )}

        {/* Step 3: Slot + reason */}
        {rescheduleStep === 3 && rsExpert && rsDate && (
          <div>
            <div className="text-[12px] mb-1" style={{ color: T.muted }}>
              Slots for <span style={{ color: T.text }}>{rsExpert.name}</span>
            </div>
            <div className="text-[11px] mb-4" style={{ color: T.faint }}>
              {new Date(rsDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {rsSlots.map((slot) => (
                <button
                  key={slot.time} type="button"
                  onClick={() => { if (slot.available) setRsSlot(slot.time); }}
                  disabled={!slot.available}
                  className="py-2.5 rounded-[8px] text-[12px] font-medium tabular-nums disabled:cursor-not-allowed"
                  style={{
                    background: rsSlot === slot.time ? T.accent : slot.available ? T.panel : "transparent",
                    border: `1px solid ${rsSlot === slot.time ? T.accent : slot.available ? T.border : T.borderSoft}`,
                    color: rsSlot === slot.time ? T.accentInk : slot.available ? T.text : T.faint,
                    opacity: slot.available ? 1 : 0.4,
                  }}
                >
                  {slot.time}
                </button>
              ))}
            </div>
            <Textarea value={rsReason} onChange={setRsReason} label="Reason (optional)" placeholder="Reason for rescheduling…" rows={2} />
            <div className="flex gap-2.5 mt-4">
              <GoldBtn onClick={handleRescheduleSubmit} disabled={!rsSlot}>Confirm</GoldBtn>
              <GhostBtn onClick={() => setRescheduleStep(2)}>← Back</GhostBtn>
            </div>
          </div>
        )}
      </Modal>

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
