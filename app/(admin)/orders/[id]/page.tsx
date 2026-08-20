"use client";
import { use, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, GoldBtn, GhostBtn, Modal, Input, Select, FileInput, Textarea, DateInput, TimeInput, ShopifyButton, BackLink, Toast, ConfirmDialog } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_ORDERS, MOCK_CUSTOMERS, MOCK_CERTIFICATES, MOCK_ENERGISATION } from "@/lib/mock";
import { ENERGISATION } from "@/lib/catalog";
import { inr } from "@/lib/types";
import * as V from "@/lib/validators";

type CertUploadTarget = "lab_authenticity" | "energisation" | null;
type PipelineStep = 0 | 1 | 2 | 3;

const PIPELINE_STEPS = [
  { key: "source", label: "Source" },
  { key: "energise", label: "Energise" },
  { key: "certify", label: "Certify" },
  { key: "ship", label: "Ship" },
] as const;

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const order = MOCK_ORDERS.find((o) => o.id === id);

  const [certUploadTarget, setCertUploadTarget] = useState<CertUploadTarget>(null);
  const [toast, setToast] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [certIssueDate, setCertIssueDate] = useState("");
  const [certWeight, setCertWeight] = useState("");
  const [certOrigin, setCertOrigin] = useState("");
  const [certNotes, setCertNotes] = useState("");
  const [certRitualMethod, setCertRitualMethod] = useState("");
  const [certIssueDateActual, setCertIssueDateActual] = useState("");

  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleGuruji, setScheduleGuruji] = useState("");
  const [scheduleLink, setScheduleLink] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");

  const [localPaymentStatus, setLocalPaymentStatus] = useState(order?.paymentStatus ?? "pending");
  const [showMarkPaid, setShowMarkPaid] = useState(false);
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [payErrors, setPayErrors] = useState<Record<string, string>>({});

  const [localItemStatuses, setLocalItemStatuses] = useState<Record<string, string>>({});
  const [localVendorNames, setLocalVendorNames] = useState<Record<string, string>>({});
  const [localVendorOrderIds, setLocalVendorOrderIds] = useState<Record<string, string>>({});
  const [localRemarks, setLocalRemarks] = useState<Record<string, string>>({});
  // Sourcing edits are drafts until saved — saving pushes the update to the customer's web app.
  const [sourceDirty, setSourceDirty] = useState<Record<string, boolean>>({});
  const [sourceSavedAt, setSourceSavedAt] = useState<Record<string, string>>({});
  const [localEnergStatus, setLocalEnergStatus] = useState(order?.energisationStatus ?? "pending");
  const [localLabCert, setLocalLabCert] = useState(false);      // uploaded this session
  const [localEnergCert, setLocalEnergCert] = useState(false);  // generated this session
  const [certifyDone, setCertifyDone] = useState(false);        // explicit "mark as done"
  const [localTracking, setLocalTracking] = useState(order?.tracking ?? "");
  const [trackingCourier, setTrackingCourier] = useState("");
  const [trackingInput, setTrackingInput] = useState("");
  const [dispatched, setDispatched] = useState(false);
  const [receivedNotes, setReceivedNotes] = useState("");

  const [viewStep, setViewStep] = useState<PipelineStep | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [openSourceSku, setOpenSourceSku] = useState<string | null>(null); // null = auto (first unfinished)
  const [confirmEnergComplete, setConfirmEnergComplete] = useState(false);
  const [confirmDispatch, setConfirmDispatch] = useState(false);

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: T.muted }}>Order not found.</p>
        <div className="mt-3 flex justify-center"><BackLink label="Orders" href="/orders" /></div>
      </div>
    );
  }

  const customer = MOCK_CUSTOMERS.find((c) => c.id === order.customerId);
  const certs = MOCK_CERTIFICATES.filter((c) => c.orderId === order.id);
  const energisation = MOCK_ENERGISATION.find((e) => e.orderId === order.id);
  const labCert = certs.find((c) => c.type === "lab_authenticity");
  const energCert = certs.find((c) => c.type === "energisation");
  const isPaid = localPaymentStatus === "paid";

  const getItemStatus = (sku: string) => localItemStatuses[sku] ?? order.items.find((i) => i.sku === sku)?.itemStatus ?? "order_placed";
  const isItemReceived = (s: string) => s === "order_received" || s === "in_crafting" || s === "ready_to_ship";

  const stones = order.items.filter((i) => i.itemType === "stone");
  const allStonesReceived = stones.every((item) => isItemReceived(getItemStatus(item.sku)));
  const allItemsReceived = order.items.every((item) => isItemReceived(getItemStatus(item.sku)));

  const sourceComplete = allItemsReceived;
  const energiseComplete = localEnergStatus === "completed";
  const labUploaded = labCert?.status === "uploaded" || labCert?.status === "verified" || localLabCert;
  const energUploaded = energCert?.status === "uploaded" || energCert?.status === "verified" || localEnergCert;
  const hasBothCerts = labUploaded && energUploaded;
  // Complete only when explicitly marked done (or seeded verified on both certs).
  const certifyComplete = certifyDone || (labCert?.status === "verified" && energCert?.status === "verified");
  const shipComplete = dispatched || order.shopifyStatus === "fulfilled";

  const activeStep: PipelineStep = !isPaid ? 0 : !allStonesReceived ? 0 : !energiseComplete ? 1 : !certifyComplete ? 2 : !allItemsReceived ? 0 : 3;
  const displayStep = viewStep ?? activeStep;

  const isStepComplete = (s: PipelineStep) => {
    if (s === 0) return sourceComplete && isPaid;
    if (s === 1) return energiseComplete;
    if (s === 2) return certifyComplete;
    if (s === 3) return shipComplete;
    return false;
  };

  // Removed auto-advance — user should navigate pipeline steps manually

  const isStepUnlocked = (s: PipelineStep) => {
    if (!isPaid) return false;
    if (s === 0) return true;
    if (s === 1) return true;
    if (s === 2) return true;
    if (s === 3) return allItemsReceived && energiseComplete && certifyComplete;
    return false;
  };

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const handleMarkPaid = () => {
    const e: Record<string, string> = {
      paymentMethod: V.required(paymentMethod, "Payment method"),
      paymentRef: V.required(paymentRef, "Payment reference"),
    };
    setPayErrors(e);
    if (!V.isClean(e)) return;
    setLocalPaymentStatus("paid");
    setShowMarkPaid(false);
    setPaymentRef("");
    setPaymentMethod("");
    setPayErrors({});
    flash("Payment marked as received");
  };

  const handleCertUpload = () => {
    const isGenerate = certUploadTarget === "energisation";
    if (isGenerate) setLocalEnergCert(true); else setLocalLabCert(true);
    setCertUploadTarget(null);
    setCertNumber(""); setCertIssueDate(""); setCertWeight(""); setCertOrigin(""); setCertNotes(""); setCertRitualMethod(""); setCertIssueDateActual("");
    flash(isGenerate ? "Certificate generated" : "Certificate uploaded");
  };

  const handleScheduleSubmit = () => {
    setShowSchedule(false);
    setScheduleDate(""); setScheduleTime(""); setScheduleGuruji(""); setScheduleLink(""); setScheduleNotes("");
    setLocalEnergStatus("scheduled");
    flash("Energisation scheduled");
  };

  const itemStatusLabel = (s: string) => {
    const map: Record<string, string> = { order_placed: "Order placed", in_transit: "In transit", order_received: "Received", in_crafting: "In crafting", quality_check: "QC", ready_to_ship: "Ready" };
    return map[s] ?? s;
  };

  const itemStatusTone = (s: string) => {
    if (s === "order_received" || s === "ready_to_ship") return "good" as const;
    if (s === "in_transit" || s === "in_crafting" || s === "quality_check") return "gold" as const;
    return "muted" as const;
  };

  const tier = order.energisationTier ? ENERGISATION.find((e) => e.key === order.energisationTier) : null;

  const overallStatus = (() => {
    if (!isPaid) return { label: "Payment pending", tone: "gold" as const };
    if (shipComplete) return { label: "Delivered", tone: "good" as const };
    if (dispatched || localTracking) return { label: "In transit", tone: "gold" as const };
    if (!certifyComplete) return { label: "Cert missing", tone: "danger" as const };
    if (!energiseComplete) return { label: "Energisation pending", tone: "danger" as const };
    return { label: "Not shipped", tone: "muted" as const };
  })();

  return (
    <>
      {/* ============ HEADER ============ */}
      <PageHeader
        title={order.id}
        sub={`Placed ${new Date(order.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
        back={{ label: "Orders", href: "/orders" }}
        action={
          <div className="flex items-center gap-2.5">
            <Chip tone={overallStatus.tone}>{overallStatus.label}</Chip>
            <ShopifyButton href="https://admin.shopify.com/orders">Open in Shopify</ShopifyButton>
          </div>
        }
      />

      {/* ============ PAYMENT BANNER ============ */}
      {!isPaid && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-[12px] px-4 py-3 mb-4"
          style={{ background: "rgba(160,125,56,0.08)", border: "1px solid rgba(160,125,56,0.28)" }}
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: T.gold }} />
          <div className="flex-1 min-w-0 text-[13px]">
            <span className="font-semibold" style={{ color: T.text }}>Payment pending</span>
            <span style={{ color: T.muted }}> — fulfillment is locked until payment is received.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => flash("Payment link sent to customer")} className="text-[12.5px] font-medium h-8 px-3 rounded-[8px] cursor-pointer transition-colors hover:bg-[rgba(160,125,56,0.12)]" style={{ color: T.gold }}>Resend link</button>
            <button onClick={() => setShowMarkPaid(true)} className="text-[12.5px] font-semibold h-8 px-3.5 rounded-[8px] cursor-pointer hover:brightness-110 transition-all" style={{ background: T.accent, color: T.accentInk }}>Mark as paid</button>
          </div>
        </div>
      )}

      {/* ============ TWO-COLUMN BODY — work left, context right ============ */}
      <div className="flex flex-col xl:flex-row items-start gap-4">
        <div className="flex-1 min-w-0 space-y-4 w-full">
      {/* ============ FULFILLMENT PIPELINE ============ */}
      {isPaid && <Card>
        <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4" style={{ color: T.text }}>Fulfillment</h2>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-5 overflow-x-auto no-scrollbar">
          {PIPELINE_STEPS.map((step, i) => {
            const idx = i as PipelineStep;
            const complete = isStepComplete(idx);
            const unlocked = isStepUnlocked(idx);
            const isActive = displayStep === idx;
            const locked = !unlocked && !complete;

            return (
              <div key={step.key} className="flex items-center gap-1 flex-1 min-w-0">
                <button
                  onClick={() => {
                    if (unlocked || complete) { setViewStep(idx); }
                    else if (idx === 3) {
                      flash("Complete Source, Energise and Certify to ship");
                    }
                  }}
                  className="flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200"
                  style={{
                    background: isActive && complete ? "rgba(95,112,64,0.10)" : isActive ? T.accentMuted : complete ? "rgba(95,112,64,0.10)" : "transparent",
                    border: `1px solid ${isActive && complete ? "rgba(95,112,64,0.25)" : isActive ? T.accentBorder : complete ? "rgba(95,112,64,0.25)" : T.borderSoft}`,
                    color: isActive && complete ? T.good : isActive ? T.accent : complete ? T.good : locked ? T.faint : T.muted,
                    fontWeight: isActive ? 600 : 400,
                    cursor: unlocked || complete ? "pointer" : "default",
                    opacity: unlocked || complete || isActive ? 1 : 0.5,
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{
                      background: complete ? T.good : isActive ? T.accent : T.border,
                      color: isActive || complete ? T.accentInk : T.faint,
                    }}
                  >
                    {complete ? "✓" : locked ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    ) : i + 1}
                  </span>
                  {step.label}
                </button>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="flex-1 h-[1px] min-w-3" style={{ background: complete ? T.good : T.borderSoft }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="rounded-[10px] p-4" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>

          {/* ---- STEP 0: SOURCE — per-item sourcing cards; saving notifies the customer ---- */}
          {displayStep === 0 && (
            <div className="space-y-3">
              {isPaid && (
                <div className="flex items-center gap-2 text-[12px]" style={{ color: T.muted }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 shrink-0"><path d="M12 3a6 6 0 0 1 6 6v4l2 2H4l2-2V9a6 6 0 0 1 6-6z" /><path d="M9 17a3 3 0 0 0 6 0" /></svg>
                  Saved updates are pushed to the customer&apos;s web app.
                </div>
              )}

              {order.items.map((item) => {
                const status = getItemStatus(item.sku);
                const received = status === "order_received";
                const vendorName = localVendorNames[item.sku] ?? item.vendorName ?? "";
                const vendorOrderId = localVendorOrderIds[item.sku] ?? item.vendorOrderId ?? "";
                const dirty = !!sourceDirty[item.sku];
                const savedAt = sourceSavedAt[item.sku];
                const autoOpenSku = order.items.find((it) => getItemStatus(it.sku) !== "order_received")?.sku ?? null;
                const isOpen = dirty || (openSourceSku !== null ? openSourceSku === item.sku : autoOpenSku === item.sku);
                const markDirty = () => setSourceDirty((p) => ({ ...p, [item.sku]: true }));
                const fieldLabel = "block text-[10px] tracking-[0.1em] uppercase mb-1";
                const fieldCls = "w-full h-9 px-2.5 rounded-[8px] text-[12.5px] outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(119,123,98,0.14)]";
                const fieldStyle = { background: T.card, border: `1px solid ${T.border}`, color: T.text };

                const saveItem = () => {
                  setSourceDirty((p) => ({ ...p, [item.sku]: false }));
                  setSourceSavedAt((p) => ({ ...p, [item.sku]: new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }) }));
                  flash(`${item.name.split("·")[0].trim()} updated — customer notified`);
                };

                return (
                  <div key={item.sku} className="rounded-[12px] p-4" style={{ background: T.card, border: `1px solid ${dirty ? T.accentBorder : T.borderSoft}` }}>
                    {/* Item header — tap to expand */}
                    <button onClick={() => setOpenSourceSku(isOpen && !dirty ? "" : item.sku)} className="w-full flex flex-wrap items-center justify-between gap-2 text-left cursor-pointer">
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-semibold truncate" style={{ color: T.text }}>{item.name}</div>
                        <div className="text-[11px] mt-0.5 truncate" style={{ color: T.faint }}>
                          {item.sku}{item.caratWeight ? ` · ${item.caratWeight}` : ""}
                          {!isOpen && (vendorName || vendorOrderId) ? <span> · {vendorName}{vendorOrderId ? ` · ${vendorOrderId}` : ""}</span> : null}
                        </div>
                      </div>
                      <span className="flex items-center gap-2 shrink-0">
                        <Chip tone={itemStatusTone(status)}>{itemStatusLabel(status)}</Chip>
                        <svg viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
                      </span>
                    </button>

                    {isOpen && (!isPaid ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-2 mt-3 text-[12.5px]" style={{ color: T.muted }}>
                        <div><span className={fieldLabel} style={{ color: T.faint }}>Vendor</span>{vendorName || "—"}</div>
                        <div><span className={fieldLabel} style={{ color: T.faint }}>Vendor order</span><span className="tabular-nums">{vendorOrderId || "—"}</span></div>
                        <div className="col-span-2"><span className={fieldLabel} style={{ color: T.faint }}>Remarks</span>{localRemarks[item.sku] || "—"}</div>
                      </div>
                    ) : (
                      <>
                        {/* Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3.5">
                          <div>
                            <label className={fieldLabel} style={{ color: T.faint }}>Vendor</label>
                            <input type="text" value={vendorName} onChange={(e) => { setLocalVendorNames((p) => ({ ...p, [item.sku]: e.target.value })); markDirty(); }} placeholder="e.g. Kanakadhara Jewellers" disabled={received} className={fieldCls} style={{ ...fieldStyle, opacity: received ? 0.55 : 1 }} />
                          </div>
                          <div>
                            <label className={fieldLabel} style={{ color: T.faint }}>Vendor order no.</label>
                            <input type="text" value={vendorOrderId} onChange={(e) => { setLocalVendorOrderIds((p) => ({ ...p, [item.sku]: e.target.value })); markDirty(); }} placeholder="e.g. KJ-2026-0950" disabled={received} className={`${fieldCls} tabular-nums`} style={{ ...fieldStyle, opacity: received ? 0.55 : 1 }} />
                          </div>
                          <div>
                            <label className={fieldLabel} style={{ color: T.faint }}>Status</label>
                            <Select
                              value={status}
                              onChange={(val) => { setLocalItemStatuses((p) => ({ ...p, [item.sku]: val })); setSourceDirty((p) => ({ ...p, [item.sku]: true })); }}
                              disabled={received}
                              compact
                              options={[
                                { value: "order_placed", label: "Order placed" },
                                { value: "in_transit", label: "In transit" },
                                { value: "quality_check", label: "Quality check" },
                                { value: "order_received", label: "Received" },
                              ]}
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className={fieldLabel} style={{ color: T.faint }}>Remarks <span className="normal-case tracking-normal" style={{ color: T.faint }}>· visible to the customer</span></label>
                          <input type="text" value={localRemarks[item.sku] ?? ""} onChange={(e) => { setLocalRemarks((p) => ({ ...p, [item.sku]: e.target.value })); markDirty(); }} placeholder="e.g. Vendor confirmed dispatch by Friday" className={fieldCls} style={fieldStyle} />
                        </div>

                        {/* Footer: received toggle + save */}
                        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3.5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                          <button
                            onClick={() => {
                              const next = received ? "in_transit" : "order_received";
                              setLocalItemStatuses((p) => ({ ...p, [item.sku]: next }));
                              setSourceDirty((p) => ({ ...p, [item.sku]: true }));
                              setViewStep(0);
                            }}
                            className="inline-flex items-center gap-2 h-9 pl-2 pr-3.5 rounded-full text-[12.5px] font-medium cursor-pointer transition-all active:scale-[0.98]"
                            style={received ? { background: "rgba(95,112,64,0.13)", border: `1px solid rgba(95,112,64,0.35)`, color: T.good } : { background: T.bg, border: `1px solid ${T.border}`, color: T.muted }}
                          >
                            <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: received ? T.good : "rgba(89,82,54,0.14)", color: received ? "#fff" : T.faint }}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                            </span>
                            {received ? "Received at studio" : "Mark as received"}
                          </button>
                          <div className="flex items-center gap-3">
                            {savedAt && !dirty && <span className="text-[11.5px]" style={{ color: T.faint }}>Saved {savedAt} · customer notified</span>}
                            {dirty && <span className="text-[11.5px] font-medium" style={{ color: T.gold }}>Unsaved changes</span>}
                            <button
                              onClick={saveItem}
                              disabled={!dirty}
                              className="h-9 px-4 rounded-[9px] text-[12.5px] font-semibold cursor-pointer transition-all active:scale-[0.98] disabled:cursor-default"
                              style={dirty ? { background: T.accent, color: T.accentInk } : { background: "rgba(89,82,54,0.10)", color: T.faint }}
                            >
                              Save &amp; notify
                            </button>
                          </div>
                        </div>
                      </>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* ---- STEP 1: ENERGISE ---- */}
          {displayStep === 1 && (
            <div>
              {!allStonesReceived && !energiseComplete && (
                <div
                  className="flex items-center gap-3 rounded-[10px] px-4 py-3 mb-4"
                  style={{ background: "rgba(119,123,98,0.12)", border: "1px solid rgba(119,123,98,0.3)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span className="text-[12.5px] font-medium" style={{ color: T.text }}>Product is not yet with us</span>
                  <span className="text-[11.5px]" style={{ color: T.muted }}>— advised to schedule energisation after receiving stones.</span>
                </div>
              )}

              {tier && (
                <div className="rounded-[12px] p-4" style={{ background: T.card, border: `1px solid ${localEnergStatus === "completed" ? "rgba(95,112,64,0.35)" : T.borderSoft}` }}>
                  {/* Header — ritual identity + status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0" style={{ background: localEnergStatus === "completed" ? "rgba(95,112,64,0.13)" : T.accentFaint, color: localEnergStatus === "completed" ? T.good : T.accent }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-[18px] h-[18px]"><path d="M12 3c2 3.5 5 5.5 5 9a5 5 0 0 1-10 0c0-3.5 3-5.5 5-9z" /></svg>
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[14.5px] font-semibold" style={{ color: T.text }}>{tier.name}</span>
                          <span className="text-[11.5px]" style={{ color: T.faint }}>{tier.sanskrit}</span>
                        </div>
                        <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{tier.duration}{tier.fee > 0 ? ` · ${inr(tier.fee)}` : " · included free"}</div>
                      </div>
                    </div>
                    <Chip tone={localEnergStatus === "completed" ? "good" : localEnergStatus === "scheduled" || localEnergStatus === "in_progress" ? "gold" : "muted"}>
                      {localEnergStatus === "completed" ? "Completed" : localEnergStatus === "scheduled" || localEnergStatus === "in_progress" ? "Scheduled" : "Not scheduled"}
                    </Chip>
                  </div>

                  {/* Session details — labeled, not a dot run-on */}
                  {(localEnergStatus === "scheduled" || localEnergStatus === "in_progress" || localEnergStatus === "completed") && energisation?.scheduledAt && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 mt-4 pt-3.5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                      <div>
                        <div className="text-[10px] tracking-[0.1em] uppercase mb-0.5" style={{ color: T.faint }}>Date</div>
                        <div className="text-[13px] font-medium tabular-nums" style={{ color: T.text }}>{new Date(energisation.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
                      </div>
                      <div>
                        <div className="text-[10px] tracking-[0.1em] uppercase mb-0.5" style={{ color: T.faint }}>Time</div>
                        <div className="text-[13px] font-medium tabular-nums" style={{ color: T.text }}>{new Date(energisation.scheduledAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}</div>
                      </div>
                      {energisation.assignedTo && (
                        <div>
                          <div className="text-[10px] tracking-[0.1em] uppercase mb-0.5" style={{ color: T.faint }}>Guruji</div>
                          <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{energisation.assignedTo}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer — link to the session + actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3.5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    {energisation ? (
                      <Link href={`/energisation/${energisation.id}`} className="text-[12px] font-medium hover:underline underline-offset-2" style={{ color: T.accent }}>View session ↗</Link>
                    ) : <span />}
                    <div className="flex items-center gap-2">
                      {localEnergStatus !== "completed" && localEnergStatus !== "scheduled" && localEnergStatus !== "in_progress" && (
                        <GoldBtn onClick={() => setShowSchedule(true)}>Schedule</GoldBtn>
                      )}
                      {(localEnergStatus === "scheduled" || localEnergStatus === "in_progress") && (
                        <>
                          <GhostBtn onClick={() => {
                            if (energisation?.scheduledAt) {
                              const d = new Date(energisation.scheduledAt);
                              setScheduleDate(energisation.scheduledAt.split("T")[0]);
                              setScheduleTime(d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase());
                            }
                            if (energisation?.liveLink) setScheduleLink(energisation.liveLink);
                            setShowSchedule(true);
                          }}>Edit</GhostBtn>
                          <GoldBtn onClick={() => setConfirmEnergComplete(true)} disabled={!allStonesReceived}>Mark as completed</GoldBtn>
                        </>
                      )}
                      {localEnergStatus === "completed" && energisation?.completedAt && (
                        <span className="text-[12px]" style={{ color: T.good }}>Completed {new Date(energisation.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {!tier && !energisation && (
                <div className="text-center py-6">
                  <p className="text-[13px] mb-3" style={{ color: T.muted }}>Schedule the energisation — assign a Guruji, date, time, and meeting link.</p>
                  <GoldBtn onClick={() => setShowSchedule(true)}>Schedule energisation</GoldBtn>
                </div>
              )}
            </div>
          )}

          {/* ---- STEP 2: CERTIFY ---- */}
          {displayStep === 2 && (
            <div>
              {!allStonesReceived && (
                <div
                  className="flex items-center gap-3 rounded-[10px] px-4 py-3 mb-4"
                  style={{ background: "rgba(119,123,98,0.12)", border: "1px solid rgba(119,123,98,0.3)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span className="text-[12.5px] font-medium" style={{ color: T.text }}>Product is not yet with us</span>
                  <span className="text-[11.5px]" style={{ color: T.muted }}>— receive all stones before uploading certificates.</span>
                </div>
              )}
                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Lab cert */}
                  <div className="rounded-[12px] p-4" style={{ background: T.card, border: `1px solid ${labUploaded ? "rgba(95,112,64,0.35)" : T.borderSoft}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12.5px] font-semibold" style={{ color: T.text }}>Lab Authenticity</span>
                      <Chip tone={labUploaded ? "good" : "danger"}>{labUploaded ? "Uploaded" : "Missing"}</Chip>
                    </div>
                    {labUploaded ? (
                      <>
                        <div className="text-[12px] space-y-1" style={{ color: T.muted }}>
                          {labCert?.certificateNumber && <div><span style={{ color: T.faint }}>Cert #:</span> {labCert.certificateNumber}</div>}
                          {labCert?.issuingAuthority && <div><span style={{ color: T.faint }}>Lab:</span> {labCert.issuingAuthority}</div>}
                          {labCert?.issueDate && <div><span style={{ color: T.faint }}>Issued:</span> {labCert.issueDate}</div>}
                          {!labCert && <div>Uploaded just now.</div>}
                        </div>
                        <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                          <a href={labCert?.fileUrl ?? "#"} target="_blank" rel="noopener" className="text-[12px] font-medium" style={{ color: T.accent }}>View ↗</a>
                          <button onClick={() => setCertUploadTarget("lab_authenticity")} className="text-[12px] font-medium cursor-pointer hover:underline underline-offset-2" style={{ color: T.muted }}>Replace</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] mb-3" style={{ color: T.faint }}>Independent gemological lab report confirming identity, weight, origin, treatment, and quality grade.</p>
                        <GoldBtn onClick={() => setCertUploadTarget("lab_authenticity")} disabled={!allStonesReceived}>Upload certificate</GoldBtn>
                        {!allStonesReceived && <p className="text-[11px] mt-2" style={{ color: T.faint }}>Available once all stones are received.</p>}
                      </>
                    )}
                  </div>

                  {/* AstroLaabh energisation cert */}
                  <div className="rounded-[12px] p-4" style={{ background: T.card, border: `1px solid ${energUploaded ? "rgba(95,112,64,0.35)" : T.borderSoft}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12.5px] font-semibold" style={{ color: T.text }}>AstroLaabh Certificate</span>
                      <Chip tone={energUploaded ? "good" : !energiseComplete ? "muted" : "danger"}>{energUploaded ? "Generated" : !energiseComplete ? "Locked" : "Missing"}</Chip>
                    </div>
                    {energUploaded ? (
                      <>
                        <div className="text-[12px] space-y-1" style={{ color: T.muted }}>
                          {energCert?.certificateNumber && <div><span style={{ color: T.faint }}>Cert #:</span> {energCert.certificateNumber}</div>}
                          {energCert?.issuingAuthority && <div><span style={{ color: T.faint }}>Issued by:</span> {energCert.issuingAuthority}</div>}
                          {energCert?.issueDate && <div><span style={{ color: T.faint }}>Date:</span> {energCert.issueDate}</div>}
                          {!energCert && <div>Generated just now.</div>}
                        </div>
                        <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                          <a href={energCert?.fileUrl ?? "#"} target="_blank" rel="noopener" className="text-[12px] font-medium" style={{ color: T.accent }}>View ↗</a>
                          <button onClick={() => setCertUploadTarget("energisation")} className="text-[12px] font-medium cursor-pointer hover:underline underline-offset-2" style={{ color: T.muted }}>Regenerate</button>
                        </div>
                      </>
                    ) : !energiseComplete ? (
                      <>
                        <p className="text-[11px] mb-3" style={{ color: T.faint }}>In-house energisation certificate confirming ritual completion, mantra details, and astrological suitability.</p>
                        <div className="flex items-center gap-2 text-[12px] rounded-[8px] px-3 py-2" style={{ background: T.bg, border: `1px dashed ${T.border}`, color: T.muted }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                          Unlocks after the energisation ritual is completed.
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] mb-3" style={{ color: T.faint }}>Ritual completed — generate the certificate with the recorded details.</p>
                        <GoldBtn onClick={() => {
                          const stone = order.items.find((i) => i.itemType === "stone");
                          setCertWeight(stone?.caratWeight ?? "");
                          if (energisation?.completedAt) setCertIssueDateActual(energisation.completedAt.split("T")[0]);
                          if (energisation?.method) setCertRitualMethod(energisation.method);
                          setCertUploadTarget("energisation");
                        }}>Generate certificate</GoldBtn>
                      </>
                    )}
                  </div>
                </div>

                {/* Completion — explicit "done" moment gated on both certificates */}
                {certifyComplete ? (
                  <div className="flex items-center gap-2.5 rounded-[10px] px-4 py-3 mt-3" style={{ background: "rgba(95,112,64,0.10)", border: "1px solid rgba(95,112,64,0.30)" }}>
                    <span className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: T.good, color: "#fff" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span>
                    <span className="text-[12.5px] font-medium" style={{ color: T.good }}>Certification complete — both certificates are on file. Shipping is unlocked.</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <span className="text-[12px]" style={{ color: T.faint }}>
                      {!labUploaded && !energUploaded ? "Upload the lab report and generate the AstroLaabh certificate to finish this step."
                        : !labUploaded ? "Waiting on the lab authenticity certificate."
                        : !energUploaded ? "Waiting on the AstroLaabh certificate."
                        : "Both certificates are in — mark this step as done."}
                    </span>
                    <GoldBtn onClick={() => { setCertifyDone(true); flash("Certification marked complete"); }} disabled={!hasBothCerts}>Mark certification done</GoldBtn>
                  </div>
                )}
            </div>
          )}

          {/* ---- STEP 3: SHIP ---- */}
          {displayStep === 3 && (
            <div>
              {!isStepUnlocked(3) ? (
                <div
                  className="flex items-center gap-3 rounded-[10px] px-4 py-3"
                  style={{ background: "rgba(119,123,98,0.12)", border: "1px solid rgba(119,123,98,0.3)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span className="text-[12.5px] font-medium" style={{ color: T.text }}>
                    Shipping unlocks when everything is ready — still pending:{" "}
                    {[
                      !allItemsReceived && `${order.items.filter((it) => !isItemReceived(getItemStatus(it.sku))).length} item(s) not received`,
                      !energiseComplete && "energisation",
                      !certifyComplete && "certification",
                    ].filter(Boolean).join(", ")}
                  </span>
                </div>
              ) : dispatched || order.shopifyStatus === "fulfilled" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium" style={{ color: T.good }}>✓ Dispatched</span>
                    {order.shopifyStatus === "fulfilled" && <Chip tone="good">Delivered</Chip>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 text-[13px]">
                    <div>
                      <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Tracking ID</div>
                      <div style={{ color: T.text }}>{localTracking || order.tracking || "—"}</div>
                    </div>
                    <div>
                      <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Courier</div>
                      <div style={{ color: T.text }}>{trackingCourier || "—"}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 grid sm:grid-cols-2 gap-3">
                      <Input value={trackingInput} onChange={setTrackingInput} label="Tracking ID" placeholder="e.g. AWB-BLU-5518234" />
                      <Input value={trackingCourier} onChange={setTrackingCourier} label="Courier" placeholder="e.g. BlueDart, DTDC" />
                    </div>
                    <div className="shrink-0 self-end">
                      <GoldBtn
                        onClick={() => setConfirmDispatch(true)}
                        disabled={!trackingInput.trim() || !trackingCourier.trim()}
                      >
                        Mark as dispatched
                      </GoldBtn>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>}
      {/* ============ ORDER SUMMARY — collapsed reference; the work lives above ============ */}
      <Card>
        <button onClick={() => setSummaryOpen((v) => !v)} className="w-full flex items-center justify-between gap-3 cursor-pointer text-left">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Order summary</h2>
            <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{order.items.length} item{order.items.length > 1 ? "s" : ""}{tier && tier.fee > 0 ? ` · energisation ${tier.name}` : ""}</div>
          </div>
          <span className="flex items-center gap-3 shrink-0">
            <span className="font-title text-[18px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(order.total + (tier && tier.fee > 0 ? tier.fee : 0))}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 transition-transform duration-200 ${summaryOpen ? "rotate-180" : ""}`}><path d="m6 9 6 6 6-6" /></svg>
          </span>
        </button>

        {summaryOpen && (<div className="mt-3">
        {isPaid && (
          <div className="flex justify-end mb-2">
            <button
              onClick={() => flash("Invoice opened")}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-[8px] cursor-pointer transition-all hover:brightness-110"
              style={{ background: "rgba(119,123,98,0.12)", color: T.accent, border: `1px solid ${T.accentBorder}` }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              View invoice
            </button>
          </div>
        )}

        {/* Column header */}
        <div className="hidden sm:grid grid-cols-[auto_1fr_100px_120px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase font-medium" style={{ color: T.faint, borderBottom: `1px solid ${T.border}` }}>
          <span className="w-6" />
          <span>Item</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Amount</span>
        </div>

        {order.items.map((item, i) => (
          <div key={item.sku} className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[auto_1fr_100px_120px] gap-3 items-center px-3 py-3 text-[13px]" style={{ borderBottom: i < order.items.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
            <div className="w-6 h-6 rounded-[5px] flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: "rgba(119,123,98,0.12)", color: T.accent }}>
              {i + 1}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium truncate" style={{ color: T.text }}>{item.name}</span>
                <span className="text-[9px] tracking-[0.06em] uppercase px-1.5 py-0.5 rounded-full shrink-0 font-semibold" style={{
                  background: item.itemType === "jewellery" ? "rgba(119,123,98,0.10)" : "rgba(95,112,64,0.10)",
                  color: item.itemType === "jewellery" ? T.accent : T.good,
                }}>
                  {item.itemType === "jewellery" ? "Jewellery" : "Stone"}
                </span>
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: T.faint }}>
                {item.sku}
                {item.caratWeight && ` · ${item.caratWeight}`}
              </div>
            </div>
            <div className="hidden sm:block text-right tabular-nums" style={{ color: T.muted }}>{item.qty}</div>
            <div className="text-right tabular-nums font-semibold" style={{ color: T.text }}>{inr(item.price)}</div>
          </div>
        ))}

        {/* Subtotal / Total */}
        <div className="mt-2 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between px-3 py-1 text-[13px]">
            <span style={{ color: T.muted }}>Subtotal ({order.items.length} item{order.items.length > 1 ? "s" : ""})</span>
            <span className="tabular-nums" style={{ color: T.text }}>{inr(order.total)}</span>
          </div>
          {tier && tier.fee > 0 && (
            <div className="flex items-center justify-between px-3 py-1 text-[13px]">
              <span style={{ color: T.muted }}>Energisation — {tier.name}</span>
              <span className="tabular-nums" style={{ color: T.text }}>{inr(tier.fee)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between px-3 pt-3 mt-2" style={{ borderTop: `1px solid ${T.border}` }}>
            <span className="text-[13.5px] font-medium" style={{ color: T.muted }}>Total</span>
            <span className="font-title text-[20px] font-semibold tabular-nums tracking-[-0.01em]" style={{ color: T.text }}>
              {inr(order.total + (tier && tier.fee > 0 ? tier.fee : 0))}
            </span>
          </div>
        </div>
        </div>)}
      </Card>
        </div>

        {/* Context rail — who, where, meta */}
        <aside className="w-full xl:w-[320px] shrink-0 space-y-4 xl:sticky xl:top-4">
        {customer ? (
          <Link href={`/customers/${customer.id}`} className="block group">
            <div className="card-interactive rounded-[16px] p-5 h-full cursor-pointer" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }}>
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
              <div className="space-y-3">
                {[["Phone", customer.phone], ["Email", customer.email], ["Location", customer.birthPlace]].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-0.5" style={{ color: T.faint }}>{k}</div>
                    <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ) : (
          <Card>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-3" style={{ color: T.text }}>Customer</h2>
            <div className="flex items-center justify-between text-[13px]">
              <span style={{ color: T.muted }}>Name</span>
              <span style={{ color: T.text }}>{order.customerName}</span>
            </div>
          </Card>
        )}

        {/* Payment details */}
        <Card>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Payment details</h2>
            <Chip tone={isPaid ? "good" : "gold"}>{isPaid ? "Paid" : "Payment pending"}</Chip>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Method</span>
              <span className="text-[13px] font-medium" style={{ color: isPaid ? T.text : T.faint }}>{isPaid ? "Bank transfer (NEFT)" : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Transaction ID</span>
              <span className="text-[13px] font-medium tabular-nums" style={{ color: isPaid ? T.accent : T.faint }}>{isPaid ? `TXN${order.id.replace(/\D/g, "").slice(0, 8)}` : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Paid at</span>
              <span className="text-[12.5px] tabular-nums" style={{ color: isPaid ? T.muted : T.faint }}>
                {isPaid ? new Date(new Date(order.placedAt).getTime() + 3600000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + " · " + new Date(new Date(order.placedAt).getTime() + 3600000).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }) : "—"}
              </span>
            </div>
          </div>
        </Card>

        {/* Shipment details */}
        <Card>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Shipment details</h2>
            <Chip tone={shipComplete ? "good" : localTracking ? "gold" : "muted"}>
              {shipComplete ? "Delivered" : localTracking ? "In transit" : "Not shipped"}
            </Chip>
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Shipment ID</span>
              <span className="text-[13px] font-medium tabular-nums" style={{ color: localTracking ? T.accent : T.faint }}>{localTracking || "—"}</span>
            </div>
            <div>
              <div className="text-[10px] font-medium tracking-[0.08em] uppercase mb-0.5" style={{ color: T.faint }}>Ship to</div>
              <div className="text-[13px] font-medium leading-relaxed" style={{ color: customer?.shippingAddress ? T.text : T.faint }}>
                {customer ? `${customer.name}, ${customer.shippingAddress || "—"}` : "—"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Shipped date</span>
              <span className="text-[12.5px] tabular-nums" style={{ color: localTracking ? T.muted : T.faint }}>
                {localTracking ? new Date(new Date(order.placedAt).getTime() + 5 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Delivery date</span>
              <span className="text-[12.5px] tabular-nums" style={{ color: shipComplete ? T.good : T.faint }}>
                {shipComplete ? new Date(new Date(order.placedAt).getTime() + 9 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
              </span>
            </div>
          </div>
        </Card>

        {/* Other details */}
        {(order.affiliateCode || order.placedBy) && (
          <Card>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-3.5" style={{ color: T.text }}>Other details</h2>
            <div className="space-y-2.5">
              {order.affiliateCode && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Affiliate</span>
                  <span className="text-[13px] font-medium" style={{ color: T.accent }}>{order.affiliateCode}</span>
                </div>
              )}
              {order.placedBy && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Placed by</span>
                  <span className="text-[13px] font-medium" style={{ color: T.text }}>{order.placedBy}</span>
                </div>
              )}
            </div>
          </Card>
        )}
        </aside>
      </div>

      {/* ============ MODALS ============ */}

      {/* Mark as paid */}
      <Modal open={showMarkPaid} onClose={() => setShowMarkPaid(false)} title="Record payment">
        <div className="space-y-3">
          <Select
            value={paymentMethod}
            onChange={(v) => { setPaymentMethod(v); setPayErrors((p) => (p.paymentMethod ? { ...p, paymentMethod: "" } : p)); }}
            error={payErrors.paymentMethod}
            label="Payment method"
            options={[
              { value: "", label: "Select…" },
              { value: "bank_transfer", label: "Bank transfer / NEFT / IMPS" },
              { value: "upi", label: "UPI" },
              { value: "card", label: "Credit / Debit card" },
              { value: "cheque", label: "Cheque" },
              { value: "cash", label: "Cash" },
            ]}
          />
          <Input value={paymentRef} onChange={(v) => { setPaymentRef(v); setPayErrors((p) => (p.paymentRef ? { ...p, paymentRef: "" } : p)); }} onBlur={() => setPayErrors((p) => ({ ...p, paymentRef: V.required(paymentRef, "Payment reference") }))} error={payErrors.paymentRef} label="Payment reference / transaction ID" placeholder="e.g. UTR number, cheque number" />
        </div>
        <div className="flex gap-2.5 mt-5">
          <GoldBtn onClick={handleMarkPaid}>Confirm payment</GoldBtn>
          <GhostBtn onClick={() => setShowMarkPaid(false)}>Cancel</GhostBtn>
        </div>
      </Modal>

      {/* Certificate Upload */}
      <Modal
        open={!!certUploadTarget}
        onClose={() => setCertUploadTarget(null)}
        title={certUploadTarget === "lab_authenticity" ? "Upload Lab Authenticity Certificate" : "Generate AstroLaabh Certificate"}
      >
        <div className="space-y-3">
          {certUploadTarget === "lab_authenticity" ? (
            <>
              <FileInput label="Certificate file (PDF or image)" accept=".pdf,.jpg,.jpeg,.png" onSelect={() => {}} />
              <Input value={certNumber} onChange={setCertNumber} label="Certificate / report number (optional)" placeholder="e.g. GIA-2026-78451" />
              <Textarea value={certNotes} onChange={setCertNotes} label="Notes (optional)" placeholder="Any remarks about this certificate…" rows={2} />
            </>
          ) : (
            <>
              <Input value={certNumber} onChange={setCertNumber} label="AstroLaabh certificate number" placeholder="Auto-generated, e.g. AEC-2026-003" />
              <DateInput value={certIssueDate} onChange={setCertIssueDate} label="Ritual completion date" placeholder="Select date…" />
              <Select value={certRitualMethod} onChange={setCertRitualMethod} label="Mantra / ritual method" options={[
                { value: "Vedic Brihaspati Mantra — 108 repetitions", label: "Vedic Brihaspati Mantra — 108 repetitions" },
                { value: "Surya Mantra — sunrise puja", label: "Surya Mantra — sunrise puja" },
                { value: "Shani Mantra — 23 day extended ritual", label: "Shani Mantra — 23 day extended ritual" },
                { value: "Budh Mantra — Wednesday puja", label: "Budh Mantra — Wednesday puja" },
                { value: "Custom ritual", label: "Custom ritual" },
              ]} />
              <Input value={certWeight} onChange={setCertWeight} label="Stone weight (carat)" placeholder="e.g. 5.21 ct" />
              <Input value={certOrigin} onChange={setCertOrigin} label="Customer name (for certificate)" placeholder="e.g. Radhika Oberoi" />
              <DateInput value={certIssueDateActual} onChange={setCertIssueDateActual} label="Issue date" placeholder="Select date…" />
              <Textarea value={certNotes} onChange={setCertNotes} label="Comments" placeholder="Gotra, nakshatra, special instructions…" rows={2} />
            </>
          )}
        </div>
        <div className="flex gap-2.5 mt-5">
          <GoldBtn onClick={handleCertUpload}>{certUploadTarget === "lab_authenticity" ? "Upload certificate" : "Generate certificate"}</GoldBtn>
          <GhostBtn onClick={() => setCertUploadTarget(null)}>Cancel</GhostBtn>
        </div>
      </Modal>

      {/* Schedule Energisation */}
      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} title={energisation ? "Update energisation" : "Schedule energisation"}>
        <div className="space-y-3">
          <Select value={scheduleGuruji} onChange={setScheduleGuruji} label="Guruji / Pandit" placeholder="Select Guruji…" options={[
            { value: "guruji_anand", label: "Pandit Anand Sharma" },
            { value: "guruji_raghav", label: "Guruji Raghav Mishra" },
            { value: "guruji_keshav", label: "Acharya Keshav Tripathi" },
            { value: "guruji_sundar", label: "Pandit Sundar Iyer" },
          ]} />
          <div className="grid grid-cols-2 gap-3">
            <DateInput value={scheduleDate} onChange={setScheduleDate} label="Date" placeholder="Select date…" />
            <TimeInput value={scheduleTime} onChange={setScheduleTime} label="Time" placeholder="Select time…" />
          </div>
          <Input value={scheduleLink} onChange={setScheduleLink} label="Streaming / Meeting link" placeholder="https://meet.google.com/..." />
          <Textarea value={scheduleNotes} onChange={setScheduleNotes} label="Notes (optional)" placeholder="Ritual details, buyer preferences…" />
        </div>
        <div className="flex gap-2.5 mt-5">
          <GoldBtn onClick={handleScheduleSubmit} disabled={!scheduleGuruji || !scheduleDate || !scheduleTime}>{energisation ? "Update" : "Schedule"}</GoldBtn>
          <GhostBtn onClick={() => setShowSchedule(false)}>Cancel</GhostBtn>
        </div>
      </Modal>

      {/* Mark energisation as completed */}
      <ConfirmDialog
        open={confirmEnergComplete}
        onClose={() => setConfirmEnergComplete(false)}
        onConfirm={() => { setLocalEnergStatus("completed"); flash("Energisation marked as completed"); }}
        title="Mark energisation as completed?"
        message="This marks the energisation ritual as completed for this order."
        confirmLabel="Mark as completed"
        tone="default"
      />

      {/* Mark order as dispatched */}
      <ConfirmDialog
        open={confirmDispatch}
        onClose={() => setConfirmDispatch(false)}
        onConfirm={() => { setLocalTracking(trackingInput); setDispatched(true); flash("Order dispatched"); }}
        title="Mark order as dispatched?"
        message="This confirms the order has been handed to the courier and notifies the customer."
        confirmLabel="Mark as dispatched"
        tone="default"
      />

      {/* Toast */}
      {toast && <Toast message={toast} />}
    </>
  );
}
