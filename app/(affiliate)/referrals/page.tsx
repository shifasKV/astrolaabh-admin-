"use client";
import { useState } from "react";
import { PageHeader, Card, Chip, Tabs, SearchFilter } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_REFERRAL_EVENTS } from "@/lib/mock";
import { inr } from "@/lib/types";

const TABS = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders" },
  { key: "bookings", label: "Bookings" },
  { key: "clicks", label: "Clicks" },
];

export default function ReferralsPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const myReferrals = MOCK_REFERRAL_EVENTS.filter((r) => r.affiliateId === "aff_001");

  const filtered = myReferrals.filter((r) => {
    if (tab === "orders") return r.eventType === "order";
    if (tab === "bookings") return r.eventType === "booking";
    if (tab === "clicks") return r.eventType === "click";
    return true;
  }).filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.maskedCustomer?.toLowerCase().includes(q) || r.campaign?.toLowerCase().includes(q);
  });

  return (
    <>
      <PageHeader title="Referrals & conversions" sub="Track how your links perform from click through commission" />

      <div className="mb-4">
        <Tabs tabs={TABS.map((t) => ({ ...t, count: myReferrals.filter((r) => t.key === "all" ? true : r.eventType === (t.key === "orders" ? "order" : t.key === "bookings" ? "booking" : "click")).length }))} active={tab} onChange={setTab} />
      </div>

      <div className="mb-4">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search customer, campaign…" />
      </div>

      <Card>
        {filtered.length === 0 ? (
          <p className="text-[13px] text-center py-6" style={{ color: T.muted }}>No referrals in this view.</p>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-1.5 py-0.5 rounded capitalize" style={{ background: T.bg, color: T.muted }}>{r.eventType}</span>
                  <span className="text-[11.5px]" style={{ color: T.faint }}>{r.eventDate}</span>
                  {r.campaign && <span className="text-[11px]" style={{ color: T.muted }}>{r.campaign}</span>}
                </div>
                {r.maskedCustomer && <div className="text-[13px] mt-0.5" style={{ color: T.text }}>{r.maskedCustomer}</div>}
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                {r.orderValue && <span className="text-[12px] tabular-nums" style={{ color: T.muted }}>Order {inr(r.orderValue)}</span>}
                {r.commissionStatus && (
                  <Chip tone={r.commissionStatus === "paid" ? "good" : r.commissionStatus === "approved" || r.commissionStatus === "payable" ? "gold" : "muted"}>
                    {r.commissionStatus}
                  </Chip>
                )}
                {r.commissionAmount && <span className="text-[12.5px] font-semibold tabular-nums" style={{ color: T.accent }}>{inr(r.commissionAmount)}</span>}
              </div>
            </div>
          ))
        )}
      </Card>
    </>
  );
}
