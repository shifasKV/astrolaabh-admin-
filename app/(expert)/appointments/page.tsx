"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Tabs, SearchFilter, Select } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CONSULTATIONS } from "@/lib/mock";
import type { Consultation } from "@/lib/types";

const TABS = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "pending", label: "Action needed" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "scheduled", label: "Scheduled" },
  { value: "summary_pending", label: "Summary pending" },
  { value: "reschedule_requested", label: "Reschedule requested" },
  { value: "completed", label: "Completed" },
  { value: "closed", label: "Closed" },
  { value: "no_show", label: "No show" },
  { value: "cancelled", label: "Cancelled" },
];

type SortKey = "newest" | "oldest";

const EXPERT_ID = "usr_expert_01";
const PER_PAGE = 8;

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AppointmentsPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dpYear, setDpYear] = useState(new Date().getFullYear());
  const [dpMonth, setDpMonth] = useState(new Date().getMonth());
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);

  const today = toISODate(new Date());
  const myConsultations = MOCK_CONSULTATIONS.filter((c) => c.expertId === EXPERT_ID);
  const uniqueCustomers = [...new Set(myConsultations.map((c) => c.customerName))].sort();

  const filtered = myConsultations
    .filter((c) => {
      if (tab === "today") return c.scheduledAt.startsWith(today);
      if (tab === "upcoming") return c.status === "scheduled";
      if (tab === "pending") return c.status === "summary_pending";
      if (tab === "completed") return c.status === "closed" || c.status === "completed";
      return true;
    })
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.customerName.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    })
    .filter((c) => {
      if (filterCustomer && c.customerName !== filterCustomer) return false;
      return true;
    })
    .filter((c) => {
      if (filterStatus && c.status !== filterStatus) return false;
      return true;
    })
    .filter((c) => {
      const dateOnly = c.scheduledAt.slice(0, 10);
      if (filterDateFrom && dateOnly < filterDateFrom) return false;
      if (filterDateTo && dateOnly > filterDateTo) return false;
      return true;
    })
    .sort((a, b) => {
      const da = new Date(a.scheduledAt).getTime();
      const db = new Date(b.scheduledAt).getTime();
      return sort === "newest" ? db - da : da - db;
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const hasActiveFilters = !!filterCustomer || !!filterStatus || !!filterDateFrom || !!filterDateTo;

  const INLINE_LABELS = new Set(["reschedule_requested"]);

  const displayStatus = (s: string) => {
    if (s === "reschedule_requested") return "scheduled";
    return s;
  };

  const statusTone = (s: string) => {
    if (s === "closed" || s === "completed") return "good" as const;
    if (s === "scheduled" || s === "rescheduled") return "gold" as const;
    if (s === "summary_pending") return "danger" as const;
    return "muted" as const;
  };

  const labelTone = (s: string) => {
    if (s === "reschedule_requested") return "gold" as const;
    return "muted" as const;
  };

  return (
    <>
      <PageHeader title="Appointments" sub="All your bookings — filter, search, and manage consultations" />

      <div className="mb-4">
        <Tabs
          tabs={TABS.map((t) => ({
            ...t,
            count: myConsultations.filter((c: Consultation) => {
              if (t.key === "today") return c.scheduledAt.startsWith(today);
              if (t.key === "upcoming") return c.status === "scheduled";
              if (t.key === "pending") return c.status === "summary_pending";
              if (t.key === "completed") return c.status === "closed" || c.status === "completed";
              return true;
            }).length,
          }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      {/* Search */}
      <div className="mb-3">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search customer, consultation ID…" />
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
                <div className="w-[130px] py-2 px-1.5 shrink-0" style={{ borderRight: `1px solid ${T.borderSoft}` }}>
                  <div className="text-[9px] tracking-[0.06em] uppercase px-2 mb-1.5" style={{ color: T.faint }}>Quick select</div>
                  {[
                    { label: "Today", from: today, to: today },
                    { label: "Yesterday", from: toISODate(new Date(Date.now() - 86400000)), to: toISODate(new Date(Date.now() - 86400000)) },
                    { label: "Last 7 days", from: toISODate(new Date(Date.now() - 7 * 86400000)), to: today },
                    { label: "Last 30 days", from: toISODate(new Date(Date.now() - 30 * 86400000)), to: today },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => { setFilterDateFrom(preset.from); setFilterDateTo(preset.to); setShowDatePicker(false); setPage(1); }}
                      className="w-full text-left px-2.5 py-2 rounded-[7px] text-[12px] transition-colors cursor-pointer hover:bg-[rgba(195,160,88,0.06)]"
                      style={{ color: T.text }}
                    >
                      {preset.label}
                    </button>
                  ))}
                  {(filterDateFrom || filterDateTo) && (
                    <button
                      onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setShowDatePicker(false); setPage(1); }}
                      className="w-full text-left px-2.5 py-2 rounded-[7px] text-[11px] mt-1 transition-colors cursor-pointer hover:bg-[rgba(176,84,84,0.06)]"
                      style={{ color: T.danger }}
                    >
                      Clear dates
                    </button>
                  )}
                </div>
                <div className="p-4 w-[280px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1">
                      <div className="text-[9px] uppercase tracking-[0.06em] mb-1" style={{ color: T.faint }}>From</div>
                      <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(1); }} className="w-full h-8 px-2 rounded-[7px] text-[11px] outline-none" style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }} />
                    </div>
                    <span className="text-[11px] mt-3" style={{ color: T.faint }}>—</span>
                    <div className="flex-1">
                      <div className="text-[9px] uppercase tracking-[0.06em] mb-1" style={{ color: T.faint }}>To</div>
                      <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(1); }} className="w-full h-8 px-2 rounded-[7px] text-[11px] outline-none" style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <button type="button" onClick={() => { if (dpMonth === 0) { setDpMonth(11); setDpYear((y) => y - 1); } else setDpMonth((m) => m - 1); }} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(195,160,88,0.1)]" style={{ color: T.muted }}>‹</button>
                    <span className="text-[11px] font-medium" style={{ color: T.text }}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][dpMonth]} {dpYear}</span>
                    <button type="button" onClick={() => { if (dpMonth === 11) { setDpMonth(0); setDpYear((y) => y + 1); } else setDpMonth((m) => m + 1); }} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(195,160,88,0.1)]" style={{ color: T.muted }}>›</button>
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
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (!filterDateFrom || (filterDateFrom && filterDateTo)) {
                              setFilterDateFrom(iso); setFilterDateTo("");
                            } else {
                              if (iso < filterDateFrom) { setFilterDateTo(filterDateFrom); setFilterDateFrom(iso); }
                              else { setFilterDateTo(iso); }
                            }
                            setPage(1);
                          }}
                          className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] transition-colors cursor-pointer"
                          style={{
                            background: (isFrom || isTo) ? T.accent : inRange ? "rgba(195,160,88,0.12)" : "transparent",
                            color: (isFrom || isTo) ? T.accentInk : T.text,
                            fontWeight: (isFrom || isTo) ? 700 : 400,
                          }}
                        >{day}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="w-[180px]">
          <Select
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setPage(1); }}
            compact
            placeholder="All statuses"
            options={STATUS_OPTIONS}
          />
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
          <div className="w-[170px]">
            <Select
              value={sort}
              onChange={(v) => { setSort(v as SortKey); setPage(1); }}
              compact
              prefix="Sort: "
              options={[
                { value: "newest", label: "Newest first" },
                { value: "oldest", label: "Oldest first" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        {/* Column headers */}
        <div
          className="hidden sm:grid items-center gap-4 pb-3 mb-1"
          style={{ gridTemplateColumns: "1fr 150px 130px", borderBottom: `1px solid ${T.border}` }}
        >
          <div className="text-[10.5px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Booking details</div>
          <div className="text-[10.5px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Scheduled time</div>
          <div className="text-[10.5px] tracking-[0.08em] uppercase text-right" style={{ color: T.faint }}>Status</div>
        </div>

        {paginated.length === 0 ? (
          <p className="text-[13px] text-center py-6" style={{ color: T.muted }}>No appointments match your filters.</p>
        ) : (
          paginated.map((c) => {
            const dt = new Date(c.scheduledAt);
            return (
              <Link
                key={c.id}
                href={`/appointments/${c.id}`}
                className="grid items-center gap-4 py-3.5 transition-all duration-150 rounded-[8px] hover:bg-[rgba(195,160,88,0.03)]"
                style={{ borderBottom: `1px solid ${T.borderSoft}`, gridTemplateColumns: "1fr 150px 130px" }}
              >
                {/* Booking details */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13.5px] font-medium" style={{ color: T.text }}>{c.customerName}</span>
                    {INLINE_LABELS.has(c.status) && (
                      <Chip tone={labelTone(c.status)}>{c.status.replace(/_/g, " ")}</Chip>
                    )}
                  </div>
                  {c.problemStatement && (
                    <div className="text-[11.5px] mt-0.5 truncate" style={{ color: T.faint }}>{c.problemStatement}</div>
                  )}
                </div>

                {/* Scheduled time */}
                <div className="shrink-0">
                  <div className="text-[13px] font-medium tabular-nums" style={{ color: T.text }}>
                    {dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div className="text-[12px] mt-0.5 tabular-nums" style={{ color: T.muted }}>
                    {dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })} · {c.duration}min
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-end shrink-0">
                  <Chip tone={statusTone(displayStatus(c.status))}>{displayStatus(c.status).replace(/_/g, " ")}</Chip>
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
            <button onClick={() => setPage(1)} disabled={currentPage === 1} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, color: T.muted }}>«</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, color: T.muted }}>‹</button>
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
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, color: T.muted }}>›</button>
            <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: T.panel, border: `1px solid ${T.borderSoft}`, color: T.muted }}>»</button>
          </div>
        </div>
      )}
    </>
  );
}
