"use client";
import { use, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Card, Chip, GhostBtn, BackLink, Tabs, Pagination, Toast, ConfirmDialog, CopyableContact } from "@/components/ui";
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
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [activeTab, setActiveTab] = useState("consultations");
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const [consPage, setConsPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [incOrdersPage, setIncOrdersPage] = useState(1);
  const [incConsPage, setIncConsPage] = useState(1);
  const PER_PAGE = 5;
  const customer = MOCK_CUSTOMERS.find((c) => c.id === id);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) setShowActionMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const payments = MOCK_PAYMENTS.filter((p) => p.customerId === customer.id);
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      {/* Back link */}
      <div className="mb-4">
        <BackLink label="Customers" href="/customers" />
      </div>

      {/* Profile Card */}
      <div className="rounded-[16px] mb-4 overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
        <div className="flex flex-wrap items-center gap-5 p-6 pb-5">
          <div
            className="w-14 h-14 rounded-[16px] flex items-center justify-center font-title text-[20px] font-semibold shrink-0"
            style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}
          >
            {customer.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-title text-[20px] font-semibold tracking-[-0.015em]" style={{ color: T.text }}>{customer.name}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[13px]" style={{ color: T.muted }}>
              <CopyableContact type="email" value={customer.email} onCopied={(msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); }} />
              <CopyableContact type="phone" value={customer.phone} onCopied={(msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); }} />
            </div>
          </div>
          <div className="relative shrink-0" ref={actionMenuRef}>
            <button
              type="button"
              onClick={() => setShowActionMenu((v) => !v)}
              className="w-9 h-9 rounded-[9px] flex items-center justify-center transition-colors hover:bg-[rgba(89,82,54,0.08)] cursor-pointer"
              style={{ border: `1px solid ${T.border}`, color: T.muted }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </button>
            {showActionMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 w-[180px] rounded-[10px] py-1.5 shadow-lg" style={{ background: T.popover, border: `1px solid ${T.border}` }}>
                <button
                  onClick={() => { setShowActionMenu(false); setConfirmDeactivate(true); }}
                  className="w-full text-left px-3.5 py-2.5 text-[13px] transition-colors cursor-pointer hover:bg-[rgba(119,123,98,0.08)]"
                  style={{ color: T.danger }}
                >
                  Deactivate
                </button>
              </div>
            )}
          </div>
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
      <div className="grid lg:grid-cols-[300px_1fr] gap-4 items-start md:flex-1 md:min-h-0">
        <div className="space-y-4">
          <Card className="!p-5">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4" style={{ color: T.text }}>Birth details</h2>
            <div className="space-y-3">
              {[
                ["Date", customer.birthDate],
                ["Time", customer.birthTime],
                ["Place", customer.birthPlace],
                ["Rashi", customer.rashi || "—"],
                ["Nakshatra", customer.nakshatra || "—"],
                ["Chart ref", customer.chartRef || "Not generated"],
              ].map(([k, v], i, arr) => (
                <div key={k} className={`flex items-baseline justify-between gap-3 ${i < arr.length - 1 ? "pb-3" : ""}`} style={i < arr.length - 1 ? { borderBottom: `1px solid ${T.borderSoft}` } : undefined}>
                  <span className="text-[11px] font-medium tracking-[0.06em] uppercase shrink-0" style={{ color: T.faint }}>{k}</span>
                  <span className="text-[13px] font-medium text-right tabular-nums" style={{ color: T.text }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="!p-5">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4" style={{ color: T.text }}>Account</h2>
            <div className="space-y-3">
              {[
                ["Payment requests", String(payments.length), false],
                ["Affiliate", customer.affiliateCode || "Direct", !!customer.affiliateCode],
                ["Joined", customer.createdAt, false],
              ].map(([k, v, accent], i, arr) => (
                <div key={k as string} className={`flex items-baseline justify-between gap-3 ${i < arr.length - 1 ? "pb-3" : ""}`} style={i < arr.length - 1 ? { borderBottom: `1px solid ${T.borderSoft}` } : undefined}>
                  <span className="text-[11px] font-medium tracking-[0.06em] uppercase shrink-0" style={{ color: T.faint }}>{k}</span>
                  <span className="text-[13px] font-medium text-right tabular-nums" style={{ color: accent ? T.accent : T.text }}>{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="min-w-0">
          <Card className="!p-0 md:flex md:flex-col md:min-h-0">
            <div className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
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
              <p className="text-[13px] py-10 text-center" style={{ color: T.faint }}>No consultations yet.</p>
            ) : (
              <>
                {consultations.slice((consPage - 1) * PER_PAGE, consPage * PER_PAGE).map((c, i, arr) => (
                  <Link
                    key={c.id}
                    href={`/consultations/${c.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-2.5 transition-colors even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
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
                        <Chip tone="gold">Reschedule request</Chip>
                      ) : (c.status === "closed" || c.status === "completed") ? (
                        <Chip tone="good">Completed</Chip>
                      ) : (
                        <Chip tone="gold">Scheduled</Chip>
                      )}
                    </div>
                  </Link>
                ))}
                {consultations.length > PER_PAGE && (
                  <div className="px-5 py-3">
                    <Pagination page={consPage - 1} totalPages={Math.ceil(consultations.length / PER_PAGE)} onPageChange={(p) => setConsPage(p + 1)} perPage={PER_PAGE} totalItems={consultations.length} />
                  </div>
                )}
              </>
            ))}
            {activeTab === "orders" && (orders.length === 0 ? (
              <p className="text-[13px] py-10 text-center" style={{ color: T.faint }}>No orders yet.</p>
            ) : (
              <>
                {orders.slice((ordersPage - 1) * PER_PAGE, ordersPage * PER_PAGE).map((o, i, arr) => (
                  <Link
                    key={o.id}
                    href={`/orders/${o.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-2.5 transition-colors even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
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
                    </div>
                  </Link>
                ))}
                {orders.length > PER_PAGE && (
                  <div className="px-5 py-3">
                    <Pagination page={ordersPage - 1} totalPages={Math.ceil(orders.length / PER_PAGE)} onPageChange={(p) => setOrdersPage(p + 1)} perPage={PER_PAGE} totalItems={orders.length} />
                  </div>
                )}
              </>
            ))}

            {activeTab === "incomplete_orders" && (incompleteOrders.length === 0 ? (
              <p className="text-[13px] py-10 text-center" style={{ color: T.faint }}>No incomplete orders.</p>
            ) : (
              <>
                {incompleteOrders.slice((incOrdersPage - 1) * PER_PAGE, incOrdersPage * PER_PAGE).map((o, i, arr) => (
                  <Link
                    key={o.id}
                    href={`/orders/incomplete/${o.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-2.5 transition-colors even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
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
                      <Chip tone={o.reason === "abandoned_cart" || o.reason === "requested_call" ? "gold" : "danger"}>
                        {o.reason === "payment_failed" ? "Payment failed" : o.reason === "abandoned_cart" ? "Abandoned cart" : o.reason === "payment_expired" ? "Payment expired" : o.reason === "requested_call" ? "Requested call" : "Card declined"}
                      </Chip>
                      <span className="text-[13.5px] font-semibold tabular-nums w-[90px] text-right" style={{ color: T.text }}>{inr(o.amount)}</span>
                    </div>
                  </Link>
                ))}
                {incompleteOrders.length > PER_PAGE && (
                  <div className="px-5 py-3">
                    <Pagination page={incOrdersPage - 1} totalPages={Math.ceil(incompleteOrders.length / PER_PAGE)} onPageChange={(p) => setIncOrdersPage(p + 1)} perPage={PER_PAGE} totalItems={incompleteOrders.length} />
                  </div>
                )}
              </>
            ))}

            {activeTab === "incomplete_consultations" && (incompleteConsultations.length === 0 ? (
              <p className="text-[13px] py-10 text-center" style={{ color: T.faint }}>No incomplete consultations.</p>
            ) : (
              <>
                {incompleteConsultations.slice((incConsPage - 1) * PER_PAGE, incConsPage * PER_PAGE).map((c, i, arr) => (
                  <Link
                    key={c.id}
                    href={`/consultations/incomplete/${c.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-2.5 transition-colors even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[13.5px] font-medium" style={{ color: T.text }}>{c.expertName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px]" style={{ color: T.muted }}>
                        <span>{fmtDate(c.date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <Chip tone={c.reason === "payment_failed" ? "danger" : c.reason === "requested_call" ? "gold" : "muted"}>
                        {c.reason === "slot_check" ? "Slot check" : c.reason === "payment_failed" ? "Payment failed" : "Requested call"}
                      </Chip>
                    </div>
                  </Link>
                ))}
                {incompleteConsultations.length > PER_PAGE && (
                  <div className="px-5 py-3">
                    <Pagination page={incConsPage - 1} totalPages={Math.ceil(incompleteConsultations.length / PER_PAGE)} onPageChange={(p) => setIncConsPage(p + 1)} perPage={PER_PAGE} totalItems={incompleteConsultations.length} />
                  </div>
                )}
              </>
            ))}
          </Card>
        </div>
      </div>

      {toast && <Toast message={toast} />}

      <ConfirmDialog
        open={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={() => { setToast("Customer deactivated"); setTimeout(() => setToast(""), 3000); }}
        title={`Deactivate ${customer.name}?`}
        message="They'll lose portal access until reactivated."
        confirmLabel="Deactivate"
        tone="danger"
      />
      </div>
    </>
  );
}
