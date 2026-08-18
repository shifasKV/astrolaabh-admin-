"use client";
import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import {
  PageHeader, Card, Chip, Tabs, GoldBtn, Select, Pagination,
  Tooltip, ToolbarSearch, ExportBtn, downloadXLS, downloadPDF, EmptyState, TableSkeleton } from "@/components/ui";
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

const DATE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last_7", label: "Last 7 days" },
  { key: "last_30", label: "Last 30 days" },
  { key: "last_90", label: "Last 90 days" },
  { key: "this_month", label: "This month" },
  { key: "last_month", label: "Last month" },
  { key: "custom", label: "Custom range" },
];

function getPresetDates(key: string): { from: string; to: string } {
  const today = new Date();
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (key === "today") return { from: iso(today), to: iso(today) };
  if (key === "yesterday") { const y = new Date(today); y.setDate(today.getDate() - 1); return { from: iso(y), to: iso(y) }; }
  if (key === "last_7") { const f = new Date(today); f.setDate(today.getDate() - 7); return { from: iso(f), to: iso(today) }; }
  if (key === "last_30") { const f = new Date(today); f.setDate(today.getDate() - 30); return { from: iso(f), to: iso(today) }; }
  if (key === "last_90") { const f = new Date(today); f.setDate(today.getDate() - 90); return { from: iso(f), to: iso(today) }; }
  if (key === "this_month") return { from: iso(new Date(today.getFullYear(), today.getMonth(), 1)), to: iso(today) };
  if (key === "last_month") return { from: iso(new Date(today.getFullYear(), today.getMonth() - 1, 1)), to: iso(new Date(today.getFullYear(), today.getMonth(), 0)) };
  return { from: "", to: "" };
}

function CFilterButton({ label, active, open, onClick, icon }: { label: string; active: boolean; open: boolean; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className="h-9 px-3 rounded-[9px] text-[12.5px] font-medium inline-flex items-center gap-1.5 cursor-pointer transition-all duration-200 whitespace-nowrap"
      style={{ background: active ? T.accentFaint : open ? T.accentFaint : T.bg, border: `1px solid ${active ? T.accentBorder : open ? T.accentBorder : T.border}`, color: active ? T.accent : T.text }}>
      {icon}{label}
      {active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />}
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3 h-3" style={{ color: T.faint }}><path d="m6 9 6 6 6-6" /></svg>
    </button>
  );
}

function ConsultExpertFilter({ value, onChange, experts, open, onToggle, resetPage }: { value: string[]; onChange: (v: string[]) => void; experts: string[]; open: boolean; onToggle: () => void; resetPage: () => void }) {
  const toggle = (v: string) => { const next = value.includes(v) ? value.filter(x => x !== v) : [...value, v]; onChange(next); resetPage(); };
  const label = value.length === 0 ? "Expert" : value.length === 1 ? value[0].split(" ").slice(-1)[0] : `${value.length} experts`;
  return (
    <div className="relative">
      <CFilterButton label={label} active={value.length > 0} open={open} onClick={onToggle}
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>} />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-[240px] rounded-[12px] p-1.5" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}>
            {experts.map((exp) => {
              const isActive = value.includes(exp);
              return (
                <button key={exp} onClick={() => toggle(exp)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[12.5px] text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                  style={{ color: isActive ? T.accent : T.text, fontWeight: isActive ? 600 : 400, background: isActive ? T.accentFaint : "transparent" }}>
                  <span className="w-3.5 h-3.5 rounded-[3px] flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${isActive ? T.accent : "rgba(89,82,54,0.25)"}`, background: isActive ? T.accent : "transparent" }}>
                    {isActive && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                  </span>
                  {exp}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function ConsultStatusFilter({ value, onChange, open, onToggle, resetPage }: { value: string[]; onChange: (v: string[]) => void; open: boolean; onToggle: () => void; resetPage: () => void }) {
  const toggle = (v: string) => { if (!v) { onChange([]); resetPage(); return; } const next = value.includes(v) ? value.filter(x => x !== v) : [...value, v]; onChange(next); resetPage(); };
  const label = value.length === 0 ? "Status" : value.length === 1 ? STATUS_FILTER_LABEL[value[0]] : `${value.length} statuses`;
  return (
    <div className="relative">
      <CFilterButton label={label} active={value.length > 0} open={open} onClick={onToggle}
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>} />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-[220px] rounded-[12px] p-1.5" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}>
            {[{ value: "", label: "All" }, ...Object.entries(STATUS_FILTER_LABEL).map(([k, v]) => ({ value: k, label: v }))].map((opt) => {
              const isActive = opt.value === "" ? value.length === 0 : value.includes(opt.value);
              return (
                <button key={opt.value} onClick={() => toggle(opt.value)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-[8px] text-[12.5px] text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                  style={{ color: isActive ? T.accent : T.text, fontWeight: isActive ? 600 : 400, background: isActive ? T.accentFaint : "transparent" }}>
                  <span className="w-3.5 h-3.5 rounded-[3px] flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${isActive ? T.accent : "rgba(89,82,54,0.25)"}`, background: isActive ? T.accent : "transparent" }}>
                    {isActive && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={T.accentInk} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function CMiniCalendar({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [viewDate, setViewDate] = useState(() => value ? new Date(value + "T00:00") : new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;
  const days: (number | null)[] = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthName = viewDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const iso = (d: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return (
    <div>
      <div className="text-[10px] font-medium tracking-[0.06em] uppercase mb-1.5" style={{ color: T.faint }}>{label}</div>
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer hover:bg-[rgba(89,82,54,0.08)]" style={{ color: T.muted }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg></button>
        <span className="text-[12px] font-medium" style={{ color: T.text }}>{monthName}</span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="w-6 h-6 rounded-[6px] flex items-center justify-center cursor-pointer hover:bg-[rgba(89,82,54,0.08)]" style={{ color: T.muted }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 18 6-6-6-6" /></svg></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (<span key={i} className="text-[9px] font-medium py-1" style={{ color: T.faint }}>{d}</span>))}
        {days.map((day, i) => {
          if (day === null) return <span key={`e-${i}`} />;
          const dateStr = iso(day);
          const isSelected = dateStr === value;
          const isToday = dateStr === new Date().toISOString().slice(0, 10);
          return (<button key={i} onClick={() => onChange(dateStr)} className="w-7 h-7 rounded-[6px] text-[11px] flex items-center justify-center cursor-pointer transition-colors"
            style={{ background: isSelected ? T.primary : "transparent", color: isSelected ? T.primaryInk : isToday ? T.accent : T.text, fontWeight: isSelected || isToday ? 600 : 400 }}>{day}</button>);
        })}
      </div>
    </div>
  );
}

function ConsultDateFilter({ from, to, onChangeFrom, onChangeTo, open, onToggle, resetPage }: { from: string; to: string; onChangeFrom: (v: string) => void; onChangeTo: (v: string) => void; open: boolean; onToggle: () => void; resetPage: () => void }) {
  const [datePreset, setDatePreset] = useState<string>("");
  const hasValue = !!(from || to);
  const handlePreset = (key: string) => { setDatePreset(key); if (key !== "custom") { const d = getPresetDates(key); onChangeFrom(d.from); onChangeTo(d.to); resetPage(); } };
  const dateLabel = hasValue
    ? `${from ? new Date(from + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "…"} – ${to ? new Date(to + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "…"}`
    : "Scheduled Date";
  return (
    <div className="relative">
      <CFilterButton label={dateLabel} active={hasValue} open={open} onClick={onToggle}
        icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>} />
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onToggle} />
          <div className="absolute left-0 top-full mt-1.5 z-50 w-[520px] rounded-[12px] p-4" style={{ background: T.popover, border: `1px solid ${T.border}`, boxShadow: T.shadowLift }}>
            <div className="flex gap-4">
              <div className="w-[148px] shrink-0 space-y-0.5">
                <div className="text-[10px] font-medium tracking-[0.06em] uppercase mb-2" style={{ color: T.faint }}>Quick select</div>
                {DATE_PRESETS.map((p) => {
                  const isActive = datePreset === p.key;
                  return (<button key={p.key} onClick={() => handlePreset(p.key)} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-[7px] text-[11.5px] text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]"
                    style={{ color: isActive ? T.accent : T.text, fontWeight: isActive ? 600 : 400, background: isActive ? T.accentFaint : "transparent" }}>
                    <span className="w-[13px] h-[13px] rounded-full flex items-center justify-center shrink-0" style={{ border: `1.5px solid ${isActive ? T.accent : "rgba(89,82,54,0.3)"}` }}>{isActive && <span className="w-[5px] h-[5px] rounded-full" style={{ background: T.accent }} />}</span>
                    {p.label}</button>);
                })}
                {hasValue && (<button onClick={() => { onChangeFrom(""); onChangeTo(""); setDatePreset(""); resetPage(); }} className="w-full mt-2 text-[11px] text-left px-2.5 py-1 cursor-pointer hover:underline underline-offset-4" style={{ color: T.danger }}>Clear dates</button>)}
              </div>
              <div className="flex-1 min-w-0" style={{ borderLeft: `1px solid ${T.borderSoft}`, paddingLeft: "16px" }}>
                <div className="grid grid-cols-2 gap-3">
                  <CMiniCalendar value={from} onChange={(v) => { onChangeFrom(v); setDatePreset("custom"); resetPage(); }} label="From" />
                  <CMiniCalendar value={to} onChange={(v) => { onChangeTo(v); setDatePreset("custom"); resetPage(); }} label="To" />
                </div>
                {hasValue && (
                  <div className="mt-3 pt-2.5 text-[11px] flex items-center gap-2" style={{ borderTop: `1px solid ${T.borderSoft}`, color: T.muted }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0" style={{ color: T.accent }}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                    <span>{from ? new Date(from + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Start"}</span>
                    <span style={{ color: T.faint }}>→</span>
                    <span>{to ? new Date(to + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "End"}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
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
  const [openFilter, setOpenFilter] = useState<"expert" | "status" | "date" | null>(null);
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
    c.status === "scheduled" ? "#6d8ea0" :
    c.status === "reschedule_requested" ? T.accent :
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
        className="sticky top-0 z-30 -mx-5 md:-mx-10 px-5 md:px-10 pt-1 pb-0.5 mb-4"
        style={{ background: T.bg, boxShadow: `0 1px 0 ${T.borderSoft}` }}
      >
        {/* Row 1: Tabs + view toggle (right) */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
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

        {/* Row 2: Search + filters + sort + clear */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <ToolbarSearch value={search} onChange={setSearch} placeholder="Search customer, expert, ID…" />
          <div className="ml-auto flex items-center gap-2">
            <ConsultExpertFilter value={filterExpert} onChange={setFilterExpert} experts={uniqueExperts} open={openFilter === "expert"} onToggle={() => setOpenFilter(openFilter === "expert" ? null : "expert")} resetPage={() => setPage(1)} />
            <ConsultStatusFilter value={filterStatus} onChange={setFilterStatus} open={openFilter === "status"} onToggle={() => setOpenFilter(openFilter === "status" ? null : "status")} resetPage={() => setPage(1)} />
            <ConsultDateFilter from={filterDateFrom} to={filterDateTo} onChangeFrom={setFilterDateFrom} onChangeTo={setFilterDateTo} open={openFilter === "date"} onToggle={() => setOpenFilter(openFilter === "date" ? null : "date")} resetPage={() => setPage(1)} />
            <div className="w-[160px]">
              <Select
                value={sort}
                onChange={(v) => { setSort(v as SortKey); setPage(1); }}
                compact
                prefix="Sort: "
                options={[
                  { value: "date_desc", label: "Newest" },
                  { value: "date_asc", label: "Oldest" },
                  { value: "upcoming", label: "Upcoming" },
                ]}
              />
            </div>
            <div className="w-[57px] flex items-center justify-center">
              {hasActiveFilters && (
                <button
                  onClick={() => { setFilterCustomer(""); setFilterExpert([]); setFilterStatus([]); setFilterDateFrom(""); setFilterDateTo(""); setPage(1); }}
                  className="text-[12px] px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap"
                  style={{ color: T.danger }}
                >
                  Clear all
                </button>
              )}
            </div>
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
          style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.border}` }}
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
                <Link
                  key={c.id}
                  href={`/consultations/${c.id}`}
                  className="group grid grid-cols-1 sm:grid-cols-[64px_1fr_150px_170px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors duration-150 last:rounded-b-[15px] even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
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
              style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.border}` }}
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
                  <Link
                    key={c.id}
                    href={`/consultations/incomplete/${c.id}`}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_100px_140px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors duration-150 last:rounded-b-[15px] even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
                    style={{ borderBottom: idx < incPaginated.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                  >
                    <span className="text-[13px] font-semibold truncate block" style={{ color: T.text }}>{c.customerName}</span>
                    <span className="text-[12.5px] truncate block" style={{ color: T.muted }}>{c.expertName}</span>
                    <span className="text-[12px] tabular-nums" style={{ color: T.muted }}>{new Date(c.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    <span className="text-[12px] truncate" style={{ color: c.assignedTo ? T.text : T.faint }}>{c.assignedTo || "—"}</span>
                    <div><Chip tone={INC_REASON_TONE[c.reason] || "muted"}>{INC_REASON_LABEL[c.reason] || c.reason}</Chip></div>
                  </Link>
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
                      { color: "#6d8ea0", label: "Scheduled" },
                      { color: T.accent, label: "Reschedule" },
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
                        onClick={() => setCalScope(scope)}
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
                    <div className="grid" style={{ gridTemplateColumns: `60px repeat(${visibleDays.length}, 1fr)`, background: T.card, borderBottom: `1px solid ${T.border}` }}>
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
                        onClick={() => { setCalWeekBase(new Date(iso + "T00:00:00")); setCalScope("day"); }}
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
                      style={{ background: T.primary, color: T.primaryInk }}
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
