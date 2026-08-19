"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Select, Pagination, fmtChipDate, ToolbarSearch, FiltersPopover, FilterField, FilterChip, DateRangeFields, ColumnStatusFilter, EmptyState, TableSkeleton, Toast, MobileListCard, Monogram, MobileToolbar, SheetSection } from "@/components/ui";
import { T } from "@/lib/theme";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import { MOCK_PAYMENTS } from "@/lib/mock";
import { inr } from "@/lib/types";

const STATUS_FILTER_LABEL: Record<string, string> = {
  paid: "Paid",
  pending: "Pending",
  expired: "Expired",
};

function matchesStatus(p: (typeof MOCK_PAYMENTS)[number], status: string) {
  if (!status) return true;
  if (status === "paid") return p.status === "paid";
  if (status === "pending") return p.status === "sent" || p.status === "opened" || p.status === "draft";
  if (status === "expired") return p.status === "expired" || p.status === "cancelled" || p.status === "failed";
  return true;
}

function getDisplayStatus(status: string) {
  if (status === "paid") return "Paid";
  if (status === "sent" || status === "opened" || status === "draft") return "Pending";
  return "Expired";
}

function getStatusTone(status: string) {
  if (status === "paid") return "good" as const;
  if (status === "sent" || status === "opened" || status === "draft") return "gold" as const;
  return "danger" as const;
}

function getItemName(p: typeof MOCK_PAYMENTS[0]) {
  const purpose = p.purpose;
  if (p.linkedOrderId) {
    const match = purpose.match(/—\s*(.+)/);
    return match ? match[1].trim() : purpose;
  }
  if (p.linkedAppointmentId) {
    const match = purpose.match(/—\s*(.+)/);
    return match ? match[1].trim() : purpose;
  }
  return purpose;
}

export default function PaymentsPage() {
  const loading = useSimulatedLoad();
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  // Filters
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterType, setFilterType] = useState<"" | "order" | "consultation">("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount_high" | "amount_low">("newest");
  const [showFilters, setShowFilters] = useState(false);

  const uniqueCustomers = Array.from(new Set(MOCK_PAYMENTS.map((p) => p.customerName))).sort();

  const filtered = MOCK_PAYMENTS.filter((p) => matchesStatus(p, filterStatus)).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return p.customerName.toLowerCase().includes(q) || p.purpose.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.transactionRef?.toLowerCase().includes(q));
  }).filter((p) => {
    if (filterCustomer && p.customerName !== filterCustomer) return false;
    if (filterType === "order" && !p.linkedOrderId) return false;
    if (filterType === "consultation" && !p.linkedAppointmentId) return false;
    if (filterDateFrom || filterDateTo) {
      const pDate = p.paidAt || p.createdAt;
      const dateOnly = pDate.slice(0, 10);
      if (filterDateFrom && dateOnly < filterDateFrom) return false;
      if (filterDateTo && dateOnly > filterDateTo) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "newest") {
      const dateA = a.paidAt || a.updatedAt;
      const dateB = b.paidAt || b.updatedAt;
      return dateB.localeCompare(dateA);
    }
    if (sortBy === "oldest") {
      const dateA = a.paidAt || a.updatedAt;
      const dateB = b.paidAt || b.updatedAt;
      return dateA.localeCompare(dateB);
    }
    if (sortBy === "amount_high") return b.amount - a.amount;
    if (sortBy === "amount_low") return a.amount - b.amount;
    return 0;
  });

  const hasActiveFilters = !!filterCustomer || !!filterDateFrom || !!filterDateTo || !!filterType || !!filterStatus;
  const activeFilterCount = [filterCustomer, filterType, filterStatus, filterDateFrom || filterDateTo].filter(Boolean).length;
  const statusOptions = [
    { value: "", label: "All statuses", count: MOCK_PAYMENTS.length },
    ...Object.entries(STATUS_FILTER_LABEL).map(([value, label]) => ({
      value,
      label,
      count: MOCK_PAYMENTS.filter((p) => matchesStatus(p, value)).length,
    })),
  ];

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const formatTime = (dateStr: string | undefined) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const paidTotal = MOCK_PAYMENTS.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);
  const pendingTotal = MOCK_PAYMENTS.filter((p) => p.status === "sent" || p.status === "opened" || p.status === "draft").reduce((sum, p) => sum + p.amount, 0);

  const PER_PAGE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <PageHeader
        title="Payments"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total collected", value: inr(paidTotal), color: T.good },
          { label: "Pending", value: inr(pendingTotal), color: T.accent },
          { label: "Transactions", value: String(MOCK_PAYMENTS.filter((p) => p.status === "paid").length), color: T.text },
          { label: "Active links", value: String(MOCK_PAYMENTS.filter((p) => p.status === "sent" || p.status === "opened").length), color: T.accent },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-[16px] p-4"
            style={
              s.label === "Total collected"
                ? { background: "linear-gradient(160deg, #faf0d8 0%, #efdfb8 100%)", border: "1px solid rgba(160,125,56,0.35)", boxShadow: T.shadow }
                : { background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }
            }
          >
            <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: s.label === "Total collected" ? "#8a6a2f" : T.faint }}>{s.label}</div>
            <div className="text-[18px] font-semibold tabular-nums" style={{ color: s.label === "Total collected" ? T.text : s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Mobile: single collapsed toolbar row (filters sheet + expanding search + sort) */}
      <MobileToolbar
        className="sm:hidden"
        filterCount={activeFilterCount}
        onClearAll={() => { setFilterCustomer(""); setFilterType(""); setFilterStatus(""); setFilterDateFrom(""); setFilterDateTo(""); setPage(1); }}
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search customer, purpose, transaction ref…"
        sort={
          <div className="w-[170px]">
            <Select
              value={sortBy}
              onChange={(v) => { setSortBy(v as typeof sortBy); setPage(1); }}
              compact
              prefix="Sort: "
              options={[
                { value: "newest", label: "Newest first" },
                { value: "oldest", label: "Oldest first" },
                { value: "amount_high", label: "Amount: high to low" },
                { value: "amount_low", label: "Amount: low to high" },
              ]}
            />
          </div>
        }
        filters={
          <>
            <SheetSection label="Customer">
              <Select
                value={filterCustomer}
                onChange={(v) => { setFilterCustomer(v); setPage(1); }}
                compact
                searchable
                placeholder="All customers"
                options={[{ value: "", label: "All customers" }, ...uniqueCustomers.map((name) => ({ value: name, label: name }))]}
              />
            </SheetSection>
            <SheetSection label="Type">
              <Select
                value={filterType}
                onChange={(v) => { setFilterType(v as typeof filterType); setPage(1); }}
                compact
                placeholder="All types"
                options={[
                  { value: "", label: "All types" },
                  { value: "order", label: "Orders" },
                  { value: "consultation", label: "Consultations" },
                ]}
              />
            </SheetSection>
            <SheetSection label="Status">
              <Select
                value={filterStatus}
                onChange={(v) => { setFilterStatus(v); setPage(1); }}
                compact
                placeholder="All statuses"
                options={[{ value: "", label: "All statuses" }, ...Object.entries(STATUS_FILTER_LABEL).map(([k, v]) => ({ value: k, label: v }))]}
              />
            </SheetSection>
            <SheetSection label="Date between">
              <DateRangeFields from={filterDateFrom} to={filterDateTo} onChange={(f, t) => { setFilterDateFrom(f); setFilterDateTo(t); setPage(1); }} />
            </SheetSection>
          </>
        }
      />

      {/* Pinned controls — search, filters, sort */}
      <div className="hidden sm:flex flex-wrap items-center gap-2 mb-3">
        <ToolbarSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search customer, purpose, transaction ref…" />
        <div className="ml-auto flex items-center gap-2">
          <FiltersPopover count={activeFilterCount} open={showFilters} onToggle={() => setShowFilters(!showFilters)}>
            <FilterField label="Customer">
              <Select
                value={filterCustomer}
                onChange={(v) => { setFilterCustomer(v); setPage(1); }}
                compact
                searchable
                placeholder="All customers"
                options={[{ value: "", label: "All customers" }, ...uniqueCustomers.map((name) => ({ value: name, label: name }))]}
              />
            </FilterField>
            <FilterField label="Type">
              <Select
                value={filterType}
                onChange={(v) => { setFilterType(v as typeof filterType); setPage(1); }}
                compact
                placeholder="All types"
                options={[
                  { value: "", label: "All types" },
                  { value: "order", label: "Orders" },
                  { value: "consultation", label: "Consultations" },
                ]}
              />
            </FilterField>
            <FilterField label="Status">
              <Select
                value={filterStatus}
                onChange={(v) => { setFilterStatus(v); setPage(1); }}
                compact
                placeholder="All statuses"
                options={[{ value: "", label: "All statuses" }, ...Object.entries(STATUS_FILTER_LABEL).map(([k, v]) => ({ value: k, label: v }))]}
              />
            </FilterField>
            <FilterField label="Date between">
              <DateRangeFields from={filterDateFrom} to={filterDateTo} onChange={(f, t) => { setFilterDateFrom(f); setFilterDateTo(t); setPage(1); }} />
            </FilterField>
          </FiltersPopover>
          <div className="w-[170px]">
            <Select
              value={sortBy}
              onChange={(v) => { setSortBy(v as typeof sortBy); setPage(1); }}
              compact
              prefix="Sort: "
              options={[
                { value: "newest", label: "Newest first" },
                { value: "oldest", label: "Oldest first" },
                { value: "amount_high", label: "Amount: high to low" },
                { value: "amount_low", label: "Amount: low to high" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Active filters — removable chips */}
      {hasActiveFilters && (
        <div className="hidden sm:flex flex-wrap items-center gap-1.5 mb-3">
          {filterCustomer && <FilterChip label={`Customer: ${filterCustomer}`} onClear={() => { setFilterCustomer(""); setPage(1); }} />}
          {filterType && <FilterChip label={`Type: ${filterType === "order" ? "Orders" : "Consultations"}`} onClear={() => { setFilterType(""); setPage(1); }} />}
          {filterStatus && <FilterChip label={`Status: ${STATUS_FILTER_LABEL[filterStatus]}`} onClear={() => { setFilterStatus(""); setPage(1); }} />}
          {(filterDateFrom || filterDateTo) && (
            <FilterChip label={`Date: ${fmtChipDate(filterDateFrom)} – ${fmtChipDate(filterDateTo)}`} onClear={() => { setFilterDateFrom(""); setFilterDateTo(""); setPage(1); }} />
          )}
          <button
            onClick={() => { setFilterCustomer(""); setFilterType(""); setFilterStatus(""); setFilterDateFrom(""); setFilterDateTo(""); setPage(1); }}
            className="text-[12px] px-1.5 cursor-pointer hover:underline underline-offset-4"
            style={{ color: T.danger }}
          >
            Clear all
          </button>
        </div>
      )}

      <Card className="!p-0 md:flex md:flex-col md:min-h-0">
        {loading ? <TableSkeleton cols={6} rows={8} /> : <>
        <div
          className="hidden sm:grid grid-cols-[1fr_110px_140px_140px_130px_120px] gap-3 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]"
          style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
        >
          <span>Details</span>
          <span>Type</span>
          <span>Date & time</span>
          <span>Transaction ID</span>
          <ColumnStatusFilter
            value={filterStatus}
            options={statusOptions}
            open={showStatusFilter}
            onToggle={() => setShowStatusFilter(!showStatusFilter)}
            onSelect={(v) => { setFilterStatus(v); setShowStatusFilter(false); setPage(1); }}
          />
          <span className="text-right">Amount</span>
        </div>
        <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">
        {filtered.length === 0 ? (
          <EmptyState inline icon="search" title="No transactions" description="Try clearing filters or widening the date range." />
        ) : (
          paginated.map((p, idx) => {
            const type = p.linkedOrderId ? "Order" : "Consultation";
            const typeTone = p.linkedOrderId ? "gold" as const : "muted" as const;
            const href = p.linkedOrderId ? `/orders/${p.linkedOrderId}` : p.linkedAppointmentId ? `/consultations/${p.linkedAppointmentId}` : null;
            const refId = p.linkedOrderId || (p.linkedAppointmentId ? p.linkedAppointmentId : "");
            const itemName = getItemName(p);
            const displayStatus = getDisplayStatus(p.status);
            const dateStr = p.paidAt || p.createdAt;

            return (
              <div key={p.id}>
              <MobileListCard
                className="sm:hidden"
                href={href || "#"}
                leading={<Monogram name={p.customerName} />}
                title={p.customerName}
                right={inr(p.amount)}
                sub={itemName}
                status={{ label: displayStatus, tone: getStatusTone(p.status), extra: type }}
                time={dateStr}
              />
              <Link
                href={href || "#"}
                className="group hidden sm:grid sm:grid-cols-[1fr_110px_140px_140px_130px_120px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors duration-150 last:rounded-b-[15px] even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
                style={{ borderBottom: idx < paginated.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
              >
                {/* Details: ID first, then item name + customer */}
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium truncate" style={{ color: T.text }}>{itemName}</div>
                  <div className="text-[12px] truncate mt-0.5" style={{ color: T.muted }}>
                    <span className="group-hover:underline" style={{ color: T.accent }}>{refId}</span> · {p.customerName}
                  </div>
                </div>

                {/* Type pill */}
                <div className="flex items-center gap-2 min-w-0">
                  <Chip tone={typeTone}>{type}</Chip>
                </div>

                {/* Date & Time */}
                <div className="min-w-0">
                  <div className="text-[12px]" style={{ color: T.text }}>{formatDate(dateStr)}</div>
                  {p.paidAt && <div className="text-[11px]" style={{ color: T.faint }}>{formatTime(p.paidAt)}</div>}
                </div>

                {/* Transaction ID */}
                <div className="min-w-0 flex items-center gap-1.5">
                  {p.transactionRef ? (
                    <>
                      <span className="text-[11px] font-mono" style={{ color: T.muted }}>{p.transactionRef}</span>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigator.clipboard.writeText(p.transactionRef!); setToast("Transaction ID copied"); setTimeout(() => setToast(""), 3000); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 cursor-pointer"
                        title="Copy transaction ID"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: T.muted }}>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px]" style={{ color: T.faint }}>—</span>
                  )}
                </div>

                {/* Status */}
                <div>
                  <Chip tone={getStatusTone(p.status)}>{displayStatus}</Chip>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <div className="text-[14px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(p.amount)}</div>
                </div>
              </Link>
              </div>
            );
          })
        )}
        </div>
        </>}
      </Card>

      {/* Pagination */}
      <Pagination page={currentPage - 1} totalPages={totalPages} totalItems={filtered.length} perPage={PER_PAGE} onPageChange={(p) => setPage(p + 1)} />
      </div>

      {toast && <Toast message={toast} />}
    </>
  );
}
