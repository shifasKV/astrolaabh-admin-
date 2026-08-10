"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Tabs, SearchFilter, GoldBtn } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_PAYMENTS } from "@/lib/mock";
import { inr } from "@/lib/types";

const TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paid", label: "Paid" },
  { key: "expired", label: "Expired/Cancelled" },
];

export default function PaymentsPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = MOCK_PAYMENTS.filter((p) => {
    if (tab === "active") return p.status === "sent" || p.status === "opened" || p.status === "draft";
    if (tab === "paid") return p.status === "paid";
    if (tab === "expired") return p.status === "expired" || p.status === "cancelled" || p.status === "failed";
    return true;
  }).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.customerName.toLowerCase().includes(q) || p.purpose.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
  });

  const statusTone = (s: string) => {
    if (s === "paid") return "good" as const;
    if (s === "sent" || s === "opened") return "gold" as const;
    if (s === "expired" || s === "failed" || s === "cancelled") return "danger" as const;
    return "muted" as const;
  };

  return (
    <>
      <PageHeader
        title="Payment requests"
        sub="Generate and track payment links for consultations and stone purchases"
        action={<Link href="/payments/create"><GoldBtn>+ New request</GoldBtn></Link>}
      />

      <div className="mb-4">
        <Tabs
          tabs={TABS.map((t) => ({ ...t, count: filtered.length }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="mb-4">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search customer, purpose…" />
      </div>

      <Card>
        {filtered.length === 0 ? (
          <p className="text-[13px] text-center py-6" style={{ color: T.muted }}>No payment requests match.</p>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] tracking-[0.06em] uppercase" style={{ color: T.accent }}>{p.id}</span>
                  <span className="text-[11px]" style={{ color: T.faint }}>{p.createdAt}</span>
                </div>
                <div className="text-[13.5px] font-medium mt-0.5" style={{ color: T.text }}>{p.customerName}</div>
                <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{p.purpose}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Chip tone={statusTone(p.status)}>{p.status}</Chip>
                <span className="text-[14px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(p.amount)}</span>
              </div>
            </div>
          ))
        )}
      </Card>
    </>
  );
}
