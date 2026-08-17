"use client";
import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Tabs, SearchFilter, Select, TableSkeleton } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CONSULTATIONS } from "@/lib/mock";
import { inr } from "@/lib/types";
import type { Consultation } from "@/lib/types";

const TABS = [
  { key: "all", label: "All" },
  { key: "recommendation_pending", label: "Recommendation due" },
  { key: "no_show", label: "No show" },
  { key: "done", label: "Done" },
];

type SortKey = "newest" | "oldest";
type ViewMode = "list" | "calendar";

const EXPERT_ID = "usr_expert_01";
const PER_PAGE = 8;
const CAL_HOURS = Array.from({ length: 24 }, (_, i) => i);

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDays(base: Date): Date[] {
  const dow = base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function expertStatus(c: Consultation): "scheduled" | "recommendation_pending" | "done" | "no_show" {
  if (c.status === "no_show") return "no_show";
  if (c.status === "closed" || c.status === "completed") return "done";
  if (c.status === "summary_pending") return "recommendation_pending";
  return "scheduled";
}

function expertStatusLabel(s: ReturnType<typeof expertStatus>): string {
  if (s === "scheduled") return "Scheduled";
  if (s === "recommendation_pending") return "Recommendation due";
  if (s === "done") return "Done";
  return "No show";
}

function expertStatusTone(s: ReturnType<typeof expertStatus>) {
  if (s === "done") return "good" as const;
  if (s === "scheduled") return "gold" as const;
  if (s === "recommendation_pending") return "danger" as const;
  return "muted" as const;
}

export default function AppointmentsPage() {
  const [tab, setTab] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
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
  const [calWeekBase, setCalWeekBase] = useState(() => new Date());
  const [goToDateOpen, setGoToDateOpen] = useState(false);
  const [gtdYear, setGtdYear] = useState(new Date().getFullYear());
  const [gtdMonth, setGtdMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const todayISO = toISODate(new Date());
  const myConsultations = MOCK_CONSULTATIONS.filter((c) => c.expertId === EXPERT_ID);
  const uniqueCustomers = [...new Set(myConsultations.map((c) => c.customerName))].sort();

  const filtered = myConsultations
    .filter((c) => {
      const es = expertStatus(c);
      if (tab === "recommendation_pending") return es === "recommendation_pending";
      if (tab === "no_show") return es === "no_show";
      if (tab === "done") return es === "done";
      return true;
    })
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.customerName.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    })
    .filter((c) => !filterCustomer || c.customerName === filterCustomer)
    .filter((c) => !filterStatus || expertStatus(c) === filterStatus)
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

  // Calendar
  const weekDays = useMemo(() => getWeekDays(calWeekBase), [calWeekBase]);
  const prevWeek = () => setCalWeekBase((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () => setCalWeekBase((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  const goToToday = () => setCalWeekBase(new Date());

  const calEvents = useMemo(() => {
    const map = new Map<string, Consultation[]>();
    const wStart = toISODate(weekDays[0]);
    const wEnd = toISODate(weekDays[6]);
    for (const c of myConsultations) {
      const iso = c.scheduledAt.slice(0, 10);
      if (iso >= wStart && iso <= wEnd) {
        if (!map.has(iso)) map.set(iso, []);
        map.get(iso)!.push(c);
      }
    }
    return map;
  }, [myConsultations, weekDays]);

  return (
    <>
      <PageHeader title="Appointments" sub="All your bookings — filter, search, and manage consultations" />

      <div className="mb-4">
        <Tabs
          tabs={TABS.map((t) => ({
            ...t,
            count: myConsultations.filter((c: Consultation) => {
              const es = expertStatus(c);
              if (t.key === "recommendation_pending") return es === "recommendation_pending";
              if (t.key === "no_show") return es === "no_show";
              if (t.key === "done") return es === "done";
              return true;
            }).length,
          }))}
          active={tab}
          onChange={(key) => { setTab(key); if (key !== "all") setViewMode("list"); }}
        />
      </div>

      {/* Search / View toggle — fixed height row */}
      <div className="flex items-center gap-3 mb-3 h-10">
        <div className="flex-1 min-w-0">
          {viewMode === "list" && (
            <div className="w-1/2">
              <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search customer, consultation ID…" />
            </div>
          )}
        </div>
        {tab === "all" && (
          <div className="inline-flex rounded-[9px] overflow-hidden shrink-0" style={{ border: `1px solid ${T.border}` }}>
            {(["list", "calendar"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="flex items-center gap-1.5 px-3 py-[6px] text-[12px] font-medium transition-all cursor-pointer"
                style={{ background: viewMode === mode ? T.accent : "transparent", color: viewMode === mode ? T.accentInk : T.muted }}
              >
                {mode === "list" ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/></svg>
                )}
                {mode === "list" ? "List" : "Calendar"}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <Card><TableSkeleton rows={6} cols={5} /></Card>
      ) : (
      <>
      {/* ============ List view ============ */}
      {viewMode === "list" && <>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="w-[200px]">
          <Select value={filterCustomer} onChange={(v) => { setFilterCustomer(v); setPage(1); }} searchable compact placeholder="All customers" options={[{ value: "", label: "All customers" }, ...uniqueCustomers.map((name) => ({ value: name, label: name }))]} />
        </div>

        <div className="w-[200px]">
          <Select value={filterStatus} onChange={(v) => { setFilterStatus(v); setPage(1); }} compact placeholder="All statuses" options={[
            { value: "", label: "All statuses" },
            { value: "scheduled", label: "Scheduled" },
            { value: "recommendation_pending", label: "Recommendation due" },
            { value: "no_show", label: "No show" },
            { value: "done", label: "Done" },
          ]} />
        </div>

        {/* Date range picker */}
        <div className="relative">
          <button onClick={() => setShowDatePicker(!showDatePicker)} className="h-9 px-3.5 rounded-[9px] text-[13.5px] flex items-center gap-2 cursor-pointer transition-all" style={{ background: T.popover, border: `1px solid ${(filterDateFrom || filterDateTo) ? T.accentBorder : T.border}`, color: T.text }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 9h18" /></svg>
            {(filterDateFrom || filterDateTo)
              ? `${filterDateFrom ? new Date(filterDateFrom + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Start"} — ${filterDateTo ? new Date(filterDateTo + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "End"}`
              : "All dates"}
          </button>
          {showDatePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 flex rounded-[9px] shadow-lg overflow-hidden" style={{ background: T.popover, border: `1px solid ${T.border}` }}>
                <div className="w-[130px] py-2 px-1.5 shrink-0" style={{ borderRight: `1px solid ${T.borderSoft}` }}>
                  <div className="text-[9px] tracking-[0.06em] uppercase px-2 mb-1.5" style={{ color: T.faint }}>Quick select</div>
                  {[
                    { label: "Today", from: todayISO, to: todayISO },
                    { label: "Yesterday", from: toISODate(new Date(Date.now() - 86400000)), to: toISODate(new Date(Date.now() - 86400000)) },
                    { label: "Last 7 days", from: toISODate(new Date(Date.now() - 7 * 86400000)), to: todayISO },
                    { label: "Last 30 days", from: toISODate(new Date(Date.now() - 30 * 86400000)), to: todayISO },
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
            <button onClick={() => { setFilterCustomer(""); setFilterStatus(""); setFilterDateFrom(""); setFilterDateTo(""); setPage(1); }} className="text-[11px] px-2.5 py-1.5 rounded-[7px] cursor-pointer transition-opacity hover:opacity-80" style={{ color: T.danger, background: "rgba(176,84,84,0.08)", border: "1px solid rgba(176,84,84,0.15)" }}>Clear filters</button>
          )}
          <div className="w-[170px]">
            <Select value={sort} onChange={(v) => { setSort(v as SortKey); setPage(1); }} compact prefix="Sort: " options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }]} />
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="hidden sm:grid items-center gap-4 pb-3 mb-1" style={{ gridTemplateColumns: "1fr 150px 100px 130px", borderBottom: `1px solid ${T.border}` }}>
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Booking details</div>
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Scheduled time</div>
          <div className="text-[11px] tracking-[0.08em] uppercase text-right" style={{ color: T.faint }}>Commission</div>
          <div className="text-[11px] tracking-[0.08em] uppercase text-right" style={{ color: T.faint }}>Status</div>
        </div>

        {paginated.length === 0 ? (
          <p className="text-[13.5px] text-center py-6" style={{ color: T.muted }}>No appointments match your filters.</p>
        ) : (
          paginated.map((c) => {
            const dt = new Date(c.scheduledAt);
            const es = expertStatus(c);
            const commEarned = es === "done" ? Math.round((c.fee ?? 0) * 0.15) : 0;
            return (
              <Link key={c.id} href={`/appointments/${c.id}`}
                className="grid items-center gap-4 py-3.5 transition-all duration-150 rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]"
                style={{ borderBottom: `1px solid ${T.borderSoft}`, gridTemplateColumns: "1fr 150px 100px 130px" }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-medium" style={{ color: T.text }}>{c.customerName}</span>
                  </div>
                  {c.problemStatement && (
                    <div className="text-[12px] mt-0.5 truncate" style={{ color: T.faint }}>{c.problemStatement}</div>
                  )}
                </div>
                <div className="shrink-0">
                  <div className="text-[13.5px] font-medium tabular-nums" style={{ color: T.text }}>
                    {dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <div className="text-[12px] mt-0.5 tabular-nums" style={{ color: T.muted }}>
                    {dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })} · {c.duration}min
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[12px] tabular-nums" style={{ color: commEarned > 0 ? T.accent : T.faint }}>{commEarned > 0 ? inr(commEarned) : "—"}</span>
                </div>
                <div className="flex items-center justify-end shrink-0">
                  <Chip tone={expertStatusTone(es)}>{expertStatusLabel(es)}</Chip>
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
      </>}

      {/* ============ Calendar view ============ */}
      {viewMode === "calendar" && (
        <>
          <div className="flex flex-wrap items-center gap-3 pb-3 mb-3" style={{ borderBottom: `1px solid ${T.border}` }}>
            <button onClick={prevWeek} className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[14px] transition-colors hover:bg-[rgba(160,125,56,0.1)] cursor-pointer" style={{ color: T.muted, background: T.popover, border: `1px solid ${T.border}` }}>‹</button>
            <button onClick={nextWeek} className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[14px] transition-colors hover:bg-[rgba(160,125,56,0.1)] cursor-pointer" style={{ color: T.muted, background: T.popover, border: `1px solid ${T.border}` }}>›</button>
            <button onClick={goToToday} className="h-9 px-3.5 rounded-[9px] text-[13.5px] font-medium transition-colors hover:bg-[rgba(160,125,56,0.1)] cursor-pointer" style={{ color: T.accent, border: `1px solid ${T.accentBorder}` }}>Today</button>

            <div className="relative ml-1">
              <button onClick={() => { setGoToDateOpen((o) => !o); setGtdYear(calWeekBase.getFullYear()); setGtdMonth(calWeekBase.getMonth()); }} className="text-[14px] font-semibold flex items-center gap-2 cursor-pointer hover:opacity-75 transition-opacity" style={{ color: T.text }}>
                {weekDays[0].toLocaleDateString("en-IN", { day: "numeric", month: "short" })} — {weekDays[6].toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {goToDateOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setGoToDateOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 z-50 rounded-[10px] p-4 shadow-lg w-[280px]" style={{ background: T.popover, border: `1px solid ${T.border}` }}>
                    <div className="flex items-center justify-between mb-2">
                      <button type="button" onClick={() => { if (gtdMonth === 0) { setGtdMonth(11); setGtdYear((y) => y - 1); } else setGtdMonth((m) => m - 1); }} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(160,125,56,0.15)]" style={{ color: T.muted }}>‹</button>
                      <span className="text-[11px] font-medium" style={{ color: T.text }}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][gtdMonth]} {gtdYear}</span>
                      <button type="button" onClick={() => { if (gtdMonth === 11) { setGtdMonth(0); setGtdYear((y) => y + 1); } else setGtdMonth((m) => m + 1); }} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(160,125,56,0.15)]" style={{ color: T.muted }}>›</button>
                    </div>
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                      {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => <div key={d} className="text-center text-[9px] py-0.5" style={{ color: T.faint }}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array.from({ length: (() => { const fd = new Date(gtdYear, gtdMonth, 1).getDay(); return fd === 0 ? 6 : fd - 1; })() }).map((_, i) => <div key={`e${i}`} />)}
                      {Array.from({ length: new Date(gtdYear, gtdMonth + 1, 0).getDate() }).map((_, i) => {
                        const day = i + 1;
                        const iso = `${gtdYear}-${String(gtdMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                        const isToday2 = iso === todayISO;
                        return (
                          <button key={day} type="button" onClick={() => { setCalWeekBase(new Date(iso + "T00:00:00")); setGoToDateOpen(false); }}
                            className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] transition-colors cursor-pointer hover:bg-[rgba(160,125,56,0.16)]"
                            style={{ background: isToday2 ? T.accent : "transparent", color: isToday2 ? T.accentInk : T.text, fontWeight: isToday2 ? 700 : 400 }}
                          >{day}</button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <div style={{ minWidth: 800 }}>
                <div className="grid sticky top-0 z-10" style={{ gridTemplateColumns: "60px repeat(7, 1fr)", background: T.card, borderBottom: `1px solid ${T.border}` }}>
                  <div className="py-1.5" />
                  {weekDays.map((day) => {
                    const iso = toISODate(day);
                    const isToday3 = iso === todayISO;
                    return (
                      <div key={iso} className="text-center py-2 px-1" style={{ borderLeft: `1px solid ${T.borderSoft}` }}>
                        <div className="text-[10px] tracking-[0.06em] uppercase" style={{ color: T.faint }}>{day.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                        <div className="text-[15px] font-semibold mx-auto" style={{ color: isToday3 ? T.accentInk : T.text, background: isToday3 ? T.accent : "transparent", borderRadius: isToday3 ? "50%" : undefined, width: isToday3 ? 28 : undefined, height: isToday3 ? 28 : undefined, lineHeight: isToday3 ? "28px" : undefined }}>{day.getDate()}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {CAL_HOURS.map((hour) => (
                    <div key={hour} className="grid" style={{ gridTemplateColumns: "60px repeat(7, 1fr)", minHeight: 40 }}>
                      <div className="text-[10px] tabular-nums text-right pr-2 pt-0.5" style={{ color: T.faint, borderTop: `1px solid ${T.borderSoft}` }}>{formatHour(hour)}</div>
                      {weekDays.map((day) => {
                        const iso = toISODate(day);
                        const events = (calEvents.get(iso) ?? []).filter((c) => new Date(c.scheduledAt).getHours() === hour);
                        return (
                          <div key={iso} className="relative px-0.5 pt-0.5" style={{ borderTop: `1px solid ${T.borderSoft}`, borderLeft: `1px solid ${T.borderSoft}` }}>
                            {events.map((ev) => {
                              const dt = new Date(ev.scheduledAt);
                              const timeStr = dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
                              const es = expertStatus(ev);
                              const tone = es === "done" ? T.good : es === "scheduled" ? "#6d8ea0" : es === "recommendation_pending" ? T.danger : T.muted;
                              return (
                                <Link key={ev.id} href={`/appointments/${ev.id}`}
                                  className="block rounded-[6px] px-1.5 py-1 mb-0.5 text-[10px] leading-tight truncate transition-all hover:brightness-110"
                                  style={{ background: `${tone}18`, borderLeft: `3px solid ${tone}`, color: tone }}
                                  title={`${ev.customerName} — ${expertStatusLabel(es)}`}
                                >
                                  <div className="font-medium truncate">{ev.customerName}</div>
                                  <div className="truncate opacity-75">{timeStr}</div>
                                </Link>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
      </>
      )}
    </>
  );
}
