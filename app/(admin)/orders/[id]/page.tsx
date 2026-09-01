"use client";
import { use, useState } from "react";
import Link from "next/link";
import { Card, Chip, GoldBtn, GhostBtn, Modal, Input, Select, Textarea, DateInput, TimeInput, ShopifyButton, BackLink, Toast, ConfirmDialog } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_ORDERS, MOCK_CUSTOMERS, MOCK_CERTIFICATES, MOCK_ENERGISATION } from "@/lib/mock";
import { ENERGISATION } from "@/lib/catalog";
import { inr } from "@/lib/types";
import * as V from "@/lib/validators";

type CertUploadTarget = "lab_authenticity" | "energisation" | null;
type PipelineStep = 0 | 1 | 2 | 3;

const PIPELINE_STEPS = [
  { key: "source", label: "Source", sub: "Vendor & receipt" },
  { key: "energise", label: "Energise", sub: "Ritual" },
  { key: "certify", label: "Certify", sub: "Certificates" },
  { key: "ship", label: "Ship", sub: "Dispatch" },
] as const;

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const order = MOCK_ORDERS.find((o) => o.id === id);

  const [certUploadTarget, setCertUploadTarget] = useState<CertUploadTarget>(null);
  const [certFile, setCertFile] = useState("");
  const [certDrag, setCertDrag] = useState(false);
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
  const [linkSent, setLinkSent] = useState(false);
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
  const [editingTracking, setEditingTracking] = useState(false);
  const [receivedNotes, setReceivedNotes] = useState("");

  type ShipmentLogEntry = { id: string; text: string; date: string; time: string };
  const [shipmentLog, setShipmentLog] = useState<ShipmentLogEntry[]>([]);
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [statusDate, setStatusDate] = useState(new Date().toISOString().split("T")[0]);
  const [statusTime, setStatusTime] = useState(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }));
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogText, setEditLogText] = useState("");
  const [editLogDate, setEditLogDate] = useState("");
  const [editLogTime, setEditLogTime] = useState("");

  const [viewStep, setViewStep] = useState<PipelineStep | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(() => (order?.paymentStatus ?? "pending") !== "paid");
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
  const isItemReceived = (s: string) => s === "order_received" || s === "quality_passed" || s === "in_crafting" || s === "ready_to_ship";

  const stones = order.items.filter((i) => i.itemType === "stone");
  const allStonesReceived = stones.every((item) => isItemReceived(getItemStatus(item.sku)));
  const allItemsReceived = order.items.every((item) => isItemReceived(getItemStatus(item.sku)));

  const sourceComplete = allItemsReceived;
  const energiseComplete = localEnergStatus === "completed" || ((localEnergStatus === "scheduled" || localEnergStatus === "in_progress") && !!energisation?.scheduledAt && new Date(energisation.scheduledAt) < new Date());
  const labUploaded = labCert?.status === "uploaded" || labCert?.status === "verified" || localLabCert;
  const energUploaded = energCert?.status === "uploaded" || energCert?.status === "verified" || localEnergCert || energiseComplete;
  const hasBothCerts = labUploaded && energUploaded;
  const certifyComplete = certifyDone || hasBothCerts || energiseComplete;
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
    setCertNumber(""); setCertIssueDate(""); setCertWeight(""); setCertOrigin(""); setCertNotes(""); setCertRitualMethod(""); setCertIssueDateActual(""); setCertFile("");
    flash(isGenerate ? "Certificate generated" : "Certificate uploaded");
  };

  const handleScheduleSubmit = () => {
    setShowSchedule(false);
    setScheduleDate(""); setScheduleTime(""); setScheduleGuruji(""); setScheduleLink(""); setScheduleNotes("");
    setLocalEnergStatus("scheduled");
    flash("Energisation scheduled");
  };

  const itemStatusLabel = (s: string) => {
    const map: Record<string, string> = { pending: "Pending", order_placed: "Placed", in_transit: "In transit", order_received: "Received", quality_passed: "Quality Passed" };
    return map[s] ?? s;
  };

  const itemStatusTone = (s: string) => {
    if (s === "order_received" || s === "quality_passed") return "good" as const;
    if (s === "in_transit") return "gold" as const;
    if (s === "pending") return "muted" as const;
    return "muted" as const;
  };

  const tier = order.energisationTier ? ENERGISATION.find((e) => e.key === order.energisationTier) : null;

  return (
    <>
      {/* ============ HEADER ============ */}
      <BackLink label="Orders" href="/orders" className="mb-4" />

      {/* Customer card moved to sidebar */}

      {/* ============ TWO-COLUMN BODY — work left, context right ============ */}
      <div className="flex flex-col xl:flex-row items-start gap-4">
        <div className="flex-1 min-w-0 flex flex-col gap-4 w-full">
      {/* ============ FULFILLMENT PIPELINE ============ */}
      {isPaid && <Card>
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Fulfillment</h2>
          <div className="flex flex-wrap gap-1">
            {!sourceComplete && <Chip tone="gold">Sourcing Pending</Chip>}
            {!energiseComplete && <Chip tone="danger">{localEnergStatus === "pending" || localEnergStatus === "not_required" ? "Energ Not Scheduled" : "Energ Incomplete"}</Chip>}
            {!certifyComplete && <Chip tone="info">Certificate Pending</Chip>}
            {!shipComplete && <Chip tone="muted">Shipment Pending</Chip>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[190px_1fr] gap-4 items-start">
        {/* Stepper — side rail on desktop, scrollable chips on mobile */}
        <nav className="lg:sticky lg:top-4">
          <ol className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar">
            {PIPELINE_STEPS.map((step, i) => {
              const idx = i as PipelineStep;
              const complete = isStepComplete(idx);
              const unlocked = isStepUnlocked(idx);
              const isActive = displayStep === idx;
              const locked = !unlocked && !complete;
              return (
                <li key={step.key} className="shrink-0">
                  <button
                    onClick={() => {
                      if (unlocked || complete) { setViewStep(idx); }
                      else if (idx === 3) { flash("Complete Source, Energise and Certify to ship"); }
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[11px] text-left transition-colors"
                    style={{
                      background: isActive ? (complete ? "rgba(95,112,64,0.10)" : T.accentFaint) : "transparent",
                      cursor: unlocked || complete ? "pointer" : "default",
                      opacity: unlocked || complete || isActive ? 1 : 0.5,
                    }}
                  >
                    <span className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0" style={complete ? { background: T.good, color: "#fff" } : isActive ? { background: T.accent, color: T.accentInk } : { background: "rgba(89,82,54,0.09)", color: T.faint }}>
                      {complete ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20 6 9 17l-5-5" /></svg>
                      ) : locked ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                      ) : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold whitespace-nowrap" style={{ color: isActive || complete ? T.text : T.muted }}>{step.label}</span>
                      <span className="hidden lg:block text-[11px]" style={{ color: T.faint }}>{step.sub}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step content */}
        <div className="rounded-[10px] p-4" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>

          {/* ---- STEP 0: SOURCE — per-item sourcing cards; saving notifies the customer ---- */}
          {displayStep === 0 && (
            <div className="space-y-3">
              {order.items.map((item) => {
                const status = getItemStatus(item.sku);
                const received = status === "order_received";
                const vendorName = localVendorNames[item.sku] ?? item.vendorName ?? "";
                const vendorOrderId = localVendorOrderIds[item.sku] ?? item.vendorOrderId ?? "";
                const dirty = !!sourceDirty[item.sku];
                const savedAt = sourceSavedAt[item.sku];
                const markDirty = () => setSourceDirty((p) => ({ ...p, [item.sku]: true }));
                const fieldLabel = "block text-[10px] tracking-[0.1em] uppercase mb-1";
                const fieldCls = "w-full h-9 px-2.5 rounded-[8px] text-[12.5px] outline-none transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(160,125,56,0.16)]";
                const fieldStyle = { background: T.card, border: `1px solid ${T.border}`, color: T.text };

                const saveItem = () => {
                  setSourceDirty((p) => ({ ...p, [item.sku]: false }));
                  setSourceSavedAt((p) => ({ ...p, [item.sku]: new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }) }));
                  flash(`${item.name.split("·")[0].trim()} saved`);
                };

                return (
                  <div key={item.sku} className="rounded-[12px] p-4" style={{ background: T.card, border: `1px solid ${dirty ? T.accentBorder : T.borderSoft}` }}>
                    {/* Item header */}
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-semibold truncate" style={{ color: T.text }}>{item.name}</div>
                      <div className="text-[11px] mt-0.5 truncate" style={{ color: T.faint }}>{item.sku}{item.caratWeight ? ` · ${item.caratWeight}` : ""}</div>
                    </div>

                    {(!isPaid ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-2 mt-3 text-[12.5px]" style={{ color: T.muted }}>
                        <div><span className={fieldLabel} style={{ color: T.faint }}>Supplier</span>{vendorName || "—"}</div>
                        <div><span className={fieldLabel} style={{ color: T.faint }}>Supplier order</span><span className="tabular-nums">{vendorOrderId || "—"}</span></div>
                        <div className="col-span-2"><span className={fieldLabel} style={{ color: T.faint }}>Remarks</span>{localRemarks[item.sku] || "—"}</div>
                      </div>
                    ) : (
                      <>
                        {/* Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3.5">
                          <div>
                            <label className={fieldLabel} style={{ color: T.faint }}>Supplier</label>
                            <input type="text" value={vendorName} onChange={(e) => { setLocalVendorNames((p) => ({ ...p, [item.sku]: e.target.value })); markDirty(); }} placeholder="e.g. Kanakadhara Jewellers" className={fieldCls} style={fieldStyle} />
                          </div>
                          <div>
                            <label className={fieldLabel} style={{ color: T.faint }}>Supplier order no.</label>
                            <input type="text" value={vendorOrderId} onChange={(e) => { setLocalVendorOrderIds((p) => ({ ...p, [item.sku]: e.target.value })); markDirty(); }} placeholder="e.g. KJ-2026-0950" className={`${fieldCls} tabular-nums`} style={fieldStyle} />
                          </div>
                          <div>
                            <label className={fieldLabel} style={{ color: T.faint }}>Status</label>
                            <Select
                              value={status}
                              onChange={(val) => { setLocalItemStatuses((p) => ({ ...p, [item.sku]: val })); setSourceDirty((p) => ({ ...p, [item.sku]: true })); }}
                              compact
                              options={[
                                { value: "pending", label: "Pending" },
                                { value: "order_placed", label: "Placed" },
                                { value: "in_transit", label: "In transit" },
                                { value: "order_received", label: "Received" },
                              ]}
                            />
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className={fieldLabel} style={{ color: T.faint }}>Remarks</label>
                          <textarea value={localRemarks[item.sku] ?? ""} onChange={(e) => { setLocalRemarks((p) => ({ ...p, [item.sku]: e.target.value })); markDirty(); }} placeholder="e.g. Vendor confirmed dispatch by Friday" rows={2} className={`${fieldCls} py-2 resize-none`} style={fieldStyle} />
                        </div>

                        {/* Footer: save */}
                        <div className="flex flex-wrap items-center justify-end gap-3 mt-4 pt-3.5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                          <button
                            onClick={saveItem}
                            disabled={!dirty}
                            className="h-9 px-4 rounded-[9px] text-[12.5px] font-semibold cursor-pointer transition-all active:scale-[0.98] disabled:cursor-default"
                            style={dirty ? { background: T.accent, color: T.accentInk } : { background: "rgba(89,82,54,0.10)", color: T.faint }}
                          >
                            Save
                          </button>
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
                <div className="rounded-[12px] p-4" style={{ background: T.card, border: `1px solid ${energiseComplete ? "rgba(95,112,64,0.35)" : T.borderSoft}` }}>
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
                    <div className="flex items-center gap-2">
                      <Chip tone={energiseComplete ? "good" : localEnergStatus === "scheduled" || localEnergStatus === "in_progress" ? "gold" : "muted"}>
                        {energiseComplete ? "Completed" : localEnergStatus === "scheduled" || localEnergStatus === "in_progress" ? "Scheduled" : "Not scheduled"}
                      </Chip>
                      {!energiseComplete && (localEnergStatus === "scheduled" || localEnergStatus === "in_progress") && (
                        <button
                          onClick={() => {
                            if (energisation?.scheduledAt) {
                              const d = new Date(energisation.scheduledAt);
                              setScheduleDate(energisation.scheduledAt.split("T")[0]);
                              setScheduleTime(d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase());
                            }
                            if (energisation?.liveLink) setScheduleLink(energisation.liveLink);
                            setShowSchedule(true);
                          }}
                          className="text-[11px] font-medium px-2 py-1 rounded-[6px] cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.1)]"
                          style={{ color: T.accent }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
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
                      {!energiseComplete && localEnergStatus !== "scheduled" && localEnergStatus !== "in_progress" && (
                        <GoldBtn onClick={() => setShowSchedule(true)}>Schedule</GoldBtn>
                      )}
                      {energiseComplete && (
                        <span className="text-[12px]" style={{ color: T.good }}>
                          Completed {energisation?.completedAt
                            ? new Date(energisation.completedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                            : energisation?.scheduledAt
                              ? new Date(energisation.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
                              : ""}
                        </span>
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
                        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                          <a href={labCert?.fileUrl ?? "#"} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12px] font-medium transition-colors hover:brightness-110 cursor-pointer" style={{ background: T.accentFaint, color: T.accent, border: `1px solid ${T.accentBorder}` }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            View
                          </a>
                          <button onClick={() => setCertUploadTarget("lab_authenticity")} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12px] font-medium cursor-pointer transition-colors hover:bg-[rgba(89,82,54,0.06)]" style={{ color: T.muted, border: `1px solid ${T.borderSoft}` }}>Replace</button>
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
                      <Chip tone={energUploaded || energiseComplete ? "good" : "muted"}>{energUploaded ? "Generated" : energiseComplete ? "Auto-generated" : "Locked"}</Chip>
                    </div>
                    {energUploaded || energiseComplete ? (
                      <>
                        <div className="text-[12px] space-y-1" style={{ color: T.muted }}>
                          {energCert?.certificateNumber && <div><span style={{ color: T.faint }}>Cert #:</span> {energCert.certificateNumber}</div>}
                          {energCert?.issuingAuthority && <div><span style={{ color: T.faint }}>Issued by:</span> {energCert.issuingAuthority}</div>}
                          {energCert?.issueDate && <div><span style={{ color: T.faint }}>Date:</span> {energCert.issueDate}</div>}
                          {!energCert && <div>Auto-generated after energisation.</div>}
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                          <a href={energCert?.fileUrl ?? "#"} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12px] font-medium transition-colors hover:brightness-110 cursor-pointer" style={{ background: T.accentFaint, color: T.accent, border: `1px solid ${T.accentBorder}` }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                            View
                          </a>
                          <button onClick={() => setCertUploadTarget("energisation")} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12px] font-medium cursor-pointer transition-colors hover:bg-[rgba(89,82,54,0.06)]" style={{ color: T.muted, border: `1px solid ${T.borderSoft}` }}>Regenerate</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-[11px] mb-3" style={{ color: T.faint }}>Auto-generated once the energisation ritual is completed.</p>
                        <div className="flex items-center gap-2 text-[12px] rounded-[8px] px-3 py-2" style={{ background: T.bg, border: `1px dashed ${T.border}`, color: T.muted }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                          Waiting for energisation to complete.
                        </div>
                      </>
                    )}
                  </div>
                </div>

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
              ) : (
                <div className="space-y-4">
                  {/* Pre-dispatch: editable inputs + dispatch button */}
                  {!(dispatched || order.shopifyStatus === "fulfilled") ? (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Input value={trackingInput} onChange={setTrackingInput} label="Tracking ID" placeholder="e.g. AWB-BLU-5518234" />
                        <Input value={trackingCourier} onChange={setTrackingCourier} label="Courier" placeholder="e.g. BlueDart, DTDC" />
                      </div>
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <span className="text-[12px]" style={{ color: T.faint }}>Enter tracking details and mark as dispatched.</span>
                        <GoldBtn
                          onClick={() => setConfirmDispatch(true)}
                          disabled={!trackingInput.trim() || !trackingCourier.trim()}
                        >
                          Mark as dispatched
                        </GoldBtn>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Dispatched card — read-only with pencil edit */}
                      <div className="rounded-[10px] p-4" style={{ background: T.card, border: `1px solid ${T.borderSoft}` }}>
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: T.good, color: "#fff" }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5"><path d="M20 6 9 17l-5-5" /></svg>
                            </span>
                            <span className="text-[13px] font-semibold" style={{ color: T.text }}>Dispatched</span>
                            {order.shopifyStatus === "fulfilled" && <Chip tone="good">Delivered</Chip>}
                          </div>
                          {!editingTracking ? (
                            <button
                              onClick={() => setEditingTracking(true)}
                              className="p-1.5 rounded-[6px] cursor-pointer transition-colors hover:bg-[rgba(89,82,54,0.06)]"
                              style={{ color: T.muted }}
                              title="Edit tracking"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <GhostBtn onClick={() => setEditingTracking(false)}>Cancel</GhostBtn>
                              <GoldBtn onClick={() => { setLocalTracking(trackingInput || localTracking); setEditingTracking(false); flash("Tracking updated"); }}>Save</GoldBtn>
                            </div>
                          )}
                        </div>

                        {editingTracking ? (
                          <div className="grid sm:grid-cols-2 gap-3">
                            <Input value={trackingInput || localTracking || order.tracking || ""} onChange={setTrackingInput} label="Tracking ID" placeholder="e.g. AWB-BLU-5518234" />
                            <Input value={trackingCourier} onChange={setTrackingCourier} label="Courier" placeholder="e.g. BlueDart, DTDC" />
                          </div>
                        ) : (
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <div className="text-[10px] tracking-[0.1em] uppercase mb-1" style={{ color: T.faint }}>Tracking ID</div>
                              <div className="text-[13px] font-medium tabular-nums" style={{ color: T.text }}>{localTracking || trackingInput || order.tracking || "—"}</div>
                            </div>
                            <div>
                              <div className="text-[10px] tracking-[0.1em] uppercase mb-1" style={{ color: T.faint }}>Courier</div>
                              <div className="text-[13px] font-medium" style={{ color: T.text }}>{trackingCourier || "—"}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Shipment timeline */}
                      <div className="pt-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <span className="text-[13px] font-semibold" style={{ color: T.text }}>Shipment status</span>
                          <button
                            onClick={() => {
                              setStatusText("");
                              setStatusDate(new Date().toISOString().split("T")[0]);
                              setStatusTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }));
                              setShowAddStatus(true);
                            }}
                            className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-[8px] cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                            style={{ color: T.accent, border: `1px solid ${T.accentBorder}` }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Add status
                          </button>
                        </div>

                        {/* Add status form */}
                        {showAddStatus && (
                          <div className="rounded-[10px] p-3.5 mb-3 space-y-3" style={{ background: T.card, border: `1px solid ${T.borderSoft}` }}>
                            <Textarea value={statusText} onChange={setStatusText} label="Status update" placeholder="e.g. Package picked up from warehouse" rows={2} />
                            <div className="grid grid-cols-2 gap-3">
                              <Input value={statusDate} onChange={setStatusDate} label="Date" placeholder="YYYY-MM-DD" />
                              <Input value={statusTime} onChange={setStatusTime} label="Time" placeholder="HH:MM" />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <GhostBtn onClick={() => setShowAddStatus(false)}>Cancel</GhostBtn>
                              <GoldBtn
                                onClick={() => {
                                  if (!statusText.trim()) return;
                                  setShipmentLog((prev) => [{ id: `log_${Date.now()}`, text: statusText.trim(), date: statusDate, time: statusTime }, ...prev]);
                                  setShowAddStatus(false);
                                  setStatusText("");
                                  flash("Status added");
                                }}
                                disabled={!statusText.trim()}
                              >
                                Add
                              </GoldBtn>
                            </div>
                          </div>
                        )}

                        {/* Timeline entries */}
                        {shipmentLog.length > 0 ? (
                          <div className="relative pl-5">
                            <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: T.border }} />
                            {shipmentLog.map((entry, i) => (
                              <div key={entry.id} className="relative pb-4 last:pb-0">
                                <span className="absolute left-[-17px] top-1.5 w-[11px] h-[11px] rounded-full border-2" style={{ borderColor: i === 0 ? T.good : T.border, background: i === 0 ? T.good : T.bg }} />
                                {editingLogId === entry.id ? (
                                  <div className="rounded-[10px] p-3 space-y-2.5" style={{ background: T.card, border: `1px solid ${T.borderSoft}` }}>
                                    <Textarea value={editLogText} onChange={setEditLogText} rows={2} />
                                    <div className="grid grid-cols-2 gap-3">
                                      <Input value={editLogDate} onChange={setEditLogDate} label="Date" />
                                      <Input value={editLogTime} onChange={setEditLogTime} label="Time" />
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                      <GhostBtn onClick={() => setEditingLogId(null)}>Cancel</GhostBtn>
                                      <GoldBtn onClick={() => {
                                        setShipmentLog((prev) => prev.map((e) => e.id === entry.id ? { ...e, text: editLogText.trim() || e.text, date: editLogDate || e.date, time: editLogTime || e.time } : e));
                                        setEditingLogId(null);
                                        flash("Status updated");
                                      }}>
                                        Save
                                      </GoldBtn>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="group">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <div className="text-[12.5px] font-medium" style={{ color: T.text }}>{entry.text}</div>
                                        <div className="text-[11px] mt-0.5 tabular-nums" style={{ color: T.faint }}>
                                          {entry.date && new Date(entry.date + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                          {entry.time && ` · ${entry.time}`}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => { setEditingLogId(entry.id); setEditLogText(entry.text); setEditLogDate(entry.date); setEditLogTime(entry.time); }}
                                        className="opacity-0 group-hover:opacity-100 text-[11px] font-medium px-2 py-1 rounded-[6px] cursor-pointer transition-all hover:bg-[rgba(89,82,54,0.06)]"
                                        style={{ color: T.muted }}
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : !showAddStatus && (
                          <div className="text-center py-4 rounded-[10px]" style={{ background: T.bg, border: `1px dashed ${T.border}` }}>
                            <p className="text-[12px]" style={{ color: T.faint }}>No shipment updates yet. Add a status to start tracking.</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </Card>}
      {/* ============ ORDER SUMMARY ============ */}
      <Card className="order-first">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
          <div>
            <h2 className="font-title text-[18px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>{order.id}</h2>
            <div className="text-[12.5px] mt-0.5" style={{ color: T.muted }}>Placed {new Date(order.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
          </div>
          <ShopifyButton href="https://admin.shopify.com/orders">Open in Shopify</ShopifyButton>
        </div>
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
          <div className="flex items-center justify-between px-3 py-1 text-[13px]">
            <span style={{ color: T.muted }}>Discount</span>
            <span className="tabular-nums" style={{ color: T.good }}>– {inr(0)}</span>
          </div>
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
        {/* Customer */}
        {customer ? (
          <Link href={`/customers/${customer.id}`} className="block group">
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[12.5px] font-semibold shrink-0" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>
                  {customer.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Customer</div>
                  <div className="text-[14px] font-semibold truncate" style={{ color: T.text }}>{customer.name}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Phone</span>
                  <span className="text-[13px] font-medium" style={{ color: T.text }}>{customer.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Email</span>
                  <span className="text-[13px] font-medium truncate ml-3" style={{ color: T.text }}>{customer.email}</span>
                </div>
              </div>
            </Card>
          </Link>
        ) : (
          <Card>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Customer</span>
              <span className="font-medium" style={{ color: T.text }}>{order.customerName}</span>
            </div>
          </Card>
        )}
        {/* Payment — pending CTAs replace details until paid */}
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
                Fulfillment is locked until payment is received.
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setLinkSent(true);
                  flash(linkSent ? "Payment link resent to customer" : "Payment link sent to customer");
                }}
                className="h-11 w-full px-5 rounded-[10px] text-[14px] font-semibold cursor-pointer transition-all hover:brightness-110"
                style={{ background: T.accent, color: T.accentInk }}
              >
                {linkSent ? "Resend link" : "Send payment link"}
              </button>
              <button
                onClick={() => setShowMarkPaid(true)}
                className="h-11 w-full px-5 rounded-[10px] text-[14px] font-semibold cursor-pointer transition-colors hover:bg-[rgba(160,125,56,0.14)]"
                style={{ color: T.gold, border: "1px solid rgba(160,125,56,0.35)", background: "rgba(255,254,250,0.6)" }}
              >
                Mark as paid
              </button>
            </div>
          </div>
        ) : (
          <Card>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Payment details</h2>
              <Chip tone="good">Paid</Chip>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Method</span>
                <span className="text-[13px] font-medium" style={{ color: T.text }}>Bank transfer (NEFT)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Transaction ID</span>
                <span className="text-[13px] font-medium tabular-nums" style={{ color: T.accent }}>{`TXN${order.id.replace(/\D/g, "").slice(0, 8)}`}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium tracking-[0.08em] uppercase" style={{ color: T.faint }}>Paid at</span>
                <span className="text-[12.5px] tabular-nums" style={{ color: T.muted }}>
                  {new Date(new Date(order.placedAt).getTime() + 3600000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + " · " + new Date(new Date(order.placedAt).getTime() + 3600000).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* Shipment details */}
        <Card>
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Shipment details</h2>
            <Chip tone={shipComplete ? "good" : dispatched ? "gold" : "muted"}>
              {shipComplete ? "Delivered" : dispatched && shipmentLog.length > 0 ? shipmentLog[0].text : dispatched ? "Dispatched" : "Not shipped"}
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
      <Modal open={showMarkPaid} onClose={() => setShowMarkPaid(false)} title="Record payment" wide>
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
              <div>
                <label className="block text-[11px] tracking-[0.12em] uppercase mb-1.5" style={{ color: T.faint }}>Certificate file (PDF or image)</label>
                <div
                  className="rounded-[11px] px-4 py-5 flex flex-col items-center justify-center gap-1.5 text-center transition-colors cursor-pointer"
                  style={{ border: `1.5px dashed ${certDrag ? T.accent : certFile ? "rgba(95,112,64,0.5)" : T.border}`, background: certDrag ? "rgba(119,123,98,0.06)" : certFile ? "rgba(95,112,64,0.06)" : T.bg }}
                  onDragOver={(e) => { e.preventDefault(); setCertDrag(true); }}
                  onDragLeave={() => setCertDrag(false)}
                  onDrop={(e) => { e.preventDefault(); setCertDrag(false); const n = e.dataTransfer.files[0]?.name; if (n) setCertFile(n); }}
                  onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = ".pdf,.jpg,.jpeg,.png"; inp.onchange = (e) => { const n = (e.target as HTMLInputElement).files?.[0]?.name; if (n) setCertFile(n); }; inp.click(); }}
                >
                  {certFile ? (
                    <>
                      <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(95,112,64,0.14)", color: T.good }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 6 9 17l-5-5" /></svg>
                      </span>
                      <span className="text-[13px] font-medium" style={{ color: T.text }}>{certFile}</span>
                      <span className="text-[11.5px]" style={{ color: T.faint }}>Tap to replace</span>
                    </>
                  ) : (
                    <>
                      <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: T.accentFaint, color: T.accent }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>
                      </span>
                      <span className="text-[13px] font-medium" style={{ color: T.text }}>Drop the certificate here, or tap to browse</span>
                      <span className="text-[11.5px]" style={{ color: T.faint }}>PDF, JPG or PNG</span>
                    </>
                  )}
                </div>
              </div>
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
        <div className="flex justify-end gap-2.5 mt-5">
          <GhostBtn onClick={() => { setCertUploadTarget(null); setCertFile(""); }}>Cancel</GhostBtn>
          <GoldBtn onClick={handleCertUpload} disabled={certUploadTarget === "lab_authenticity" && !certFile}>{certUploadTarget === "lab_authenticity" ? "Upload certificate" : "Generate certificate"}</GoldBtn>
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
        onConfirm={() => {
          setLocalTracking(trackingInput || localTracking || order.tracking || "");
          setDispatched(true);
          const now = new Date();
          setShipmentLog([{ id: `log_${Date.now()}`, text: "Order dispatched — handed to courier", date: now.toISOString().split("T")[0], time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }) }]);
          flash("Order dispatched");
        }}
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
