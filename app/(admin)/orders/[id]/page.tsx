"use client";
import { use, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, GoldBtn, GhostBtn, Modal, Input, Select, FileInput, Textarea, DateInput, TimeInput, ShopifyButton, BackLink } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_ORDERS, MOCK_CUSTOMERS, MOCK_CERTIFICATES, MOCK_ENERGISATION } from "@/lib/mock";
import { ENERGISATION } from "@/lib/catalog";
import { inr } from "@/lib/types";

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

  const [localItemStatuses, setLocalItemStatuses] = useState<Record<string, string>>({});
  const [localVendorNames, setLocalVendorNames] = useState<Record<string, string>>({});
  const [localVendorOrderIds, setLocalVendorOrderIds] = useState<Record<string, string>>({});
  const [localEnergStatus, setLocalEnergStatus] = useState(order?.energisationStatus ?? "pending");
  const [localCertStatus, setLocalCertStatus] = useState<string>(order?.certificateStatus ?? "missing");
  const [localTracking, setLocalTracking] = useState(order?.tracking ?? "");
  const [trackingCourier, setTrackingCourier] = useState("");
  const [trackingInput, setTrackingInput] = useState("");
  const [dispatched, setDispatched] = useState(false);
  const [receivedNotes, setReceivedNotes] = useState("");

  const [viewStep, setViewStep] = useState<PipelineStep | null>(null);

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
  const isItemReceived = (s: string) => s === "order_received" || s === "in_crafting" || s === "quality_check" || s === "ready_to_ship";

  const stones = order.items.filter((i) => i.itemType === "stone");
  const allStonesReceived = stones.every((item) => isItemReceived(getItemStatus(item.sku)));
  const allItemsReceived = order.items.every((item) => isItemReceived(getItemStatus(item.sku)));

  const sourceComplete = allItemsReceived;
  const energiseComplete = localEnergStatus === "completed";
  const hasBothCerts = (labCert?.status === "uploaded" || labCert?.status === "verified" || localCertStatus === "uploaded" || localCertStatus === "verified") &&
    (energCert?.status === "uploaded" || energCert?.status === "verified" || localCertStatus === "verified");
  const certifyComplete = hasBothCerts || localCertStatus === "verified";
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
    setLocalPaymentStatus("paid");
    setShowMarkPaid(false);
    setPaymentRef("");
    setPaymentMethod("");
    flash("Payment marked as received");
  };

  const handleCertUpload = () => {
    const isGenerate = certUploadTarget === "energisation";
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

  return (
    <>
      {/* ============ HEADER ============ */}
      <PageHeader
        title={order.id}
        sub={`Placed ${new Date(order.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
        back={{ label: "Orders", href: "/orders" }}
        action={
          <div className="flex items-center gap-2.5">
            <ShopifyButton href="https://admin.shopify.com/orders">Open in Shopify</ShopifyButton>
          </div>
        }
      />

      {/* ============ PAYMENT BANNER ============ */}
      {!isPaid && (
        <div
          className="flex items-center gap-3 rounded-[10px] px-4 py-3 mb-4"
          style={{ background: "rgba(195,160,88,0.12)", border: `1px solid rgba(195,160,88,0.3)` }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div className="flex-1">
            <span className="text-[13.5px] font-medium" style={{ color: T.text }}>Payment pending</span>
            <span className="text-[12px] ml-2" style={{ color: T.muted }}>— fulfillment steps are locked until payment is received.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowMarkPaid(true)} className="text-[12px] font-medium px-3 py-1.5 rounded-[8px] cursor-pointer hover:brightness-110 transition-all" style={{ background: T.primary, color: T.primaryInk }}>Mark as paid</button>
            <button onClick={() => flash("Payment link sent to customer")} className="text-[12px] font-medium px-3 py-1.5 rounded-[8px] cursor-pointer hover:opacity-90 transition-opacity" style={{ background: T.accent, color: T.accentInk }}>Resend link</button>
          </div>
        </div>
      )}

      {/* ============ ORDER SUMMARY (invoice-style) ============ */}
      <Card className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Order summary</div>
          {isPaid && (
            <button
              onClick={() => flash("Invoice downloaded")}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-[8px] cursor-pointer transition-all hover:brightness-110"
              style={{ background: "rgba(160,125,56,0.12)", color: T.accent, border: `1px solid ${T.accentBorder}` }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download invoice
            </button>
          )}
        </div>

        {/* Column header */}
        <div className="hidden sm:grid grid-cols-[auto_1fr_100px_120px] gap-3 px-3 py-2 text-[10px] tracking-[0.06em] uppercase font-semibold rounded-[6px] mb-1" style={{ color: T.muted, background: "rgba(89,82,54,0.04)" }}>
          <span className="w-6" />
          <span>Item</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Amount</span>
        </div>

        {order.items.map((item, i) => (
          <div key={item.sku} className="grid grid-cols-[auto_1fr_100px_120px] gap-3 items-center px-3 py-3 text-[13px]" style={{ borderBottom: i < order.items.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
            <div className="w-6 h-6 rounded-[5px] flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: "rgba(160,125,56,0.12)", color: T.accent }}>
              {i + 1}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium truncate" style={{ color: T.text }}>{item.name}</span>
                <span className="text-[9px] tracking-[0.06em] uppercase px-1.5 py-0.5 rounded-full shrink-0 font-semibold" style={{
                  background: item.itemType === "jewellery" ? "rgba(160,125,56,0.10)" : "rgba(95,112,64,0.10)",
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
            <div className="text-right tabular-nums" style={{ color: T.muted }}>{item.qty}</div>
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
          <div className="flex items-center justify-between px-3 py-2 mt-1 rounded-[8px]" style={{ background: "rgba(89,82,54,0.04)" }}>
            <span className="text-[14px] font-semibold" style={{ color: T.text }}>Total</span>
            <span className="text-[17px] font-bold tabular-nums" style={{ color: T.text }}>
              {inr(order.total + (tier && tier.fee > 0 ? tier.fee : 0))}
            </span>
          </div>
        </div>
      </Card>

      {/* ============ CUSTOMER + ORDER INFO ============ */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {customer ? (
          <Link href={`/customers/${customer.id}`} className="block group">
            <div className="card-interactive rounded-[12px] p-5 h-full cursor-pointer" style={{ background: T.card, border: `1px solid ${T.border}` }}>
              <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Customer</div>
              <div className="space-y-2.5 text-[13px]">
                {[["Name", customer.name], ["Phone", customer.phone], ["Email", customer.email], ["Location", customer.birthPlace]].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <span style={{ color: T.muted }}>{k}</span>
                    <span className="text-right" style={{ color: T.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ) : (
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Customer</div>
            <div className="flex items-center justify-between text-[13px]">
              <span style={{ color: T.muted }}>Name</span>
              <span style={{ color: T.text }}>{order.customerName}</span>
            </div>
          </Card>
        )}

        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Order details</div>
          <div className="space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between">
              <span style={{ color: T.muted }}>Payment</span>
              <Chip tone={isPaid ? "good" : "gold"}>{isPaid ? "Paid" : "Pending"}</Chip>
            </div>
            <div className="flex items-start justify-between">
              <span style={{ color: T.muted }}>Ship to</span>
              <span className="text-right max-w-[220px]" style={{ color: customer?.shippingAddress ? T.text : T.faint }}>
                {customer ? `${customer.name}, ${customer.shippingAddress || "—"}` : "—"}
              </span>
            </div>
            {order.affiliateCode && (
              <div className="flex items-center justify-between">
                <span style={{ color: T.muted }}>Affiliate</span>
                <span style={{ color: T.accent }}>{order.affiliateCode}</span>
              </div>
            )}
            {order.placedBy && (
              <div className="flex items-center justify-between">
                <span style={{ color: T.muted }}>Placed by</span>
                <span style={{ color: T.text }}>{order.placedBy}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ============ FULFILLMENT PIPELINE ============ */}
      <Card className="mb-4">
        <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.faint }}>Fulfillment</div>

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

          {/* ---- STEP 0: SOURCE ---- */}
          {displayStep === 0 && (
            <div>
              {/* Header row */}
              <div className="hidden sm:grid grid-cols-[1fr_140px_150px_130px_60px] gap-3 px-3 py-2 text-[10px] tracking-[0.06em] uppercase font-semibold rounded-[6px] mb-1" style={{ color: T.muted, background: "rgba(89,82,54,0.04)" }}>
                <span>Item</span>
                <span>Vendor</span>
                <span>Vendor order</span>
                <span>Status</span>
                <span className="text-center">Received</span>
              </div>

              {order.items.map((item, i) => {
                const status = getItemStatus(item.sku);
                const received = status === "order_received";
                const vendorName = localVendorNames[item.sku] ?? item.vendorName ?? "";
                const vendorOrderId = localVendorOrderIds[item.sku] ?? item.vendorOrderId ?? "";

                return (
                  <div key={item.sku} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_150px_130px_60px] gap-2 sm:gap-3 items-center px-3 py-3" style={{ borderBottom: i < order.items.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{item.name}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: T.faint }}>{item.sku} {item.caratWeight && `· ${item.caratWeight}`}</div>
                    </div>
                    <div>
                      {isPaid ? (
                        <input
                          type="text"
                          value={vendorName}
                          onChange={(e) => setLocalVendorNames((prev) => ({ ...prev, [item.sku]: e.target.value }))}
                          placeholder="Vendor name"
                          disabled={received}
                          className="w-full h-7 px-2 rounded-[6px] text-[11px] outline-none truncate"
                          style={{ background: T.card, border: `1px solid ${T.borderSoft}`, color: T.text, opacity: received ? 0.6 : 1 }}
                        />
                      ) : (
                        <div className="text-[12px] truncate" style={{ color: T.muted }}>{vendorName || "—"}</div>
                      )}
                    </div>
                    <div>
                      {isPaid ? (
                        <input
                          type="text"
                          value={vendorOrderId}
                          onChange={(e) => setLocalVendorOrderIds((prev) => ({ ...prev, [item.sku]: e.target.value }))}
                          placeholder="Order ID"
                          disabled={received}
                          className="w-full h-7 px-2 rounded-[6px] text-[11px] outline-none tabular-nums truncate"
                          style={{ background: T.card, border: `1px solid ${T.borderSoft}`, color: T.text, opacity: received ? 0.6 : 1 }}
                        />
                      ) : (
                        <div className="text-[12px] tabular-nums truncate" style={{ color: T.muted }}>{vendorOrderId || "—"}</div>
                      )}
                    </div>
                    <div>
                      {isPaid ? (
                        <Select
                          value={status}
                          onChange={(val) => {
                            setLocalItemStatuses((prev) => ({ ...prev, [item.sku]: val }));
                            flash(`${item.name.split("·")[0].trim()} → ${itemStatusLabel(val)}`);
                          }}
                          disabled={received}
                          compact
                          options={[
                            { value: "order_placed", label: "Order placed" },
                            { value: "in_transit", label: "In transit" },
                            { value: "quality_check", label: "Quality check" },
                            { value: "order_received", label: "Received" },
                          ]}
                        />
                      ) : (
                        <Chip tone={itemStatusTone(status)}>{itemStatusLabel(status)}</Chip>
                      )}
                    </div>
                    <div className="flex justify-center">
                      {isPaid && (
                        <button
                          onClick={() => {
                            const next = received ? "in_transit" : "order_received";
                            setLocalItemStatuses((prev) => ({ ...prev, [item.sku]: next }));
                            setViewStep(0);
                            flash(`${item.name.split("·")[0].trim()} ${received ? "→ In transit" : "marked as received"}`);
                          }}
                          className="w-9 h-9 rounded-[8px] flex items-center justify-center cursor-pointer transition-all hover:brightness-110"
                          style={{
                            background: received ? T.good : T.borderSoft,
                            color: received ? "#fff" : T.faint,
                          }}
                        >
                          {received ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" opacity="0.3"/></svg>
                          )}
                        </button>
                      )}
                    </div>
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
                  style={{ background: "rgba(195,160,88,0.12)", border: "1px solid rgba(195,160,88,0.3)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span className="text-[12.5px] font-medium" style={{ color: T.text }}>Product is not yet with us</span>
                  <span className="text-[11.5px]" style={{ color: T.muted }}>— advised to schedule energisation after receiving stones.</span>
                </div>
              )}

              {tier && (
                <Link
                  href={energisation ? `/energisation/${energisation.id}` : "#"}
                  className="block rounded-[9px] p-4 transition-all duration-150 hover:brightness-[0.97] hover:shadow-md cursor-pointer group"
                  style={{ background: T.card, border: `1px solid ${T.borderSoft}` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[13.5px] font-semibold group-hover:underline" style={{ color: T.accent }}>{tier.name}</span>
                        <span className="text-[11px]" style={{ color: T.faint }}>{tier.sanskrit}</span>
                      </div>
                      <div className="text-[12px]" style={{ color: T.muted }}>{tier.duration}</div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <Chip tone={localEnergStatus === "completed" ? "good" : localEnergStatus === "scheduled" || localEnergStatus === "in_progress" ? "gold" : "muted"}>
                          {localEnergStatus === "completed" ? "Completed" : localEnergStatus === "scheduled" || localEnergStatus === "in_progress" ? "Scheduled" : "Not scheduled"}
                        </Chip>
                        {tier.fee > 0 && (
                          <div className="text-[12px] font-medium tabular-nums mt-1" style={{ color: T.text }}>
                            {inr(tier.fee)}
                          </div>
                        )}
                      </div>
                      {localEnergStatus !== "completed" && localEnergStatus !== "scheduled" && localEnergStatus !== "in_progress" && (
                        <span onClick={(e) => e.preventDefault()}>
                          <GoldBtn onClick={() => setShowSchedule(true)}>Schedule</GoldBtn>
                        </span>
                      )}
                      {(localEnergStatus === "scheduled" || localEnergStatus === "in_progress") && (
                        <span onClick={(e) => e.preventDefault()}>
                          <GoldBtn onClick={() => { setLocalEnergStatus("completed"); flash("Energisation marked as completed"); }}>Mark as completed</GoldBtn>
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
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
                  style={{ background: "rgba(195,160,88,0.12)", border: "1px solid rgba(195,160,88,0.3)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span className="text-[12.5px] font-medium" style={{ color: T.text }}>Product is not yet with us</span>
                  <span className="text-[11.5px]" style={{ color: T.muted }}>— receive all stones before uploading certificates.</span>
                </div>
              )}
                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Lab cert */}
                  <div className="rounded-[9px] p-4" style={{ background: T.card, border: `1px solid ${T.borderSoft}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-medium" style={{ color: T.text }}>Lab Authenticity</span>
                      <Chip tone={labCert?.status === "verified" || labCert?.status === "uploaded" ? "good" : "danger"}>
                        {labCert?.status ?? "Missing"}
                      </Chip>
                    </div>
                    <p className="text-[11px] mb-3" style={{ color: T.faint }}>Independent gemological lab report confirming identity, weight, origin, treatment, and quality grade.</p>
                    {labCert && labCert.status !== "missing" ? (
                      <div className="text-[12px] space-y-1" style={{ color: T.muted }}>
                        {labCert.certificateNumber && <div><span style={{ color: T.faint }}>Cert #:</span> {labCert.certificateNumber}</div>}
                        {labCert.issuingAuthority && <div><span style={{ color: T.faint }}>Lab:</span> {labCert.issuingAuthority}</div>}
                        {labCert.issueDate && <div><span style={{ color: T.faint }}>Issued:</span> {labCert.issueDate}</div>}
                        <div className="pt-2">
                          <a href={labCert.fileUrl ?? "#"} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[12px]" style={{ color: T.accent }}>View certificate ↗</a>
                        </div>
                      </div>
                    ) : (
                      <GoldBtn onClick={() => setCertUploadTarget("lab_authenticity")}>Upload certificate</GoldBtn>
                    )}
                  </div>

                  {/* AstroLaabh cert */}
                  <div className="rounded-[9px] p-4" style={{ background: T.card, border: `1px solid ${T.borderSoft}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-medium" style={{ color: T.text }}>AstroLaabh Certificate</span>
                      <Chip tone={energCert?.status === "verified" || energCert?.status === "uploaded" ? "good" : "danger"}>
                        {energCert?.status ?? "Missing"}
                      </Chip>
                    </div>
                    <p className="text-[11px] mb-3" style={{ color: T.faint }}>In-house energisation certificate confirming ritual completion, mantra details, and astrological suitability.</p>
                    {energCert && energCert.status !== "missing" ? (
                      <div className="text-[12px] space-y-1" style={{ color: T.muted }}>
                        {energCert.certificateNumber && <div><span style={{ color: T.faint }}>Cert #:</span> {energCert.certificateNumber}</div>}
                        {energCert.issuingAuthority && <div><span style={{ color: T.faint }}>Issued by:</span> {energCert.issuingAuthority}</div>}
                        {energCert.issueDate && <div><span style={{ color: T.faint }}>Date:</span> {energCert.issueDate}</div>}
                        <div className="pt-2">
                          <a href={energCert.fileUrl ?? "#"} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[12px]" style={{ color: T.accent }}>View certificate ↗</a>
                        </div>
                      </div>
                    ) : (
                      <GoldBtn onClick={() => {
                        const stone = order.items.find((i) => i.itemType === "stone");
                        setCertWeight(stone?.caratWeight ?? "");
                        setCertOrigin(order.customerName ?? "");
                        if (energisation?.completedAt) setCertIssueDate(energisation.completedAt.split("T")[0]);
                        if (energisation?.method) setCertRitualMethod(energisation.method);
                        setCertUploadTarget("energisation");
                      }}>Generate certificate</GoldBtn>
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
                  style={{ background: "rgba(195,160,88,0.12)", border: "1px solid rgba(195,160,88,0.3)" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span className="text-[12.5px] font-medium" style={{ color: T.text }}>Complete Source, Energise and Certify to ship</span>
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
                        onClick={() => { setLocalTracking(trackingInput); setDispatched(true); flash("Order dispatched"); }}
                        disabled={!trackingInput}
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
      </Card>

      {/* ============ MODALS ============ */}

      {/* Mark as paid */}
      <Modal open={showMarkPaid} onClose={() => setShowMarkPaid(false)} title="Record payment">
        <div className="space-y-3">
          <Select
            value={paymentMethod}
            onChange={setPaymentMethod}
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
          <Input value={paymentRef} onChange={setPaymentRef} label="Payment reference / transaction ID" placeholder="e.g. UTR number, cheque number" />
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
          <GoldBtn onClick={handleScheduleSubmit}>{energisation ? "Update" : "Schedule"}</GoldBtn>
          <GhostBtn onClick={() => setShowSchedule(false)}>Cancel</GhostBtn>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium animate-in" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
