"use client";
import { use, useState } from "react";
import Link from "next/link";
import { Card, Chip, GhostBtn, BackLink, Tabs } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CUSTOMERS, MOCK_ORDERS, MOCK_CONSULTATIONS, MOCK_PAYMENTS, MOCK_INCOMPLETE_ORDERS, MOCK_INCOMPLETE_CONSULTATIONS } from "@/lib/mock";
import { inr } from "@/lib/types";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { dateStyle: "medium" });
}

function SectionTitle({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-[11px] tracking-[0.08em] uppercase font-medium" style={{ color: T.faint }}>{children}</span>
      {count !== undefined && (
        <span className="text-[11px] font-medium tabular-nums px-1.5 py-0.5 rounded-full" style={{ color: T.muted, background: "rgba(89,82,54,0.07)" }}>
          {count}
        </span>
      )}
    </div>
  );
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState("consultations");
  const customer = MOCK_CUSTOMERS.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: T.muted }}>Customer not found.</p>
        <div className="mt-3 flex justify-center"><BackLink label="Customers" href="/customers" /></div>
      </div>
    );
  }

  const orders = MOCK_ORDERS.filter((o) => o.customerId === customer.id)
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
  const consultations = MOCK_CONSULTATIONS.filter((c) => c.customerId === customer.id)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  const incompleteOrders = MOCK_INCOMPLETE_ORDERS.filter((o) => o.customerId === customer.id)
    .sort((a, b) => new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime());
  const incompleteConsultations = MOCK_INCOMPLETE_CONSULTATIONS.filter((c) => c.customerId === customer.id)
    .sort((a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime());
  const payments = MOCK_PAYMENTS.filter((p) => p.customerId === customer.id);
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);

  return (
    <>
      {/* Back link */}
      <div className="mb-5">
        <BackLink label="Customers" href="/customers" />
      </div>

      {/* Profile Card */}
      <div className="rounded-[14px] mb-6 overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
        <div className="flex flex-wrap items-center gap-5 p-6 pb-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center font-title text-[20px] font-semibold shrink-0"
            style={{ background: `${T.accent}15`, border: `1px solid ${T.accent}35`, color: T.accent }}
          >
            {customer.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-title text-[20px] font-semibold tracking-[-0.015em]" style={{ color: T.text }}>{customer.name}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[13px]" style={{ color: T.muted }}>
              <span className="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5" style={{ color: T.faint }}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                {customer.email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5" style={{ color: T.faint }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span className="tabular-nums">{customer.phone}</span>
              </span>
            </div>
          </div>
          <GhostBtn className="!text-[12px] !h-8 !px-3 shrink-0" onClick={() => { setToast("Customer deactivated"); setTimeout(() => setToast(""), 3000); }}>
            Deactivate
          </GhostBtn>
        </div>
        <div
          className="px-6 py-3"
          style={{ borderTop: `1px solid ${T.borderSoft}`, background: "rgba(89,82,54,0.025)" }}
        >
          <div className="grid grid-cols-3 sm:max-w-[440px]">
          {[
            [String(consultations.length), "Consultations"],
            [String(orders.length), "Orders"],
            [inr(totalSpent), "Total spent"],
          ].map(([v, k], i) => (
            <div key={k} className={i > 0 ? "pl-5" : ""} style={i > 0 ? { borderLeft: `1px solid ${T.borderSoft}` } : undefined}>
              <div className="text-[15px] font-semibold tabular-nums" style={{ color: T.text }}>{v}</div>
              <div className="text-[11px] uppercase tracking-[0.07em] mt-0.5" style={{ color: T.faint }}>{k}</div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Left rail: attributes · Main: full history */}
      <div className="grid lg:grid-cols-[300px_1fr] gap-4 items-start">
        <div className="space-y-4">
          <Card>
            <SectionTitle>Birth details</SectionTitle>
            <div className="space-y-2 text-[13px] mt-3">
              {[
                ["Date", customer.birthDate],
                ["Time", customer.birthTime],
                ["Place", customer.birthPlace],
                ["Rashi", customer.rashi || "—"],
                ["Nakshatra", customer.nakshatra || "—"],
                ["Chart ref", customer.chartRef || "Not generated"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span style={{ color: T.muted }}>{k}</span>
                  <span className="text-right" style={{ color: T.text }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle>Account</SectionTitle>
            <div className="space-y-2 text-[13px] mt-3">
              {[
                ["Payment requests", String(payments.length)],
                ["Affiliate", customer.affiliateCode || "Direct"],
                ["Joined", customer.createdAt],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span style={{ color: T.muted }}>{k}</span>
                  <span className="text-right" style={{ color: T.text }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="min-w-0">
          <Card>
            <div className="mb-3">
              <Tabs
                tabs={[
                  { key: "consultations", label: "Consultations", count: consultations.length },
                  { key: "orders", label: "Orders", count: orders.length },
                  ...(incompleteOrders.length > 0 ? [{ key: "incomplete_orders", label: "Incomplete orders", count: incompleteOrders.length }] : []),
                  ...(incompleteConsultations.length > 0 ? [{ key: "incomplete_consultations", label: "Incomplete consultations", count: incompleteConsultations.length }] : []),
                ]}
                active={activeTab}
                onChange={setActiveTab}
              />
            </div>
            {activeTab === "consultations" && (consultations.length === 0 ? (
              <p className="text-[13px] py-5 text-center" style={{ color: T.faint }}>No consultations yet.</p>
            ) : (
              consultations.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/consultations/${c.id}`}
                  className="flex items-center justify-between gap-4 py-3 row-interactive rounded-[9px] px-2 -mx-2"
                  style={{ borderBottom: i < consultations.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13.5px] font-medium capitalize" style={{ color: T.text }}>{c.type.replace(/_/g, " ")}</span>
                      <span className="text-[11px]" style={{ color: T.faint }}>·</span>
                      <span className="text-[13px]" style={{ color: T.muted }}>{c.expertName}</span>
                    </div>
                    <div className="text-[12px]" style={{ color: T.muted }}>
                      {fmtDate(c.scheduledAt)}
                      <span className="mx-1.5" style={{ color: T.faint }}>·</span>
                      <span className="uppercase tracking-[0.05em] text-[11px]" style={{ color: T.faint }}>{c.id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {c.paymentStatus === "pending" ? (
                      <Chip tone="gold">Payment pending</Chip>
                    ) : c.status === "reschedule_requested" ? (
                      <Chip tone="danger">Reschedule request</Chip>
                    ) : (c.status === "closed" || c.status === "completed") ? (
                      <Chip tone="good">Completed</Chip>
                    ) : (
                      <Chip tone="gold">Scheduled</Chip>
                    )}
                    <span style={{ color: T.faint }}>→</span>
                  </div>
                </Link>
              ))
            ))}
            {activeTab === "orders" && (orders.length === 0 ? (
              <p className="text-[13px] py-5 text-center" style={{ color: T.faint }}>No orders yet.</p>
            ) : (
              orders.map((o, i) => (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="flex items-center justify-between gap-4 py-3 row-interactive rounded-[9px] px-2 -mx-2"
                  style={{ borderBottom: i < orders.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 mb-0.5 min-w-0">
                      <span className="text-[13.5px] font-medium truncate" style={{ color: T.text }}>
                        {o.items[0]?.name}
                      </span>
                      {o.items.length > 1 && <span className="text-[12px] shrink-0" style={{ color: T.faint }}>+{o.items.length - 1} more</span>}
                    </div>
                    <div className="flex items-baseline gap-3 text-[12px]" style={{ color: T.muted }}>
                      <span>Placed {fmtDate(o.placedAt)}</span>
                      <span className="uppercase tracking-[0.05em] text-[11px]" style={{ color: T.faint }}>{o.id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Chip tone={o.shopifyStatus === "fulfilled" ? "good" : o.paymentStatus === "pending" ? "gold" : "muted"}>
                      {o.shopifyStatus === "fulfilled" ? "Delivered" : o.paymentStatus === "pending" ? "Payment pending" : o.tracking ? "In transit" : "In progress"}
                    </Chip>
                    <span className="text-[13.5px] font-semibold tabular-nums w-[90px] text-right" style={{ color: T.text }}>{inr(o.total)}</span>
                    <span style={{ color: T.faint }}>→</span>
                  </div>
                </Link>
              ))
            ))}

            {activeTab === "incomplete_orders" && (incompleteOrders.length === 0 ? (
              <p className="text-[13px] py-5 text-center" style={{ color: T.faint }}>No incomplete orders.</p>
            ) : (
              incompleteOrders.map((o, i) => (
                <Link
                  key={o.id}
                  href={`/inventory?q=${encodeURIComponent(o.itemName.split("—")[0].trim())}`}
                  className="flex items-center justify-between gap-4 py-3 row-interactive rounded-[9px] px-2 -mx-2"
                  style={{ borderBottom: i < incompleteOrders.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13.5px] font-medium truncate" style={{ color: T.text }}>{o.itemName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px]" style={{ color: T.muted }}>
                      <span>{fmtDate(o.failedAt)}</span>
                      {o.paymentAttempts && (
                        <>
                          <span style={{ color: T.faint }}>·</span>
                          <span>{o.paymentAttempts} attempt{o.paymentAttempts > 1 ? "s" : ""}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Chip tone={o.reason === "abandoned_cart" ? "gold" : "danger"}>
                      {o.reason === "payment_failed" ? "Payment failed" : o.reason === "abandoned_cart" ? "Abandoned cart" : o.reason === "payment_expired" ? "Payment expired" : "Card declined"}
                    </Chip>
                    <span className="text-[13.5px] font-semibold tabular-nums w-[90px] text-right" style={{ color: T.text }}>{inr(o.amount)}</span>
                    <span style={{ color: T.faint }}>→</span>
                  </div>
                </Link>
              ))
            ))}

            {activeTab === "incomplete_consultations" && (incompleteConsultations.length === 0 ? (
              <p className="text-[13px] py-5 text-center" style={{ color: T.faint }}>No incomplete consultations.</p>
            ) : (
              incompleteConsultations.map((c, i) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-4 py-3 px-2 -mx-2"
                  style={{ borderBottom: i < incompleteConsultations.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[13.5px] font-medium capitalize" style={{ color: T.text }}>{c.type.replace(/_/g, " ")}</span>
                      <span className="text-[11px]" style={{ color: T.faint }}>·</span>
                      <span className="text-[13px]" style={{ color: T.muted }}>{c.expertName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px]" style={{ color: T.muted }}>
                      <span>{fmtDate(c.viewedAt)}</span>
                      {c.slotDate && (
                        <>
                          <span style={{ color: T.faint }}>·</span>
                          <span>Slot: {fmtDate(c.slotDate)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Chip tone={c.reason === "slot_viewed" ? "muted" : "gold"}>
                      {c.reason === "slot_viewed" ? "Slot viewed" : c.reason === "slot_selected_not_booked" ? "Slot selected, not booked" : c.reason === "payment_abandoned" ? "Payment abandoned" : "Booking timeout"}
                    </Chip>
                  </div>
                </div>
              ))
            ))}
          </Card>
        </div>
      </div>

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
