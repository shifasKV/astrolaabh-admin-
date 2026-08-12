"use client";
import { useState, useMemo } from "react";
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
type ViewMode = "list" | "calendar";

const HOURS = Array.from({ length: 16 }, (_, i) => i + 5); // 5 AM to 8 PM

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDays(base: Date): Date[] {
  const dayOfWeek = base.getDay();
  const monday = new Date(base);
  monday.setDate(base.getDate() - ((dayOfWeek + 6) % 7));
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

export default function EnergisationPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
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
  const [calWeekBase, setCalWeekBase] = useState(() => new Date());
  const [goToDateOpen, setGoToDateOpen] = useState(false);
  const [gtdYear, setGtdYear] = useState(new Date().getFullYear());
  const [gtdMonth, setGtdMonth] = useState(new Date().getMonth());

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

  const weekDays = useMemo(() => getWeekDays(calWeekBase), [calWeekBase]);
  const todayISO = toISODate(new Date());

  const calEvents = useMemo(() => {
    const scheduled = MOCK_ENERGISATION.filter((e) => e.scheduledAt && e.status !== "not_required");
    const map = new Map<string, typeof scheduled>();
    for (const e of scheduled) {
      const dt = new Date(e.scheduledAt!);
      const key = toISODate(dt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, []);

  const prevWeek = () => {
    const d = new Date(calWeekBase);
    d.setDate(d.getDate() - 7);
    setCalWeekBase(d);
  };
  const nextWeek = () => {
    const d = new Date(calWeekBase);
    d.setDate(d.getDate() + 7);
    setCalWeekBase(d);
  };
  const goToToday = () => setCalWeekBase(new Date());

  return (
    <>
      <PageHeader
        title="Energisation management"
        sub="Track preparation and completion of gemstone energisation rituals"
      />

      {/* View toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex gap-0 rounded-[9px] overflow-hidden shrink-0" style={{ border: `1px solid ${T.border}` }}>
          {(["list", "calendar"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="px-4 py-1.5 text-[12px] font-medium transition-all cursor-pointer capitalize"
              style={{
                background: viewMode === mode ? T.accent : "transparent",
                color: viewMode === mode ? T.accentInk : T.muted,
              }}
            >
              {mode === "list" ? "List" : "Calendar"}
            </button>
          ))}
        </div>
      </div>

      {viewMode === "list" && <>
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
      </>}

      {/* ============ Calendar view ============ */}
      {viewMode === "calendar" && (
        <>
          {/* Week navigation */}
          <div className="flex flex-wrap items-center gap-3 pb-3 mb-3" style={{ borderBottom: `1px solid ${T.border}` }}>
            <button
              onClick={prevWeek}
              className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[14px] transition-colors hover:bg-[rgba(160,125,56,0.1)] cursor-pointer"
              style={{ color: T.muted, background: T.popover, border: `1px solid ${T.border}` }}
            >
              ‹
            </button>
            <button
              onClick={nextWeek}
              className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[14px] transition-colors hover:bg-[rgba(160,125,56,0.1)] cursor-pointer"
              style={{ color: T.muted, background: T.popover, border: `1px solid ${T.border}` }}
            >
              ›
            </button>
            <button
              onClick={goToToday}
              className="h-9 px-3.5 rounded-[9px] text-[13.5px] font-medium transition-colors hover:bg-[rgba(160,125,56,0.1)] cursor-pointer"
              style={{ color: T.accent, border: `1px solid ${T.accentBorder}` }}
            >
              Today
            </button>

            {/* Clickable date range → opens calendar picker */}
            <div className="relative ml-1">
              <button
                onClick={() => { setGoToDateOpen((o) => !o); setGtdYear(calWeekBase.getFullYear()); setGtdMonth(calWeekBase.getMonth()); }}
                className="text-[14px] font-semibold flex items-center gap-2 cursor-pointer hover:opacity-75 transition-opacity"
                style={{ color: T.text }}
              >
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
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              setCalWeekBase(new Date(iso + "T00:00:00"));
                              setGoToDateOpen(false);
                            }}
                            className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] transition-colors cursor-pointer hover:bg-[rgba(160,125,56,0.16)]"
                            style={{
                              background: isToday2 ? T.accent : "transparent",
                              color: isToday2 ? T.accentInk : T.text,
                              fontWeight: isToday2 ? 700 : 400,
                            }}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Info bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
            <span className="text-[12px]" style={{ color: T.muted }}>Showing scheduled energisation rituals only</span>
          </div>

          {/* Calendar grid */}
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <div style={{ minWidth: 800 }}>
                {/* Day headers */}
                <div className="grid sticky top-0 z-10" style={{ gridTemplateColumns: "60px repeat(7, 1fr)", background: T.card, borderBottom: `1px solid ${T.border}` }}>
                  <div className="p-2" />
                  {weekDays.map((day) => {
                    const iso = toISODate(day);
                    const isToday = iso === todayISO;
                    return (
                      <div
                        key={iso}
                        className="text-center py-3 px-1"
                        style={{ borderLeft: `1px solid ${T.borderSoft}` }}
                      >
                        <div className="text-[10px] tracking-[0.06em] uppercase" style={{ color: T.faint }}>
                          {day.toLocaleDateString("en-IN", { weekday: "short" })}
                        </div>
                        <div
                          className="text-[18px] font-semibold mt-0.5 mx-auto"
                          style={{
                            color: isToday ? T.accentInk : T.text,
                            background: isToday ? T.accent : "transparent",
                            borderRadius: isToday ? "50%" : undefined,
                            width: isToday ? 34 : undefined,
                            height: isToday ? 34 : undefined,
                            lineHeight: isToday ? "34px" : undefined,
                          }}
                        >
                          {day.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Hour rows */}
                <div className="max-h-[600px] overflow-y-auto">
                  {HOURS.map((hour) => (
                    <div
                      key={hour}
                      className="grid"
                      style={{ gridTemplateColumns: "60px repeat(7, 1fr)", minHeight: 60 }}
                    >
                      <div
                        className="text-[10px] tabular-nums text-right pr-2 pt-1"
                        style={{ color: T.faint, borderTop: `1px solid ${T.borderSoft}` }}
                      >
                        {formatHour(hour)}
                      </div>
                      {weekDays.map((day) => {
                        const iso = toISODate(day);
                        const events = (calEvents.get(iso) ?? []).filter((e) => {
                          const h = new Date(e.scheduledAt!).getHours();
                          return h === hour;
                        });
                        return (
                          <div
                            key={iso}
                            className="relative px-0.5 pt-0.5"
                            style={{ borderTop: `1px solid ${T.borderSoft}`, borderLeft: `1px solid ${T.borderSoft}` }}
                          >
                            {events.map((ev) => {
                              const dt = new Date(ev.scheduledAt!);
                              const timeStr = dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
                              const toneColor =
                                ev.status === "completed" ? T.good :
                                ev.status === "in_progress" ? T.accent :
                                ev.status === "scheduled" ? "#6d8ea0" :
                                T.muted;
                              return (
                                <Link
                                  key={ev.id}
                                  href={`/energisation/${ev.id}`}
                                  className="block rounded-[6px] px-1.5 py-1 mb-0.5 text-[10px] leading-tight truncate transition-all hover:brightness-110"
                                  style={{
                                    background: `${toneColor}18`,
                                    borderLeft: `3px solid ${toneColor}`,
                                    color: toneColor,
                                  }}
                                  title={`${ev.customerName} — ${ev.stoneDescription}`}
                                >
                                  <div className="font-medium truncate">{ev.customerName}</div>
                                  <div className="truncate opacity-75">{timeStr} · {ev.stoneDescription.split("·")[0].trim()}</div>
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
  );
}
