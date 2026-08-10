"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Tabs, SearchFilter, GoldBtn, Select } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CONSULTATIONS } from "@/lib/mock";

const TABS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "reschedule", label: "Reschedule request" },
  { key: "summary_due", label: "Summary due" },
];

type SortKey = "scheduled_desc" | "scheduled_asc";

function filterByTab(c: typeof MOCK_CONSULTATIONS[number], tab: string): boolean {
  if (tab === "upcoming") return c.status === "scheduled" && c.paymentStatus === "paid";
  if (tab === "payment_pending") return c.paymentStatus === "pending";
  if (tab === "link_pending") return c.status === "scheduled" && !c.meetingLink;
  if (tab === "reschedule") return c.status === "reschedule_requested";
  if (tab === "summary_due") return c.status === "summary_pending";
  if (tab === "completed") return c.status === "closed" || c.status === "completed";
  return true;
}

export default function ConsultationsPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("scheduled_desc");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterExpert, setFilterExpert] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const uniqueCustomers = [...new Set(MOCK_CONSULTATIONS.map((c) => c.customerName))];
  const uniqueExperts = [...new Set(MOCK_CONSULTATIONS.map((c) => c.expertName))];

  const filtered = MOCK_CONSULTATIONS.filter((c) => filterByTab(c, tab))
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.customerName.toLowerCase().includes(q) || c.expertName.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    })
    .filter((c) => {
      if (filterCustomer && c.customerName !== filterCustomer) return false;
      if (filterExpert && c.expertName !== filterExpert) return false;
      if (filterStatus === "payment_pending" && c.paymentStatus !== "pending") return false;
      if (filterStatus === "scheduled" && c.status !== "scheduled") return false;
      if (filterStatus === "completed" && c.status !== "closed" && c.status !== "completed") return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "scheduled_desc") return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
      if (sort === "scheduled_asc") return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      return 0;
    });

  const statusTone = (s: string) => {
    if (s === "closed" || s === "completed") return "good" as const;
    if (s === "scheduled") return "gold" as const;
    if (s === "summary_pending" || s === "reschedule_requested") return "danger" as const;
    if (s === "no_show" || s === "cancelled") return "muted" as const;
    return "muted" as const;
  };

  return (
    <>
      <PageHeader
        title="Consultations"
        sub="Full consultation lifecycle — appointments, summaries, recommendations"
        action={
          <div className="flex items-center gap-2.5">
            <Link href="/consultations/create"><GoldBtn>+ New consultation</GoldBtn></Link>
          </div>
        }
      />

      <div className="mb-4">
        <Tabs
          tabs={TABS.map((t) => ({
            ...t,
            count: MOCK_CONSULTATIONS.filter((c) => filterByTab(c, t.key)).length,
          }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex-1 min-w-[200px]">
            <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search customer, expert, consultation ID…" />
          </div>
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            compact
            placeholder="Status: All"
            prefix="Status: "
            options={[
              { value: "", label: "All" },
              { value: "payment_pending", label: "Payment pending" },
              { value: "scheduled", label: "Scheduled" },
              { value: "completed", label: "Completed" },
            ]}
            className="w-[185px]"
          />
          <Select
            value={filterCustomer}
            onChange={setFilterCustomer}
            searchable
            compact
            placeholder="All customers"
            options={[
              { value: "", label: "All customers" },
              ...uniqueCustomers.map((name) => ({ value: name, label: name })),
            ]}
            className="w-[170px]"
          />
          <Select
            value={filterExpert}
            onChange={setFilterExpert}
            compact
            placeholder="All experts"
            options={[
              { value: "", label: "All experts" },
              ...uniqueExperts.map((name) => ({ value: name, label: name })),
            ]}
            className="w-[170px]"
          />
          <div className="flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-[12px]" style={{ border: `1px solid ${T.borderSoft}`, color: T.muted }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M6 12h12M9 18h6"/></svg>
            <Select
              value={sort}
              onChange={(val) => setSort(val as SortKey)}
              compact
              options={[
                { value: "scheduled_desc", label: "Newest" },
                { value: "scheduled_asc", label: "Soonest" },
              ]}
              className="w-[110px]"
            />
          </div>
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <p className="text-[13px] text-center py-6" style={{ color: T.muted }}>No consultations match.</p>
        ) : (
          filtered.map((c) => (
            <Link
              key={c.id}
              href={`/consultations/${c.id}`}
              className="flex items-center justify-between gap-4 py-3.5 row-interactive rounded-[9px] px-2 -mx-2"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] tracking-[0.06em] uppercase" style={{ color: T.accent }}>{c.id}</span>
                  <span className="text-[11px]" style={{ color: T.faint }}>·</span>
                  <span className="text-[13px] font-medium" style={{ color: T.text }}>{c.customerName}</span>
                  {c.status === "reschedule_requested" && <Chip tone="danger">Reschedule request</Chip>}
                  {c.status === "summary_pending" && <Chip tone="danger">Summary due</Chip>}
                </div>
                <div className="text-[12px]" style={{ color: T.muted }}>{c.expertName}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {c.paymentStatus === "pending" ? (
                  <Chip tone="gold">Payment pending</Chip>
                ) : (c.status === "closed" || c.status === "completed") ? (
                  <Chip tone="good">Completed</Chip>
                ) : (
                  <Chip tone="gold">Scheduled</Chip>
                )}
                <div className="text-[11px] tabular-nums" style={{ color: T.faint }}>
                  {new Date(c.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </div>
              </div>
            </Link>
          ))
        )}
      </Card>
    </>
  );
}
