"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  PageHeader, Card, Chip, Tabs, GoldBtn, Pagination,
  Tooltip, ToolbarSearch, ExportBtn, downloadXLS, downloadPDF, InlineFilter, MultiCheck, SortMenu, DateRangePanel, EmptyState, TableSkeleton, MobileListCard, Monogram } from "@/components/ui";

const C_ICONS = {
  expert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  status: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>,
  date: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
};
const C_SORT_OPTIONS = [
  { value: "date_desc", label: "Newest" },
  { value: "date_asc", label: "Oldest" },
  { value: "upcoming", label: "Upcoming" },
];
import { T } from "@/lib/theme";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import { usePersistentState } from "@/lib/usePersistentState";
import { MOCK_CONSULTATIONS, MOCK_INCOMPLETE_CONSULTATIONS } from "@/lib/mock";

const TABS = [
  { key: "all", label: "All" },
  { key: "reschedule", label: "Reschedule Request" },
  { key: "summary_due", label: "Recommendation due" },
  { key: "no_show", label: "No show" },
  { key: "incomplete", label: "Incomplete" },
];

const INC_REASON_LABEL: Record<string, string> = { slot_check: "Slot check", payment_failed: "Payment failed", requested_call: "Requested call" };
const INC_REASON_TONE: Record<string, "danger" | "gold" | "muted"> = { slot_check: "muted", payment_failed: "danger", requested_call: "gold" };

const STATUS_FILTER_LABEL: Record<string, string> = {
  payment_pending: "Payment pending",
  scheduled: "Scheduled",
  reschedule: "Reschedule request",
  summary_due: "Recommendation due",
  no_show: "No show",
  done: "Done",
};

type SortKey = "date_desc" | "date_asc" | "upcoming";
type ViewMode = "list" | "calendar";

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

export default function ConsultationsPage() {
  const [viewMode, setViewMode] = usePersistentState<ViewMode>("pref-consult-view", "list");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterExpert, setFilterExpert] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [page, setPage] = useState(1);

  // Incomplete tab
  const [incFilterCustomer, setIncFilterCustomer] = useState("");
  const [incFilterExpert, setIncFilterExpert] = useState("");
  const [incFilterReason, setIncFilterReason] = useState("");
  const [incFilterDateFrom, setIncFilterDateFrom] = useState("");
  const [incFilterDateTo, setIncFilterDateTo] = useState("");
  const [incSort, setIncSort] = useState<SortKey>("date_desc");
  const [incPage, setIncPage] = useState(1);

  // Calendar
  const [calWeekBase, setCalWeekBase] = useState(() => new Date());
  const [calScope, setCalScope] = usePersistentState<"day" | "week">("pref-cal-scope", "week");
  const [selectedEvent, setSelectedEvent] = useState<(typeof MOCK_CONSULTATIONS)[number] | null>(null);
  const [gtdYear, setGtdYear] = useState(new Date().getFullYear());
  const [gtdMonth, setGtdMonth] = useState(new Date().getMonth());
  const hoursRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (viewMode === "calendar" && hoursRef.current) hoursRef.current.scrollTop = 5 * 40;
  }, [viewMode, calScope]);

  const PER_PAGE = 10;
  const loading = useSimulatedLoad();

  const matchesStatus = (c: (typeof MOCK_CONSULTATIONS)[number], status: string) => {
    if (!status) return true;
    if (status === "payment_pending") return c.paymentStatus === "pending";
    if (status === "scheduled") return c.status === "scheduled";
    if (status === "reschedule") return c.status === "reschedule_requested";
    if (status === "summary_due") return c.status === "summary_pending";
    if (status === "no_show") return c.status === "no_show";
    if (status === "done") return c.status === "closed" || c.status === "completed";
    return true;
  };

  const uniqueExperts = [...new Set(MOCK_CONSULTATIONS.map((c) => c.expertName))].sort();

  const filtered = MOCK_CONSULTATIONS
    .filter((c) => {
      if (tab === "all" || tab === "incomplete") return true;
      return matchesStatus(c, tab);
    })
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.customerName.toLowerCase().includes(q) || c.expertName.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
    })
    .filter((c) => !filterCustomer || c.customerName === filterCustomer)
    .filter((c) => filterExpert.length === 0 || filterExpert.includes(c.expertName))
    .filter((c) => {
      if (filterStatus.length === 0) return true;
      return filterStatus.some((s) => matchesStatus(c, s));
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
      if (sort === "upcoming") {
        const now = Date.now();
        const aF = new Date(a.scheduledAt).getTime() >= now ? 0 : 1;
        const bF = new Date(b.scheduledAt).getTime() >= now ? 0 : 1;
        if (aF !== bF) return aF - bF;
        return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      }
      return 0;
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const hasActiveFilters = !!filterCustomer || filterExpert.length > 0 || filterStatus.length > 0 || !!filterDateFrom || !!filterDateTo;
  const tabCounts: Record<string, number> = {
    all: MOCK_CONSULTATIONS.length,
    reschedule: MOCK_CONSULTATIONS.filter(c => matchesStatus(c, "reschedule")).length,
    summary_due: MOCK_CONSULTATIONS.filter(c => matchesStatus(c, "summary_due")).length,
    no_show: MOCK_CONSULTATIONS.filter(c => matchesStatus(c, "no_show")).length,
    incomplete: MOCK_INCOMPLETE_CONSULTATIONS.length,
  };
  // Incomplete
  const incCustomers = [...new Set(MOCK_INCOMPLETE_CONSULTATIONS.map((c) => c.customerName))].sort();
  const incExperts = [...new Set(MOCK_INCOMPLETE_CONSULTATIONS.map((c) => c.expertName))].sort();


  const incFiltered = MOCK_INCOMPLETE_CONSULTATIONS
    .filter((c) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return c.customerName.toLowerCase().includes(q) || c.expertName.toLowerCase().includes(q);
    })
    .filter((c) => !incFilterCustomer || c.customerName === incFilterCustomer)
    .filter((c) => !incFilterExpert || c.expertName === incFilterExpert)
    .filter((c) => !incFilterReason || c.reason === incFilterReason)
    .filter((c) => {
      if (incFilterDateFrom && c.date < incFilterDateFrom) return false;
      if (incFilterDateTo && c.date > incFilterDateTo) return false;
      return true;
    })
    .sort((a, b) => (incSort === "date_asc" ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime()));

  const incTotalPages = Math.ceil(incFiltered.length / PER_PAGE);
  const incCurrentPage = incPage > incTotalPages && incTotalPages > 0 ? incTotalPages : incPage;
  const incPaginated = incFiltered.slice((incCurrentPage - 1) * PER_PAGE, incCurrentPage * PER_PAGE);

  // Calendar data
  const weekDays = useMemo(() => getWeekDays(calWeekBase), [calWeekBase]);
  const visibleDays = calScope === "day" ? [calWeekBase] : weekDays;
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

  const goToToday = () => {
    setCalWeekBase(new Date());
    setCalScope("day");
  };

  const rowStatus = (c: (typeof MOCK_CONSULTATIONS)[number]) => {
    if (c.paymentStatus === "pending") return { tone: "gold" as const, label: "Payment pending" };
    if (c.status === "reschedule_requested") return { tone: "gold" as const, label: "Reschedule request" };
    if (c.status === "summary_pending") return { tone: "danger" as const, label: "Recommendation due" };
    if (c.status === "no_show") return { tone: "danger" as const, label: c.noShowBy === "expert" ? "Expert no show" : "Customer no show" };
    if (c.status === "closed" || c.status === "completed") return { tone: "good" as const, label: "Done" };
    if (c.status === "scheduled") return { tone: "info" as const, label: "Scheduled" };
    return { tone: "muted" as const, label: c.status };
  };

  const eventTone = (c: (typeof MOCK_CONSULTATIONS)[number]) =>
    c.status === "closed" || c.status === "completed" ? T.good :
    c.status === "scheduled" ? T.info :
    c.status === "reschedule_requested" ? T.gold :
    c.status === "summary_pending" || c.status === "no_show" ? T.danger :
    T.muted;

  const handleExport = ({ from, to, format, periodLabel }: { from: string; to: string; format: "pdf" | "xls"; periodLabel: string }) => {
    const inRange = (d: string) => (!from || d.slice(0, 10) >= from) && (!to || d.slice(0, 10) <= to);
    if (tab === "incomplete") {
      const header = ["Customer", "Expert", "Date", "Reason"];
      const rows = incFiltered.filter((c) => inRange(c.date)).map((c) => [c.customerName, c.expertName, c.date, INC_REASON_LABEL[c.reason] || c.reason]);
      if (format === "xls") downloadXLS(header, rows, `incomplete-consultations-${from}-to-${to}.xls`);
      else downloadPDF(`Incomplete consultations — ${periodLabel}`, header, rows);
    } else {
      const header = ["ID", "Customer", "Expert", "Scheduled at", "Status", "Payment"];
      const rows = filtered.filter((c) => inRange(c.scheduledAt || "")).map((c) => [c.id, c.customerName, c.expertName, c.scheduledAt || "—", c.status || "—", c.paymentStatus || "—"] as (string | number)[]);
      if (format === "xls") downloadXLS(header, rows, `consultations-${from}-to-${to}.xls`);
      else downloadPDF(`Consultations — ${periodLabel}`, header, rows);
    }
  };

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <PageHeader
        title="Consultations"
        action={
          <div className="flex items-center gap-2.5">
            <ExportBtn onExport={handleExport} dateLabel="Select consultation date range" />
            <Link href="/consultations/create"><GoldBtn>+ New consultation</GoldBtn></Link>
          </div>
        }
      />



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
            onChange={(key) => { setTab(key); if (key !== "all") setViewMode("list"); setPage(1); }}
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
            <InlineFilter label="Expert" icon={C_ICONS.expert} count={filterExpert.length} width={240}>
              <MultiCheck options={uniqueExperts.map((e) => ({ value: e, label: e }))} value={filterExpert} onChange={setFilterExpert} onAfter={() => setPage(1)} />
            </InlineFilter>
            <InlineFilter label="Status" icon={C_ICONS.status} count={filterStatus.length}>
              <MultiCheck options={Object.entries(STATUS_FILTER_LABEL).map(([k, v]) => ({ value: k, label: v }))} value={filterStatus} onChange={setFilterStatus} onAfter={() => setPage(1)} />
            </InlineFilter>
            <InlineFilter label="Date" icon={C_ICONS.date} count={filterDateFrom || filterDateTo ? 1 : 0} width={440}>
              <DateRangePanel from={filterDateFrom} to={filterDateTo} onChange={(f, t) => { setFilterDateFrom(f); setFilterDateTo(t); setPage(1); }} />
            </InlineFilter>
            {hasActiveFilters && (
              <button
                onClick={() => { setFilterCustomer(""); setFilterExpert([]); setFilterStatus([]); setFilterDateFrom(""); setFilterDateTo(""); setPage(1); }}
                className="text-[12px] font-medium px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap"
                style={{ color: T.danger }}
              >
                Clear all
              </button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ToolbarSearch value={search} onChange={setSearch} placeholder="Search customer, expert, ID…" />
            <SortMenu value={sort} onChange={(v) => { setSort(v as SortKey); setPage(1); }} options={C_SORT_OPTIONS} />
          </div>
        </div>
      </div>

      {/* ============ List view ============ */}
      {tab !== "incomplete" && viewMode === "list" && <>
      <Card className="!p-0 md:flex md:flex-col md:min-h-0">
        {loading ? (
          <TableSkeleton cols={4} rows={8} />
        ) : (
          <>
        <div
          className="hidden sm:grid grid-cols-[64px_1fr_150px_170px] gap-3 items-center px-4 h-10 text-[11px] font-medium tracking-[0.06em] uppercase rounded-t-[15px]"
          style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
        >
          <span>ID</span>
          <span>Customer</span>
          <span>Scheduled</span>
          <span>Status</span>
        </div>
        <div className="md:flex-1 md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">
          {paginated.length === 0 ? (
            <EmptyState inline icon="search" title="No consultations" description="Try a different search or clear the filters." />
          ) : (
            paginated.map((c, idx) => {
              const st = rowStatus(c);
              const dt = new Date(c.scheduledAt);
              return (
                <div key={c.id}>
                <MobileListCard
                  className="sm:hidden"
                  href={`/consultations/${c.id}`}
                  leading={<Monogram name={c.customerName} />}
                  title={c.customerName}
                  sub={`${c.type.replace(/_/g, " ").replace(/^./, (ch) => ch.toUpperCase())} with ${c.expertName}`}
                  status={{ label: st.label, tone: st.tone }}
                  time={c.scheduledAt}
                />
                <Link
                  href={`/consultations/${c.id}`}
                  className="group hidden sm:grid sm:grid-cols-[64px_1fr_150px_170px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors duration-150 last:rounded-b-[15px] even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
                  style={{ borderBottom: idx < paginated.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                >
                  <span className="text-[11.5px] tabular-nums" style={{ color: T.faint }}>#{c.id.replace(/\D/g, "")}</span>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{c.customerName}</div>
                    <div className="text-[12px] truncate mt-px" style={{ color: T.muted }}>with {c.expertName}</div>
                  </div>
                  <span className="text-[12px] tabular-nums" style={{ color: T.muted }}>
                    {dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    <span style={{ color: T.faint }}> · {dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}</span>
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

      {/* ============ Incomplete bookings ============ */}
      {tab === "incomplete" && (
        <>
          <Card className="!p-0 md:flex md:flex-col md:min-h-0">
            {loading ? (
              <TableSkeleton cols={4} rows={8} />
            ) : (
              <>
            <div
              className="hidden sm:grid grid-cols-[1fr_1fr_100px_100px_140px] gap-3 items-center px-4 h-10 text-[11px] font-medium tracking-[0.06em] uppercase rounded-t-[15px]"
              style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <span>Customer</span>
              <span>Astrologer</span>
              <span>Date</span>
              <span>Assignee</span>
              <span>Reason</span>
            </div>
            <div className="md:flex-1 md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">
              {incPaginated.length === 0 ? (
                <EmptyState inline icon="check" title="No incomplete bookings" description="Nothing needs recovery right now." />
              ) : (
                incPaginated.map((c, idx) => (
                  <div key={c.id}>
                  <MobileListCard
                    className="sm:hidden"
                    href={`/consultations/incomplete/${c.id}`}
                    leading={<Monogram name={c.customerName} tone="muted" />}
                    title={c.customerName}
                    sub={`Booking with ${c.expertName}`}
                    status={{ label: INC_REASON_LABEL[c.reason] || c.reason, tone: INC_REASON_TONE[c.reason] || "muted" }}
                    time={c.date}
                    facts={c.assignedTo ? [{ label: "with", value: c.assignedTo }] : undefined}
                  />
                  <Link
                    href={`/consultations/incomplete/${c.id}`}
                    className="hidden sm:grid sm:grid-cols-[1fr_1fr_100px_100px_140px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors duration-150 last:rounded-b-[15px] even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
                    style={{ borderBottom: idx < incPaginated.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                  >
                    <span className="text-[13px] font-semibold truncate block" style={{ color: T.text }}>{c.customerName}</span>
                    <span className="text-[12.5px] truncate block" style={{ color: T.muted }}>{c.expertName}</span>
                    <span className="text-[12px] tabular-nums" style={{ color: T.muted }}>{new Date(c.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    <span className="text-[12px] truncate" style={{ color: c.assignedTo ? T.text : T.faint }}>{c.assignedTo || "—"}</span>
                    <div><Chip tone={INC_REASON_TONE[c.reason] || "muted"}>{INC_REASON_LABEL[c.reason] || c.reason}</Chip></div>
                  </Link>
                  </div>
                ))
              )}
            </div>
              </>
            )}
          </Card>
          <Pagination page={incCurrentPage - 1} totalPages={incTotalPages} totalItems={incFiltered.length} perPage={PER_PAGE} onPageChange={(p) => setIncPage(p + 1)} />
        </>
      )}

      {/* ============ Calendar view ============ */}
      {tab === "all" && viewMode === "calendar" && (() => {
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
            {/* Main timeline */}
            <div className="flex-1 min-w-0 h-full flex flex-col">
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
                      { color: T.gold, label: "Reschedule" },
                      { color: T.danger, label: "Needs action" },
                      { color: T.good, label: "Done" },
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

              <Card className="overflow-hidden !p-0 flex-1 min-h-0 flex flex-col w-full">
                <div className="overflow-x-auto flex-1 min-h-0 flex flex-col">
                  <div className="h-full flex flex-col" style={{ minWidth: calScope === "day" ? 0 : 800 }}>
                    <div className="grid" style={{ gridTemplateColumns: `60px repeat(${visibleDays.length}, 1fr)`, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}>
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

                    <div ref={hoursRef} className="flex-1 min-h-0 overflow-y-auto max-h-[560px] lg:max-h-none">
                      {CAL_HOURS.map((hour) => (
                        <div key={hour} className="grid relative" style={{ gridTemplateColumns: `60px repeat(${visibleDays.length}, 1fr)`, minHeight: 40 }}>
                          <div className="text-[10px] tabular-nums text-right pr-2 pt-0.5" style={{ color: T.faint, borderTop: `1px solid ${T.borderSoft}` }}>
                            {formatHour(hour)}
                          </div>
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
                                      style={{
                                        background: `${tone}${selectedEvent?.id === ev.id ? "30" : "18"}`,
                                        color: tone,
                                        boxShadow: selectedEvent?.id === ev.id ? `inset 0 0 0 1.5px ${tone}` : "none",
                                      }}
                                    >
                                      <div className="font-medium truncate">{ev.customerName}</div>
                                      <div className="truncate opacity-75">{timeStr} · {ev.expertName.split(" ").pop()}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
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

            {/* Right rail */}
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
                const dt = new Date(ev.scheduledAt);
                const st = rowStatus(ev);
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
                    <div className="text-[12.5px] mt-0.5" style={{ color: T.muted }}>with {ev.expertName}</div>

                    <div className="mt-4 pt-4 space-y-2.5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                      {[
                        { label: "When", value: `${dt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · ${dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}` },
                        { label: "Payment", value: ev.paymentStatus === "pending" ? "Pending" : "Paid" },
                        { label: "Meeting", value: ev.meetingLink ? "Link ready" : "Link pending" },
                        { label: "ID", value: ev.id },
                      ].map((row) => (
                        <div key={row.label} className="flex gap-3 text-[12.5px]">
                          <span className="w-[76px] shrink-0" style={{ color: T.faint }}>{row.label}</span>
                          <span className="min-w-0" style={{ color: T.text }}>{row.value}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      href={`/consultations/${ev.id}`}
                      className="mt-4 h-9 w-full rounded-[9px] text-[13px] font-semibold inline-flex items-center justify-center transition-all duration-200 hover:brightness-110"
                      style={{ background: T.accent, color: T.accentInk }}
                    >
                      Open details
                    </Link>
                  </div>
                );
              })() : (
                <div className="rounded-[16px] p-5 text-center" style={{ background: T.card, border: `1px dashed ${T.border}` }}>
                  <div className="text-[12.5px]" style={{ color: T.faint }}>
                    Select a consultation on the calendar to see its details here.
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
