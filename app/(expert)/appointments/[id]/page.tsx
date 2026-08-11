"use client";
import { use, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, GoldBtn, GhostBtn, Textarea, Input, Modal, SearchFilter, StepIndicator } from "@/components/ui";
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

  const [notes, setNotes] = useState("");
  const [editingSummary, setEditingSummary] = useState(false);

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

  if (!consultation) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: T.muted }}>Consultation not found.</p>
        <Link href="/appointments" className="text-[12.5px] mt-2 inline-block" style={{ color: T.accent }}>← Back</Link>
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

  const consultStatusTone = consultation.status === "scheduled" ? "gold" as const
    : (consultation.status === "closed" || consultation.status === "completed") ? "good" as const
    : "muted" as const;

  const canEditRec = recData.status === "not_recommended" || recData.status === "draft";
  const isUpcoming = consultation.status === "scheduled" || consultation.status === "reschedule_requested";

  return (
    <>
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-4 hover:opacity-80 cursor-pointer transition-opacity duration-200"
          style={{ color: T.accent }}
        >
          ← Appointments
        </button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-[17px] font-semibold" style={{ color: T.text }}>
              {consultation.customerName} — {consultation.type.replace(/_/g, " ")}
            </h1>
            <Chip tone={consultStatusTone}>{consultation.status.replace(/_/g, " ")}</Chip>
            {consultation.rescheduleReason && <Chip tone="gold">Reschedule requested</Chip>}
          </div>
          <div className="flex items-center gap-2.5">
            {isUpcoming && (
              <GhostBtn onClick={() => setShowReschedule(true)}>Request reschedule</GhostBtn>
            )}
            {consultation.meetingLink && isUpcoming && (
              <a href={consultation.meetingLink} target="_blank" rel="noopener">
                <GoldBtn>Join meeting ↗</GoldBtn>
              </a>
            )}
          </div>
        </div>
        <p className="text-[12.5px] mt-1" style={{ color: T.muted }}>
          {new Date(consultation.scheduledAt).toLocaleString("en-IN")} · {consultation.duration}min
        </p>
      </div>

      {/* Customer context */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Customer context</div>
          {customer ? (
            <div className="space-y-2 text-[12.5px]">
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
            <p className="text-[12.5px]" style={{ color: T.muted }}>Customer not found.</p>
          )}
          {customer?.chartRef && (
            <button
              onClick={() => showToast("Opening chart viewer…")}
              className="mt-3 p-3 rounded-[8px] w-full flex items-center justify-between cursor-pointer transition-all hover:brightness-110"
              style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}
            >
              <div className="text-left">
                <div className="text-[12px] font-medium" style={{ color: T.text }}>{customer.chartRef} — Kundali / D1 chart</div>
                <div className="text-[10.5px] mt-0.5" style={{ color: T.faint }}>Open chart viewer</div>
              </div>
              <span className="text-[13px]" style={{ color: T.accent }}>↗</span>
            </button>
          )}
        </Card>

        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Problem & intake</div>
          <p className="text-[13px] leading-relaxed" style={{ color: T.text }}>
            {consultation.problemStatement || "No problem statement recorded."}
          </p>
          {consultation.notes && (
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <div className="text-[10px] uppercase mb-1" style={{ color: T.faint }}>Notes</div>
              <p className="text-[12.5px]" style={{ color: T.muted }}>{consultation.notes}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Working notes */}
      <Card className="mb-4">
        <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Working notes (private)</div>
        <Textarea value={notes} onChange={setNotes} placeholder="Personal notes during consultation — not shared with customer" rows={3} />
        <div className="flex justify-end mt-3">
          <GhostBtn disabled={!notes.trim()} onClick={() => showToast("Notes saved")}>Save notes</GhostBtn>
        </div>
      </Card>

      {/* Post-consultation summary (only for past/ongoing appointments) */}
      {!isUpcoming && <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Post-consultation summary</div>
          <div className="flex items-center gap-2">
            {summaryStatus === "submitted" && <Chip tone="good">Submitted</Chip>}
            {summaryStatus === "draft" && <Chip tone="muted">Draft saved</Chip>}
            {summaryStatus === "submitted" && !editingSummary && (
              <button
                onClick={() => setEditingSummary(true)}
                className="text-[11px] font-medium cursor-pointer transition-opacity hover:opacity-80"
                style={{ color: T.accent }}
              >
                Edit
              </button>
            )}
          </div>
        </div>
        {summaryStatus === "submitted" && !editingSummary ? (
          <p className="text-[13px] leading-relaxed" style={{ color: T.text }}>{summaryText}</p>
        ) : (
          <>
            <Textarea value={summaryText} onChange={setSummaryText} placeholder="Key observations, interpretation, conclusion, agreed next steps…" rows={4} />
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
          </>
        )}
      </Card>}

      {/* Stone recommendation (only for past/ongoing appointments) */}
      {!isUpcoming && <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Stone recommendation</div>
          <div className="flex items-center gap-2.5">
            {recData.status !== "not_recommended" && (
              <Chip tone={recStatusTone(recData.status)}>{recData.status.replace(/_/g, " ")}</Chip>
            )}
            {canEditRec && (
              <GoldBtn onClick={openRecModal}>
                {recData.status === "draft" ? "Edit draft" : "+ New recommendation"}
              </GoldBtn>
            )}
          </div>
        </div>

        {recData.status === "not_recommended" && (
          <p className="text-[12.5px]" style={{ color: T.muted }}>No recommendation yet. Click above to create one.</p>
        )}

        {recData.status === "draft" && (
          <div className="space-y-1.5 text-[12.5px]">
            <div><span style={{ color: T.muted }}>Gemstone: </span><span style={{ color: T.text }}>{recData.gemstone}</span></div>
            <div><span style={{ color: T.muted }}>Weight: </span><span style={{ color: T.text }}>{recData.weightRange}</span></div>
            <div><span style={{ color: T.muted }}>Setting: </span><span style={{ color: T.text }}>{recData.metalSetting}</span></div>
            <div><span style={{ color: T.muted }}>Rationale: </span><span style={{ color: T.text }}>{recData.rationale}</span></div>
          </div>
        )}

        {(recData.status === "recommended" || recData.status === "purchased") && (
          <div className="space-y-1.5 text-[12.5px]">
            <div><span style={{ color: T.muted }}>Gemstone: </span><span style={{ color: T.text }}>{recData.gemstone}</span></div>
            <div><span style={{ color: T.muted }}>Weight: </span><span style={{ color: T.text }}>{recData.weightRange}</span></div>
            <div><span style={{ color: T.muted }}>Setting: </span><span style={{ color: T.text }}>{recData.metalSetting}</span></div>
            <div><span style={{ color: T.muted }}>Purpose: </span><span style={{ color: T.text }}>{recData.purpose}</span></div>
            <div><span style={{ color: T.muted }}>Finger: </span><span style={{ color: T.text }}>{recData.fingerGuidance}</span></div>
            <div><span style={{ color: T.muted }}>Timing: </span><span style={{ color: T.text }}>{recData.timingGuidance}</span></div>
            <div><span style={{ color: T.muted }}>Rationale: </span><span style={{ color: T.text }}>{recData.rationale}</span></div>
            {recData.stoneSku && (
              <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <span style={{ color: T.muted }}>Matched SKU: </span><span style={{ color: T.accent }}>{recData.stoneSku}</span>
              </div>
            )}
          </div>
        )}
      </Card>}

      {/* Remedy recommendation (only for past/ongoing) */}
      {!isUpcoming && remedyRec && (
        <Card className="mb-4">
          <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Other remedy</div>
          <div className="space-y-1.5 text-[12.5px]">
            <div><span style={{ color: T.muted }}>Type: </span><span style={{ color: T.text }}>{remedyRec.type}</span></div>
            <div><span style={{ color: T.muted }}>Instructions: </span><span style={{ color: T.text }}>{remedyRec.instructions}</span></div>
            {remedyRec.frequency && <div><span style={{ color: T.muted }}>Frequency: </span><span style={{ color: T.text }}>{remedyRec.frequency}</span></div>}
            {remedyRec.duration && <div><span style={{ color: T.muted }}>Duration: </span><span style={{ color: T.text }}>{remedyRec.duration}</span></div>}
          </div>
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
              <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Select stone from inventory</div>
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
                      background: recStoneSku === s.sku ? "rgba(195,160,88,0.08)" : "transparent",
                      borderBottom: `1px solid ${T.borderSoft}`,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-medium" style={{ color: T.text }}>{s.sku}</div>
                      <div className="text-[11.5px] mt-0.5" style={{ color: T.muted }}>
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
              <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Select jewellery design (optional)</div>
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
                            background: isActive ? "rgba(195,160,88,0.1)" : T.bg,
                            border: `1.5px solid ${isActive ? "rgba(195,160,88,0.6)" : T.borderSoft}`,
                          }}
                        >
                          <span className="text-[18px] mb-1">
                            {form === "Ring" && "💍"}{form === "Pendant" && "📿"}{form === "Bracelet" && "⌚"}{form === "Loose" && "💎"}
                          </span>
                          <span className="text-[10px] font-medium" style={{ color: isActive ? T.accent : T.text }}>
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
                            background: recDesignMetal === metal ? "rgba(195,160,88,0.1)" : T.bg,
                            border: `1.5px solid ${recDesignMetal === metal ? "rgba(195,160,88,0.6)" : T.borderSoft}`,
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
                              background: isActive ? "rgba(195,160,88,0.1)" : T.bg,
                              border: `1.5px solid ${isActive ? "rgba(195,160,88,0.6)" : T.borderSoft}`,
                            }}
                          >
                            <div className="w-[56px] h-[56px] rounded-[8px] overflow-hidden mb-1.5" style={{ background: "rgba(195,160,88,0.04)", border: `1px solid ${T.borderSoft}` }}>
                              <img src={d.image} alt={d.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            </div>
                            <span className="text-[11px] font-medium text-center truncate w-full" style={{ color: isActive ? T.accent : T.text }}>{d.name}</span>
                            <span className="text-[10px]" style={{ color: T.faint }}>₹{d.price.toLocaleString("en-IN")}</span>
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

              <div className="space-y-3 text-[13px] mb-5">
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
            <label className="text-[11.5px] block mb-1.5" style={{ color: T.muted }}>Reason for reschedule</label>
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
          className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13px] font-medium"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good, animation: "fadeIn 200ms ease-out" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
