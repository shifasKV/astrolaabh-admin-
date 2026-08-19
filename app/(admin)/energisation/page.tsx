"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  PageHeader, Card, Chip, Tabs, Pagination,
  Tooltip, ToolbarSearch, ExportBtn, downloadXLS, downloadPDF, InlineFilter, MultiCheck, SortMenu, DateRangePanel, EmptyState, TableSkeleton, MobileListCard } from "@/components/ui";

const E_ICONS = {
  expert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  date: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  status: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>,
};
const E_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "upcoming", label: "Upcoming" },
  { value: "order_desc", label: "Order: Newest" },
  { value: "order_asc", label: "Order: Oldest" },
];
import { T } from "@/lib/theme";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import { MOCK_ENERGISATION } from "@/lib/mock";

type SortKey = "newest" | "oldest" | "upcoming" | "order_desc" | "order_asc";
type ViewMode = "list" | "calendar";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const TABS = [
  { key: "all", label: "All" },
  { key: "not_scheduled", label: "Not scheduled" },
  { key: "scheduled", label: "Scheduled" },
  { key: "completed", label: "Completed" },
];

const STATUS_FILTER_LABEL: Record<string, string> = {
  not_scheduled: "Not scheduled",
  link_pending: "Link pending",
  scheduled: "Scheduled",
  completed: "Done",
};

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
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterExpert, setFilterExpert] = useState<string[]>([]);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [calWeekBase, setCalWeekBase] = useState(() => new Date());
  const [calScope, setCalScope] = useState<"day" | "week">("week");
  const hoursRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    /* open on the working morning, not midnight */
    if (viewMode === "calendar" && hoursRef.current) hoursRef.current.scrollTop = 5 * 40;
  }, [viewMode, calScope]);
  const [selectedEvent, setSelectedEvent] = useState<(typeof MOCK_ENERGISATION)[number] | null>(null);
  const [gtdYear, setGtdYear] = useState(new Date().getFullYear());
  const [gtdMonth, setGtdMonth] = useState(new Date().getMonth());

  const PER_PAGE = 10;
  const loading = useSimulatedLoad();

  const matchesStatus = (e: (typeof MOCK_ENERGISATION)[number], status: string) => {
    if (!status) return true;
    if (status === "not_scheduled") return e.status === "pending";
    if (status === "link_pending") return e.status === "scheduled" && !e.liveLink;
    if (status === "scheduled") return e.status === "scheduled";
    if (status === "completed") return e.status === "completed";
    return true;
  };

  const filtered = MOCK_ENERGISATION.filter((e) => e.status !== "not_required").filter((e) => {
    if (tab === "all") return true;
    return matchesStatus(e, tab);
  }).filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.customerName.toLowerCase().includes(q) || e.orderNumber.toLowerCase().includes(q) || e.stoneDescription.toLowerCase().includes(q);
  }).filter((e) => {
    if (filterCustomer && e.customerName !== filterCustomer) return false;
    return true;
  }).filter((e) => {
    if (filterStatus.length === 0) return true;
    return filterStatus.some((s) => matchesStatus(e, s));
  }).filter((e) => {
    if (filterExpert.length === 0) return true;
    return filterExpert.includes(e.assignedTo || "");
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
    if (sort === "upcoming") {
      const now = new Date().toISOString();
      const aFuture = (a.scheduledAt ?? "") >= now ? 0 : 1;
      const bFuture = (b.scheduledAt ?? "") >= now ? 0 : 1;
      if (aFuture !== bFuture) return aFuture - bFuture;
      return (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? "");
    }
    if (sort === "order_desc") return b.orderNumber.localeCompare(a.orderNumber);
    if (sort === "order_asc") return a.orderNumber.localeCompare(b.orderNumber);
    return 0;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const allActive = MOCK_ENERGISATION.filter((e) => e.status !== "not_required");
  const uniqueCustomers = [...new Set(allActive.map((e) => e.customerName))].sort();
  const uniqueExperts = [...new Set(allActive.map((e) => e.assignedTo).filter(Boolean))] as string[];
  const hasActiveFilters = !!filterCustomer || filterStatus.length > 0 || filterExpert.length > 0 || !!filterDateFrom || !!filterDateTo;
  const activeFilterCount = [filterCustomer, filterStatus.length > 0 ? "1" : "", filterExpert.length > 0 ? "1" : "", filterDateFrom || filterDateTo].filter(Boolean).length;
  const tabCounts: Record<string, number> = {
    all: allActive.length,
    not_scheduled: allActive.filter(e => matchesStatus(e, "not_scheduled")).length,
    scheduled: allActive.filter(e => matchesStatus(e, "scheduled")).length,
    completed: allActive.filter(e => matchesStatus(e, "completed")).length,
  };
  const statusOptions = [
    { value: "", label: "All statuses", count: allActive.length },
    ...Object.entries(STATUS_FILTER_LABEL).map(([value, label]) => ({
      value,
      label,
      count: allActive.filter((e) => matchesStatus(e, value)).length,
    })),
  ];

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

  const visibleDays = calScope === "day" ? [calWeekBase] : weekDays;

  /* Today lands on today's day view — the day's actual schedule, not just the week */
  const goToToday = () => {
    setCalWeekBase(new Date());
    setCalScope("day");
  };

  const handleExport = ({ from, to, format, periodLabel }: { from: string; to: string; format: "pdf" | "xls"; periodLabel: string }) => {
    const inRange = (d: string) => (!from || d.slice(0, 10) >= from) && (!to || d.slice(0, 10) <= to);
    const header = ["Order", "Customer", "Stone", "Assigned to", "Scheduled", "Status"];
    const rows = filtered.filter((e) => inRange(e.scheduledAt || e.createdAt || "")).map((e) => [e.orderNumber, e.customerName, e.stoneDescription, e.assignedTo || "—", e.scheduledAt || "—", e.status] as (string | number)[]);
    if (format === "xls") downloadXLS(header, rows, `energisation-${from}-to-${to}.xls`);
    else downloadPDF(`Energisation — ${periodLabel}`, header, rows);
  };

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <PageHeader title="Energisation management" action={<ExportBtn onExport={handleExport} dateLabel="Select energisation date range" />} />

      {/* Pinned controls */}
      <div
        className="sticky top-0 z-30 -mx-5 md:-mx-10 px-5 md:px-10 pt-1 pb-1 mb-1"
        style={{ background: "transparent" }}
      >
        {/* Tabs row + view toggle */}
        <div className="flex flex-wrap items-center gap-2 pb-2.5">
          <Tabs
            tabs={TABS.map((t) => ({ ...t, count: tabCounts[t.key] ?? 0 }))}
            active={tab}
            onChange={(k) => { setTab(k); setPage(1); }}
          />
          {tab === "all" && (
            <div className="ml-auto inline-flex items-center gap-1 p-1 rounded-full shrink-0" style={{ background: "rgba(89,82,54,0.07)", border: `1px solid ${T.borderSoft}` }}>
              {(["list", "calendar"] as const).map((mode) => (
                <Tooltip key={mode} label={mode === "list" ? "List view" : "Calendar view"}>
                <button onClick={() => setViewMode(mode)} aria-label={mode === "list" ? "List view" : "Calendar view"}
                  className="h-8 w-11 rounded-full inline-flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer"
                  style={viewMode === mode ? { background: T.card, color: T.text, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(43,42,34,0.10)" } : { color: T.muted, border: "1px solid transparent" }}>
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

        {/* Filter strip — filters left, search + sort right */}
        <div className="flex flex-wrap items-center gap-2 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
          <div className="flex flex-wrap items-center gap-2">
            {viewMode === "list" && (
              <>
                <InlineFilter label="Expert" icon={E_ICONS.expert} count={filterExpert.length} width={240}>
                  <MultiCheck options={uniqueExperts.map((e) => ({ value: e, label: e }))} value={filterExpert} onChange={setFilterExpert} onAfter={() => setPage(1)} />
                </InlineFilter>
                <InlineFilter label="Date" icon={E_ICONS.date} count={filterDateFrom || filterDateTo ? 1 : 0} width={440}>
                  <DateRangePanel from={filterDateFrom} to={filterDateTo} onChange={(f, t) => { setFilterDateFrom(f); setFilterDateTo(t); setPage(1); }} />
                </InlineFilter>
                <InlineFilter label="Status" icon={E_ICONS.status} count={filterStatus.length}>
                  <MultiCheck options={Object.entries(STATUS_FILTER_LABEL).map(([k, v]) => ({ value: k, label: v }))} value={filterStatus} onChange={setFilterStatus} onAfter={() => setPage(1)} />
                </InlineFilter>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setFilterCustomer(""); setFilterStatus([]); setFilterExpert([]); setFilterDateFrom(""); setFilterDateTo(""); setPage(1); }}
                    className="text-[12px] font-medium px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap"
                    style={{ color: T.danger }}
                  >
                    Clear all
                  </button>
                )}
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ToolbarSearch value={search} onChange={setSearch} placeholder="Search customer, order, stone…" />
            <SortMenu value={sort} onChange={(val) => { setSort(val as SortKey); setPage(1); }} options={E_SORT_OPTIONS} />
          </div>
        </div>
      </div>

      {viewMode === "list" && <>
      <Card className="!p-0 md:flex md:flex-col md:min-h-0">
        {loading ? (
          <TableSkeleton cols={4} rows={8} />
        ) : (
          <>
        <div
          className="hidden sm:grid grid-cols-[64px_1fr_130px_150px] gap-3 items-center px-4 h-10 text-[11px] font-medium tracking-[0.06em] uppercase rounded-t-[15px]"
          style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
        >
          <span>Order</span>
          <span>Energisation</span>
          <span>Scheduled</span>
          <span>Status</span>
        </div>
        <div className="md:flex-1 md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">

        {paginated.length === 0 ? (
          <EmptyState inline icon="search" title="No energisation tasks" description="Nothing matches these filters right now." />
        ) : (
          paginated.map((e, idx) => {
            /* One status per row, most urgent wins — not scheduled > link pending > scheduled > done */
            const st =
              e.status === "pending"
                ? { tone: "danger" as const, label: "Not scheduled" }
                : e.status === "scheduled" && !e.liveLink
                  ? { tone: "danger" as const, label: "Link pending" }
                  : e.status === "scheduled"
                    ? { tone: "gold" as const, label: "Scheduled" }
                    : { tone: "good" as const, label: "Done" };
            return (
              <div key={e.id}>
              <MobileListCard
                className="sm:hidden"
                href={`/energisation/${e.id}`}
                title={e.customerName}
                sub={e.stoneDescription}
                rightSub={e.scheduledAt ? new Date(e.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                chips={<Chip tone={st.tone}>{st.label}</Chip>}
              />
              <Link
                href={`/energisation/${e.id}`}
                className="group hidden sm:grid sm:grid-cols-[64px_1fr_130px_150px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors duration-150 last:rounded-b-[15px] even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
                style={{ borderBottom: idx < paginated.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
              >
                <span className="text-[11.5px] tabular-nums" style={{ color: T.faint }}>#{e.orderNumber.replace("AL-ORD-", "")}</span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{e.customerName}</div>
                  <div className="text-[12px] truncate mt-px" style={{ color: T.muted }}>
                    {e.method || "Method not assigned"}
                    {e.assignedTo && <span style={{ color: T.faint }}> — {e.assignedTo}</span>}
                  </div>
                </div>
                <span className="text-[12px] tabular-nums" style={{ color: T.muted }}>
                  {e.scheduledAt
                    ? new Date(e.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                    : "—"}
                </span>
                <div><Chip tone={st.tone}>{st.label}</Chip></div>
              </Link>
              </div>
            );
          })
        )}
        </div>
          </>
        )}
      </Card>

      <Pagination page={currentPage - 1} totalPages={totalPages} totalItems={filtered.length} perPage={PER_PAGE} onPageChange={(p) => setPage(p + 1)} />
      </>}

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
          <div className="flex items-start gap-4 md:flex-1 md:min-h-0">
            {/* ——— Main timeline ——— */}
            <div className="flex-1 min-w-0 h-full flex flex-col">
              {/* Big date title + scope pills */}
              <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
                <div>
                  <h2 className="font-title text-[26px] leading-tight tracking-[-0.02em]">
                    <span className="font-bold" style={{ color: T.text }}>
                      {calScope === "day"
                        ? calWeekBase.toLocaleDateString("en-IN", { day: "numeric", month: "long" })
                        : `${weekDays[0].toLocaleDateString("en-IN", { day: "numeric", month: "short" })} — ${weekDays[6].toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                    </span>
                    <span className="font-normal" style={{ color: T.muted }}> {calScope === "day" ? calWeekBase.getFullYear() : weekDays[6].getFullYear()}</span>
                  </h2>
                  <div className="text-[13.5px] mt-0.5" style={{ color: T.muted }}>
                    {calScope === "day" ? calWeekBase.toLocaleDateString("en-IN", { weekday: "long" }) : "Week view"}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden xl:flex items-center gap-4">
                    {[
                      { color: T.info, label: "Scheduled" },
                      { color: T.gold, label: "In progress" },
                      { color: T.good, label: "Completed" },
                    ].map((l) => (
                      <span key={l.label} className="inline-flex items-center gap-1.5 text-[11.5px]" style={{ color: T.muted }}>
                        <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                        {l.label}
                      </span>
                    ))}
                  </div>
                  <div
                    className="inline-flex items-center gap-1 p-1 rounded-full shrink-0"
                    style={{ background: "rgba(89,82,54,0.07)", border: `1px solid ${T.borderSoft}` }}
                  >
                    {(["day", "week"] as const).map((scope) => (
                      <button
                        key={scope}
                        onClick={() => { setCalScope(scope); setSelectedEvent(null); }}
                        className="h-7 px-3.5 rounded-full text-[12.5px] capitalize shrink-0 transition-all duration-200 cursor-pointer"
                        style={
                          calScope === scope
                            ? { background: T.card, color: T.text, fontWeight: 600, border: `1px solid ${T.border}`, boxShadow: "0 1px 3px rgba(43,42,34,0.10)" }
                            : { color: T.muted, border: "1px solid transparent" }
                        }
                      >
                        {scope}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timeline grid */}
              <Card className="overflow-hidden !p-0 flex-1 min-h-0 flex flex-col w-full">
                <div className="overflow-x-auto flex-1 min-h-0 flex flex-col">
                  <div className="h-full flex flex-col" style={{ minWidth: calScope === "day" ? 0 : 800 }}>
                    {/* Day headers */}
                    <div className="grid sticky top-0 z-10" style={{ gridTemplateColumns: `60px repeat(${visibleDays.length}, 1fr)`, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}>
                      <div className="py-1.5" />
                      {visibleDays.map((day) => {
                        const iso = toISODate(day);
                        const isToday = iso === todayISO;
                        return (
                          <div key={iso} className="text-center py-2 px-1" style={{ borderLeft: `1px solid ${T.borderSoft}` }}>
                            <div className="text-[10px] tracking-[0.06em] uppercase" style={{ color: T.faint }}>
                              {day.toLocaleDateString("en-IN", { weekday: "short" })}
                            </div>
                            <div
                              className="text-[15px] font-semibold mx-auto"
                              style={{
                                color: isToday ? T.accentInk : T.text,
                                background: isToday ? T.accent : "transparent",
                                borderRadius: isToday ? "50%" : undefined,
                                width: isToday ? 28 : undefined,
                                height: isToday ? 28 : undefined,
                                lineHeight: isToday ? "28px" : undefined,
                              }}
                            >
                              {day.getDate()}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Hour rows — fills the viewport, page itself never scrolls */}
                    <div ref={hoursRef} className="flex-1 min-h-0 overflow-y-auto max-h-[560px] lg:max-h-none">
                      {HOURS.map((hour) => (
                        <div key={hour} className="grid relative" style={{ gridTemplateColumns: `60px repeat(${visibleDays.length}, 1fr)`, minHeight: 40 }}>
                          <div className="text-[10px] tabular-nums text-right pr-2 pt-0.5" style={{ color: T.faint, borderTop: `1px solid ${T.borderSoft}` }}>
                            {formatHour(hour)}
                          </div>
                          {visibleDays.map((day) => {
                            const iso = toISODate(day);
                            const events = (calEvents.get(iso) ?? []).filter((e) => {
                              const h = new Date(e.scheduledAt!).getHours();
                              return h === hour;
                            });
                            return (
                              <div key={iso} className="relative px-0.5 pt-0.5" style={{ borderTop: `1px solid ${T.borderSoft}`, borderLeft: `1px solid ${T.borderSoft}` }}>
                                {events.map((ev) => {
                                  const dt = new Date(ev.scheduledAt!);
                                  const timeStr = dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
                                  const toneColor =
                                    ev.status === "completed" ? T.good :
                                    ev.status === "in_progress" ? T.gold :
                                    ev.status === "scheduled" ? T.info :
                                    T.muted;
                                  return (
                                    <button
                                      key={ev.id}
                                      onClick={() => setSelectedEvent(selectedEvent?.id === ev.id ? null : ev)}
                                      className="block w-full text-left rounded-[6px] px-1.5 py-1 mb-0.5 text-[10px] leading-tight truncate transition-all hover:brightness-110 cursor-pointer"
                                      style={{
                                        background: `${toneColor}${selectedEvent?.id === ev.id ? "30" : "18"}`,
                                        color: toneColor,
                                        boxShadow: selectedEvent?.id === ev.id ? `inset 0 0 0 1.5px ${toneColor}` : "none",
                                      }}
                                    >
                                      <div className="font-medium truncate">{ev.customerName}</div>
                                      <div className="truncate opacity-75">{timeStr} · {ev.stoneDescription.split("·")[0].trim()}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                          {/* Current time — red line with time bubble */}
                          {todayVisible && hour === nowHour && (
                            <div className="absolute left-0 right-0 z-10 pointer-events-none" style={{ top: `${nowPct}%` }}>
                              <div className="relative h-[2px]" style={{ background: T.danger }}>
                                <span
                                  className="absolute left-0.5 top-1/2 -translate-y-1/2 text-[9px] font-bold px-1.5 py-px rounded-full tabular-nums"
                                  style={{ background: T.danger, color: "#fdf6ea" }}
                                >
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

            {/* ——— Right rail: mini month + event details ——— */}
            <aside className="w-[300px] shrink-0 hidden lg:block space-y-3 lg:max-h-full lg:overflow-y-auto no-scrollbar">
              {/* Mini month */}
              <div className="rounded-[16px] p-4" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }}>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[13px] font-semibold" style={{ color: T.text }}>
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][gtdMonth]} {gtdYear}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { if (gtdMonth === 0) { setGtdMonth(11); setGtdYear((y) => y - 1); } else setGtdMonth((m) => m - 1); }}
                      aria-label="Previous month"
                      className="w-7 h-7 rounded-[8px] flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.12)]"
                      style={{ color: T.muted }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="m15 18-6-6 6-6" /></svg>
                    </button>
                    <button
                      onClick={goToToday}
                      className="h-7 px-2.5 rounded-[8px] text-[12px] font-medium cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.12)]"
                      style={{ color: T.text, border: `1px solid ${T.border}` }}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => { if (gtdMonth === 11) { setGtdMonth(0); setGtdYear((y) => y + 1); } else setGtdMonth((m) => m + 1); }}
                      aria-label="Next month"
                      className="w-7 h-7 rounded-[8px] flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.12)]"
                      style={{ color: T.muted }}
                    >
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
                        style={{
                          background: isToday ? T.danger : isSelected ? T.accent : "transparent",
                          color: isToday || isSelected ? "#fdf6ea" : T.text,
                          fontWeight: isToday || isSelected ? 700 : 400,
                        }}
                      >
                        {day}
                        {hasEvents && !isToday && !isSelected && (
                          <span className="absolute bottom-0.5 w-1 h-1 rounded-full" style={{ background: T.accent }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Event details */}
              {selectedEvent ? (() => {
                const ev = selectedEvent;
                const dt = ev.scheduledAt ? new Date(ev.scheduledAt) : null;
                const st =
                  ev.status === "completed"
                    ? { tone: "good" as const, label: "Done" }
                    : ev.status === "in_progress"
                      ? { tone: "gold" as const, label: "In progress" }
                      : ev.status === "scheduled" && !ev.liveLink
                        ? { tone: "danger" as const, label: "Link pending" }
                        : { tone: "info" as const, label: "Scheduled" };
                return (
                  <div
                    className="rounded-[16px] p-5"
                    style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow, animation: "fadeIn 0.15s ease both" }}
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <Chip tone={st.tone}>{st.label}</Chip>
                      <button
                        onClick={() => setSelectedEvent(null)}
                        aria-label="Close details"
                        className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(89,82,54,0.10)]"
                        style={{ color: T.muted }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="text-[15px] font-semibold" style={{ color: T.text }}>{ev.customerName}</div>
                    <div className="text-[12.5px] mt-0.5" style={{ color: T.muted }}>{ev.stoneDescription}</div>

                    <div className="mt-4 pt-4 space-y-2.5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                      {[
                        { label: "When", value: dt ? `${dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · ${dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}` : "Not scheduled" },
                        { label: "Ritual", value: ev.method || "Method not assigned" },
                        { label: "Assigned", value: ev.assignedTo || "—" },
                        { label: "Order", value: ev.orderNumber },
                        { label: "Live link", value: ev.liveLink ? "Ready" : "Pending" },
                      ].map((row) => (
                        <div key={row.label} className="flex gap-3 text-[12.5px]">
                          <span className="w-[76px] shrink-0" style={{ color: T.faint }}>{row.label}</span>
                          <span className="min-w-0" style={{ color: T.text }}>{row.value}</span>
                        </div>
                      ))}
                    </div>

                    {ev.notes && (
                      <div className="mt-3 pt-3 text-[12px] leading-relaxed" style={{ borderTop: `1px solid ${T.borderSoft}`, color: T.muted }}>
                        {ev.notes}
                      </div>
                    )}

                    <Link
                      href={`/energisation/${ev.id}`}
                      className="mt-4 h-9 w-full rounded-[9px] text-[13px] font-semibold inline-flex items-center justify-center transition-all duration-200 hover:brightness-110"
                      style={{ background: T.accent, color: T.accentInk }}
                    >
                      Open details
                    </Link>
                  </div>
                );
              })() : (
                <div
                  className="rounded-[16px] p-5 text-center"
                  style={{ background: T.card, border: `1px dashed ${T.border}` }}
                >
                  <div className="text-[12.5px]" style={{ color: T.faint }}>
                    Select a ritual on the calendar to see its details here.
                  </div>
                </div>
              )}
            </aside>
          </div>
        );
      })()}
      </div>
    </>
  );
}
