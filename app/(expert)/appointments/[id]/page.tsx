"use client";
import { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, GoldBtn, GhostBtn, Textarea, Input, Modal, SearchFilter, StepIndicator, BackLink } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CONSULTATIONS, MOCK_CUSTOMERS, MOCK_STONE_RECOMMENDATIONS, MOCK_REMEDY_RECOMMENDATIONS } from "@/lib/mock";
import { STONES, DESIGNS, inr } from "@/lib/catalog";

type RecStep = "stone" | "design" | "review";
const REC_STEPS: { key: RecStep; label: string }[] = [
  { key: "stone", label: "Stone" },
  { key: "design", label: "Design" },
  { key: "review", label: "Review" },
];

type RecStatus = "not_recommended" | "draft" | "recommended" | "purchased";

interface RecData {
  status: RecStatus;
  stoneSku: string;
  gemstone: string;
  weightRange: string;
  metalSetting: string;
  rationale: string;
  purpose: string;
  fingerGuidance: string;
  timingGuidance: string;
  designName: string;
}

function recStatusTone(s: RecStatus) {
  if (s === "purchased") return "good" as const;
  if (s === "recommended") return "gold" as const;
  if (s === "draft") return "muted" as const;
  return "muted" as const;
}

export default function ConsultationWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const consultation = MOCK_CONSULTATIONS.find((c) => c.id === id);

  // Summary state
  const [summaryText, setSummaryText] = useState(() => consultation?.summary ?? "");
  const [summaryStatus, setSummaryStatus] = useState<"empty" | "draft" | "submitted">(() =>
    consultation?.summary ? "submitted" : "empty"
  );

  const [editingSummary, setEditingSummary] = useState(false);
  const [activeWorkTab, setActiveWorkTab] = useState<"summary" | "stone" | "remedy">("summary");

  // Remedy local state
  const [remedyType, setRemedyType] = useState("");
  const [remedyInstructions, setRemedyInstructions] = useState("");
  const [remedyFrequency, setRemedyFrequency] = useState("");
  const [remedyDuration, setRemedyDuration] = useState("");
  const [remedySaved, setRemedySaved] = useState(false);

  // Recommendation local state — seeded from mock
  const mockRec = MOCK_STONE_RECOMMENDATIONS.find((r) => r.consultationId === id);
  const [recData, setRecData] = useState<RecData>(() => {
    if (!mockRec) return { status: "not_recommended", stoneSku: "", gemstone: "", weightRange: "", metalSetting: "", rationale: "", purpose: "", fingerGuidance: "", timingGuidance: "", designName: "" };
    let status: RecStatus = "not_recommended";
    if (mockRec.status === "draft") status = "draft";
    else if (mockRec.status === "converted_to_order") status = "purchased";
    else if (mockRec.status === "submitted" || mockRec.status === "approved" || mockRec.status === "shared") status = "recommended";
    return {
      status,
      stoneSku: mockRec.matchedSku ?? "",
      gemstone: mockRec.gemstone,
      weightRange: mockRec.weightRange,
      metalSetting: mockRec.metalSetting ?? "",
      rationale: mockRec.rationale,
      purpose: mockRec.purpose,
      fingerGuidance: mockRec.fingerGuidance ?? "",
      timingGuidance: mockRec.timingGuidance ?? "",
      designName: "",
    };
  });

  // Modal state
  const [showRecModal, setShowRecModal] = useState(false);
  const [recStep, setRecStep] = useState<RecStep>("stone");
  const [recSearch, setRecSearch] = useState("");
  const [recStoneSku, setRecStoneSku] = useState("");
  const [recDesignForm, setRecDesignForm] = useState<"" | "Ring" | "Pendant" | "Bracelet" | "Loose">("Ring");
  const [recDesignSlug, setRecDesignSlug] = useState("");
  const [recDesignMetal, setRecDesignMetal] = useState("22K Gold");
  const [recDesignSize, setRecDesignSize] = useState("");
  const [recRationale, setRecRationale] = useState("");
  const [recPurpose, setRecPurpose] = useState("");
  const [recFinger, setRecFinger] = useState("");
  const [recTiming, setRecTiming] = useState("");
  const [animating, setAnimating] = useState(false);
  const [toast, setToast] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [localStatus, setLocalStatus] = useState(consultation?.status ?? "scheduled");
  const [localNoShowBy, setLocalNoShowBy] = useState("");

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
        <div className="mt-3 flex justify-center"><BackLink label="Appointments" href="/appointments" /></div>
      </div>
    );
  }

  const customer = MOCK_CUSTOMERS.find((c) => c.id === consultation.customerId);
  const remedyRec = MOCK_REMEDY_RECOMMENDATIONS.find((r) => r.consultationId === consultation.id);

  const selectedStone = STONES.find((s) => s.sku === recStoneSku);
  const selectedDesign = DESIGNS.find((d) => d.slug === recDesignSlug);

  const recStepIndex = REC_STEPS.findIndex((s) => s.key === recStep);
  const canNavRec = (i: number) => {
    if (i === 0) return true;
    if (i >= 1) return !!recStoneSku;
    return false;
  };

  const goRecStep = (target: RecStep) => {
    setAnimating(true);
    setTimeout(() => { setRecStep(target); setAnimating(false); }, 150);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const openRecModal = () => {
    if (recData.status === "draft") {
      const matchedStone = STONES.find((s) => s.gemName === recData.gemstone || s.sku === recData.stoneSku);
      if (matchedStone) setRecStoneSku(matchedStone.sku);
      setRecRationale(recData.rationale);
      setRecPurpose(recData.purpose);
      setRecFinger(recData.fingerGuidance);
      setRecTiming(recData.timingGuidance);
    } else {
      setRecStoneSku("");
      setRecRationale("");
      setRecPurpose("");
      setRecFinger("");
      setRecTiming("");
    }
    setRecDesignSlug("");
    setRecDesignForm("Ring");
    setRecStep("stone");
    setShowRecModal(true);
  };

  const saveRec = (status: "draft" | "recommended") => {
    const stone = STONES.find((s) => s.sku === recStoneSku);
    const design = DESIGNS.find((d) => d.slug === recDesignSlug);
    setRecData({
      status,
      stoneSku: recStoneSku,
      gemstone: stone?.gemName ?? "",
      weightRange: stone ? `${stone.ratti} ratti` : "",
      metalSetting: recDesignForm === "Loose" ? "Loose stone" : `${recDesignMetal} ${recDesignForm}`,
      rationale: recRationale,
      purpose: recPurpose,
      fingerGuidance: recFinger,
      timingGuidance: recTiming,
      designName: design?.name ?? (recDesignForm === "Loose" ? "Loose stone" : ""),
    });
    setShowRecModal(false);
    showToast(status === "draft" ? "Recommendation saved as draft" : "Recommendation submitted");
  };

  const handleSubmitSummary = () => {
    if (!summaryText.trim()) return;
    setSummaryStatus("submitted");
    setEditingSummary(false);
    showToast(summaryStatus === "submitted" ? "Summary updated" : "Summary submitted successfully");
  };

  const handleSaveDraft = () => {
    if (!summaryText.trim()) return;
    setSummaryStatus("draft");
    showToast("Summary saved as draft");
  };

  const effectiveStatus = localStatus;
  const statusChipLabel = effectiveStatus === "no_show"
    ? (localNoShowBy === "expert" ? "Expert no show" : "Customer no show")
    : effectiveStatus === "summary_pending" ? "Recommendation due"
    : effectiveStatus === "scheduled" || effectiveStatus === "reschedule_requested" ? "Scheduled"
    : (effectiveStatus === "closed" || effectiveStatus === "completed") ? "Done"
    : effectiveStatus.replace(/_/g, " ");
  const statusChipTone = effectiveStatus === "no_show" ? "danger" as const
    : effectiveStatus === "summary_pending" ? "danger" as const
    : (effectiveStatus === "closed" || effectiveStatus === "completed") ? "good" as const
    : "gold" as const;

  const canEditRec = recData.status === "not_recommended" || recData.status === "draft";
  const isUpcoming = effectiveStatus === "scheduled" || effectiveStatus === "reschedule_requested";
  const isRecommendationDue = effectiveStatus === "summary_pending";
  const isNoShow = effectiveStatus === "no_show";

  return (
    <>
      <div className="mb-5">
        <BackLink label="Appointments" href="/appointments" />
      </div>

      {/* Main consultation card — matching admin detail style */}
      <Card className="mb-5">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <h2 className="text-[18px] font-semibold" style={{ color: T.text }}>
                {consultation.customerName} — {consultation.type.replace(/_/g, " ")}
              </h2>
              <Chip tone={statusChipTone}>{statusChipLabel}</Chip>
              {consultation.status === "reschedule_requested" && <Chip tone="gold">Reschedule requested</Chip>}
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              {consultation.meetingLink && isUpcoming && (
                <a href={consultation.meetingLink} target="_blank" rel="noopener">
                  <GoldBtn>Join meeting ↗</GoldBtn>
                </a>
              )}
              <div className="relative" ref={actionMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowActionMenu((v) => !v)}
                  className="w-9 h-9 rounded-[9px] flex items-center justify-center transition-colors hover:bg-[rgba(89,82,54,0.08)] cursor-pointer"
                  style={{ border: `1px solid ${T.border}`, color: T.muted }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
                </button>
                {showActionMenu && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-[220px] rounded-[10px] py-1.5 shadow-lg" style={{ background: T.popover, border: `1px solid ${T.border}` }}>
                    {isUpcoming && (
                      <button
                        onClick={() => { setShowActionMenu(false); setShowReschedule(true); }}
                        className="w-full text-left px-3.5 py-2.5 text-[13px] transition-colors cursor-pointer hover:bg-[rgba(119,123,98,0.08)]"
                        style={{ color: T.text }}
                      >
                        Request reschedule
                      </button>
                    )}
                    {isRecommendationDue && (
                      <>
                        <button
                          onClick={() => { setShowActionMenu(false); setLocalStatus("no_show"); setLocalNoShowBy("customer"); showToast("Marked as customer no show"); }}
                          className="w-full text-left px-3.5 py-2.5 text-[13px] transition-colors cursor-pointer hover:bg-[rgba(119,123,98,0.08)]"
                          style={{ color: T.text }}
                        >
                          Mark as customer no show
                        </button>
                        <button
                          onClick={() => { setShowActionMenu(false); setLocalStatus("no_show"); setLocalNoShowBy("expert"); showToast("Marked as astrologer no show"); }}
                          className="w-full text-left px-3.5 py-2.5 text-[13px] transition-colors cursor-pointer hover:bg-[rgba(119,123,98,0.08)]"
                          style={{ color: T.text }}
                        >
                          Mark as astrologer no show
                        </button>
                      </>
                    )}
                    {isNoShow && (
                      <button
                        onClick={() => { setShowActionMenu(false); setShowReschedule(true); showToast("Reschedule request sent"); }}
                        className="w-full text-left px-3.5 py-2.5 text-[13px] transition-colors cursor-pointer hover:bg-[rgba(119,123,98,0.08)]"
                        style={{ color: T.text }}
                      >
                        Request reschedule
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-[12px] mt-1" style={{ color: T.muted }}>{consultation.id}</div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-[13px]">
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Customer</div>
            <div style={{ color: T.text }}>{consultation.customerName}</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Date</div>
            <div style={{ color: T.text }}>{new Date(consultation.scheduledAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Time</div>
            <div style={{ color: T.text }}>{new Date(consultation.scheduledAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })} · {consultation.duration}min</div>
          </div>
        </div>
      </Card>

      {/* Customer context */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card>
          <div className="text-[15px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Customer context</div>
          {customer ? (
            <div className="space-y-2 text-[13px]">
              {[
                ["Name", customer.name],
                ["Birth", `${customer.birthDate} · ${customer.birthTime}`],
                ["Place", customer.birthPlace],
                ["Rashi / Nakshatra", `${customer.rashi || "—"} / ${customer.nakshatra || "—"}`],
                ["Chart ref", customer.chartRef || "Not generated"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between"><span style={{ color: T.muted }}>{k}</span><span style={{ color: T.text }}>{v}</span></div>
              ))}
            </div>
          ) : (
            <p className="text-[13px]" style={{ color: T.muted }}>Customer not found.</p>
          )}
          {customer?.chartRef && (
            <button
              onClick={() => showToast("Opening chart viewer…")}
              className="mt-3 p-3 rounded-[8px] w-full flex items-center justify-between cursor-pointer transition-all hover:brightness-[0.97]"
              style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}
            >
              <div className="text-left">
                <div className="text-[12px] font-medium" style={{ color: T.text }}>{customer.chartRef} — Kundali / D1 chart</div>
                <div className="text-[11px] mt-0.5" style={{ color: T.faint }}>Open chart viewer</div>
              </div>
              <span className="text-[13.5px]" style={{ color: T.accent }}>↗</span>
            </button>
          )}
        </Card>

        <Card>
          <div className="text-[15px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Problem & intake</div>
          <p className="text-[13.5px] leading-relaxed" style={{ color: T.text }}>
            {consultation.problemStatement || "No problem statement recorded."}
          </p>
          {consultation.notes && (
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <div className="text-[11px] uppercase mb-1" style={{ color: T.faint }}>Notes</div>
              <p className="text-[13px]" style={{ color: T.muted }}>{consultation.notes}</p>
            </div>
          )}
        </Card>
      </div>

      {/* ========= Unified Recommendation Workspace ========= */}
      {!isUpcoming && (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold" style={{ color: T.text }}>Post-consultation</h3>
            <div className="flex items-center gap-2">
              {summaryStatus === "submitted" && recData.status !== "not_recommended" && remedySaved && (
                <Chip tone="good">All submitted</Chip>
              )}
            </div>
          </div>

          {/* Tab bar with completion indicators */}
          <div className="flex items-center gap-1 mb-5 pb-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            {([
              { key: "summary" as const, label: "Summary", done: summaryStatus === "submitted" },
              { key: "stone" as const, label: "Stone recommendation", done: recData.status === "recommended" || recData.status === "purchased" },
              { key: "remedy" as const, label: "Other remedy", done: remedySaved || !!remedyRec },
            ]).map((t) => {
              const active = activeWorkTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveWorkTab(t.key)}
                  className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[13px] font-medium transition-all cursor-pointer"
                  style={{
                    background: active ? "rgba(119,123,98,0.12)" : "transparent",
                    color: active ? T.accent : T.muted,
                  }}
                >
                  <span
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] shrink-0"
                    style={{
                      background: t.done ? T.good : "rgba(89,82,54,0.08)",
                      color: t.done ? "#fff" : T.faint,
                      border: t.done ? "none" : `1px solid ${T.borderSoft}`,
                    }}
                  >
                    {t.done ? "✓" : ""}
                  </span>
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* ---- Summary tab ---- */}
          {activeWorkTab === "summary" && (
            <div>
              {summaryStatus === "submitted" && !editingSummary ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Chip tone="good">Submitted</Chip>
                    <button onClick={() => setEditingSummary(true)} className="text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-80" style={{ color: T.accent }}>Edit</button>
                  </div>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: T.text }}>{summaryText}</p>
                </div>
              ) : (
                <div>
                  <div className="text-[12px] mb-2" style={{ color: T.muted }}>Key observations, interpretation, conclusion, and agreed next steps</div>
                  <Textarea value={summaryText} onChange={setSummaryText} placeholder="Write your consultation summary here…" rows={5} />
                  <div className="flex items-center justify-end gap-2.5 mt-3">
                    {summaryStatus === "submitted" && editingSummary && (
                      <GhostBtn onClick={() => setEditingSummary(false)}>Cancel</GhostBtn>
                    )}
                    {summaryStatus !== "submitted" && (
                      <GhostBtn disabled={!summaryText.trim()} onClick={handleSaveDraft}>Save draft</GhostBtn>
                    )}
                    <GoldBtn disabled={!summaryText.trim()} onClick={handleSubmitSummary}>
                      {summaryStatus === "submitted" ? "Update summary" : "Submit summary"}
                    </GoldBtn>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- Stone recommendation tab ---- */}
          {activeWorkTab === "stone" && (
            <div>
              {recData.status === "not_recommended" && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-[20px]" style={{ background: "rgba(119,123,98,0.1)" }}>💎</div>
                  <p className="text-[13.5px] mb-3" style={{ color: T.muted }}>No stone recommendation yet</p>
                  <GoldBtn onClick={openRecModal}>Select stone from inventory</GoldBtn>
                </div>
              )}

              {recData.status === "draft" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Chip tone="muted">Draft</Chip>
                    <GoldBtn onClick={openRecModal}>Edit draft</GoldBtn>
                  </div>
                  <div className="rounded-[9px] p-4 space-y-2 text-[13px]" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Gemstone</span><span style={{ color: T.text }}>{recData.gemstone}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Weight</span><span style={{ color: T.text }}>{recData.weightRange}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Setting</span><span style={{ color: T.text }}>{recData.metalSetting}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Rationale</span><span className="text-right max-w-[60%]" style={{ color: T.text }}>{recData.rationale}</span></div>
                  </div>
                </div>
              )}

              {(recData.status === "recommended" || recData.status === "purchased") && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Chip tone={recStatusTone(recData.status)}>{recData.status === "purchased" ? "Purchased" : "Recommended"}</Chip>
                  </div>
                  <div className="rounded-[9px] p-4 space-y-2 text-[13px]" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Gemstone</span><span style={{ color: T.text }}>{recData.gemstone}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Weight</span><span style={{ color: T.text }}>{recData.weightRange}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Setting</span><span style={{ color: T.text }}>{recData.metalSetting}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Purpose</span><span className="text-right max-w-[60%]" style={{ color: T.text }}>{recData.purpose}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Finger</span><span style={{ color: T.text }}>{recData.fingerGuidance}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Timing</span><span style={{ color: T.text }}>{recData.timingGuidance}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Rationale</span><span className="text-right max-w-[60%]" style={{ color: T.text }}>{recData.rationale}</span></div>
                    {recData.stoneSku && (
                      <div className="pt-2 mt-2 flex justify-between" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                        <span style={{ color: T.muted }}>Matched SKU</span><span style={{ color: T.accent }}>{recData.stoneSku}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- Other remedy tab ---- */}
          {activeWorkTab === "remedy" && (
            <div>
              {(remedySaved || remedyRec) ? (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Chip tone="good">Saved</Chip>
                    <button onClick={() => setRemedySaved(false)} className="text-[12px] font-medium cursor-pointer transition-opacity hover:opacity-80" style={{ color: T.accent }}>Edit</button>
                  </div>
                  <div className="rounded-[9px] p-4 space-y-2 text-[13px]" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Type</span><span style={{ color: T.text }}>{remedyType || remedyRec?.type || "—"}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Instructions</span><span className="text-right max-w-[60%]" style={{ color: T.text }}>{remedyInstructions || remedyRec?.instructions || "—"}</span></div>
                    {(remedyFrequency || remedyRec?.frequency) && <div className="flex justify-between"><span style={{ color: T.muted }}>Frequency</span><span style={{ color: T.text }}>{remedyFrequency || remedyRec?.frequency}</span></div>}
                    {(remedyDuration || remedyRec?.duration) && <div className="flex justify-between"><span style={{ color: T.muted }}>Duration</span><span style={{ color: T.text }}>{remedyDuration || remedyRec?.duration}</span></div>}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-[12px] mb-3" style={{ color: T.muted }}>Prescribe mantras, rituals, or lifestyle changes</div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[12px] block mb-1.5" style={{ color: T.muted }}>Remedy type</label>
                      <div className="flex flex-wrap gap-2">
                        {["Mantra", "Havan / Puja", "Gemstone wearing ritual", "Charity / Daan", "Lifestyle", "Other"].map((type) => (
                          <button
                            key={type}
                            onClick={() => setRemedyType(type)}
                            className="px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-all cursor-pointer"
                            style={{
                              background: remedyType === type ? "rgba(119,123,98,0.15)" : T.bg,
                              border: `1.5px solid ${remedyType === type ? "rgba(119,123,98,0.65)" : T.borderSoft}`,
                              color: remedyType === type ? T.accent : T.text,
                            }}
                          >{type}</button>
                        ))}
                      </div>
                    </div>
                    <Textarea value={remedyInstructions} onChange={setRemedyInstructions} label="Instructions" placeholder="Detailed instructions for the customer…" rows={3} />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Input value={remedyFrequency} onChange={setRemedyFrequency} label="Frequency (optional)" placeholder="E.g. Daily, Every Saturday" />
                      <Input value={remedyDuration} onChange={setRemedyDuration} label="Duration (optional)" placeholder="E.g. 40 days, 3 months" />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <GoldBtn disabled={!remedyType || !remedyInstructions.trim()} onClick={() => { setRemedySaved(true); showToast("Remedy saved"); }}>
                      Save remedy
                    </GoldBtn>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ================================================================ */}
      {/*  Recommendation modal                                            */}
      {/* ================================================================ */}
      <Modal open={showRecModal} onClose={() => setShowRecModal(false)} title="Stone recommendation" wide>
        <StepIndicator
          steps={REC_STEPS}
          currentIndex={recStepIndex}
          onNavigate={(i) => goRecStep(REC_STEPS[i].key)}
          canNavigateTo={canNavRec}
        />

        <div
          className="transition-all duration-150 mt-4"
          style={{ opacity: animating ? 0 : 1, transform: animating ? "translateY(6px)" : "translateY(0)" }}
        >
          {/* STEP: Stone */}
          {recStep === "stone" && (
            <>
              <div className="text-[15px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Select stone from inventory</div>
              <div className="mb-3">
                <SearchFilter search={recSearch} onSearchChange={setRecSearch} placeholder="Search SKU, gemstone…" />
              </div>
              <div className="max-h-[320px] overflow-y-auto">
                {STONES.filter((s) => !recSearch || s.sku.toLowerCase().includes(recSearch.toLowerCase()) || s.gemName.toLowerCase().includes(recSearch.toLowerCase())).slice(0, 20).map((s) => (
                  <button
                    key={s.sku}
                    onClick={() => { setRecStoneSku(s.sku); setRecSearch(""); }}
                    className="w-full flex items-center justify-between py-3 px-3 text-left rounded-[9px] transition-all duration-150 cursor-pointer hover:pl-4"
                    style={{
                      background: recStoneSku === s.sku ? "rgba(119,123,98,0.13)" : "transparent",
                      borderBottom: `1px solid ${T.borderSoft}`,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[13.5px] font-medium" style={{ color: T.text }}>{s.sku}</div>
                      <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>
                        {s.gemName} · {s.origin} · {s.ratti}r · {inr(s.price)}
                      </div>
                    </div>
                    {recStoneSku === s.sku && <span style={{ color: T.accent }}>✓</span>}
                  </button>
                ))}
              </div>
              {recStoneSku && (
                <div className="mt-4 pt-3 flex justify-end" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <GoldBtn onClick={() => goRecStep("design")}>Next →</GoldBtn>
                </div>
              )}
            </>
          )}

          {/* STEP: Design */}
          {recStep === "design" && (
            <>
              <div className="text-[15px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Select jewellery design (optional)</div>
              <div className="space-y-5">
                <div>
                  <div className="text-[11px] tracking-[0.06em] uppercase mb-2.5" style={{ color: T.muted }}>Type of wear</div>
                  <div className="flex flex-wrap gap-2.5">
                    {(["Ring", "Pendant", "Bracelet", "Loose"] as const).map((form) => {
                      const isActive = recDesignForm === form;
                      return (
                        <button
                          key={form}
                          onClick={() => { setRecDesignForm(form); setRecDesignSize(""); if (form === "Loose") setRecDesignSlug(""); }}
                          className="flex flex-col items-center justify-center w-[80px] h-[70px] rounded-[10px] transition-all duration-150 cursor-pointer"
                          style={{
                            background: isActive ? "rgba(119,123,98,0.15)" : T.bg,
                            border: `1.5px solid ${isActive ? "rgba(119,123,98,0.65)" : T.borderSoft}`,
                          }}
                        >
                          <span className="text-[18px] mb-1">
                            {form === "Ring" && "💍"}{form === "Pendant" && "📿"}{form === "Bracelet" && "⌚"}{form === "Loose" && "💎"}
                          </span>
                          <span className="text-[11px] font-medium" style={{ color: isActive ? T.accent : T.text }}>
                            {form === "Loose" ? "Loose stone" : form}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {recDesignForm && recDesignForm !== "Loose" && (
                  <div>
                    <div className="text-[11px] tracking-[0.06em] uppercase mb-2.5" style={{ color: T.muted }}>Metal</div>
                    <div className="flex flex-wrap gap-2">
                      {["22K Gold", "18K Gold", "Silver", "Panchdhatu"].map((metal) => (
                        <button
                          key={metal}
                          onClick={() => setRecDesignMetal(recDesignMetal === metal ? "" : metal)}
                          className="px-3 py-1.5 rounded-[8px] text-[11px] font-medium transition-all duration-150 cursor-pointer"
                          style={{
                            background: recDesignMetal === metal ? "rgba(119,123,98,0.15)" : T.bg,
                            border: `1.5px solid ${recDesignMetal === metal ? "rgba(119,123,98,0.65)" : T.borderSoft}`,
                            color: recDesignMetal === metal ? T.accent : T.text,
                          }}
                        >{metal}</button>
                      ))}
                    </div>
                  </div>
                )}

                {recDesignForm && recDesignForm !== "Loose" && (
                  <div>
                    <div className="text-[11px] tracking-[0.06em] uppercase mb-2.5" style={{ color: T.muted }}>Designs</div>
                    <div className="grid grid-cols-3 gap-2.5 max-h-[200px] overflow-y-auto">
                      {DESIGNS.filter((d) => d.remaining > 0 && d.form === recDesignForm).map((d) => {
                        const isActive = recDesignSlug === d.slug;
                        return (
                          <button
                            key={d.slug}
                            onClick={() => setRecDesignSlug(d.slug)}
                            className="flex flex-col items-center p-2.5 rounded-[10px] transition-all duration-150 cursor-pointer"
                            style={{
                              background: isActive ? "rgba(119,123,98,0.15)" : T.bg,
                              border: `1.5px solid ${isActive ? "rgba(119,123,98,0.65)" : T.borderSoft}`,
                            }}
                          >
                            <div className="w-[56px] h-[56px] rounded-[8px] overflow-hidden mb-1.5" style={{ background: "rgba(119,123,98,0.10)", border: `1px solid ${T.borderSoft}` }}>
                              <img src={d.image} alt={d.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            </div>
                            <span className="text-[11px] font-medium text-center truncate w-full" style={{ color: isActive ? T.accent : T.text }}>{d.name}</span>
                            <span className="text-[11px]" style={{ color: T.faint }}>₹{d.price.toLocaleString("en-IN")}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 flex justify-end gap-2.5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <GhostBtn onClick={() => goRecStep("stone")}>← Back</GhostBtn>
                <GoldBtn onClick={() => goRecStep("review")}>Next →</GoldBtn>
              </div>
            </>
          )}

          {/* STEP: Review */}
          {recStep === "review" && (
            <>
              <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.faint }}>Review recommendation</div>

              <div className="space-y-3 text-[13.5px] mb-5">
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <span style={{ color: T.muted }}>Stone</span>
                  <span style={{ color: T.text }}>{selectedStone ? `${selectedStone.gemName} · ${selectedStone.sku} · ${selectedStone.ratti}r` : "—"}</span>
                </div>
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <span style={{ color: T.muted }}>Design</span>
                  <span style={{ color: T.text }}>
                    {recDesignForm === "Loose" ? "Loose stone" : selectedDesign ? `${selectedDesign.name} · ${recDesignMetal}` : "None selected"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Textarea value={recRationale} onChange={setRecRationale} label="Astrological rationale" placeholder="Why this stone for this chart…" rows={3} />
                <Input value={recPurpose} onChange={setRecPurpose} label="Purpose" placeholder="E.g. Career advancement" />
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input value={recFinger} onChange={setRecFinger} label="Finger guidance" placeholder="E.g. Index finger, right hand" />
                  <Input value={recTiming} onChange={setRecTiming} label="Timing guidance" placeholder="E.g. Thursday, Pushya nakshatra" />
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <GhostBtn onClick={() => goRecStep("design")}>← Back</GhostBtn>
                <div className="flex gap-2.5">
                  <GhostBtn onClick={() => saveRec("draft")}>Save as draft</GhostBtn>
                  <GoldBtn disabled={!recRationale.trim() || !recStoneSku} onClick={() => saveRec("recommended")}>Recommend</GoldBtn>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Reschedule modal */}
      <Modal open={showReschedule} onClose={() => { setShowReschedule(false); setRescheduleReason(""); }} title="Request reschedule">
        <div className="space-y-4">
          <div>
            <label className="text-[12px] block mb-1.5" style={{ color: T.muted }}>Reason for reschedule</label>
            <Textarea
              value={rescheduleReason}
              onChange={setRescheduleReason}
              placeholder="Why does this consultation need to be rescheduled?"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <GhostBtn onClick={() => { setShowReschedule(false); setRescheduleReason(""); }}>Cancel</GhostBtn>
            <GoldBtn
              disabled={!rescheduleReason.trim()}
              onClick={() => {
                showToast("Reschedule request sent");
                setShowReschedule(false);
                setRescheduleReason("");
              }}
            >
              Confirm
            </GoldBtn>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good, animation: "fadeIn 200ms ease-out" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
