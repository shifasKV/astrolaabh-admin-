"use client";
import { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, GoldBtn, GhostBtn, Modal, Input, Textarea, BackLink, Toast, ConfirmDialog } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CONSULTATIONS, MOCK_CUSTOMERS, MOCK_STONE_RECOMMENDATIONS, MOCK_REMEDY_RECOMMENDATIONS, EXPERT_PROFILES, getExpertDates, getExpertSlots } from "@/lib/mock";
import type { ExpertProfile, TimeSlot } from "@/lib/mock";
import { STONES } from "@/lib/catalog";

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
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [localStatus, setLocalStatus] = useState(consultation?.status ?? "scheduled");
  const [localNoShowBy, setLocalNoShowBy] = useState(consultation?.noShowBy ?? "");
  const [confirmNoShow, setConfirmNoShow] = useState<"customer" | "expert" | null>(null);
  const [confirmMarkPaid, setConfirmMarkPaid] = useState(false);
  const [localPaymentStatus, setLocalPaymentStatus] = useState(consultation?.paymentStatus ?? "pending");
  const [linkSent, setLinkSent] = useState(false);
  const [stoneLinkSent, setStoneLinkSent] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!consultation) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: T.muted }}>Consultation not found.</p>
        <div className="mt-3 flex justify-center"><BackLink label="Consultations" href="/consultations" /></div>
      </div>
    );
  }

  const customer = MOCK_CUSTOMERS.find((c) => c.id === consultation.customerId);
  const recommendation = MOCK_STONE_RECOMMENDATIONS.find((r) => r.consultationId === consultation.id);
  const remedy = MOCK_REMEDY_RECOMMENDATIONS.find((r) => r.consultationId === consultation.id);

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
    setLocalStatus("scheduled");
    setToast("Consultation rescheduled");
    setTimeout(() => setToast(""), 3000);
  };

  const dt = new Date(consultation.scheduledAt);
  const isPaid = localPaymentStatus === "paid";
  const statusChip =
    !isPaid ? { tone: "gold" as const, label: "Payment pending" } :
    localStatus === "summary_pending" ? { tone: "danger" as const, label: "Recommendation due" } :
    localStatus === "no_show" ? { tone: "danger" as const, label: (localNoShowBy || consultation.noShowBy) === "expert" ? "Expert no-show" : "Customer no-show" } :
    localStatus === "reschedule_requested" ? { tone: "gold" as const, label: "Reschedule requested" } :
    (localStatus === "closed" || localStatus === "completed") ? { tone: "good" as const, label: "Completed" } :
    { tone: "info" as const, label: "Scheduled" };

  return (
    <>
      <div className="mb-4"><BackLink label="Consultations" href="/consultations" /></div>

      {/* Identity header */}
      <Card className="!p-6 mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[15px] font-semibold shrink-0" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>
              {consultation.customerName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[18px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>{consultation.customerName}</h1>
                <Chip tone={statusChip.tone}>{statusChip.label}</Chip>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[12.5px]" style={{ color: T.muted }}>
                <span className="uppercase tracking-[0.05em] text-[11px] tabular-nums" style={{ color: T.faint }}>{consultation.id}</span>
                <span style={{ color: T.faint }}>·</span>
                <span>with <Link href={`/astro-gemologists/${consultation.expertId}`} className="font-medium hover:underline" style={{ color: T.accent }}>{consultation.expertName}</Link></span>
                <span style={{ color: T.faint }}>·</span>
                <span className="tabular-nums">{dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}</span>
              </div>
            </div>
          </div>
          <div className="relative shrink-0" ref={actionMenuRef}>
            <button type="button" onClick={() => setShowActionMenu((v) => !v)} className="w-9 h-9 rounded-[9px] flex items-center justify-center transition-colors hover:bg-[rgba(89,82,54,0.08)] cursor-pointer" style={{ border: `1px solid ${showActionMenu ? T.accentBorder : T.border}`, color: T.muted, background: showActionMenu ? T.accentFaint : "transparent" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </button>
            {showActionMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-[230px] rounded-[12px] p-1.5" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}>
                <button onClick={() => { setShowActionMenu(false); openRescheduleModal(); }} className="w-full text-left px-2.5 py-2 rounded-[8px] text-[12.5px] font-medium transition-colors cursor-pointer hover:bg-[rgba(119,123,98,0.10)]" style={{ color: T.text }}>Reschedule</button>
                {(localStatus === "summary_pending" || consultation.status === "summary_pending") && (
                  <>
                    <button onClick={() => { setShowActionMenu(false); setConfirmNoShow("customer"); }} className="w-full text-left px-2.5 py-2 rounded-[8px] text-[12.5px] font-medium transition-colors cursor-pointer hover:bg-[rgba(119,123,98,0.10)]" style={{ color: T.text }}>Mark as customer no-show</button>
                    <button onClick={() => { setShowActionMenu(false); setConfirmNoShow("expert"); }} className="w-full text-left px-2.5 py-2 rounded-[8px] text-[12.5px] font-medium transition-colors cursor-pointer hover:bg-[rgba(119,123,98,0.10)]" style={{ color: T.text }}>Mark as astrologer no-show</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Reschedule request note */}
      {localStatus === "reschedule_requested" && consultation.rescheduleReason && (
        <div className="flex flex-wrap items-start gap-3 rounded-[12px] p-4 mb-4" style={{ background: "rgba(176,84,84,0.06)", border: "1px solid rgba(176,84,84,0.22)" }}>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold mb-1" style={{ color: T.danger }}>Reschedule requested</div>
            <p className="text-[13px]" style={{ color: T.text }}>{consultation.rescheduleReason}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setLocalStatus("scheduled");
                setToast("Reschedule request rejected — original slot kept");
                setTimeout(() => setToast(""), 3000);
              }}
              className="h-9 px-3.5 rounded-[9px] text-[13px] font-semibold cursor-pointer transition-colors hover:bg-[rgba(176,84,84,0.12)]"
              style={{ color: T.danger, border: "1px solid rgba(176,84,84,0.35)", background: "rgba(255,254,250,0.7)" }}
            >
              Reject
            </button>
            <button
              onClick={openRescheduleModal}
              className="h-9 px-3.5 rounded-[9px] text-[13px] font-semibold cursor-pointer transition-all hover:brightness-110"
              style={{ background: T.accent, color: T.accentInk }}
            >
              Reschedule
            </button>
          </div>
        </div>
      )}

      {/* Two-column body */}
      <div className="flex flex-col xl:flex-row items-start gap-4">
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* Problem + Recommendation */}
          <Card className="!p-6">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4" style={{ color: T.text }}>Problem</h2>
            {consultation.problemStatement ? (
              <p className="text-[13px]" style={{ color: T.text }}>{consultation.problemStatement}</p>
            ) : (
              <p className="text-[13px]" style={{ color: T.faint }}>No problem statement recorded.</p>
            )}

            <div className="mt-5 pt-5 space-y-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              {/* 1. Consultation summary */}
              <div>
                <div className="text-[11px] font-medium tracking-[0.06em] uppercase mb-1.5" style={{ color: T.faint }}>Consultation summary</div>
                {consultation.summary ? (
                  <p className="text-[13.5px] leading-relaxed" style={{ color: T.text }}>{consultation.summary}</p>
                ) : (
                  <p className="text-[13px]" style={{ color: T.faint }}>Not submitted yet — waiting on the astrologer.</p>
                )}
              </div>

              {/* 2. Stone recommendation */}
              <div>
                <div className="text-[11px] font-medium tracking-[0.06em] uppercase mb-2" style={{ color: T.faint }}>Stone recommendation</div>
                {recommendation ? (
                  <div className="rounded-[12px] p-4" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}` }}>
                    <div className="flex items-start gap-3">
                      {(() => {
                        const stone = recommendation.matchedSku
                          ? STONES.find((s) => s.sku === recommendation.matchedSku)
                          : STONES.find((s) =>
                              recommendation.gemstone.toLowerCase().includes(s.gemName.toLowerCase()) ||
                              recommendation.gemstone.toLowerCase().includes(s.english.toLowerCase())
                            );
                        return (
                          <div
                            className="w-[72px] h-[72px] rounded-[10px] shrink-0 overflow-hidden flex items-center justify-center"
                            style={{ background: stone?.shadeHex ? `${stone.shadeHex}22` : "rgba(89,82,54,0.06)", border: `1px solid ${T.borderSoft}` }}
                          >
                            {stone?.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={stone.image} alt={recommendation.gemstone} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[22px]" aria-hidden>💎</span>
                            )}
                          </div>
                        );
                      })()}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="text-[16px] font-semibold min-w-0" style={{ color: T.text }}>{recommendation.gemstone}</div>
                          {recommendation.status === "converted_to_order" && recommendation.orderId ? (
                            <Link href={`/orders/${recommendation.orderId}`} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold shrink-0 hover:underline underline-offset-4" style={{ color: T.accent }}>
                              View order {recommendation.orderId}
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M7 17 17 7M17 7H9M17 7v8" /></svg>
                            </Link>
                          ) : (
                            <GoldBtn
                              onClick={() => setShowSendLinkModal(true)}
                              className="!h-9 !px-4 !text-[12.5px] shrink-0"
                            >
                              {stoneLinkSent ? "Resend Payment Link" : "Send Payment Link"}
                            </GoldBtn>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-[12.5px]">
                          <span style={{ color: T.muted }}>Weight <span className="font-medium" style={{ color: T.text }}>{recommendation.weightRange}</span></span>
                          <span style={{ color: T.muted }}>Purpose <span className="font-medium" style={{ color: T.text }}>{recommendation.purpose ?? "—"}</span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[12px] p-4 text-[13px]" style={{ background: "rgba(89,82,54,0.03)", border: `1px dashed ${T.border}`, color: T.faint }}>No stone recommended yet.</div>
                )}
                {consultation.summarySubmittedAt && (
                  <p className="text-[11.5px] mt-2" style={{ color: T.faint }}>
                    Submitted {new Date(consultation.summarySubmittedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </p>
                )}
              </div>

              {/* 3. Other remedy */}
              <div>
                <div className="text-[11px] font-medium tracking-[0.06em] uppercase mb-1.5" style={{ color: T.faint }}>Other remedy</div>
                {remedy ? (
                  <p className="text-[13.5px] leading-relaxed" style={{ color: T.text }}>
                    <span className="font-medium capitalize">{remedy.type}</span> — {remedy.instructions}
                    {remedy.frequency && ` (${remedy.frequency})`}{remedy.duration && `. Duration: ${remedy.duration}`}
                  </p>
                ) : (
                  <p className="text-[13px]" style={{ color: T.faint }}>No other remedy prescribed.</p>
                )}
              </div>
            </div>
          </Card>

          {/* Meeting */}
          <Card className="!p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Meeting</h2>
              {localMeetingLink && !editingMeetLink && consultation.status !== "closed" && consultation.status !== "completed" && (
                <button onClick={() => { setMeetingLinkInput(localMeetingLink); setEditingMeetLink(true); }} className="text-[12px] font-medium cursor-pointer hover:underline underline-offset-4" style={{ color: T.accent }}>Edit link</button>
              )}
            </div>
            {editingMeetLink ? (
              <div className="space-y-3">
                <Input value={meetingLinkInput} onChange={setMeetingLinkInput} label="Meeting link" type="url" placeholder="https://meet.google.com/..." />
                <div className="flex gap-2.5">
                  <GoldBtn onClick={() => { if (meetingLinkInput) setLocalMeetingLink(meetingLinkInput); setEditingMeetLink(false); }}>Save</GoldBtn>
                  <GhostBtn onClick={() => setEditingMeetLink(false)}>Cancel</GhostBtn>
                </div>
              </div>
            ) : localMeetingLink ? (
              <div className="flex items-center gap-2">
                <a href={localMeetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-[10px] p-3 transition-all duration-200 hover:brightness-[0.98] flex-1 min-w-0" style={{ background: "rgba(95,112,64,0.08)", border: "1px solid rgba(95,112,64,0.2)" }}>
                  <span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "rgba(95,112,64,0.16)", color: T.good }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m23 7-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-medium truncate" style={{ color: T.good }}>{localMeetingLink}</span>
                    <span className="block text-[11px] mt-0.5" style={{ color: T.muted }}>Google Meet</span>
                  </span>
                </a>
                <button onClick={() => { navigator.clipboard.writeText(localMeetingLink); setToast("Link copied to clipboard"); setTimeout(() => setToast(""), 3000); }} className="shrink-0 w-9 h-9 rounded-[9px] flex items-center justify-center transition-all cursor-pointer hover:brightness-[0.97]" style={{ background: "rgba(95,112,64,0.08)", border: "1px solid rgba(95,112,64,0.2)", color: T.good }} title="Copy link">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                </button>
              </div>
            ) : (
              <p className="text-[13px]" style={{ color: T.faint }}>No meeting link set.</p>
            )}
          </Card>
        </div>

        {/* Context rail */}
        <aside className="w-full xl:w-[320px] shrink-0 space-y-4 xl:sticky xl:top-4">
          {customer ? (
            <Link href={`/customers/${customer.id}`} className="block group">
              <Card className="!p-5 card-interactive cursor-pointer">
                {/* Identity header */}
                <div className="flex items-center gap-3 pb-4 mb-4" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <span className="w-10 h-10 rounded-[12px] flex items-center justify-center text-[13.5px] font-semibold shrink-0" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>
                    {customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Customer</div>
                    <div className="text-[14.5px] font-semibold truncate" style={{ color: T.text }}>{customer.name}</div>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: T.faint }}><path d="m9 18 6-6-6-6" /></svg>
                </div>
                {/* Birth — full width */}
                <div className="mb-3.5">
                  <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Birth</div>
                  <div className="text-[13px] font-medium tabular-nums" style={{ color: T.text }}>{customer.birthDate} · {customer.birthTime}</div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: T.muted }}>{customer.birthPlace}</div>
                </div>
                {/* Chart facts — 2-col grid, no dividers */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  {[["Rashi", customer.rashi || "—"], ["Nakshatra", customer.nakshatra || "—"], ["Chart ref", customer.chartRef || "—"]].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>{k}</div>
                      <div className="text-[13px] font-medium" style={{ color: T.text }}>{v}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </Link>
          ) : (
            <Card className="!p-5"><h2 className="text-[15px] font-semibold mb-1" style={{ color: T.text }}>Customer</h2><p className="text-[13px]" style={{ color: T.muted }}>Record not found.</p></Card>
          )}

          {!isPaid ? (
            <div
              className="rounded-[16px] p-5"
              style={{ background: "rgba(160,125,56,0.08)", border: "1px solid rgba(160,125,56,0.28)", boxShadow: T.shadow }}
            >
              <div className="mb-4 pb-4" style={{ borderBottom: "1px solid rgba(160,125,56,0.18)" }}>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: T.gold }} />
                  <h2 className="font-title text-[18px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Payment pending</h2>
                </div>
                <p className="text-[13.5px]" style={{ color: T.muted }}>
                  The customer hasn&apos;t paid the consultation fee yet.
                </p>
              </div>
              <div className="pb-4 mb-4" style={{ borderBottom: "1px solid rgba(160,125,56,0.18)" }}>
                <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Fee</div>
                <div className="font-title text-[24px] leading-none font-semibold tabular-nums" style={{ color: T.text }}>
                  {consultation.fee ? `₹${consultation.fee.toLocaleString("en-IN")}` : "—"}
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setLinkSent(true);
                    setToast(linkSent ? "Payment link resent to customer" : "Payment link sent to customer");
                    setTimeout(() => setToast(""), 3000);
                  }}
                  className="h-11 w-full px-5 rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all hover:brightness-110"
                  style={{ background: T.accent, color: T.accentInk }}
                >
                  {linkSent ? "Resend link" : "Send payment link"}
                </button>
                <button
                  onClick={() => setConfirmMarkPaid(true)}
                  className="h-11 w-full px-5 rounded-[10px] text-[14px] font-semibold cursor-pointer transition-colors hover:bg-[rgba(160,125,56,0.14)]"
                  style={{ color: T.gold, border: "1px solid rgba(160,125,56,0.35)", background: "rgba(255,254,250,0.6)" }}
                >
                  Mark as paid
                </button>
              </div>
            </div>
          ) : (
            <Card className="!p-5">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Payment</h2>
                <Chip tone="good">Paid</Chip>
              </div>
              <div className="pb-3.5 mb-3.5" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Fee</div>
                <div className="font-title text-[24px] leading-none font-semibold tabular-nums" style={{ color: T.text }}>
                  {consultation.fee ? `₹${consultation.fee.toLocaleString("en-IN")}` : "—"}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Paid at</div>
                <div className="text-[13px] font-medium tabular-nums" style={{ color: T.text }}>
                  {dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}
                </div>
              </div>
            </Card>
          )}
        </aside>
      </div>

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
          <GoldBtn onClick={() => { setStoneLinkSent(true); setShowSendLinkModal(false); setToast(stoneLinkSent ? "Payment link resent to customer" : "Payment link sent to customer"); setTimeout(() => setToast(""), 3000); }}>{stoneLinkSent ? "Resend link" : "Send link"}</GoldBtn>
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
                    background: rsExpert?.id === ep.id ? "rgba(119,123,98,0.13)" : T.panel,
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
                      background: sel ? T.accent : avail ? "rgba(119,123,98,0.10)" : "transparent",
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

      {/* No-show confirmation */}
      <ConfirmDialog
        open={!!confirmNoShow}
        onClose={() => setConfirmNoShow(null)}
        onConfirm={() => {
          const by = confirmNoShow === "expert" ? "expert" : "customer";
          setLocalStatus("no_show");
          setLocalNoShowBy(by);
          setToast(by === "expert" ? "Marked as astrologer no show" : "Marked as customer no show");
          setTimeout(() => setToast(""), 3000);
        }}
        title={confirmNoShow === "expert" ? "Mark astrologer no-show?" : "Mark customer no-show?"}
        message={confirmNoShow === "expert"
          ? "This records that the astrologer did not attend the consultation."
          : "This records that the customer did not attend the consultation."}
        confirmLabel="Mark no-show"
        tone="danger"
      />

      {/* Mark payment as received */}
      <ConfirmDialog
        open={confirmMarkPaid}
        onClose={() => setConfirmMarkPaid(false)}
        onConfirm={() => { setLocalPaymentStatus("paid"); setToast("Payment marked as received"); setTimeout(() => setToast(""), 3000); }}
        title="Mark payment as received?"
        message="Confirm that the consultation fee has been received from the customer."
        confirmLabel="Mark as paid"
        tone="default"
      />

      {toast && <Toast message={toast} />}
    </>
  );
}
