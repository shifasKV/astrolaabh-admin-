"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Tabs, Select, SearchFilter } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_ENERGISATION } from "@/lib/mock";

const TABS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "not_scheduled", label: "Not scheduled" },
  { key: "link_pending", label: "Link pending" },
];

type SortKey = "newest" | "oldest" | "order_desc" | "order_asc";

export default function EnergisationPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dpYear, setDpYear] = useState(new Date().getFullYear());
  const [dpMonth, setDpMonth] = useState(new Date().getMonth());
  const [page, setPage] = useState(1);

  const PER_PAGE = 9;

  const filtered = MOCK_ENERGISATION.filter((e) => {
    if (tab === "upcoming") return e.status === "scheduled" && e.scheduledAt;
    if (tab === "not_scheduled") return e.status === "pending";
    if (tab === "link_pending") return e.status === "scheduled" && !e.liveLink;
    return e.status !== "not_required";
  }).filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.customerName.toLowerCase().includes(q) || e.orderNumber.toLowerCase().includes(q) || e.stoneDescription.toLowerCase().includes(q);
  }).filter((e) => {
    if (filterCustomer && e.customerName !== filterCustomer) return false;
    return true;
  }).filter((e) => {
    if (!filterStatus) return true;
    if (filterStatus === "pending") return e.status === "pending";
    if (filterStatus === "scheduled") return e.status === "scheduled";
    if (filterStatus === "completed") return e.status === "completed";
    return true;
  }).filter((e) => {
    if (!filterDateFrom && !filterDateTo) return true;
    if (!e.scheduledAt) return false;
    const d = e.scheduledAt.slice(0, 10);
    if (filterDateFrom && d < filterDateFrom) return false;
    if (filterDateTo && d > filterDateTo) return false;
    return true;
  }).sort((a, b) => {
    if (sort === "newest") return (b.scheduledAt ?? "").localeCompare(a.scheduledAt ?? "");
    if (sort === "oldest") return (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "");
    if (sort === "order_desc") return b.orderNumber.localeCompare(a.orderNumber);
    if (sort === "order_asc") return a.orderNumber.localeCompare(b.orderNumber);
    return 0;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const uniqueCustomers = [...new Set(MOCK_ENERGISATION.filter((e) => e.status !== "not_required").map((e) => e.customerName))].sort();
  const hasActiveFilters = !!filterCustomer || !!filterStatus || !!filterDateFrom || !!filterDateTo;

  return (
    <>
      <PageHeader
        title="Energisation management"
        sub="Track preparation and completion of gemstone energisation rituals"
      />

      <div className="mb-4">
        <Tabs
          tabs={TABS.map((t) => ({
            ...t,
            count: MOCK_ENERGISATION.filter((e) =>
              t.key === "all" ? (e.status !== "not_required") :
              t.key === "upcoming" ? (e.status === "scheduled" && !!e.scheduledAt) :
              t.key === "not_scheduled" ? (e.status === "pending") :
              (e.status === "scheduled" && !e.liveLink)
            ).length,
          }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      {/* Full-width search */}
      <div className="mb-3">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search customer, order, stone…" />
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="w-[200px]">
          <Select
            value={filterCustomer}
            onChange={(v) => { setFilterCustomer(v); setPage(1); }}
            searchable
            compact
            placeholder="All customers"
            options={[
              { value: "", label: "All customers" },
              ...uniqueCustomers.map((name) => ({ value: name, label: name })),
            ]}
          />
        </div>

        <div className="w-[180px]">
          <Select
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setPage(1); }}
            compact
            placeholder="All status"
            options={[
              { value: "", label: "All status" },
              { value: "pending", label: "Not scheduled" },
              { value: "scheduled", label: "Scheduled" },
              { value: "completed", label: "Completed" },
            ]}
          />
        </div>

        {/* Date range picker */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="h-9 px-3.5 rounded-[9px] text-[13.5px] flex items-center gap-2 cursor-pointer transition-all"
            style={{ background: T.popover, border: `1px solid ${(filterDateFrom || filterDateTo) ? T.accentBorder : T.border}`, color: T.text }}
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
              <div className="absolute top-full left-0 mt-1 z-50 flex rounded-[9px] shadow-lg overflow-hidden" style={{ background: T.popover, border: `1px solid ${T.border}` }}>
                <div className="w-[130px] py-2 px-1.5 shrink-0" style={{ borderRight: `1px solid ${T.borderSoft}` }}>
                  <div className="text-[9px] tracking-[0.06em] uppercase px-2 mb-1.5" style={{ color: T.faint }}>Quick select</div>
                  {[
                    { label: "Today", from: new Date().toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
                    { label: "Yesterday", from: new Date(Date.now() - 86400000).toISOString().slice(0, 10), to: new Date(Date.now() - 86400000).toISOString().slice(0, 10) },
                    { label: "Last 7 days", from: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
                    { label: "Last 30 days", from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
                  ].map((preset) => (
                    <button key={preset.label} onClick={() => { setFilterDateFrom(preset.from); setFilterDateTo(preset.to); setShowDatePicker(false); setPage(1); }} className="w-full text-left px-2.5 py-2 rounded-[7px] text-[12px] transition-colors cursor-pointer hover:bg-[rgba(160,125,56,0.10)]" style={{ color: T.text }}>{preset.label}</button>
                  ))}
                  {(filterDateFrom || filterDateTo) && (
                    <button onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setShowDatePicker(false); setPage(1); }} className="w-full text-left px-2.5 py-2 rounded-[7px] text-[11px] mt-1 transition-colors cursor-pointer hover:bg-[rgba(176,84,84,0.06)]" style={{ color: T.danger }}>Clear dates</button>
                  )}
                </div>
                <div className="p-4 w-[280px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1">
                      <div className="text-[9px] uppercase tracking-[0.06em] mb-1" style={{ color: T.faint }}>After</div>
                      <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }} className="w-full h-8 px-2 rounded-[7px] text-[11px] outline-none" style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }} />
                    </div>
                    <span className="text-[11px] mt-3" style={{ color: T.faint }}>—</span>
                    <div className="flex-1">
                      <div className="text-[9px] uppercase tracking-[0.06em] mb-1" style={{ color: T.faint }}>Before</div>
                      <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }} className="w-full h-8 px-2 rounded-[7px] text-[11px] outline-none" style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <button type="button" onClick={() => { if (dpMonth === 0) { setDpMonth(11); setDpYear((y) => y - 1); } else setDpMonth((m) => m - 1); }} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(160,125,56,0.15)]" style={{ color: T.muted }}>‹</button>
                    <span className="text-[11px] font-medium" style={{ color: T.text }}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][dpMonth]} {dpYear}</span>
                    <button type="button" onClick={() => { if (dpMonth === 11) { setDpMonth(0); setDpYear((y) => y + 1); } else setDpMonth((m) => m + 1); }} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(160,125,56,0.15)]" style={{ color: T.muted }}>›</button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => <div key={d} className="text-center text-[9px] py-0.5" style={{ color: T.faint }}>{d}</div>)}
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
                        <button key={day} type="button" onClick={() => { if (!filterDateFrom || (filterDateFrom && filterDateTo)) { setFilterDateFrom(iso); setFilterDateTo(""); } else { if (iso < filterDateFrom) { setFilterDateTo(filterDateFrom); setFilterDateFrom(iso); } else { setFilterDateTo(iso); } } setPage(1); }}
                          className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] transition-colors cursor-pointer"
                          style={{ background: (isFrom || isTo) ? T.accent : inRange ? "rgba(160,125,56,0.16)" : "transparent", color: (isFrom || isTo) ? T.accentInk : T.text, fontWeight: (isFrom || isTo) ? 700 : 400 }}
                        >{day}</button>
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
              onClick={() => { setFilterCustomer(""); setFilterStatus(""); setFilterDateFrom(""); setFilterDateTo(""); setPage(1); }}
              className="text-[11px] px-2.5 py-1.5 rounded-[7px] cursor-pointer transition-opacity hover:opacity-80"
              style={{ color: T.danger, background: "rgba(176,84,84,0.08)", border: "1px solid rgba(176,84,84,0.15)" }}
            >
              Clear filters
            </button>
          )}
          <div className="w-[180px]">
            <Select
              value={sort}
              onChange={(val) => { setSort(val as SortKey); setPage(1); }}
              compact
              prefix="Sort: "
              options={[
                { value: "newest", label: "Newest first" },
                { value: "oldest", label: "Oldest first" },
                { value: "order_desc", label: "Order: newest" },
                { value: "order_asc", label: "Order: oldest" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* List view */}
      <Card>
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_140px_120px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase" style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
          <span>Energisation details</span>
          <span>Scheduled date</span>
          <span>Status</span>
        </div>

        {paginated.length === 0 ? (
          <p className="text-[13.5px] text-center py-6" style={{ color: T.muted }}>No energisation tasks match your filters.</p>
        ) : (
          paginated.map((e) => (
            <Link
              key={e.id}
              href={`/energisation/${e.id}`}
              className="group grid grid-cols-1 sm:grid-cols-[1fr_140px_120px] gap-2 sm:gap-3 items-center px-3 py-3.5 transition-all duration-150 rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}
            >
              {/* Energisation details */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[14px] font-medium group-hover:underline" style={{ color: T.text }}>{e.customerName}</span>
                  {!e.liveLink && e.status === "scheduled" && <Chip tone="danger">Link pending</Chip>}
                </div>
                <div className="flex items-baseline gap-3 mt-0.5 min-w-0">
                  <span className="text-[13px] truncate" style={{ color: T.muted }}>
                    {e.method || "Method not assigned"}
                    {e.assignedTo && <span style={{ color: T.faint }}> — {e.assignedTo}</span>}
                  </span>
                  <span className="text-[11px] tracking-[0.05em] uppercase tabular-nums shrink-0" style={{ color: T.faint }}>{e.orderNumber}</span>
                </div>
              </div>

              {/* Scheduled date */}
              <div className="min-w-0">
                <span className="text-[12px]" style={{ color: T.text }}>
                  {e.scheduledAt
                    ? new Date(e.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/ (\d{4})$/, ", $1")
                    : "—"}
                </span>
              </div>

              {/* Status */}
              <div>
                <Chip tone={e.status === "completed" ? "good" : e.status === "pending" ? "danger" : "gold"}>
                  {e.status === "completed" ? "Done" : e.status === "pending" ? "Not scheduled" : "Scheduled"}
                </Chip>
              </div>
            </Link>
          ))
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-[12px]" style={{ color: T.faint }}>
            Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={currentPage === 1} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>«</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>‹</button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              if (totalPages > 7 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
                if (p === currentPage - 3 || p === currentPage + 3) return <span key={p} className="w-6 text-center text-[11px]" style={{ color: T.faint }}>…</span>;
                return null;
              }
              return (
                <button key={p} onClick={() => setPage(p)} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] font-medium transition-all cursor-pointer" style={{ background: p === currentPage ? T.accent : T.panel, border: `1px solid ${p === currentPage ? T.accent : T.borderSoft}`, color: p === currentPage ? T.accentInk : T.text }}>{p}</button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>›</button>
            <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>»</button>
          </div>
        </div>
      )}
    </>
  );
}
