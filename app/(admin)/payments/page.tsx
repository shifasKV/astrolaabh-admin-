"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Tabs, SearchFilter, GoldBtn, Select } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_PAYMENTS } from "@/lib/mock";
import { inr } from "@/lib/types";

const TABS = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "pending", label: "Pending" },
  { key: "expired", label: "Expired" },
];

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
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  // Filters
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterType, setFilterType] = useState<"" | "order" | "consultation">("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "amount_high" | "amount_low">("newest");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dpYear, setDpYear] = useState(new Date().getFullYear());
  const [dpMonth, setDpMonth] = useState(new Date().getMonth());

  const uniqueCustomers = Array.from(new Set(MOCK_PAYMENTS.map((p) => p.customerName))).sort();

  const filtered = MOCK_PAYMENTS.filter((p) => {
    if (tab === "pending") return p.status === "sent" || p.status === "opened" || p.status === "draft";
    if (tab === "paid") return p.status === "paid";
    if (tab === "expired") return p.status === "expired" || p.status === "cancelled" || p.status === "failed";
    return true;
  }).filter((p) => {
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

  const hasActiveFilters = !!filterCustomer || !!filterDateFrom || !!filterDateTo || !!filterType;

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

  const PER_PAGE = 8;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <>
      <PageHeader
        title="Payments"
        sub="Track all payment transactions across orders and consultations"
        action={<Link href="/payments/create"><GoldBtn>+ New request</GoldBtn></Link>}
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
            className="rounded-[12px] p-4"
            style={{ background: T.card, border: `1px solid ${T.border}` }}
          >
            <div className="text-[10px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>{s.label}</div>
            <div className="text-[18px] font-semibold tabular-nums" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <Tabs
          tabs={TABS.map((t) => {
            const count = MOCK_PAYMENTS.filter((p) => {
              if (t.key === "pending") return p.status === "sent" || p.status === "opened" || p.status === "draft";
              if (t.key === "paid") return p.status === "paid";
              if (t.key === "expired") return p.status === "expired" || p.status === "cancelled" || p.status === "failed";
              return true;
            }).length;
            return { ...t, count };
          })}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="mb-4">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search customer, purpose, transaction ref…" />
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="w-[200px]">
          <Select
            value={filterCustomer}
            onChange={setFilterCustomer}
            compact
            searchable
            placeholder="All customers"
            options={[
              { value: "", label: "All customers" },
              ...uniqueCustomers.map((name) => ({ value: name, label: name })),
            ]}
          />
        </div>

        <div className="w-[150px]">
          <Select
            value={filterType}
            onChange={(v) => setFilterType(v as typeof filterType)}
            compact
            placeholder="All types"
            options={[
              { value: "", label: "All types" },
              { value: "order", label: "Orders" },
              { value: "consultation", label: "Consultations" },
            ]}
          />
        </div>

        {/* Date range picker */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="h-9 px-3.5 rounded-[9px] text-[13px] flex items-center gap-2 cursor-pointer transition-all"
            style={{ background: T.panel, border: `1px solid ${(filterDateFrom || filterDateTo) ? T.accentBorder : T.border}`, color: T.text }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 9h18" />
            </svg>
            {(filterDateFrom || filterDateTo)
              ? `${filterDateFrom ? new Date(filterDateFrom + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Start"} — ${filterDateTo ? new Date(filterDateTo + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "End"}`
              : "All dates"
            }
          </button>

          {showDatePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
              <div
                className="absolute top-full left-0 mt-1 z-50 flex rounded-[9px] shadow-lg overflow-hidden"
                style={{ background: T.panel, border: `1px solid ${T.border}` }}
              >
                {/* Quick selects */}
                <div className="w-[130px] py-2 px-1.5 shrink-0" style={{ borderRight: `1px solid ${T.borderSoft}` }}>
                  <div className="text-[9px] tracking-[0.06em] uppercase px-2 mb-1.5" style={{ color: T.faint }}>Quick select</div>
                  {[
                    { label: "Today", from: new Date().toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
                    { label: "Yesterday", from: new Date(Date.now() - 86400000).toISOString().slice(0, 10), to: new Date(Date.now() - 86400000).toISOString().slice(0, 10) },
                    { label: "Last 7 days", from: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
                    { label: "Last 30 days", from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => { setFilterDateFrom(preset.from); setFilterDateTo(preset.to); setShowDatePicker(false); }}
                      className="w-full text-left px-2.5 py-2 rounded-[7px] text-[12px] transition-colors cursor-pointer hover:bg-[rgba(195,160,88,0.06)]"
                      style={{ color: T.text }}
                    >
                      {preset.label}
                    </button>
                  ))}
                  {(filterDateFrom || filterDateTo) && (
                    <button
                      onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setShowDatePicker(false); }}
                      className="w-full text-left px-2.5 py-2 rounded-[7px] text-[11px] mt-1 transition-colors cursor-pointer hover:bg-[rgba(176,84,84,0.06)]"
                      style={{ color: T.danger }}
                    >
                      Clear dates
                    </button>
                  )}
                </div>

                {/* Calendar + inputs */}
                <div className="p-4 w-[280px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1">
                      <div className="text-[9px] uppercase tracking-[0.06em] mb-1" style={{ color: T.faint }}>After</div>
                      <input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="w-full h-8 px-2 rounded-[7px] text-[11px] outline-none"
                        style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }}
                      />
                    </div>
                    <span className="text-[11px] mt-3" style={{ color: T.faint }}>—</span>
                    <div className="flex-1">
                      <div className="text-[9px] uppercase tracking-[0.06em] mb-1" style={{ color: T.faint }}>Before</div>
                      <input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        className="w-full h-8 px-2 rounded-[7px] text-[11px] outline-none"
                        style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={() => { if (dpMonth === 0) { setDpMonth(11); setDpYear((y) => y - 1); } else setDpMonth((m) => m - 1); }}
                      className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(195,160,88,0.1)]"
                      style={{ color: T.muted }}
                    >‹</button>
                    <span className="text-[11px] font-medium" style={{ color: T.text }}>
                      {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][dpMonth]} {dpYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => { if (dpMonth === 11) { setDpMonth(0); setDpYear((y) => y + 1); } else setDpMonth((m) => m + 1); }}
                      className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(195,160,88,0.1)]"
                      style={{ color: T.muted }}
                    >›</button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => (
                      <div key={d} className="text-center text-[9px] py-0.5" style={{ color: T.faint }}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: (() => { const fd = new Date(dpYear, dpMonth, 1).getDay(); return fd === 0 ? 6 : fd - 1; })() }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: new Date(dpYear, dpMonth + 1, 0).getDate() }).map((_, i) => {
                      const day = i + 1;
                      const iso = `${dpYear}-${String(dpMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const isFrom = filterDateFrom === iso;
                      const isTo = filterDateTo === iso;
                      const inRange = filterDateFrom && filterDateTo && iso >= filterDateFrom && iso <= filterDateTo;
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (!filterDateFrom || (filterDateFrom && filterDateTo)) {
                              setFilterDateFrom(iso);
                              setFilterDateTo("");
                            } else {
                              if (iso < filterDateFrom) {
                                setFilterDateTo(filterDateFrom);
                                setFilterDateFrom(iso);
                              } else {
                                setFilterDateTo(iso);
                              }
                            }
                          }}
                          className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] transition-colors cursor-pointer"
                          style={{
                            background: (isFrom || isTo) ? T.accent : inRange ? "rgba(195,160,88,0.12)" : "transparent",
                            color: (isFrom || isTo) ? T.accentInk : inRange ? T.text : T.text,
                            fontWeight: (isFrom || isTo) ? 700 : 400,
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterCustomer(""); setFilterDateFrom(""); setFilterDateTo(""); setFilterType(""); }}
              className="text-[11px] px-2.5 py-1.5 rounded-[7px] cursor-pointer transition-opacity hover:opacity-80"
              style={{ color: T.danger, background: "rgba(176,84,84,0.08)", border: "1px solid rgba(176,84,84,0.15)" }}
            >
              Clear filters
            </button>
          )}
          <div className="w-[170px]">
            <Select
              value={sortBy}
              onChange={(v) => setSortBy(v as typeof sortBy)}
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

      <Card>
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_110px_140px_130px_90px_120px] gap-3 px-3 py-2 text-[10px] tracking-[0.06em] uppercase" style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
          <span>Details</span>
          <span>Type</span>
          <span>Date & Time</span>
          <span>Transaction ID</span>
          <span>Status</span>
          <span className="text-right">Amount</span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-[13px] text-center py-6" style={{ color: T.muted }}>No transactions match.</p>
        ) : (
          paginated.map((p) => {
            const type = p.linkedOrderId ? "Order" : "Consultation";
            const typeTone = p.linkedOrderId ? "gold" as const : "muted" as const;
            const href = p.linkedOrderId ? `/orders/${p.linkedOrderId}` : p.linkedAppointmentId ? `/consultations/${p.linkedAppointmentId}` : null;
            const refId = p.linkedOrderId || (p.linkedAppointmentId ? p.linkedAppointmentId : "");
            const itemName = getItemName(p);
            const displayStatus = getDisplayStatus(p.status);
            const dateStr = p.paidAt || p.createdAt;

            return (
              <Link
                key={p.id}
                href={href || "#"}
                className="group grid grid-cols-1 sm:grid-cols-[1fr_110px_140px_130px_90px_120px] gap-2 sm:gap-3 items-center px-3 py-3.5 transition-all duration-150 rounded-[8px] hover:bg-[rgba(195,160,88,0.03)]"
                style={{ borderBottom: `1px solid ${T.borderSoft}` }}
              >
                {/* Details: ID first, then item name + customer */}
                <div className="min-w-0">
                  <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{itemName}</div>
                  <div className="text-[11.5px] truncate mt-0.5" style={{ color: T.muted }}>
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
                  {p.paidAt && <div className="text-[10.5px]" style={{ color: T.faint }}>{formatTime(p.paidAt)}</div>}
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
            );
          })
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-[12px]" style={{ color: T.faint }}>
            Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, color: T.muted }}
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, color: T.muted }}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              if (totalPages > 7 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
                if (p === currentPage - 3 || p === currentPage + 3) return <span key={p} className="w-6 text-center text-[11px]" style={{ color: T.faint }}>…</span>;
                return null;
              }
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] font-medium transition-all cursor-pointer"
                  style={{
                    background: p === currentPage ? T.accent : T.panel,
                    border: `1px solid ${p === currentPage ? T.accent : T.borderSoft}`,
                    color: p === currentPage ? T.accentInk : T.text,
                  }}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, color: T.muted }}
            >
              ›
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={currentPage === totalPages}
              className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, color: T.muted }}
            >
              »
            </button>
          </div>
        </div>
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
