"use client";
import { use, useState } from "react";
import Link from "next/link";
import { Card, Chip, SectionLink, GhostBtn } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CUSTOMERS, MOCK_ORDERS, MOCK_CONSULTATIONS, MOCK_PAYMENTS } from "@/lib/mock";
import { inr } from "@/lib/types";

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [toast, setToast] = useState("");
  const customer = MOCK_CUSTOMERS.find((c) => c.id === id);

  if (!customer) {
    return (
      <div className="py-20 text-center">
        <p className="text-[14px]" style={{ color: T.muted }}>Customer not found.</p>
        <Link href="/customers" className="text-[12.5px] mt-2 inline-block" style={{ color: T.accent }}>← Back</Link>
      </div>
    );
  }

  const orders = MOCK_ORDERS.filter((o) => o.customerId === customer.id);
  const consultations = MOCK_CONSULTATIONS.filter((c) => c.customerId === customer.id);
  const payments = MOCK_PAYMENTS.filter((p) => p.customerId === customer.id);

  return (
    <>
      {/* Back link */}
      <div className="mb-5">
        <Link href="/customers" className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:opacity-80 transition-opacity duration-200" style={{ color: T.accent }}>
          ← Customers
        </Link>
      </div>

      {/* Profile Card */}
      <div className="rounded-[14px] p-6 mb-6" style={{ background: `linear-gradient(135deg, ${T.card} 0%, ${T.panel} 100%)`, border: `1px solid ${T.border}` }}>
        <div className="flex flex-wrap items-start gap-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-bold shrink-0"
            style={{ background: `${T.accent}15`, border: `2px solid ${T.accent}40`, color: T.accent }}
          >
            {customer.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-[17px] font-semibold" style={{ color: T.text }}>{customer.name}</span>
            </div>
            <div className="text-[13px] mt-1" style={{ color: T.muted }}>{customer.email} · {customer.phone}</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-4 text-[12px] mr-3" style={{ color: T.faint }}>
              <div className="text-center">
                <div className="text-[15px] font-semibold" style={{ color: T.text }}>{orders.length}</div>
                <div className="text-[10px] uppercase tracking-wider">Orders</div>
              </div>
              <div className="text-center">
                <div className="text-[15px] font-semibold" style={{ color: T.text }}>{consultations.length}</div>
                <div className="text-[10px] uppercase tracking-wider">Consults</div>
              </div>
            </div>
            <GhostBtn className="!text-[11.5px] !h-8 !px-3" onClick={() => { setToast("Customer deactivated"); setTimeout(() => setToast(""), 3000); }}>
              Deactivate
            </GhostBtn>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        {/* Birth details */}
        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Birth details</div>
          <div className="space-y-2 text-[12.5px]">
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
                <span style={{ color: T.text }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Summary stats */}
        <Card>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Activity</div>
          <div className="space-y-2 text-[12.5px]">
            {[
              ["Consultations", String(consultations.length)],
              ["Orders", String(orders.length)],
              ["Total spent", inr(orders.reduce((s, o) => s + o.total, 0))],
              ["Payment requests", String(payments.length)],
              ["Affiliate", customer.affiliateCode || "Direct"],
              ["Joined", customer.createdAt],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2">
                <span style={{ color: T.muted }}>{k}</span>
                <span style={{ color: T.text }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Consultations */}
      {consultations.length > 0 && (
        <Card className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Consultations</span>
            <SectionLink href={`/consultations?customer=${encodeURIComponent(customer.name)}`} />
          </div>
          {consultations.slice(0, 3).map((c) => (
            <Link key={c.id} href={`/consultations/${c.id}`} className="flex items-center justify-between gap-4 py-3 row-interactive rounded-[9px] px-2 -mx-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] tracking-[0.06em] uppercase" style={{ color: T.accent }}>{c.id}</span>
                  <span className="text-[11px]" style={{ color: T.faint }}>·</span>
                  <span className="text-[13px] font-medium" style={{ color: T.text }}>{c.expertName}</span>
                </div>
                <div className="text-[12px]" style={{ color: T.muted }}>
                  {new Date(c.scheduledAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {c.paymentStatus === "pending" ? (
                  <Chip tone="gold">Payment pending</Chip>
                ) : (c.status === "closed" || c.status === "completed") ? (
                  <Chip tone="good">Completed</Chip>
                ) : (
                  <Chip tone="gold">Scheduled</Chip>
                )}
              </div>
            </Link>
          ))}
        </Card>
      )}

      {/* Orders */}
      {orders.length > 0 && (
        <Card className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Orders</span>
            <SectionLink href={`/orders?customer=${encodeURIComponent(customer.name)}`} />
          </div>
          {orders.slice(0, 3).map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center justify-between gap-4 py-3 row-interactive rounded-[9px] px-2 -mx-2" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] tracking-[0.06em] uppercase" style={{ color: T.accent }}>{o.id}</span>
                  <span className="text-[11px]" style={{ color: T.faint }}>·</span>
                  <span className="text-[13px] font-medium" style={{ color: T.text }}>{o.items[0]?.name}</span>
                </div>
                <div className="text-[12px]" style={{ color: T.muted }}>
                  Placed {new Date(o.placedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Chip tone={o.shopifyStatus === "fulfilled" ? "good" : o.paymentStatus === "pending" ? "gold" : "muted"}>
                  {o.shopifyStatus === "fulfilled" ? "Delivered" : o.paymentStatus === "pending" ? "Payment pending" : "In progress"}
                </Chip>
                <span className="text-[13px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(o.total)}</span>
              </div>
            </Link>
          ))}
        </Card>
      )}

      {toast && (
        <div
          className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13px] font-medium animate-in"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
