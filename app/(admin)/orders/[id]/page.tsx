"use client";
import { use, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Timeline, GoldBtn, GhostBtn, Modal, Input, Select, FileInput, Textarea, DateInput, TimeInput, ShopifyButton } from "@/components/ui";
import type { TimelineEvent } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_ORDERS, MOCK_CUSTOMERS, MOCK_CERTIFICATES, MOCK_ENERGISATION } from "@/lib/mock";
import { ENERGISATION } from "@/lib/catalog";
import { inr } from "@/lib/types";

type CertUploadTarget = "lab_authenticity" | "energisation" | null;

const STONE_STATUSES = [
  { value: "order_placed", label: "Order placed" },
  { value: "in_transit", label: "In transit" },
  { value: "order_received", label: "Order received" },
  { value: "quality_check", label: "Quality check" },
  { value: "ready_to_ship", label: "Ready to ship" },
];

const JEWELLERY_STATUSES = [
  { value: "order_placed", label: "Order placed" },
  { value: "order_received", label: "Order received" },
  { value: "in_crafting", label: "In crafting" },
  { value: "quality_check", label: "Quality check" },
  { value: "ready_to_ship", label: "Ready to ship" },
];

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const order = MOCK_ORDERS.find((o) => o.id === id);

  const [certUploadTarget, setCertUploadTarget] = useState<CertUploadTarget>(null);
  const [toast, setToast] = useState("");
  const [certNumber, setCertNumber] = useState("");
  const [certAuthority, setCertAuthority] = useState("");
  const [certIssueDate, setCertIssueDate] = useState("");
  const [certWeight, setCertWeight] = useState("");
  const [certOrigin, setCertOrigin] = useState("");
  const [certTreatment, setCertTreatment] = useState("");
  const [certNotes, setCertNotes] = useState("");
  const [certRitualMethod, setCertRitualMethod] = useState("");

  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleGuruji, setScheduleGuruji] = useState("");
  const [scheduleLink, setScheduleLink] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [itemStatuses, setItemStatuses] = useState<Record<string, string>>({});
  const [localTracking, setLocalTracking] = useState(order?.tracking ?? "");
  const [editingTracking, setEditingTracking] = useState(false);
  const [trackingInput, setTrackingInput] = useState("");

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: T.muted }}>Order not found.</p>
        <Link href="/orders" className="text-[13px] mt-2 inline-block" style={{ color: T.accent }}>← Back to orders</Link>
      </div>
    );
  }

  const customer = MOCK_CUSTOMERS.find((c) => c.id === order.customerId);
  const certs = MOCK_CERTIFICATES.filter((c) => c.orderId === order.id);
  const energisation = MOCK_ENERGISATION.find((e) => e.orderId === order.id);
  const labCert = certs.find((c) => c.type === "lab_authenticity");
  const energCert = certs.find((c) => c.type === "energisation");

  const timeline: TimelineEvent[] = [
    { id: "t1", title: "Order placed", time: order.placedAt, tone: "good" },
    ...(energisation?.scheduledAt ? [{ id: "t-eng-sched", title: `Energisation scheduled — ${energisation.method ?? "ritual"}`, time: energisation.createdAt, tone: "gold" as const }] : []),
    ...(energisation?.completedAt ? [{ id: "t2", title: "Energisation completed", time: energisation.completedAt, tone: "good" as const }] : []),
    ...certs.filter((c) => c.uploadedAt).map((c) => ({ id: c.id, title: `Certificate uploaded — ${c.type === "lab_authenticity" ? "Lab Authenticity" : "AstroLaabh Certificate"}`, time: c.uploadedAt!, tone: "gold" as const })),
    ...(order.tracking ? [{ id: "t3", title: `Dispatched — ${order.tracking}`, time: order.updatedAt, tone: "gold" as const }] : []),
    ...(order.stage === 7 ? [{ id: "t4", title: "Delivered", time: order.updatedAt, tone: "good" as const }] : []),
  ];

  const handleCertUpload = () => {
    setCertUploadTarget(null);
    setCertNumber("");
    setCertAuthority("");
    setCertIssueDate("");
    setCertWeight("");
    setCertOrigin("");
    setCertTreatment("");
    setCertNotes("");
    setToast("Certificate uploaded");
    setTimeout(() => setToast(""), 3000);
  };

  const handleScheduleSubmit = () => {
    setShowSchedule(false);
    setScheduleDate("");
    setScheduleTime("");
    setScheduleGuruji("");
    setScheduleLink("");
    setScheduleNotes("");
    setToast("Energisation scheduled");
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <>
      <PageHeader
        title={order.id}
        sub={`Placed ${order.placedAt}`}
        back={{ label: "Orders", href: "/orders" }}
        action={
          <div className="flex items-center gap-2.5">
            {order.paymentStatus === "pending" && (
              <span
                onClick={() => { setToast("Payment link sent to customer"); setTimeout(() => setToast(""), 3000); }}
                className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-[8px] cursor-pointer hover:opacity-90 transition-opacity"
                style={{ background: T.primary, color: T.primaryInk, fontWeight: 600 }}
              >
                Resend payment link
              </span>
            )}
            <ShopifyButton href="https://admin.shopify.com/orders">Open in Shopify</ShopifyButton>
          </div>
        }
      />

      {/* Items — full width */}
      <Card className="mb-4">
        <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Items</div>
        {order.items.map((item, i) => (
          <div
            key={item.sku}
            className="flex items-center justify-between py-3"
            style={{ borderBottom: i < order.items.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
          >
            <Link href="/inventory" className="flex items-center gap-4 min-w-0 flex-1 row-interactive rounded-[9px] py-1 px-1 -ml-1">
              <div className="w-8 h-8 rounded-[6px] flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ background: "rgba(160,125,56,0.15)", color: T.accent }}>
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-medium truncate" style={{ color: T.text }}>{item.name}</div>
                <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>
                  {item.sku} {item.caratWeight && `· ${item.caratWeight}`} {item.gemstone && `· ${item.gemstone}`}
                </div>
              </div>
            </Link>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <Select
                value={itemStatuses[item.sku] ?? item.itemStatus ?? "order_placed"}
                onChange={(val) => setItemStatuses((prev) => ({ ...prev, [item.sku]: val }))}
                options={item.itemType === "jewellery" ? JEWELLERY_STATUSES : STONE_STATUSES}
                compact
                className="w-[170px]"
              />
              <span className="text-[14px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(item.price)}</span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: `1px solid ${T.border}` }}>
          <span className="text-[13px] font-medium" style={{ color: T.muted }}>Order total</span>
          <span className="text-[16px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(order.total)}</span>
        </div>
      </Card>

      {/* Details — two columns: Customer + Order */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        {customer ? (
          <Link href={`/customers/${customer.id}`} className="block group">
            <div
              className="card-interactive rounded-[12px] p-5 h-full cursor-pointer"
              style={{ background: T.card, border: `1px solid ${T.border}` }}
            >
              <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Customer</div>
              <div className="space-y-2.5 text-[13px]">
                <div className="flex items-center justify-between">
                  <span style={{ color: T.muted }}>Name</span>
                  <span style={{ color: T.text }}>{customer.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: T.muted }}>Phone</span>
                  <span style={{ color: T.text }}>{customer.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: T.muted }}>Email</span>
                  <span className="text-right" style={{ color: T.text }}>{customer.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span style={{ color: T.muted }}>Location</span>
                  <span className="text-right" style={{ color: T.text }}>{customer.birthPlace}</span>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <Card>
            <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Customer</div>
            <div className="space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <span style={{ color: T.muted }}>Name</span>
                <span style={{ color: T.text }}>{order.customerName}</span>
              </div>
            </div>
          </Card>
        )}

        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Order details</div>
          <div className="space-y-2.5 text-[13px]">
            <div className="flex items-center justify-between">
              <span style={{ color: T.muted }}>Payment status</span>
              <Chip tone={order.paymentStatus === "paid" ? "good" : order.paymentStatus === "pending" ? "gold" : "danger"}>
                {order.paymentStatus}
              </Chip>
            </div>
            <div className="flex items-start justify-between">
              <span style={{ color: T.muted }}>Shipping address</span>
              <span className="text-right max-w-[220px]" style={{ color: customer?.shippingAddress ? T.text : T.faint }}>
                {customer ? `${customer.name}, ${customer.shippingAddress || "—"}` : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: T.muted }}>Shipment status</span>
              <span style={{ color: order.shopifyStatus === "fulfilled" ? T.good : T.text }}>
                {order.shopifyStatus === "fulfilled" ? "Delivered" : order.tracking ? "In transit" : "Not shipped"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: T.muted }}>Tracking ID</span>
              {editingTracking ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    className="h-7 px-2 rounded-[6px] text-[12px] w-[160px] outline-none"
                    style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
                    autoFocus
                  />
                  <span
                    onClick={() => { setLocalTracking(trackingInput); setEditingTracking(false); }}
                    className="text-[11px] font-medium cursor-pointer px-2 py-1 rounded-[6px] hover:opacity-90 transition-opacity"
                    style={{ background: T.primary, color: T.primaryInk }}
                  >
                    Save
                  </span>
                  <span
                    onClick={() => setEditingTracking(false)}
                    className="text-[11px] cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ color: T.muted }}
                  >
                    Cancel
                  </span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <span style={{ color: localTracking ? T.text : T.faint }}>{localTracking || "—"}</span>
                  {order.paymentStatus === "paid" && (
                    <span
                      onClick={() => { setTrackingInput(localTracking); setEditingTracking(true); }}
                      className="text-[11px] cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ color: T.accent }}
                    >
                      {localTracking ? "Edit" : "Add"}
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span style={{ color: T.muted }}>Affiliate</span>
              <span style={{ color: order.affiliateCode ? T.accent : T.faint }}>{order.affiliateCode || "—"}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Energisation section */}
      {energisation ? (
        <Link href={`/energisation/${energisation.id}`} className="block mb-4 group">
          <div
            className="card-interactive rounded-[12px] p-5 cursor-pointer"
            style={{ background: T.card, border: `1px solid ${T.border}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Energisation</div>
              <div className="flex items-center gap-2">
                {!energisation.liveLink && energisation.status === "scheduled" && <Chip tone="danger">Link missing</Chip>}
                <Chip tone={energisation.status === "completed" ? "good" : energisation.status === "scheduled" || energisation.status === "in_progress" ? "gold" : "danger"}>
                  {energisation.status.replace(/_/g, " ")}
                </Chip>
              </div>
            </div>

            {/* Tier info */}
            {order.energisationTier && (() => {
              const tier = ENERGISATION.find((e) => e.key === order.energisationTier);
              if (!tier) return null;
              return (
                <div className="rounded-[9px] p-4 mb-4" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold" style={{ color: T.accent }}>{tier.name}</span>
                      <span className="text-[11px]" style={{ color: T.faint }}>{tier.sanskrit}</span>
                    </div>
                    <span className="text-[12px] font-medium tabular-nums" style={{ color: tier.fee === 0 ? T.good : T.text }}>
                      {tier.fee === 0 ? "Included" : inr(tier.fee)}
                    </span>
                  </div>
                  <div className="text-[12px]" style={{ color: T.muted }}>{tier.duration}</div>
                </div>
              );
            })()}

            {/* Schedule details */}
            <div className="flex items-center gap-4">
              <div className="grid sm:grid-cols-3 gap-4 text-[13px] flex-1">
                <div>
                  <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Guruji</div>
                  <div style={{ color: energisation.assignedTo ? T.text : T.faint }}>{energisation.assignedTo ?? "Unassigned"}</div>
                </div>
                <div>
                  <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>
                    {energisation.completedAt ? "Completed" : energisation.scheduledAt ? "Scheduled" : "Schedule"}
                  </div>
                  <div style={{ color: energisation.scheduledAt || energisation.completedAt ? T.text : T.danger }}>
                    {energisation.completedAt
                      ? new Date(energisation.completedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
                      : energisation.scheduledAt
                        ? new Date(energisation.scheduledAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
                        : "Not scheduled"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Session link</div>
                  <div style={{ color: energisation.liveLink ? T.good : T.faint }}>
                    {energisation.liveLink ? "Uploaded" : "Not uploaded"}
                  </div>
                </div>
              </div>
              {(energisation.status === "scheduled" || energisation.status === "pending") && (
                <span
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowSchedule(true); }}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[12px] font-medium cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                  style={{ border: `1px solid ${T.border}`, color: T.text }}
                >
                  Edit
                </span>
              )}
            </div>
          </div>
        </Link>
      ) : (
        <Card className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Energisation</div>
            <Chip tone="muted">Not scheduled</Chip>
          </div>

          {order.energisationTier && (() => {
            const tier = ENERGISATION.find((e) => e.key === order.energisationTier);
            if (!tier) return null;
            return (
              <div className="rounded-[9px] p-4 mb-4" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13.5px] font-semibold" style={{ color: T.accent }}>{tier.name}</span>
                    <span className="text-[11px]" style={{ color: T.faint }}>{tier.sanskrit}</span>
                  </div>
                  <span className="text-[12px] font-medium tabular-nums" style={{ color: tier.fee === 0 ? T.good : T.text }}>
                    {tier.fee === 0 ? "Included" : inr(tier.fee)}
                  </span>
                </div>
                <div className="text-[12px]" style={{ color: T.muted }}>{tier.duration}</div>
              </div>
            );
          })()}

          <p className="text-[13px] mb-3" style={{ color: T.muted }}>
            {order.paymentStatus === "pending"
              ? "Energisation can be scheduled after payment is received."
              : "Schedule the energisation — assign a Guruji, date, time, and meeting link."}
          </p>
          <GoldBtn onClick={() => setShowSchedule(true)} disabled={order.paymentStatus === "pending"}>Schedule energisation</GoldBtn>
        </Card>
      )}

      {/* Certificates section */}
      <Card className="mb-4">
        <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Certificates</div>
        <div className="grid sm:grid-cols-2 gap-3">
          {/* Lab Authenticity Certificate */}
          <div className="rounded-[9px] p-4" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-medium" style={{ color: T.text }}>Licensed Lab Authenticity</span>
              <Chip tone={labCert?.status === "verified" || labCert?.status === "uploaded" ? "good" : "danger"}>
                {labCert?.status ?? "Missing"}
              </Chip>
            </div>
            <p className="text-[11px] mb-2" style={{ color: T.faint }}>
              Independent gemological lab report confirming identity, weight, origin, treatment, and quality grade.
            </p>
            {labCert && labCert.status !== "missing" ? (
              <div className="text-[12px] space-y-1" style={{ color: T.muted }}>
                {labCert.certificateNumber && <div><span style={{ color: T.faint }}>Cert #:</span> {labCert.certificateNumber}</div>}
                {labCert.issuingAuthority && <div><span style={{ color: T.faint }}>Lab:</span> {labCert.issuingAuthority}</div>}
                {labCert.issueDate && <div><span style={{ color: T.faint }}>Issued:</span> {labCert.issueDate}</div>}
                {labCert.fileName && <div><span style={{ color: T.faint }}>File:</span> {labCert.fileName}</div>}
                <div className="pt-2">
                  <a href={labCert.fileUrl ?? "#"} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[12px]" style={{ color: T.accent }}>
                    View certificate ↗
                  </a>
                </div>
              </div>
            ) : (
              <GoldBtn onClick={() => setCertUploadTarget("lab_authenticity")} disabled={order.paymentStatus === "pending"}>Upload certificate</GoldBtn>
            )}
          </div>

          {/* AstroLaabh Energisation Certificate */}
          <div className="rounded-[9px] p-4" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-medium" style={{ color: T.text }}>AstroLaabh Certificate</span>
              <Chip tone={energCert?.status === "verified" || energCert?.status === "uploaded" ? "good" : "danger"}>
                {energCert?.status ?? "Missing"}
              </Chip>
            </div>
            <p className="text-[11px] mb-2" style={{ color: T.faint }}>
              In-house energisation certificate confirming ritual completion, mantra details, and astrological suitability.
            </p>
            {energCert && energCert.status !== "missing" ? (
              <div className="text-[12px] space-y-1" style={{ color: T.muted }}>
                {energCert.certificateNumber && <div><span style={{ color: T.faint }}>Cert #:</span> {energCert.certificateNumber}</div>}
                {energCert.issuingAuthority && <div><span style={{ color: T.faint }}>Issued by:</span> {energCert.issuingAuthority}</div>}
                {energCert.issueDate && <div><span style={{ color: T.faint }}>Date:</span> {energCert.issueDate}</div>}
                {energCert.fileName && <div><span style={{ color: T.faint }}>File:</span> {energCert.fileName}</div>}
                <div className="pt-2">
                  <a href={energCert.fileUrl ?? "#"} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-[12px]" style={{ color: T.accent }}>
                    View certificate ↗
                  </a>
                </div>
              </div>
            ) : (
              <GoldBtn onClick={() => setCertUploadTarget("energisation")} disabled={order.paymentStatus === "pending"}>Upload certificate</GoldBtn>
            )}
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card>
        <div className="text-[11px] tracking-[0.08em] uppercase mb-4" style={{ color: T.faint }}>Activity timeline</div>
        <Timeline events={timeline} />
      </Card>

      {/* Certificate Upload Modal */}
      <Modal
        open={!!certUploadTarget}
        onClose={() => setCertUploadTarget(null)}
        title={certUploadTarget === "lab_authenticity" ? "Upload Lab Authenticity Certificate" : "Upload AstroLaabh Certificate"}
      >
        <div className="space-y-3">
          {certUploadTarget === "lab_authenticity" ? (
            <>
              <Select
                value={certAuthority}
                onChange={setCertAuthority}
                label="Issuing laboratory"
                searchable
                placeholder="Select lab…"
                options={[
                  { value: "", label: "Select lab…" },
                  { value: "GIA (Gemological Institute of America)", label: "GIA — Gemological Institute of America" },
                  { value: "GRS (Gem Research Swisslab)", label: "GRS — Gem Research Swisslab" },
                  { value: "IGI (International Gemological Institute)", label: "IGI — International Gemological Institute" },
                  { value: "Gübelin Gem Lab", label: "Gübelin Gem Lab" },
                  { value: "SSEF (Swiss Gemmological Institute)", label: "SSEF — Swiss Gemmological Institute" },
                  { value: "Lotus Gemology", label: "Lotus Gemology" },
                  { value: "AGL (American Gemological Laboratories)", label: "AGL — American Gemological Laboratories" },
                  { value: "C. Dunaigre", label: "C. Dunaigre Consulting" },
                ]}
              />
              <Input value={certNumber} onChange={setCertNumber} label="Certificate / report number" placeholder="e.g. GIA-2026-78451" />
              <DateInput value={certIssueDate} onChange={setCertIssueDate} label="Issue date" placeholder="Select date…" />
              <Input value={certWeight} onChange={setCertWeight} label="Certified weight (carat)" placeholder="e.g. 5.21 ct" />
              <Input value={certOrigin} onChange={setCertOrigin} label="Origin determination" placeholder="e.g. Ceylon (Sri Lanka)" />
              <Select
                value={certTreatment}
                onChange={setCertTreatment}
                label="Treatment disclosure"
                options={[
                  { value: "", label: "Select…" },
                  { value: "No indication of heating", label: "No indication of heating (natural unheated)" },
                  { value: "Natural, untreated", label: "Natural, untreated" },
                  { value: "Heat treatment detected", label: "Heat treatment detected" },
                  { value: "Minor residues (standard)", label: "Minor residues — standard enhancement" },
                ]}
              />
              <Textarea value={certNotes} onChange={setCertNotes} label="Additional notes (optional)" placeholder="Colour grade, clarity, special remarks…" rows={2} />
            </>
          ) : (
            <>
              <Input value={certNumber} onChange={setCertNumber} label="AstroLaabh certificate number" placeholder="e.g. AEC-2026-003" />
              <Select
                value={certAuthority}
                onChange={setCertAuthority}
                label="Issued by"
                options={[
                  { value: "", label: "Select…" },
                  { value: "AstroLaabh Puja Division", label: "AstroLaabh Puja Division" },
                  { value: "Pt. Sandeep Kochaar", label: "Pt. Sandeep Kochaar" },
                  { value: "Dr. Meenakshi Joshi", label: "Dr. Meenakshi Joshi" },
                ]}
              />
              <DateInput value={certIssueDate} onChange={setCertIssueDate} label="Ritual completion date" placeholder="Select date…" />
              <Select
                value={certRitualMethod}
                onChange={setCertRitualMethod}
                label="Mantra / ritual method"
                options={[
                  { value: "Vedic Brihaspati Mantra — 108 repetitions", label: "Vedic Brihaspati Mantra — 108 repetitions" },
                  { value: "Surya Mantra — sunrise puja", label: "Surya Mantra — sunrise puja" },
                  { value: "Shani Mantra — 23 day extended ritual", label: "Shani Mantra — 23 day extended ritual" },
                  { value: "Budh Mantra — Wednesday puja", label: "Budh Mantra — Wednesday puja" },
                  { value: "Custom ritual", label: "Custom ritual" },
                ]}
              />
              <Textarea value={certNotes} onChange={setCertNotes} label="Ritual notes / remarks" placeholder="Gotra, nakshatra, special instructions…" rows={2} />
            </>
          )}
          <FileInput
            label="Certificate file (PDF or image)"
            accept=".pdf,.jpg,.jpeg,.png"
            onSelect={() => {}}
          />
        </div>
        <div className="flex gap-2.5 mt-5">
          <GoldBtn onClick={handleCertUpload}>Upload certificate</GoldBtn>
          <GhostBtn onClick={() => setCertUploadTarget(null)}>Cancel</GhostBtn>
        </div>
      </Modal>

      {/* Schedule / Reschedule Energisation Modal */}
      <Modal
        open={showSchedule}
        onClose={() => setShowSchedule(false)}
        title={energisation ? "Update energisation" : "Schedule energisation"}
      >
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
