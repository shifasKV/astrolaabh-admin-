"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Tabs, SearchFilter, GoldBtn, Select } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CONSULTATIONS } from "@/lib/mock";

const TABS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "reschedule", label: "Reschedule request" },
  { key: "summary_due", label: "Summary due" },
  { key: "no_show", label: "No show" },
];

type SortKey = "date_desc" | "date_asc";
type ViewMode = "list" | "calendar";

const CAL_HOURS = Array.from({ length: 16 }, (_, i) => i + 5);

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

function filterByTab(c: typeof MOCK_CONSULTATIONS[number], tab: string): boolean {
  if (tab === "upcoming") return c.status === "scheduled" && c.paymentStatus === "paid";
  if (tab === "payment_pending") return c.paymentStatus === "pending";
  if (tab === "link_pending") return c.status === "scheduled" && !c.meetingLink;
  if (tab === "reschedule") return c.status === "reschedule_requested";
  if (tab === "summary_due") return c.status === "summary_pending";
  if (tab === "no_show") return c.status === "no_show";
  if (tab === "completed") return c.status === "closed" || c.status === "completed";
  return true;
}

export default function ConsultationsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterExpert, setFilterExpert] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
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

  const uniqueCustomers = [...new Set(MOCK_CONSULTATIONS.map((c) => c.customerName))].sort();
  const uniqueExperts = [...new Set(MOCK_CONSULTATIONS.map((c) => c.expertName))].sort();

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
      if (filterStatus === "reschedule_requested" && c.status !== "reschedule_requested") return false;
      if (filterStatus === "no_show" && c.status !== "no_show") return false;
      return true;
    })
    .filter((c) => {
      const d = c.scheduledAt?.slice(0, 10);
      if (filterDateFrom && d && d < filterDateFrom) return false;
      if (filterDateTo && d && d > filterDateTo) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "date_desc") return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
      if (sort === "date_asc") return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const hasActiveFilters = !!filterCustomer || !!filterExpert || !!filterStatus || !!filterDateFrom || !!filterDateTo;

  const weekDays = useMemo(() => getWeekDays(calWeekBase), [calWeekBase]);
  const todayISO = toISODate(new Date());

  const calEvents = useMemo(() => {
    const map = new Map<string, typeof MOCK_CONSULTATIONS>();
    for (const c of MOCK_CONSULTATIONS) {
      if (c.status === "cancelled") continue;
      const dt = new Date(c.scheduledAt);
      const key = toISODate(dt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, []);

  const prevWeek = () => { const d = new Date(calWeekBase); d.setDate(d.getDate() - 7); setCalWeekBase(d); };
  const nextWeek = () => { const d = new Date(calWeekBase); d.setDate(d.getDate() + 7); setCalWeekBase(d); };
  const goToToday = () => setCalWeekBase(new Date());

  const statusTone = (s: string) => {
    if (s === "closed" || s === "completed") return "good" as const;
    if (s === "scheduled") return "gold" as const;
    if (s === "summary_pending" || s === "reschedule_requested" || s === "no_show") return "danger" as const;
    if (s === "cancelled") return "muted" as const;
    return "muted" as const;
  };

  const statusLabel = (c: typeof MOCK_CONSULTATIONS[number]) => {
    if (c.paymentStatus === "pending") return "Payment pending";
    if (c.status === "reschedule_requested") return "Reschedule";
    if (c.status === "summary_pending") return "Summary due";
    if (c.status === "closed" || c.status === "completed") return "Completed";
    if (c.status === "scheduled") return "Scheduled";
    if (c.status === "no_show") return c.noShowBy === "expert" ? "Expert no show" : "Customer no show";
    if (c.status === "cancelled") return "Cancelled";
    return c.status;
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
            count: MOCK_CONSULTATIONS.filter((c) => filterByTab(c, t.key)).length,
          }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      {/* Full-width search */}
      <div className="mb-3">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search customer, expert, consultation ID…" />
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
            value={filterExpert}
            onChange={(v) => { setFilterExpert(v); setPage(1); }}
            compact
            placeholder="All experts"
            options={[
              { value: "", label: "All experts" },
              ...uniqueExperts.map((name) => ({ value: name, label: name })),
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
              { value: "payment_pending", label: "Payment pending" },
              { value: "scheduled", label: "Scheduled" },
              { value: "reschedule_requested", label: "Reschedule" },
              { value: "no_show", label: "No show" },
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
              <div
                className="absolute top-full left-0 mt-1 z-50 flex rounded-[9px] shadow-lg overflow-hidden"
                style={{ background: T.popover, border: `1px solid ${T.border}` }}
              >
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
                      onClick={() => { setFilterDateFrom(preset.from); setFilterDateTo(preset.to); setShowDatePicker(false); setPage(1); }}
                      className="w-full text-left px-2.5 py-2 rounded-[7px] text-[12px] transition-colors cursor-pointer hover:bg-[rgba(160,125,56,0.10)]"
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
              onClick={() => { setFilterCustomer(""); setFilterExpert(""); setFilterStatus(""); setFilterDateFrom(""); setFilterDateTo(""); setPage(1); }}
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
                { value: "date_desc", label: "Newest first" },
                { value: "date_asc", label: "Oldest first" },
              ]}
            />
          </div>
        </div>
      </div>

      <Card>
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_140px_140px_120px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase" style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
          <span>Consultation details</span>
          <span>Customer</span>
          <span>Scheduled date</span>
          <span>Status</span>
        </div>

        {paginated.length === 0 ? (
          <p className="text-[13.5px] text-center py-6" style={{ color: T.muted }}>No consultations match your filters.</p>
        ) : (
          paginated.map((c) => (
            <Link
              key={c.id}
              href={`/consultations/${c.id}`}
              className="group grid grid-cols-1 sm:grid-cols-[1fr_140px_140px_120px] gap-2 sm:gap-3 items-center px-3 py-3.5 transition-all duration-150 rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}
            >
              {/* Consultation details */}
              <div className="min-w-0">
                <span className="text-[11px] tracking-[0.06em] uppercase font-medium group-hover:underline" style={{ color: T.accent }}>{c.id}</span>
                <div className="text-[14px] mt-0.5 truncate" style={{ color: T.text }}>
                  {c.expertName}
                </div>
              </div>

              {/* Customer */}
              <div className="min-w-0">
                <span className="text-[12px] truncate block" style={{ color: T.text }}>{c.customerName}</span>
              </div>

              {/* Scheduled date */}
              <div className="min-w-0">
                <span className="text-[12px]" style={{ color: T.text }}>
                  {new Date(c.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/ (\d{4})$/, ", $1")}
                </span>
              </div>

              {/* Status */}
              <div>
                <Chip tone={c.paymentStatus === "pending" ? "gold" : statusTone(c.status)}>
                  {statusLabel(c)}
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
            <button onClick={prevWeek} className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[14px] transition-colors hover:bg-[rgba(160,125,56,0.1)] cursor-pointer" style={{ color: T.muted, background: T.popover, border: `1px solid ${T.border}` }}>‹</button>
            <button onClick={nextWeek} className="w-9 h-9 rounded-[9px] flex items-center justify-center text-[14px] transition-colors hover:bg-[rgba(160,125,56,0.1)] cursor-pointer" style={{ color: T.muted, background: T.popover, border: `1px solid ${T.border}` }}>›</button>
            <button onClick={goToToday} className="h-9 px-3.5 rounded-[9px] text-[13.5px] font-medium transition-colors hover:bg-[rgba(160,125,56,0.1)] cursor-pointer" style={{ color: T.accent, border: `1px solid ${T.accentBorder}` }}>Today</button>

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

          {/* Info */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
            <span className="text-[12px]" style={{ color: T.muted }}>Showing scheduled consultations only</span>
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
                    const isToday3 = iso === todayISO;
                    return (
                      <div key={iso} className="text-center py-3 px-1" style={{ borderLeft: `1px solid ${T.borderSoft}` }}>
                        <div className="text-[10px] tracking-[0.06em] uppercase" style={{ color: T.faint }}>{day.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                        <div
                          className="text-[18px] font-semibold mt-0.5 mx-auto"
                          style={{
                            color: isToday3 ? T.accentInk : T.text,
                            background: isToday3 ? T.accent : "transparent",
                            borderRadius: isToday3 ? "50%" : undefined,
                            width: isToday3 ? 34 : undefined,
                            height: isToday3 ? 34 : undefined,
                            lineHeight: isToday3 ? "34px" : undefined,
                          }}
                        >{day.getDate()}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Hour rows */}
                <div className="max-h-[600px] overflow-y-auto">
                  {CAL_HOURS.map((hour) => (
                    <div key={hour} className="grid" style={{ gridTemplateColumns: "60px repeat(7, 1fr)", minHeight: 60 }}>
                      <div className="text-[10px] tabular-nums text-right pr-2 pt-1" style={{ color: T.faint, borderTop: `1px solid ${T.borderSoft}` }}>{formatHour(hour)}</div>
                      {weekDays.map((day) => {
                        const iso = toISODate(day);
                        const events = (calEvents.get(iso) ?? []).filter((c) => new Date(c.scheduledAt).getHours() === hour);
                        return (
                          <div key={iso} className="relative px-0.5 pt-0.5" style={{ borderTop: `1px solid ${T.borderSoft}`, borderLeft: `1px solid ${T.borderSoft}` }}>
                            {events.map((ev) => {
                              const dt = new Date(ev.scheduledAt);
                              const timeStr = dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
                              const tone =
                                ev.status === "closed" || ev.status === "completed" ? T.good :
                                ev.status === "scheduled" ? "#6d8ea0" :
                                ev.status === "reschedule_requested" ? T.accent :
                                ev.status === "summary_pending" || ev.status === "no_show" ? T.danger :
                                T.muted;
                              return (
                                <Link key={ev.id} href={`/consultations/${ev.id}`}
                                  className="block rounded-[6px] px-1.5 py-1 mb-0.5 text-[10px] leading-tight truncate transition-all hover:brightness-110"
                                  style={{ background: `${tone}18`, borderLeft: `3px solid ${tone}`, color: tone }}
                                  title={`${ev.customerName} — ${ev.expertName}`}
                                >
                                  <div className="font-medium truncate">{ev.customerName}</div>
                                  <div className="truncate opacity-75">{timeStr} · {ev.expertName.split(" ").pop()}</div>
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
