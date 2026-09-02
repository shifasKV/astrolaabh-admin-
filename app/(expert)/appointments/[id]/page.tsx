"use client";
import { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Card, Chip, GoldBtn, GhostBtn, Textarea, Input, Modal, BackLink, ConfirmDialog } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CONSULTATIONS, MOCK_CUSTOMERS, MOCK_STONE_RECOMMENDATIONS, MOCK_REMEDY_RECOMMENDATIONS } from "@/lib/mock";
import { STONES } from "@/lib/catalog";
import { RecommendationPickerFlow, type RecommendationPickResult } from "@/components/create/RecommendationPickerFlow";

type RecStatus = "not_recommended" | "draft" | "recommended" | "purchased";

interface RecData {
  status: RecStatus;
  stoneSku: string;
  gemstone: string;
  weightRange: string;
  metalSetting: string;
  why: string;
  purpose: string;
  howToWear: string;
  designName: string;
  designSlug: string;
  form: string;
  energisationKey: string;
  energisationName: string;
}

interface DetailFields {
  why: string;
  purpose: string;
  howToWear: string;
}

function remedyIsComplete(v: string | null): boolean {
  return !!v && !!v.trim();
}

function SectionActions({
  showEdit,
  showSave,
  onEdit,
  onSave,
  saveDisabled,
}: {
  showEdit?: boolean;
  showSave?: boolean;
  onEdit?: () => void;
  onSave: () => void;
  saveDisabled?: boolean;
}) {
  if (showSave) {
    return (
      <GoldBtn onClick={onSave} disabled={saveDisabled} className="!h-8 !px-3.5 !text-[12px] shrink-0">
        Save
      </GoldBtn>
    );
  }
  if (showEdit && onEdit) {
    return (
      <GoldBtn onClick={onEdit} className="!h-8 !px-3.5 !text-[12px] shrink-0">
        Edit
      </GoldBtn>
    );
  }
  return null;
}

function StoneRecDisplay({
  recData,
  savedDetails,
  canChangeStone,
  canEditDetails,
  detailsIsEditing,
  onChangeStone,
  onEditDetails,
  onSaveDetails,
  onDetailsChange,
}: {
  recData: RecData;
  savedDetails: DetailFields;
  canChangeStone?: boolean;
  canEditDetails?: boolean;
  detailsIsEditing?: boolean;
  onChangeStone?: () => void;
  onEditDetails?: () => void;
  onSaveDetails?: () => void;
  onDetailsChange?: (field: "purpose" | "howToWear" | "why", value: string) => void;
}) {
  const stone = STONES.find((s) => s.sku === recData.stoneSku)
    ?? STONES.find((s) =>
      recData.gemstone.toLowerCase().includes(s.gemName.toLowerCase()) ||
      recData.gemstone.toLowerCase().includes(s.english.toLowerCase())
    );
  const isLoose = recData.metalSetting.toLowerCase().includes("loose");
  const jewellery = isLoose ? "Loose stone" : (recData.designName || recData.metalSetting.split(" ").slice(-1)[0] || "—");
  const metal = isLoose ? "—" : recData.metalSetting.replace(/\s+(Ring|Pendant|Bracelet)$/i, "") || recData.metalSetting;

  return (
    <div className="rounded-[12px] p-4" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}` }}>
      <div className="flex items-start gap-3">
        <div
          className="w-[72px] h-[72px] rounded-[10px] shrink-0 overflow-hidden flex items-center justify-center"
          style={{ background: stone?.shadeHex ? `${stone.shadeHex}22` : "rgba(89,82,54,0.06)", border: `1px solid ${T.borderSoft}` }}
        >
          {stone?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={stone.image} alt={recData.gemstone} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[22px]" aria-hidden>💎</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-semibold" style={{ color: T.text }}>{recData.gemstone}</div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-2 text-[12.5px]">
            <span style={{ color: T.muted }}>Weight <span className="font-medium" style={{ color: T.text }}>{recData.weightRange || "—"}</span></span>
            {!isLoose && <span style={{ color: T.muted }}>Metal <span className="font-medium" style={{ color: T.text }}>{metal}</span></span>}
            <span style={{ color: T.muted }}>Jewellery <span className="font-medium" style={{ color: T.text }}>{jewellery}</span></span>
            {recData.energisationName && (
              <span style={{ color: T.muted }}>Energisation <span className="font-medium" style={{ color: T.text }}>{recData.energisationName}</span></span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canChangeStone && onChangeStone && (
            <GhostBtn onClick={onChangeStone} className="!h-8 !px-3.5 !text-[12px]">
              Change stone
            </GhostBtn>
          )}
        </div>
      </div>
      {(savedDetails.purpose || savedDetails.howToWear || savedDetails.why || detailsIsEditing || canEditDetails) && (
        <div className="mt-4 pt-4 space-y-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
          {canEditDetails && (
            <div className="flex items-center justify-end -mt-1 mb-1">
              <SectionActions
                showEdit={!detailsIsEditing}
                showSave={!!detailsIsEditing}
                onEdit={onEditDetails}
                onSave={() => onSaveDetails?.()}
                saveDisabled={!recData.why.trim() || !recData.purpose.trim()}
              />
            </div>
          )}
          {detailsIsEditing ? (
            <div className="space-y-3">
              <Textarea value={recData.why} onChange={(v) => onDetailsChange?.("why", v)} label="Why" placeholder="Why this stone for this chart…" rows={3} />
              <Input value={recData.purpose} onChange={(v) => onDetailsChange?.("purpose", v)} label="Purpose" placeholder="E.g. Career advancement" />
              <Textarea value={recData.howToWear} onChange={(v) => onDetailsChange?.("howToWear", v)} label="How to wear" placeholder="E.g. Index finger, right hand · Thursday, Pushya nakshatra" rows={2} />
            </div>
          ) : (
            <>
              {savedDetails.purpose && (
                <div>
                  <div className="text-[11px] font-medium tracking-[0.06em] uppercase mb-1" style={{ color: T.faint }}>Purpose</div>
                  <p className="text-[13px] leading-relaxed" style={{ color: T.text }}>{savedDetails.purpose}</p>
                </div>
              )}
              {savedDetails.howToWear && (
                <div>
                  <div className="text-[11px] font-medium tracking-[0.06em] uppercase mb-1" style={{ color: T.faint }}>How to wear</div>
                  <p className="text-[13px] leading-relaxed" style={{ color: T.text }}>{savedDetails.howToWear}</p>
                </div>
              )}
              {savedDetails.why && (
                <div>
                  <div className="text-[11px] font-medium tracking-[0.06em] uppercase mb-1" style={{ color: T.faint }}>Why</div>
                  <p className="text-[13px] leading-relaxed" style={{ color: T.text }}>{savedDetails.why}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConsultationWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const consultation = MOCK_CONSULTATIONS.find((c) => c.id === id);

  // Summary — saved = committed section value; summaryText = in-progress draft
  const initialSummary = consultation?.summary ?? "";
  const [savedSummary, setSavedSummary] = useState(initialSummary);
  const [summaryText, setSummaryText] = useState(initialSummary);
  const [summaryEditSession, setSummaryEditSession] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState<"empty" | "draft" | "submitted">(() =>
    consultation?.summary ? "submitted" : "empty"
  );
  const [packageStatus, setPackageStatus] = useState<"empty" | "draft" | "submitted">(() => {
    if (consultation?.summary) return "submitted";
    return "empty";
  });
  const [showEditWarning, setShowEditWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [activeWorkTab, setActiveWorkTab] = useState<"summary" | "stone" | "remedy">("summary");

  // Remedy — optional single free-text field
  const initialRemedy = (() => {
    const rec = MOCK_REMEDY_RECOMMENDATIONS.find((r) => r.consultationId === id);
    if (!rec) return null;
    return [rec.type, rec.instructions].filter(Boolean).join("\n\n");
  })();
  const [savedRemedy, setSavedRemedy] = useState<string | null>(initialRemedy);
  const [remedyText, setRemedyText] = useState(initialRemedy ?? "");
  const [remedyEditSession, setRemedyEditSession] = useState(false);

  // Recommendation local state — seeded from mock
  const mockRec = MOCK_STONE_RECOMMENDATIONS.find((r) => r.consultationId === id);
  const [recData, setRecData] = useState<RecData>(() => {
    if (!mockRec) return { status: "not_recommended", stoneSku: "", gemstone: "", weightRange: "", metalSetting: "", why: "", purpose: "", howToWear: "", designName: "", designSlug: "", form: "Ring", energisationKey: "shuddhi", energisationName: "Shuddhi" };
    let status: RecStatus = "not_recommended";
    if (mockRec.status === "draft") status = "draft";
    else if (mockRec.status === "converted_to_order") status = "purchased";
    else if (mockRec.status === "submitted" || mockRec.status === "approved" || mockRec.status === "shared") status = "recommended";
    const howToWear = [mockRec.fingerGuidance, mockRec.timingGuidance].filter(Boolean).join(" · ");
    return {
      status,
      stoneSku: mockRec.matchedSku ?? "",
      gemstone: mockRec.gemstone,
      weightRange: mockRec.weightRange,
      metalSetting: mockRec.metalSetting ?? "",
      why: mockRec.rationale,
      purpose: mockRec.purpose,
      howToWear,
      designName: "",
      designSlug: "",
      form: "Ring",
      energisationKey: "shuddhi",
      energisationName: "Shuddhi",
    };
  });

  const [showRecModal, setShowRecModal] = useState(false);
  const [recPickerStartStep, setRecPickerStartStep] = useState(0);

  const [savedDetails, setSavedDetails] = useState<DetailFields>(() => {
    if (!mockRec) return { why: "", purpose: "", howToWear: "" };
    const howToWear = [mockRec.fingerGuidance, mockRec.timingGuidance].filter(Boolean).join(" · ");
    return { why: mockRec.rationale, purpose: mockRec.purpose, howToWear };
  });
  const [detailsEditSession, setDetailsEditSession] = useState(false);
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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const openRecPicker = (startStep = 0) => {
    setRecPickerStartStep(startStep);
    setShowRecModal(true);
  };

  const handlePickerComplete = (pick: RecommendationPickResult) => {
    setRecData((prev) => ({
      ...prev,
      status: prev.status === "recommended" || prev.status === "purchased" ? prev.status : "draft",
      stoneSku: pick.stoneSku,
      gemstone: pick.gemstone,
      weightRange: pick.weightRange,
      metalSetting: pick.metalSetting,
      designName: pick.designName,
      designSlug: pick.designSlug,
      form: pick.form,
      energisationKey: pick.energisationKey,
      energisationName: pick.energisationName,
    }));
    setShowRecModal(false);
    if (packageStatus !== "submitted") setPackageStatus("draft");
    showToast("Stone selection saved");
  };

  const handleDetailsChange = (field: "purpose" | "howToWear" | "why", value: string) => {
    setRecData((prev) => ({ ...prev, [field]: value }));
  };

  const hasMandatoryContent = savedSummary.trim().length > 0;
  const hasStoneRecommendation = recData.status !== "not_recommended";
  const hasRemedy = remedyIsComplete(savedRemedy);

  const summaryHasSaved = !!savedSummary.trim();
  const summaryIsFirstEntry = !summaryHasSaved && packageStatus !== "submitted";
  const summaryIsEditing = summaryIsFirstEntry || summaryEditSession;

  const remedyHasSaved = hasRemedy;
  const remedyIsFirstEntry = !remedyHasSaved && packageStatus !== "submitted";
  const remedyIsEditing = remedyIsFirstEntry || remedyEditSession;

  const detailsHasSaved = !!(savedDetails.why.trim() && savedDetails.purpose.trim());
  const detailsIsFirstEntry = !detailsHasSaved && packageStatus !== "submitted" && hasStoneRecommendation;
  const detailsIsEditing = detailsIsFirstEntry || detailsEditSession;

  const missingOptionalParts = [
    !hasStoneRecommendation ? "Stone recommendation" : null,
    !hasRemedy ? "Other remedy" : null,
  ].filter(Boolean) as string[];

  const startEditSummary = () => {
    setSummaryText(savedSummary);
    setSummaryEditSession(true);
  };

  const saveSummarySection = () => {
    if (!summaryText.trim()) return;
    setSavedSummary(summaryText);
    setSummaryEditSession(false);
    if (packageStatus !== "submitted") {
      setSummaryStatus("draft");
      setPackageStatus("draft");
    }
  };

  const startEditRemedy = () => {
    setRemedyText(savedRemedy ?? "");
    setRemedyEditSession(true);
  };

  const saveRemedySection = () => {
    if (!remedyText.trim()) return;
    setSavedRemedy(remedyText.trim());
    setRemedyEditSession(false);
    if (packageStatus !== "submitted") setPackageStatus("draft");
  };

  const startEditDetails = () => {
    setRecData((prev) => ({ ...prev, ...savedDetails }));
    setDetailsEditSession(true);
  };

  const saveDetailsSection = () => {
    if (!recData.why.trim() || !recData.purpose.trim()) return;
    const next = { why: recData.why, purpose: recData.purpose, howToWear: recData.howToWear };
    setSavedDetails(next);
    setDetailsEditSession(false);
    if (packageStatus !== "submitted") setPackageStatus("draft");
  };

  const contentBoxStyle = { background: T.bg, border: `1px solid ${T.borderSoft}` };

  const performSubmitRecommendation = () => {
    if (!hasMandatoryContent) return;
    setSummaryStatus("submitted");
    setSummaryEditSession(false);
    setRemedyEditSession(false);
    setDetailsEditSession(false);
    setShowEditWarning(false);
    setShowSubmitConfirm(false);
    if (recData.status === "draft") {
      setRecData((prev) => ({ ...prev, status: "recommended" }));
    }
    setPackageStatus("submitted");
    showToast("Recommendation submitted successfully");
  };

  const handleSubmitRecommendation = () => {
    if (!hasMandatoryContent) return;
    if (missingOptionalParts.length > 0) {
      setShowSubmitConfirm(true);
      return;
    }
    performSubmitRecommendation();
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
        <Card className={`mb-4 ${isNoShow ? "opacity-50 pointer-events-none select-none" : ""}`}>
          <div className="flex items-center justify-between gap-4 mb-4 pb-4" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            <div className="flex items-center gap-2.5 min-w-0">
              <h3 className="text-[15px] font-semibold shrink-0" style={{ color: T.text }}>Post-consultation</h3>
              {packageStatus === "draft" && (
                <Chip tone="muted">Draft</Chip>
              )}
            </div>
            {!isNoShow && packageStatus !== "submitted" && (
              <div className="flex items-center gap-2 shrink-0">
                <GoldBtn disabled={!hasMandatoryContent} onClick={handleSubmitRecommendation}>
                  Submit recommendation
                </GoldBtn>
              </div>
            )}
          </div>

          {showEditWarning && packageStatus !== "submitted" && (
            <div className="rounded-[9px] px-3.5 py-2.5 mb-4 text-[12.5px] leading-relaxed" style={{ background: "rgba(160,125,56,0.12)", border: "1px solid rgba(160,125,56,0.28)", color: T.text }}>
              Changes are saved as draft only. Submit recommendation when ready to send to the customer.
            </div>
          )}

          {/* Tab bar with completion indicators */}
          <div className="flex items-center gap-1 mb-5 pb-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            {([
              { key: "summary" as const, label: "Summary", optional: false, done: summaryHasSaved },
              { key: "stone" as const, label: "Stone recommendation", optional: true, done: false },
              { key: "remedy" as const, label: "Other remedy", optional: true, done: false },
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
                  {!t.optional && (
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
                  )}
                  {t.label}{t.optional ? " (Optional)" : ""}
                </button>
              );
            })}
          </div>

          {/* ---- Summary tab ---- */}
          {activeWorkTab === "summary" && (
            <div className="rounded-[9px] p-4" style={contentBoxStyle}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium tracking-[0.06em] uppercase" style={{ color: T.faint }}>Consultation summary</div>
                  <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: T.muted }}>
                    Key observations, interpretation, conclusion, and agreed next steps
                  </p>
                </div>
                <SectionActions
                  showEdit={summaryHasSaved && !summaryIsEditing}
                  showSave={summaryIsEditing}
                  onEdit={startEditSummary}
                  onSave={saveSummarySection}
                  saveDisabled={!summaryText.trim()}
                />
              </div>
              {summaryIsEditing ? (
                <Textarea value={summaryText} onChange={setSummaryText} placeholder="Write your consultation summary here…" rows={5} />
              ) : (
                <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: T.text }}>{savedSummary}</p>
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
                  <GoldBtn onClick={() => openRecPicker(0)}>Select stone from inventory</GoldBtn>
                </div>
              )}

              {recData.status !== "not_recommended" && (
                <div>
                  <StoneRecDisplay
                    recData={recData}
                    savedDetails={savedDetails}
                    canChangeStone={recData.status !== "purchased"}
                    canEditDetails
                    detailsIsEditing={detailsIsEditing}
                    onChangeStone={() => openRecPicker(0)}
                    onEditDetails={startEditDetails}
                    onSaveDetails={saveDetailsSection}
                    onDetailsChange={handleDetailsChange}
                  />
                </div>
              )}
            </div>
          )}

          {/* ---- Other remedy tab ---- */}
          {activeWorkTab === "remedy" && (
            <div className="rounded-[9px] p-4" style={contentBoxStyle}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium tracking-[0.06em] uppercase" style={{ color: T.faint }}>Other remedy</div>
                  <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: T.muted }}>
                    Prescribe mantras, rituals, or lifestyle changes (optional)
                  </p>
                </div>
                <SectionActions
                  showEdit={remedyHasSaved && !remedyIsEditing}
                  showSave={remedyIsEditing}
                  onEdit={startEditRemedy}
                  onSave={saveRemedySection}
                  saveDisabled={!remedyText.trim()}
                />
              </div>
              {remedyIsEditing ? (
                <Textarea
                  value={remedyText}
                  onChange={setRemedyText}
                  placeholder="E.g. Mantra, havan / puja, lifestyle changes — include timing, duration, and instructions…"
                  rows={5}
                />
              ) : (
                <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap" style={{ color: T.text }}>{savedRemedy}</p>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ================================================================ */}
      {/*  Recommendation modal                                            */}
      {/* ================================================================ */}
      <Modal open={showRecModal} onClose={() => setShowRecModal(false)} title="Stone recommendation" extraWide>
        <RecommendationPickerFlow
          key={`${showRecModal}-${recPickerStartStep}`}
          startStep={recPickerStartStep}
          initial={{
            stoneSku: recData.stoneSku,
            gemstone: recData.gemstone,
            weightRange: recData.weightRange,
            metalSetting: recData.metalSetting,
            designName: recData.designName,
            designSlug: recData.designSlug,
            form: recData.form,
            energisationKey: recData.energisationKey,
            energisationName: recData.energisationName,
          }}
          onCancel={() => setShowRecModal(false)}
          onComplete={handlePickerComplete}
        />
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

      <ConfirmDialog
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        onConfirm={performSubmitRecommendation}
        title="Submit without optional items?"
        tone="default"
        confirmLabel="Submit recommendation anyway"
        cancelLabel="Cancel"
        message={
          missingOptionalParts.length === 2
            ? "Stone recommendation and Other remedy have not been added. You can still submit with the consultation summary only."
            : `${missingOptionalParts[0]} has not been added. You can still submit the recommendation without it.`
        }
      />

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
