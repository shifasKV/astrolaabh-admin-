"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, Chip, SearchFilter, Pagination, Select, DateInput, EmptyState } from "@/components/ui";
import { T } from "@/lib/theme";
import { EXPERT_PROFILES, MOCK_CONSULTATIONS } from "@/lib/mock";

const PAGE_SIZE = 10;

type SortKey = "date_desc" | "date_asc";

export default function ExpertConsultationsPage() {
  const { id } = useParams<{ id: string }>();
  const expert = EXPERT_PROFILES.find((e) => e.id === id);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSummary, setFilterSummary] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<SortKey>("date_desc");

  const allConsultations = MOCK_CONSULTATIONS.filter((c) => c.expertId === id);

  const customers = [...new Set(allConsultations.map((c) => c.customerName))].sort();

  const filtered = allConsultations.filter((c) => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.customerName.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q)) return false;
    }
    if (filterStatus) {
      if (filterStatus === "scheduled" && c.status !== "scheduled") return false;
      if (filterStatus === "completed" && c.status !== "closed" && c.status !== "completed") return false;
      if (filterStatus === "payment_pending" && c.paymentStatus !== "pending") return false;
      if (filterStatus === "reschedule" && c.status !== "reschedule_requested") return false;
      if (filterStatus === "summary_pending" && c.status !== "summary_pending") return false;
    }
    if (filterSummary) {
      if (filterSummary === "provided" && !c.summarySubmittedAt) return false;
      if (filterSummary === "pending" && c.summarySubmittedAt) return false;
    }
    if (filterCustomer && c.customerName !== filterCustomer) return false;
    if (dateFrom) {
      const d = new Date(c.scheduledAt);
      if (d < new Date(dateFrom)) return false;
    }
    if (dateTo) {
      const d = new Date(c.scheduledAt);
      if (d > new Date(dateTo + "T23:59:59")) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sort === "date_asc") return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
    return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const statusTone = (s: string) => {
    if (s === "closed" || s === "completed") return "good" as const;
    if (s === "scheduled") return "gold" as const;
    if (s === "summary_pending" || s === "reschedule_requested") return "danger" as const;
    return "muted" as const;
  };

  return (
    <>
      <PageHeader
        title={`Consultations`}
        back={{ label: expert?.name ?? "Profile", href: `/astro-gemologists/${id}` }}
      />

      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex-1 min-w-[200px]">
            <SearchFilter search={search} onSearchChange={(v) => { setSearch(v); setPage(0); }} placeholder="Search customer, ID…" />
          </div>
          <Select
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setPage(0); }}
            compact
            placeholder="Status: All"
            prefix="Status: "
            options={[
              { value: "", label: "All" },
              { value: "scheduled", label: "Scheduled" },
              { value: "completed", label: "Completed" },
              { value: "payment_pending", label: "Payment Pending" },
              { value: "reschedule", label: "Reschedule" },
              { value: "summary_pending", label: "Summary Pending" },
            ]}
            className="w-[200px]"
          />
          <Select
            value={filterSummary}
            onChange={(v) => { setFilterSummary(v); setPage(0); }}
            compact
            placeholder="Summary: All"
            prefix="Summary: "
            options={[
              { value: "", label: "All" },
              { value: "provided", label: "Provided" },
              { value: "pending", label: "Pending" },
            ]}
            className="w-[170px]"
          />
          <Select
            value={filterCustomer}
            onChange={(v) => { setFilterCustomer(v); setPage(0); }}
            compact
            placeholder="Customer: All"
            prefix="Customer: "
            options={[
              { value: "", label: "All" },
              ...customers.map((c) => ({ value: c, label: c })),
            ]}
            className="w-[190px]"
          />
          <DateInput value={dateFrom} onChange={(v) => { setDateFrom(v); setPage(0); }} label="From" />
          <DateInput value={dateTo} onChange={(v) => { setDateTo(v); setPage(0); }} label="To" />
          <div className="flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-[12px]" style={{ border: `1px solid ${T.borderSoft}`, color: T.muted }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M6 12h12M9 18h6"/></svg>
            <Select
              value={sort}
              onChange={(val) => { setSort(val as SortKey); setPage(0); }}
              compact
              options={[
                { value: "date_desc", label: "Newest" },
                { value: "date_asc", label: "Oldest" },
              ]}
              className="w-[80px]"
            />
          </div>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_130px_130px_100px] gap-3 py-2.5 px-2 text-[11px] uppercase tracking-wider min-w-[500px]" style={{ color: T.faint, borderBottom: `1px solid ${T.border}` }}>
          <span>Customer</span>
          <span>Date</span>
          <span>Summary</span>
          <span>Status</span>
        </div>

        {paginated.length === 0 ? (
          <EmptyState inline icon="inbox" title="No consultations" description="No consultations to show." />
        ) : (
          paginated.map((c) => (
            <Link
              key={c.id}
              href={`/consultations/${c.id}`}
              className="group grid grid-cols-[1fr_130px_130px_100px] gap-3 items-center py-3 px-2 rounded-[9px] row-interactive min-w-[500px]"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ background: `${T.accent}10`, color: T.accent }}>
                  {c.customerName[0]}
                </span>
                <span className="text-[13.5px] font-medium truncate" style={{ color: T.text }}>{c.customerName}</span>
              </div>
              <span className="text-[12px] tabular-nums" style={{ color: T.muted }}>
                {new Date(c.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
              <div>
                {c.summarySubmittedAt ? (
                  <Chip tone="good">Provided</Chip>
                ) : (
                  <Chip tone="danger">Pending</Chip>
                )}
              </div>
              <div>
                {c.paymentStatus === "pending" ? (
                  <Chip tone="gold">Payment pending</Chip>
                ) : (c.status === "closed" || c.status === "completed") ? (
                  <Chip tone="good">Completed</Chip>
                ) : (
                  <Chip tone={statusTone(c.status)}>{c.status.replace(/_/g, " ")}</Chip>
                )}
              </div>
            </Link>
          ))
        )}

        </div>
        <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} perPage={PAGE_SIZE} onPageChange={setPage} />
      </Card>
    </>
  );
}
