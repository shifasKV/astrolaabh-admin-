"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Tabs, ToolbarSearch, SortMenu, Select, Pagination, Tooltip, TableSkeleton, MobileListCard, Monogram, MobileAgenda, MobileToolbar, SheetSection, DateRangePanel } from "@/components/ui";
import { T } from "@/lib/theme";
import { usePersistentState } from "@/lib/usePersistentState";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
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
  const loading = useSimulatedLoad();
  const [tab, setTab] = useState("all");
  const [viewMode, setViewMode] = usePersistentState<ViewMode>("pref-consult-view", "calendar");
  const [selectedEvent, setSelectedEvent] = useState<Consultation | null>(null);
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
  const visibleDays = weekDays;
  const prevWeek = () => setCalWeekBase((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () => setCalWeekBase((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  const goToToday = () => setCalWeekBase(new Date());

  const hoursRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (viewMode === "calendar" && hoursRef.current) hoursRef.current.scrollTop = 6 * 40;
  }, [viewMode]);

  const eventTone = (c: Consultation) => {
    const es = expertStatus(c);
    return es === "done" ? T.good : es === "scheduled" ? T.info : es === "recommendation_pending" ? T.danger : T.muted;
  };

  const calEvents = useMemo(() => {
    const map = new Map<string, Consultation[]>();
    for (const c of myConsultations) {
      const iso = c.scheduledAt.slice(0, 10);
      if (!map.has(iso)) map.set(iso, []);
      map.get(iso)!.push(c);
    }
    return map;
  }, [myConsultations]);

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <PageHeader title="Appointments" />

      {/* Tabs + view toggle */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
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
        {tab === "all" && (
          <div className="ml-auto inline-flex items-center gap-1 p-[3px] rounded-full shrink-0" style={{ background: "rgba(89,82,54,0.055)" }}>
            {(["list", "calendar"] as const).map((mode) => (
              <Tooltip key={mode} label={mode === "list" ? "List view" : "Calendar view"}>
              <button onClick={() => setViewMode(mode)} aria-label={mode === "list" ? "List view" : "Calendar view"}
                className="h-8 w-11 rounded-full inline-flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer"
                style={viewMode === mode ? { background: T.card, color: T.text, border: `1px solid ${T.borderSoft}`, boxShadow: "0 1px 2px rgba(43,42,34,0.08)" } : { color: T.muted, border: "1px solid transparent" }}>
                {mode === "list" ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/></svg>
                )}
              </button>
              </Tooltip>
            ))}
          </div>
        )}
      </div>

      {/* ============ List view ============ */}
      {viewMode === "list" && <>

      {/* Mobile: collapsed toolbar (filters sheet + expanding search + sort) */}
      <MobileToolbar
        className="sm:hidden mb-3"
        filterCount={(filterCustomer ? 1 : 0) + (filterStatus ? 1 : 0) + (filterDateFrom || filterDateTo ? 1 : 0)}
        onClearAll={() => { setFilterCustomer(""); setFilterStatus(""); setFilterDateFrom(""); setFilterDateTo(""); setPage(1); }}
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search customer, consultation ID…"
        sort={<SortMenu value={sort} onChange={(v) => { setSort(v as SortKey); setPage(1); }} options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }]} />}
        filters={
          <>
            <SheetSection label="Customer">
              <Select value={filterCustomer} onChange={(v) => { setFilterCustomer(v); setPage(1); }} searchable compact placeholder="All customers" options={[{ value: "", label: "All customers" }, ...uniqueCustomers.map((name) => ({ value: name, label: name }))]} />
            </SheetSection>
            <SheetSection label="Status">
              <Select value={filterStatus} onChange={(v) => { setFilterStatus(v); setPage(1); }} compact placeholder="All statuses" options={[
                { value: "", label: "All statuses" },
                { value: "scheduled", label: "Scheduled" },
                { value: "recommendation_pending", label: "Recommendation due" },
                { value: "no_show", label: "No show" },
                { value: "done", label: "Done" },
              ]} />
            </SheetSection>
            <SheetSection label="Scheduled between">
              <DateRangePanel from={filterDateFrom} to={filterDateTo} onChange={(f, t) => { setFilterDateFrom(f); setFilterDateTo(t); setPage(1); }} />
            </SheetSection>
          </>
        }
      />

      {/* Filters & Sort */}
      <div className="hidden sm:flex flex-wrap items-center gap-2.5 mb-4">
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
                    <button key={preset.label} onClick={() => { setFilterDateFrom(preset.from); setFilterDateTo(preset.to); setShowDatePicker(false); setPage(1); }} className="w-full text-left px-2.5 py-2 rounded-[7px] text-[12px] transition-colors cursor-pointer hover:bg-[rgba(119,123,98,0.10)]" style={{ color: T.text }}>{preset.label}</button>
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
                    <button type="button" onClick={() => { if (dpMonth === 0) { setDpMonth(11); setDpYear((y) => y - 1); } else setDpMonth((m) => m - 1); }} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(119,123,98,0.15)]" style={{ color: T.muted }}>‹</button>
                    <span className="text-[11px] font-medium" style={{ color: T.text }}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][dpMonth]} {dpYear}</span>
                    <button type="button" onClick={() => { if (dpMonth === 11) { setDpMonth(0); setDpYear((y) => y + 1); } else setDpMonth((m) => m + 1); }} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(119,123,98,0.15)]" style={{ color: T.muted }}>›</button>
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
                          style={{ background: (isFrom || isTo) ? T.accent : inRange ? "rgba(119,123,98,0.16)" : "transparent", color: (isFrom || isTo) ? T.accentInk : T.text, fontWeight: (isFrom || isTo) ? 700 : 400 }}
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
            <button onClick={() => { setFilterCustomer(""); setFilterStatus(""); setFilterDateFrom(""); setFilterDateTo(""); setPage(1); }} className="text-[12px] font-medium px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap" style={{ color: T.danger }}>Clear all</button>
          )}
          <ToolbarSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search customer, consultation ID…" />
          <SortMenu value={sort} onChange={(v) => { setSort(v as SortKey); setPage(1); }} options={[{ value: "newest", label: "Newest first" }, { value: "oldest", label: "Oldest first" }]} />
        </div>
      </div>

      {/* Table */}
      <Card className="!p-0 md:min-h-0 md:overflow-y-auto">
        {loading ? <TableSkeleton cols={4} rows={8} /> : <>
        <div className="hidden sm:grid items-center gap-4 px-4 pt-4 pb-3" style={{ gridTemplateColumns: "1fr 150px 100px 130px", borderBottom: `1px solid ${T.border}` }}>
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Booking details</div>
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Scheduled time</div>
          <div className="text-[11px] tracking-[0.08em] uppercase text-right" style={{ color: T.faint }}>Commission</div>
          <div className="text-[11px] tracking-[0.08em] uppercase text-right" style={{ color: T.faint }}>Status</div>
        </div>

        {paginated.length === 0 ? (
          <p className="text-[13.5px] text-center py-6" style={{ color: T.muted }}>No appointments match your filters.</p>
        ) : (
          paginated.map((c, i) => {
            const dt = new Date(c.scheduledAt);
            const es = expertStatus(c);
            const commEarned = es === "done" ? Math.round((c.fee ?? 0) * 0.15) : 0;
            return (
              <div key={c.id} className="group">
              <MobileListCard
                className="sm:hidden"
                href={`/appointments/${c.id}`}
                leading={<Monogram name={c.customerName} />}
                title={c.customerName}
                sub={c.problemStatement || c.type.replace(/_/g, " ")}
                right={commEarned > 0 ? inr(commEarned) : undefined}
                status={{ label: expertStatusLabel(es), tone: expertStatusTone(es) }}
                time={c.scheduledAt}
              />
              <Link href={`/appointments/${c.id}`}
                className={`hidden sm:grid items-center gap-4 px-4 py-3.5 transition-colors duration-150 group-${i % 2 === 0 ? "bg-[rgba(89,82,54,0.025)]" : ""} hover:!bg-[rgba(119,123,98,0.08)]`}
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
              </div>
            );
          })
        )}
        </>}
      </Card>

      <Pagination page={currentPage - 1} totalPages={totalPages} totalItems={filtered.length} perPage={PER_PAGE} onPageChange={(p) => setPage(p + 1)} />
      </>}

      {/* ============ Calendar view ============ */}
      {/* ============ Calendar view ============ */}
      {viewMode === "calendar" && (() => {
        const now = new Date();
        const nowHour = now.getHours();
        const nowPct = (now.getMinutes() / 60) * 100;
        const nowTimeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
        const todayVisible = visibleDays.some((d) => toISODate(d) === todayISO);
        const mmLead = (new Date(gtdYear, gtdMonth, 1).getDay() + 6) % 7;
        const mmDays = new Date(gtdYear, gtdMonth + 1, 0).getDate();
        const selISO = toISODate(calWeekBase);
        return (
          <>
            {/* ——— Mobile: Apple-style infinite agenda ——— */}
            <Card className="md:hidden !p-0 overflow-hidden w-full">
              <MobileAgenda
                className=""
                events={myConsultations.filter((c) => c.scheduledAt).map((c) => ({
                  id: c.id,
                  dateISO: c.scheduledAt.slice(0, 10),
                  timeLabel: new Date(c.scheduledAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }),
                  title: c.customerName,
                  sub: c.problemStatement || c.type.replace(/_/g, " ").replace(/^./, (ch) => ch.toUpperCase()),
                  color: eventTone(c),
                  href: `/appointments/${c.id}`,
                }))}
              />
            </Card>

            {/* Calendar header — outside flex row so sidebar aligns with grid */}
            <div className="hidden md:flex flex-wrap items-end justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-[9px] overflow-hidden" style={{ border: `1px solid ${T.border}`, background: T.bg }}>
                  <button onClick={prevWeek} aria-label="Previous week" className="w-8 h-8 flex items-center justify-center transition-colors hover:bg-[rgba(119,123,98,0.1)] cursor-pointer" style={{ color: T.muted, borderRight: `1px solid ${T.borderSoft}` }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="m15 18-6-6 6-6" /></svg>
                  </button>
                  <button onClick={nextWeek} aria-label="Next week" className="w-8 h-8 flex items-center justify-center transition-colors hover:bg-[rgba(119,123,98,0.1)] cursor-pointer" style={{ color: T.muted }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="m9 18 6-6-6-6" /></svg>
                  </button>
                </div>
                <h2 className="font-title text-[22px] leading-tight tracking-[-0.02em]">
                  <span className="font-bold" style={{ color: T.text }}>
                    {`${weekDays[0].toLocaleDateString("en-IN", { day: "numeric", month: "short" })} — ${weekDays[6].toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                  </span>
                  <span className="font-normal" style={{ color: T.muted }}> {weekDays[6].getFullYear()}</span>
                </h2>
              </div>
              <div className="hidden xl:flex items-center gap-4">
                {[
                  { color: T.info, label: "Scheduled" },
                  { color: T.danger, label: "Recommendation due" },
                  { color: T.good, label: "Done" },
                ].map((l) => (
                  <span key={l.label} className="inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: T.muted }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                    {l.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-4 md:flex-1 md:min-h-0">
            {/* Main timeline (desktop) */}
            <div className="flex-1 min-w-0 h-full hidden md:flex flex-col">
              <Card className="overflow-hidden !p-0 flex-1 min-h-0 flex flex-col w-full">
                <div className="overflow-x-auto flex-1 min-h-0 flex flex-col">
                  <div className="h-full flex flex-col" style={{ minWidth: 800 }}>
                    <div className="grid" style={{ gridTemplateColumns: `60px repeat(${visibleDays.length}, 1fr)`, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}>
                      <div className="py-1.5" />
                      {visibleDays.map((day) => {
                        const iso = toISODate(day);
                        const isToday = iso === todayISO;
                        return (
                          <div key={iso} className="text-center py-2 px-1" style={{ borderLeft: `1px solid ${T.borderSoft}` }}>
                            <div className="text-[10px] tracking-[0.06em] uppercase" style={{ color: T.faint }}>{day.toLocaleDateString("en-IN", { weekday: "short" })}</div>
                            <div className="text-[15px] font-semibold mx-auto" style={{ color: isToday ? T.accentInk : T.text, background: isToday ? T.accent : "transparent", borderRadius: isToday ? "50%" : undefined, width: isToday ? 28 : undefined, height: isToday ? 28 : undefined, lineHeight: isToday ? "28px" : undefined }}>{day.getDate()}</div>
                          </div>
                        );
                      })}
                    </div>

                    <div ref={hoursRef} className="flex-1 min-h-0 overflow-y-auto max-h-[560px] lg:max-h-none">
                      {CAL_HOURS.map((hour) => (
                        <div key={hour} className="grid relative" style={{ gridTemplateColumns: `60px repeat(${visibleDays.length}, 1fr)`, minHeight: 40 }}>
                          <div className="text-[10px] tabular-nums text-right pr-2 pt-0.5" style={{ color: T.faint, borderTop: `1px solid ${T.borderSoft}` }}>{formatHour(hour)}</div>
                          {visibleDays.map((day) => {
                            const iso = toISODate(day);
                            const events = (calEvents.get(iso) ?? []).filter((c) => new Date(c.scheduledAt).getHours() === hour);
                            return (
                              <div key={iso} className="relative px-0.5 pt-0.5" style={{ borderTop: `1px solid ${T.borderSoft}`, borderLeft: `1px solid ${T.borderSoft}` }}>
                                {events.map((ev) => {
                                  const dt = new Date(ev.scheduledAt);
                                  const timeStr = dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
                                  const tone = eventTone(ev);
                                  return (
                                    <button
                                      key={ev.id}
                                      onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)}
                                      className="block w-full text-left rounded-[6px] px-1.5 py-1 mb-0.5 text-[10px] leading-tight truncate transition-all hover:brightness-110 cursor-pointer"
                                      style={{ background: `${tone}${selectedEvent?.id === ev.id ? "30" : "18"}`, color: tone, boxShadow: selectedEvent?.id === ev.id ? `inset 0 0 0 1.5px ${tone}` : "none" }}
                                    >
                                      <div className="font-medium truncate">{ev.customerName}</div>
                                      <div className="truncate opacity-75">{timeStr}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                          {todayVisible && hour === nowHour && (
                            <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: `${nowPct}%` }}>
                              <div className="relative h-[2px]" style={{ background: T.danger }}>
                                <span className="absolute left-0.5 top-1/2 -translate-y-1/2 text-[9px] font-bold px-1.5 py-px rounded-full tabular-nums" style={{ background: T.danger, color: "#fdf6ea" }}>
                                  {nowTimeStr}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right rail */}
            <aside className="w-[300px] shrink-0 hidden lg:block space-y-3 lg:max-h-full lg:overflow-y-auto no-scrollbar">
              <div className="rounded-[16px] p-4" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[13px] font-semibold" style={{ color: T.text }}>
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][gtdMonth]} {gtdYear}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { if (gtdMonth === 0) { setGtdMonth(11); setGtdYear((y) => y - 1); } else setGtdMonth((m) => m - 1); }} aria-label="Previous month" className="w-7 h-7 rounded-[8px] flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.12)]" style={{ color: T.muted }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <button onClick={() => { goToToday(); setGtdYear(new Date().getFullYear()); setGtdMonth(new Date().getMonth()); }} className="h-7 px-2.5 rounded-[8px] text-[12px] font-medium cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.12)]" style={{ color: T.text, border: `1px solid ${T.border}` }}>Today</button>
                    <button onClick={() => { if (gtdMonth === 11) { setGtdMonth(0); setGtdYear((y) => y + 1); } else setGtdMonth((m) => m + 1); }} aria-label="Next month" className="w-7 h-7 rounded-[8px] flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.12)]" style={{ color: T.muted }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {["M","T","W","T","F","S","S"].map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-medium py-0.5" style={{ color: T.faint }}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: mmLead }).map((_, i) => <div key={`e${i}`} />)}
                  {Array.from({ length: mmDays }).map((_, i) => {
                    const day = i + 1;
                    const iso = `${gtdYear}-${String(gtdMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const isToday = iso === todayISO;
                    const isSelected = iso === selISO;
                    const hasEvents = calEvents.has(iso);
                    return (
                      <button
                        key={day}
                        onClick={() => { setCalWeekBase(new Date(iso + "T00:00:00")); setSelectedEvent(null); }}
                        className="relative h-8 rounded-full flex items-center justify-center text-[11.5px] tabular-nums transition-colors cursor-pointer hover:bg-[rgba(119,123,98,0.14)]"
                        style={{ background: isToday ? T.danger : isSelected ? T.accent : "transparent", color: isToday || isSelected ? "#fdf6ea" : T.text, fontWeight: isToday || isSelected ? 700 : 400 }}
                      >
                        {day}
                        {hasEvents && !isToday && !isSelected && <span className="absolute bottom-0.5 w-1 h-1 rounded-full" style={{ background: T.accent }} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedEvent ? (() => {
                const ev = selectedEvent;
                const dt = new Date(ev.scheduledAt);
                const es = expertStatus(ev);
                return (
                  <div className="rounded-[16px] p-5" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow, animation: "fadeIn 0.15s ease both" }}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <Chip tone={expertStatusTone(es)}>{expertStatusLabel(es)}</Chip>
                      <button onClick={() => setSelectedEvent(null)} aria-label="Close details" className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(89,82,54,0.10)]" style={{ color: T.muted }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="text-[15px] font-semibold" style={{ color: T.text }}>{ev.customerName}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: T.muted }}>{ev.type ? ev.type.replace(/_/g, " ") : "Consultation"}</div>
                    <div className="mt-4 pt-4 space-y-2.5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                      {[
                        { label: "When", value: `${dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · ${dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}` },
                        { label: "Meeting", value: ev.meetingLink ? "Link ready" : "Link pending" },
                        { label: "ID", value: ev.id },
                      ].map((row) => (
                        <div key={row.label} className="flex gap-3 text-[12.5px]">
                          <span className="w-[76px] shrink-0" style={{ color: T.faint }}>{row.label}</span>
                          <span className="min-w-0" style={{ color: T.text }}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <Link href={`/appointments/${ev.id}`} className="mt-4 h-9 w-full rounded-[9px] text-[13px] font-semibold inline-flex items-center justify-center transition-all duration-200 hover:brightness-110" style={{ background: T.accent, color: T.accentInk }}>
                      Open details
                    </Link>
                  </div>
                );
              })() : (
                <div className="rounded-[16px] p-5 text-center" style={{ background: T.card, border: `1px dashed ${T.border}` }}>
                  <div className="text-[12.5px]" style={{ color: T.faint }}>
                    Select an appointment on the calendar to see its details here.
                  </div>
                </div>
              )}
            </aside>
          </div>
          </>
        );
      })()}
      </div>
    </>
  );
}
