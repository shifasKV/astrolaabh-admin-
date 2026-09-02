"use client";
import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Chip, StatCard, GhostBtn, GoldBtn, SectionLink, BackLink, Tabs, Tooltip, Pagination, Select, Modal, Input, ToolbarSearch, InlineFilter, MultiCheck, SortMenu, EmptyState, Toast, ConfirmDialog, MobileAgenda } from "@/components/ui";
import { T } from "@/lib/theme";
import { usePersistentState } from "@/lib/usePersistentState";
import { EXPERT_PROFILES, EXPERT_AVAILABILITY, MOCK_CONSULTATIONS, MOCK_STONE_RECOMMENDATIONS, MOCK_ORDERS, MOCK_PAYMENTS } from "@/lib/mock";
import { inr } from "@/lib/types";
import type { StoneRecommendation } from "@/lib/types";

const PAGE_SIZE = 8;
type SortKey = "date_desc" | "date_asc";

const DETAIL_TABS = [
  { key: "overview", label: "Overview" },
  { key: "upcoming", label: "Consultations" },
  { key: "availability", label: "Availability" },
  { key: "recommendations", label: "Recommendations" },
  { key: "payments", label: "Payments" },
];

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

function generateFullDaySlots(): string[] {
  return Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, "0")}:00`);
}

function to12Hour(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
}

function recommendationStatusLabel(rec: StoneRecommendation): string {
  return rec.status === "converted_to_order" ? "Converted to order" : "Submitted";
}

function getEstimatedPrice(rec: StoneRecommendation): number | null {
  if (rec.orderId) {
    const order = MOCK_ORDERS.find((o) => o.id === rec.orderId);
    if (order) return order.total;
  }
  const payment = MOCK_PAYMENTS.find((p) => p.linkedRecommendationId === rec.id);
  if (payment) return payment.amount;
  return null;
}

export default function AstroGemologistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const expert = EXPERT_PROFILES.find((e) => e.id === id);
  const availability = EXPERT_AVAILABILITY.find((e) => e.expertId === id);
  const expertId = expert?.id ?? id;

  const consultations = MOCK_CONSULTATIONS.filter((c) => c.expertId === expertId);
  const allUpcoming = consultations.filter((c) => c.status === "scheduled");
  const allPendingSummaries = consultations.filter((c) => c.status === "summary_pending");
  const allCompleted = consultations.filter((c) => c.status === "closed" || c.status === "completed");
  const allNoShows = consultations.filter((c) => c.status === "no_show" && c.noShowBy === "expert");
  const allRecommendations = MOCK_STONE_RECOMMENDATIONS.filter((r) => r.expertId === expertId);

  const weekDaysForAvail = useMemo(() => {
    const start = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return toISODate(d);
    });
  }, []);

  const fullDaySlots = useMemo(() => generateFullDaySlots(), []);

  const bookedSlotMap = useMemo(() => {
    const map = new Map<string, { id: string; customerName: string }>();
    for (const c of consultations) {
      if (c.status === "cancelled" || c.status === "no_show") continue;
      const dt = new Date(c.scheduledAt);
      const dateKey = toISODate(dt);
      const hh = String(dt.getHours()).padStart(2, "0");
      const mm = String(dt.getMinutes()).padStart(2, "0");
      map.set(`${dateKey}-${hh}:${mm}`, { id: c.id, customerName: c.customerName });
    }
    return map;
  }, [consultations]);

  const [unavailableSlots, setUnavailableSlots] = useState<Set<string>>(() => {
    const set = new Set<string>();
    for (const day of availability?.availability.slice(0, 7) ?? []) {
      for (const slot of day.slots) {
        if (!slot.available) {
          const raw = slot.time;
          let hhmm = raw;
          if (/am|pm/i.test(raw)) {
            const m = raw.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (m) {
              let h = parseInt(m[1], 10);
              const min = m[2];
              const ap = m[3].toUpperCase();
              if (ap === "PM" && h !== 12) h += 12;
              if (ap === "AM" && h === 12) h = 0;
              hhmm = `${String(h).padStart(2, "0")}:${min}`;
            }
          }
          set.add(`${day.date}-${hhmm}`);
        }
      }
    }
    if (set.size === 0) {
      const today = toISODate(new Date());
      set.add(`${today}-07:00`);
      set.add(`${today}-18:00`);
    }
    return set;
  });

  const router = useRouter();
  const [isActive, setIsActive] = useState(expert?.status === "active");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [commissionEditing, setCommissionEditing] = useState(false);
  const [commissionToast, setCommissionToast] = useState("");
  const [commissionRates, setCommissionRates] = useState({ stone: "8", jewellery: "6", consultation: "15" });
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: "", paymentType: "bank_transfer", paidBy: "", notes: "" });

  const toggleUnavailable = (dateISO: string, time: string) => {
    const key = `${dateISO}-${time}`;
    if (bookedSlotMap.has(key)) return;
    let nowUnavailable = false;
    setUnavailableSlots((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else { n.add(key); nowUnavailable = true; }
      return n;
    });
    setToast(nowUnavailable ? `${to12Hour(time)} marked unavailable` : `${to12Hour(time)} opened`);
    setTimeout(() => setToast(""), 2500);
  };

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const [activeTab, setActiveTab] = useState("overview");
  const [viewMode, setViewMode] = usePersistentState<"list" | "calendar">("pref-consult-view", "calendar");

  // Consultations tab state (list + calendar)
  const [consSearch, setConsSearch] = useState("");
  const [consSort, setConsSort] = useState<SortKey>("date_desc");
  const [consFilterStatus, setConsFilterStatus] = useState("");
  const [consFilterStatusMulti, setConsFilterStatusMulti] = useState<string[]>([]);
  const [consFilterCustomer, setConsFilterCustomer] = useState("");
  const [consFilterDateFrom, setConsFilterDateFrom] = useState("");
  const [consFilterDateTo, setConsFilterDateTo] = useState("");
  const [showConsDatePicker, setShowConsDatePicker] = useState(false);
  const [consDpYear, setConsDpYear] = useState(new Date().getFullYear());
  const [consDpMonth, setConsDpMonth] = useState(new Date().getMonth());
  const [consPage, setConsPage] = useState(0);

  // Summary due state
  const [sdSearch, setSdSearch] = useState("");
  const [sdSort, setSdSort] = useState<SortKey>("date_desc");
  const [sdPage, setSdPage] = useState(0);

  // No show state
  const [nsSearch, setNsSearch] = useState("");
  const [nsSort, setNsSort] = useState<SortKey>("date_desc");
  const [nsPage, setNsPage] = useState(0);

  // Recommendations state
  const [recSearch, setRecSearch] = useState("");
  const [recSort, setRecSort] = useState<SortKey>("date_desc");
  const [recFilterStone, setRecFilterStone] = useState("");
  const [recFilterStatus, setRecFilterStatus] = useState("");
  const [recPage, setRecPage] = useState(0);

  // Payments state
  const [paySearch, setPaySearch] = useState("");
  const [paySort, setPaySort] = useState<SortKey>("date_desc");
  const [payPage, setPayPage] = useState(0);

  // Calendar state
  const [calWeekBase, setCalWeekBase] = useState(() => new Date());
  const [goToDateOpen, setGoToDateOpen] = useState(false);
  const [gtdYear, setGtdYear] = useState(new Date().getFullYear());
  const [gtdMonth, setGtdMonth] = useState(new Date().getMonth());

  const weekDays = useMemo(() => getWeekDays(calWeekBase), [calWeekBase]);
  const todayISO = toISODate(new Date());

  const calEvents = useMemo(() => {
    const map = new Map<string, typeof consultations>();
    for (const c of consultations) {
      if (c.status === "cancelled") continue;
      const dt = new Date(c.scheduledAt);
      const key = toISODate(dt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return map;
  }, [consultations]);

  const prevWeek = () => { const d = new Date(calWeekBase); d.setDate(d.getDate() - 7); setCalWeekBase(d); };
  const nextWeek = () => { const d = new Date(calWeekBase); d.setDate(d.getDate() + 7); setCalWeekBase(d); };
  const goToToday = () => setCalWeekBase(new Date());

  const calScope = "week" as const;
  const [selectedEvent, setSelectedEvent] = useState<(typeof consultations)[number] | null>(null);

  // Add-consultation → same multi-step flow as new order (/consultations/create), expert prelocked
  const openAddConsult = (date?: string) => {
    const qs = new URLSearchParams({ expertId: id });
    if (date) qs.set("date", date);
    router.push(`/consultations/create?${qs.toString()}`);
  };
  const hoursRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (viewMode === "calendar" && hoursRef.current) hoursRef.current.scrollTop = 6 * 40;
  }, [viewMode, calScope]);

  const visibleDays = weekDays;

  const rowStatus = (c: (typeof consultations)[number]) => {
    if (c.paymentStatus === "pending") return { tone: "gold" as const, label: "Payment pending" };
    if (c.status === "reschedule_requested") return { tone: "gold" as const, label: "Reschedule request" };
    if (c.status === "summary_pending") return { tone: "danger" as const, label: "Recommendation due" };
    if (c.status === "no_show") return { tone: "danger" as const, label: c.noShowBy === "expert" ? "Expert no show" : "Customer no show" };
    if (c.status === "closed" || c.status === "completed") return { tone: "good" as const, label: "Done" };
    if (c.status === "scheduled") return { tone: "info" as const, label: "Scheduled" };
    return { tone: "muted" as const, label: c.status };
  };

  const eventTone = (c: (typeof consultations)[number]) =>
    c.status === "closed" || c.status === "completed" ? T.good :
    c.status === "scheduled" ? T.info :
    c.status === "reschedule_requested" ? T.gold :
    c.status === "summary_pending" || c.status === "no_show" ? T.danger :
    T.muted;

  // Filtered data helpers
  function searchFilter<T extends { customerName: string; id: string }>(items: T[], q: string): T[] {
    if (!q) return items;
    const lq = q.toLowerCase();
    return items.filter((c) => c.customerName.toLowerCase().includes(lq) || c.id.toLowerCase().includes(lq));
  }

  function sortByDate<T extends { scheduledAt: string }>(items: T[], key: SortKey): T[] {
    return [...items].sort((a, b) => {
      if (key === "date_asc") return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
      return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
    });
  }

  // Consultations filtered (for list view)
  const uniqueConsCustomers = [...new Set(consultations.map((c) => c.customerName))].sort();
  const consHasActiveFilters = !!consFilterCustomer || consFilterStatusMulti.length > 0 || !!consFilterStatus || !!consFilterDateFrom || !!consFilterDateTo;
  const consFiltered = sortByDate(
    searchFilter(consultations, consSearch).filter((c) => {
      if (consFilterCustomer && c.customerName !== consFilterCustomer) return false;
      const activeStatuses = consFilterStatusMulti.length > 0 ? consFilterStatusMulti : (consFilterStatus ? [consFilterStatus] : []);
      if (activeStatuses.length > 0) {
        const matches = activeStatuses.some((s) => {
          if (s === "scheduled") return c.status === "scheduled";
          if (s === "completed") return c.status === "closed" || c.status === "completed";
          if (s === "summary_pending") return c.status === "summary_pending";
          if (s === "no_show") return c.status === "no_show";
          if (s === "reschedule_requested") return c.status === "reschedule_requested";
          if (s === "payment_pending") return c.paymentStatus === "pending";
          return false;
        });
        if (!matches) return false;
      }
      return true;
    }).filter((c) => {
      const d = c.scheduledAt?.slice(0, 10);
      if (consFilterDateFrom && d && d < consFilterDateFrom) return false;
      if (consFilterDateTo && d && d > consFilterDateTo) return false;
      return true;
    }),
    consSort,
  );
  const consFilterCount = consFilterStatusMulti.length;
  const consTotalPages = Math.ceil(consFiltered.length / PAGE_SIZE);
  const consPaginated = consFiltered.slice(consPage * PAGE_SIZE, (consPage + 1) * PAGE_SIZE);

  // Summary due filtered
  const sdFiltered = sortByDate(searchFilter(allPendingSummaries, sdSearch), sdSort);
  const sdTotalPages = Math.ceil(sdFiltered.length / PAGE_SIZE);
  const sdPaginated = sdFiltered.slice(sdPage * PAGE_SIZE, (sdPage + 1) * PAGE_SIZE);

  // No show filtered
  const nsFiltered = sortByDate(searchFilter(allNoShows, nsSearch), nsSort);
  const nsTotalPages = Math.ceil(nsFiltered.length / PAGE_SIZE);
  const nsPaginated = nsFiltered.slice(nsPage * PAGE_SIZE, (nsPage + 1) * PAGE_SIZE);

  // Recommendations filtered
  const recStones = [...new Set(allRecommendations.map((r) => r.gemstone))].sort();
  const recFiltered = [...allRecommendations]
    .filter((r) => {
      if (recSearch) {
        const q = recSearch.toLowerCase();
        if (!r.customerName.toLowerCase().includes(q) && !r.gemstone.toLowerCase().includes(q) && !r.purpose.toLowerCase().includes(q)) return false;
      }
      if (recFilterStone && r.gemstone !== recFilterStone) return false;
      if (recFilterStatus === "converted_to_order" && r.status !== "converted_to_order") return false;
      if (recFilterStatus === "submitted" && r.status === "converted_to_order") return false;
      return true;
    })
    .sort((a, b) => {
      if (recSort === "date_asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  const recTotalPages = Math.ceil(recFiltered.length / PAGE_SIZE);
  const recPaginated = recFiltered.slice(recPage * PAGE_SIZE, (recPage + 1) * PAGE_SIZE);

  // Payments filtered — payments linked to this expert's consultations
  const expertConsIds = new Set(consultations.map((c) => c.id));
  const expertPayments = MOCK_PAYMENTS.filter((p) => p.linkedAppointmentId && expertConsIds.has(p.linkedAppointmentId));
  const payFiltered = expertPayments
    .filter((p) => {
      if (!paySearch) return true;
      const q = paySearch.toLowerCase();
      return p.customerName.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.purpose.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const aTime = new Date(a.paidAt ?? a.createdAt).getTime();
      const bTime = new Date(b.paidAt ?? b.createdAt).getTime();
      return paySort === "date_asc" ? aTime - bTime : bTime - aTime;
    });
  const payTotalPages = Math.ceil(payFiltered.length / PAGE_SIZE);
  const payPaginated = payFiltered.slice(payPage * PAGE_SIZE, (payPage + 1) * PAGE_SIZE);
  const totalEarnings = expertPayments.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0);

  const tabCounts: Record<string, number> = {
    availability: weekDaysForAvail.length,
    recommendations: allRecommendations.length,
    upcoming: consultations.length,
    summary_due: allPendingSummaries.length,
    no_show: allNoShows.length,
    payments: expertPayments.length,
  };

  const statusTone = (s: string) => {
    if (s === "closed" || s === "completed") return "good" as const;
    if (s === "scheduled") return "gold" as const;
    if (s === "summary_pending" || s === "reschedule_requested" || s === "no_show") return "danger" as const;
    return "muted" as const;
  };

  const consCommission = (fee: number) => Math.round(fee * parseFloat(commissionRates.consultation) / 100);

  function ConsultationRow({ c, showStatus }: { c: typeof consultations[number]; showStatus?: string }) {
    const comm = c.paymentStatus === "paid" ? consCommission(c.fee ?? 0) : 0;
    const dt = new Date(c.scheduledAt);
    const esLabel = showStatus === "summary"
      ? (c.summarySubmittedAt ? "Provided" : "Pending")
      : c.status === "scheduled" ? "Scheduled"
      : c.status === "summary_pending" ? "Recommendation due"
      : c.status === "no_show" ? (c.noShowBy === "expert" ? "Expert no show" : "Customer no show")
      : c.status === "closed" || c.status === "completed" ? "Completed"
      : c.status.replace(/_/g, " ");
    const esTone = showStatus === "summary"
      ? (c.summarySubmittedAt ? "good" as const : "danger" as const)
      : statusTone(c.status);

    return (
      <Link
        href={`/consultations/${c.id}`}
        className="group hidden sm:grid items-center gap-4 px-4 py-3.5 transition-colors duration-150 even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)] last:rounded-b-[15px]"
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
          <span className="text-[12px] tabular-nums" style={{ color: comm > 0 ? T.accent : T.faint }}>{comm > 0 ? inr(comm) : "—"}</span>
        </div>
        <div className="flex items-center justify-end shrink-0">
          <Chip tone={esTone}>{esLabel}</Chip>
        </div>
      </Link>
    );
  }

  function TableHeader({ cols }: { cols: string[] }) {
    return (
      <div className="hidden sm:grid items-center gap-4 px-4 pt-4 pb-3 text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint, borderBottom: `1px solid ${T.border}`, gridTemplateColumns: "1fr 150px 100px 130px" }}>
        {cols.map((c) => (
          <div key={c} className={c === "Commission" || c === "Status" ? "text-right" : undefined}>{c}</div>
        ))}
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[14px]" style={{ color: T.muted }}>Expert not found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <div className="mb-4">
        <BackLink label="Astro-Gemologists" href="/astro-gemologists" />
      </div>

      {/* Identity */}
      <Card className="!p-6 mb-4">
        <div className="flex flex-wrap items-start gap-5">
          <div
            className="w-14 h-14 rounded-[16px] flex items-center justify-center text-[18px] font-semibold shrink-0"
            style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}
          >
            {expert.name.split(" ").map((w) => w[0]).slice(-2).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[18px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>{expert.name}</span>
              {isActive ? (expert.calendlyStatus === "pending" ? <Chip tone="gold">Calendly invite pending</Chip> : <Chip tone="good">active</Chip>) : <Chip tone="danger">inactive</Chip>}
            </div>
            <div className="text-[13px] mt-1" style={{ color: T.muted }}>{expert.specialization}</div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-[12.5px]" style={{ color: T.muted }}>
              <span>{expert.experience}</span>
              <span style={{ color: T.faint }}>·</span>
              <span>{expert.languages.join(", ")}</span>
              <span style={{ color: T.faint }}>·</span>
              <span className="font-medium" style={{ color: T.accent }}>{inr(expert.fee)}/session</span>
              <span style={{ color: T.faint }}>·</span>
              <span className="tabular-nums">{expert.phone}</span>
            </div>
          </div>
          <div className="relative shrink-0" ref={menuRef}>
            <button type="button" onClick={() => setShowMenu((v) => !v)} className="w-9 h-9 rounded-[9px] flex items-center justify-center transition-colors hover:bg-[rgba(89,82,54,0.08)] cursor-pointer" style={{ border: `1px solid ${T.border}`, color: T.muted }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-[10px] overflow-hidden shadow-lg py-1 min-w-[190px]" style={{ background: T.popover, border: `1px solid ${T.border}`, animation: "fadeIn 120ms ease-out" }}>
                <button type="button" onClick={() => { setShowMenu(false); router.push(`/astro-gemologists/${id}/edit`); }} className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(119,123,98,0.08)] cursor-pointer" style={{ color: T.text }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  Edit profile
                </button>
                {expert.calendlyStatus === "pending" && isActive && (
                  <button type="button" onClick={() => { setShowMenu(false); setToast("Calendly invitation resent"); setTimeout(() => setToast(""), 3000); }} className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(119,123,98,0.08)] cursor-pointer" style={{ color: T.text }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4z"/></svg>
                    Resend invitation
                  </button>
                )}
                <button type="button" onClick={() => { setShowMenu(false); setShowPayoutModal(true); }} className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(119,123,98,0.08)] cursor-pointer" style={{ color: T.text }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M6 6h9a3 3 0 0 1 0 6H5M7 12h8a3 3 0 0 1 0 6H6"/></svg>
                  Make payout
                </button>
                <div className="mx-2 my-1" style={{ borderTop: `1px solid ${T.borderSoft}` }} />
                <button type="button" onClick={() => { setShowMenu(false); if (isActive) { setConfirmDeactivate(true); } else { setIsActive(true); setToast("Gemologist activated"); setTimeout(() => setToast(""), 3000); } }} className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(119,123,98,0.08)] cursor-pointer" style={{ color: isActive ? T.danger : T.good }}>
                  {isActive ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>Deactivate</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>Activate</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs + (Consultations) view controls on the same line */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Tabs
          tabs={DETAIL_TABS.map((t) => ({ ...t, count: t.key === "overview" ? undefined : tabCounts[t.key] }))}
          active={activeTab}
          onChange={(key) => { setActiveTab(key); }}
        />
        {activeTab === "upcoming" && (
          <div className="ml-auto flex items-center gap-2">
            <div className="inline-flex items-center gap-1 p-[3px] rounded-full shrink-0" style={{ background: "rgba(89,82,54,0.055)" }}>
              {(["list", "calendar"] as const).map((mode) => (
                <Tooltip key={mode} label={mode === "list" ? "List view" : "Calendar view"}>
                <button
                  onClick={() => setViewMode(mode)}
                  aria-label={mode === "list" ? "List view" : "Calendar view"}
                  className="h-8 w-11 rounded-full inline-flex items-center justify-center shrink-0 transition-all duration-200 cursor-pointer"
                  style={viewMode === mode ? { background: T.card, color: T.text, border: `1px solid ${T.borderSoft}`, boxShadow: "0 1px 2px rgba(43,42,34,0.08)" } : { color: T.muted, border: "1px solid transparent" }}
                >
                  {mode === "list" ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/></svg>
                  )}
                </button>
                </Tooltip>
              ))}
            </div>
            <button
              onClick={() => openAddConsult(toISODate(calWeekBase))}
              className="inline-flex items-center gap-1.5 h-8 pl-2.5 pr-3.5 rounded-[9px] text-[12.5px] font-medium transition-all duration-200 hover:brightness-110 cursor-pointer"
              style={{ background: T.accent, color: T.accentInk }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Add consultation
            </button>
          </div>
        )}
      </div>

      {/* ========= OVERVIEW TAB ========= */}
      {activeTab === "overview" && (
        <div className="md:min-h-0 md:overflow-y-auto">
      {/* Rates + payout — named cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card className="!p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Commission rates</h2>
              {commissionToast && <span className="text-[12px] font-medium" style={{ color: T.good }}>✓ {commissionToast}</span>}
            </div>
            {commissionEditing ? (
              <GoldBtn className="!h-7 !px-3 !text-[11px]" onClick={() => { setCommissionEditing(false); setCommissionToast("Commission saved"); setTimeout(() => setCommissionToast(""), 3000); }}>Save</GoldBtn>
            ) : (
              <GhostBtn className="!h-7 !px-3 !text-[11px]" onClick={() => setCommissionEditing(true)}>Edit</GhostBtn>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(["stone", "jewellery", "consultation"] as const).map((cat) => (
              <div key={cat}>
                <div className="text-[11px] tracking-[0.07em] uppercase" style={{ color: T.faint }}>{cat}</div>
                {commissionEditing ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input type="number" value={commissionRates[cat]} onChange={(e) => setCommissionRates((p) => ({ ...p, [cat]: e.target.value }))} className="w-full h-8 px-2 rounded-[7px] text-[13px] outline-none" style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }} />
                    <span className="text-[12px] font-medium shrink-0" style={{ color: T.muted }}>%</span>
                  </div>
                ) : (
                  <div className="font-title text-[22px] font-semibold tabular-nums mt-1" style={{ color: T.text }}>{commissionRates[cat]}%</div>
                )}
              </div>
            ))}
          </div>
        </Card>
        <Card className="!p-6">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4" style={{ color: T.text }}>Payout account</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {[
              ["Bank", "HDFC Bank"],
              ["Account", "1234 5678 6789"],
              ["IFSC", "HDFC0001234"],
              ["UPI", `${expert.name.split(" ").pop()?.toLowerCase()}@upi`],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="text-[11px] tracking-[0.07em] uppercase" style={{ color: T.faint }}>{k}</div>
                <div className="text-[13px] font-medium tabular-nums mt-0.5" style={{ color: T.text }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* KPIs — alert cards jump into the filtered Consultations tab */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {[
          { label: "Consultations", value: allCompleted.length, status: "completed", tone: T.good, hero: false, jump: () => { setActiveTab("upcoming"); setViewMode("list"); setConsFilterStatus("completed"); } },
          { label: "Purchases", value: allRecommendations.filter((r) => r.status === "converted_to_order").length, status: "completed", tone: T.good, hero: false, jump: () => setActiveTab("recommendations") },
          { label: "Recommendation due", value: allPendingSummaries.length, status: allPendingSummaries.length > 0 ? "action needed" : "all clear", tone: allPendingSummaries.length > 0 ? T.danger : T.good, hero: false, jump: () => { setActiveTab("upcoming"); setViewMode("list"); setConsFilterStatus("summary_pending"); } },
          { label: "No-shows", value: allNoShows.length, status: allNoShows.length > 0 ? "review" : "all clear", tone: allNoShows.length > 0 ? T.danger : T.good, hero: false, jump: () => { setActiveTab("upcoming"); setViewMode("list"); setConsFilterStatus("no_show"); } },
          { label: "Commission earned", value: inr(totalEarnings), status: "lifetime", tone: "#8a6a2f", hero: true, jump: () => setActiveTab("payments") },
        ].map((stat, i) => (
          <button
            key={i}
            onClick={stat.jump}
            className="rounded-[16px] p-5 text-left transition-all duration-200 hover:-translate-y-[2px] cursor-pointer"
            style={
              stat.hero
                ? { background: "linear-gradient(160deg, #faf0d8 0%, #efdfb8 100%)", border: "1px solid rgba(160,125,56,0.35)", boxShadow: T.shadow }
                : { background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }
            }
          >
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: stat.hero ? "#8a6a2f" : T.faint }}>{stat.label}</div>
            <div className="text-[20px] font-semibold mt-1 tabular-nums" style={{ color: T.text }}>{stat.value}</div>
            <div className="text-[11px] font-medium mt-1" style={{ color: stat.tone }}>{stat.status}</div>
          </button>
        ))}
      </div>

        </div>
      )}

      {/* ========= CONSULTATIONS TAB ========= */}
      {activeTab === "upcoming" && (
        <>
          {/* Toolbar — list view only */}
          {viewMode === "list" && (
            <div className="hidden sm:flex flex-wrap items-center gap-2.5 mb-4">
              <div className="w-[200px]">
                <Select
                  value={consFilterCustomer}
                  onChange={(v) => { setConsFilterCustomer(v); setConsPage(0); }}
                  searchable
                  compact
                  placeholder="All customers"
                  options={[{ value: "", label: "All customers" }, ...uniqueConsCustomers.map((name) => ({ value: name, label: name }))]}
                />
              </div>
              <div className="w-[200px]">
                <Select
                  value={consFilterStatus}
                  onChange={(v) => { setConsFilterStatus(v); setConsFilterStatusMulti([]); setConsPage(0); }}
                  compact
                  placeholder="All statuses"
                  options={[
                    { value: "", label: "All statuses" },
                    { value: "payment_pending", label: "Payment pending" },
                    { value: "scheduled", label: "Scheduled" },
                    { value: "reschedule_requested", label: "Reschedule" },
                    { value: "summary_pending", label: "Recommendation due" },
                    { value: "no_show", label: "No show" },
                    { value: "completed", label: "Completed" },
                  ]}
                />
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowConsDatePicker(!showConsDatePicker)}
                  className="h-9 px-3.5 rounded-[9px] text-[13.5px] flex items-center gap-2 cursor-pointer transition-all"
                  style={{ background: T.popover, border: `1px solid ${(consFilterDateFrom || consFilterDateTo) ? T.accentBorder : T.border}`, color: T.text }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 9h18" /></svg>
                  {(consFilterDateFrom || consFilterDateTo)
                    ? `${consFilterDateFrom ? new Date(consFilterDateFrom + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Start"} — ${consFilterDateTo ? new Date(consFilterDateTo + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "End"}`
                    : "All dates"}
                </button>
                {showConsDatePicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowConsDatePicker(false)} />
                    <div className="absolute top-full left-0 mt-1 z-50 rounded-[9px] shadow-lg p-4 w-[280px]" style={{ background: T.popover, border: `1px solid ${T.border}` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex-1">
                          <div className="text-[9px] uppercase tracking-[0.06em] mb-1" style={{ color: T.faint }}>From</div>
                          <input type="date" value={consFilterDateFrom} onChange={(e) => { setConsFilterDateFrom(e.target.value); setConsPage(0); }} className="w-full h-8 px-2 rounded-[7px] text-[11px] outline-none" style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }} />
                        </div>
                        <span className="text-[11px] mt-3" style={{ color: T.faint }}>—</span>
                        <div className="flex-1">
                          <div className="text-[9px] uppercase tracking-[0.06em] mb-1" style={{ color: T.faint }}>To</div>
                          <input type="date" value={consFilterDateTo} onChange={(e) => { setConsFilterDateTo(e.target.value); setConsPage(0); }} className="w-full h-8 px-2 rounded-[7px] text-[11px] outline-none" style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }} />
                        </div>
                      </div>
                      {(consFilterDateFrom || consFilterDateTo) && (
                        <button onClick={() => { setConsFilterDateFrom(""); setConsFilterDateTo(""); setShowConsDatePicker(false); setConsPage(0); }} className="text-[11px] cursor-pointer hover:underline" style={{ color: T.danger }}>Clear dates</button>
                      )}
                    </div>
                  </>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2">
                {consHasActiveFilters && (
                  <button onClick={() => { setConsFilterCustomer(""); setConsFilterStatus(""); setConsFilterStatusMulti([]); setConsFilterDateFrom(""); setConsFilterDateTo(""); setConsPage(0); }} className="text-[12px] font-medium px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap" style={{ color: T.danger }}>Clear all</button>
                )}
                <ToolbarSearch value={consSearch} onChange={(v) => { setConsSearch(v); setConsPage(0); }} placeholder="Search customer, consultation ID…" />
                <SortMenu value={consSort} onChange={(v) => { setConsSort(v as SortKey); setConsPage(0); }} options={[{ value: "date_desc", label: "Newest first" }, { value: "date_asc", label: "Oldest first" }]} />
              </div>
            </div>
          )}

          {/* ---- List view ---- */}
          {viewMode === "list" && (
            <>
              <Card className="!p-0 md:min-h-0 md:overflow-y-auto">
                <TableHeader cols={["Booking details", "Scheduled time", "Commission", "Status"]} />
                {consPaginated.length === 0 ? (
                  <EmptyState inline icon="search" title="No consultations" description="Try a different search or clear the filters." />
                ) : (
                  consPaginated.map((c) => <ConsultationRow key={c.id} c={c} />)
                )}
              </Card>
              <Pagination page={consPage} totalPages={consTotalPages} totalItems={consFiltered.length} perPage={PAGE_SIZE} onPageChange={setConsPage} />
            </>
          )}

          {/* ---- Calendar view ---- */}
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
                  events={consultations.filter((c) => c.scheduledAt).map((c) => ({
                    id: c.id,
                    dateISO: c.scheduledAt.slice(0, 10),
                    timeLabel: new Date(c.scheduledAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }),
                    title: c.customerName,
                    sub: c.type.replace(/_/g, " ").replace(/^./, (ch) => ch.toUpperCase()),
                    color: eventTone(c),
                    href: `/consultations/${c.id}`,
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
                                  <div
                                    key={iso}
                                    onClick={() => openAddConsult(iso)}
                                    className="relative px-0.5 pt-0.5 cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.045)]"
                                    style={{ borderTop: `1px solid ${T.borderSoft}`, borderLeft: `1px solid ${T.borderSoft}` }}
                                  >
                                    {events.map((ev) => {
                                      const dt = new Date(ev.scheduledAt);
                                      const timeStr = dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
                                      const tone = eventTone(ev);
                                      return (
                                        <button
                                          key={ev.id}
                                          onClick={(e) => { e.stopPropagation(); setSelectedEvent(selectedEvent?.id === ev.id ? null : ev); }}
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
                  {/* Mini month */}
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

                  {/* Event details */}
                  {selectedEvent ? (() => {
                    const ev = selectedEvent;
                    const dt = new Date(ev.scheduledAt);
                    const st = rowStatus(ev);
                    return (
                      <div className="rounded-[16px] p-5" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow, animation: "fadeIn 0.15s ease both" }}>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <Chip tone={st.tone}>{st.label}</Chip>
                          <button onClick={() => setSelectedEvent(null)} aria-label="Close details" className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(89,82,54,0.10)]" style={{ color: T.muted }}>
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
                        <Link href={`/consultations/${ev.id}`} className="mt-4 h-9 w-full rounded-[9px] text-[13px] font-semibold inline-flex items-center justify-center transition-all duration-200 hover:brightness-110" style={{ background: T.accent, color: T.accentInk }}>
                          Open details
                        </Link>
                      </div>
                    );
                  })() : (
                    <div className="rounded-[16px] p-5 text-center" style={{ background: T.card, border: `1px dashed ${T.border}` }}>
                      <div className="text-[12.5px]" style={{ color: T.faint }}>
                        Select a consultation on the calendar to see its details, or click an empty slot to add one.
                      </div>
                    </div>
                  )}
                </aside>
              </div>
              </>
            );
          })()}
        </>
      )}

      {/* ========= AVAILABILITY TAB ========= */}
      {activeTab === "availability" && (
        <Card className="!p-6 md:min-h-0 md:overflow-y-auto">
          <div className="flex items-center justify-between mb-4 pb-4" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            <div>
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Week availability</h2>
              <p className="text-[12px] mt-0.5" style={{ color: T.muted }}>24-hour slots · Booked opens the consultation · Available / Unavailable toggle</p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-[11.5px]" style={{ color: T.muted }}>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: T.good }} />Booked</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: T.info }} />Available</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: T.faint }} />Unavailable</span>
            </div>
          </div>
          <div>
            {weekDaysForAvail.map((dateISO, i) => {
              const bookedCount = fullDaySlots.filter((t) => bookedSlotMap.has(`${dateISO}-${t}`)).length;
              const unavailableCount = fullDaySlots.filter((t) => !bookedSlotMap.has(`${dateISO}-${t}`) && unavailableSlots.has(`${dateISO}-${t}`)).length;
              const openCount = 24 - bookedCount - unavailableCount;
              const bookedStyle = { background: "rgba(95,112,64,0.16)", border: "1px solid rgba(95,112,64,0.42)", color: "#3d4a28" };
              const availableStyle = { background: "rgba(88,112,130,0.14)", border: "1px solid rgba(88,112,130,0.40)", color: T.info };
              const unavailableStyle = { background: "rgba(134,126,100,0.10)", border: "1px dashed rgba(134,126,100,0.50)", color: T.faint };
              const slotBtnClass = "inline-flex items-center justify-center gap-1.5 h-8 w-[92px] px-2 rounded-[9px] text-[12.5px] font-medium tabular-nums cursor-pointer transition-colors hover:brightness-95";
              return (
                <div
                  key={dateISO}
                  className="py-4"
                  style={{ borderBottom: i < weekDaysForAvail.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                >
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-[13px] font-medium" style={{ color: T.text }}>
                      {new Date(dateISO + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <span className="text-[11.5px] tabular-nums" style={{ color: T.faint }}>
                      {openCount} available · {bookedCount} booked · {unavailableCount} unavailable
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fullDaySlots.map((time) => {
                      const key = `${dateISO}-${time}`;
                      const booking = bookedSlotMap.get(key);
                      if (booking) {
                        return (
                          <Link
                            key={key}
                            href={`/consultations/${booking.id}`}
                            title={`Booked — ${booking.customerName}`}
                            className={slotBtnClass}
                            style={bookedStyle}
                          >
                            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: T.good }} />
                            {to12Hour(time)}
                          </Link>
                        );
                      }
                      const isUnavailable = unavailableSlots.has(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleUnavailable(dateISO, time)}
                          title={isUnavailable ? "Unavailable — tap to reopen" : "Available — tap to mark unavailable"}
                          className={slotBtnClass}
                          style={isUnavailable ? unavailableStyle : availableStyle}
                        >
                          {isUnavailable ? (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3 h-3"><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6 18.4 18.4" /></svg>
                              <span className="line-through">{to12Hour(time)}</span>
                            </>
                          ) : (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: T.info }} />
                              {to12Hour(time)}
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ========= SUMMARY DUE TAB ========= */}
      {activeTab === "summary_due" && (
        <>
          <div className="hidden sm:flex flex-wrap items-center gap-2 pt-4 mb-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
            <div className="ml-auto flex items-center gap-2">
              <ToolbarSearch value={sdSearch} onChange={(v) => { setSdSearch(v); setSdPage(0); }} placeholder="Search customer, ID…" />
              <SortMenu value={sdSort} onChange={(v) => { setSdSort(v as SortKey); setSdPage(0); }} options={[{ value: "date_desc", label: "Newest first" }, { value: "date_asc", label: "Oldest first" }]} />
            </div>
          </div>

          <Card className="!p-0 md:flex md:flex-col md:min-h-0">
          <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none flex-1">
            <TableHeader cols={["Booking details", "Scheduled time", "Commission", "Status"]} />
            {sdPaginated.length === 0 ? (
              <EmptyState inline icon="check" title="Nothing pending" description="All recommendations are up to date." />
            ) : (
              sdPaginated.map((c) => <ConsultationRow key={c.id} c={c} />)
            )}
          </div>
        </Card>
        <Pagination page={sdPage} totalPages={sdTotalPages} totalItems={sdFiltered.length} perPage={PAGE_SIZE} onPageChange={setSdPage} />
        </>
      )}

      {/* ========= NO SHOW TAB ========= */}
      {activeTab === "no_show" && (
        <>
          <div className="hidden sm:flex flex-wrap items-center gap-2 pt-4 mb-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
            <div className="ml-auto flex items-center gap-2">
              <ToolbarSearch value={nsSearch} onChange={(v) => { setNsSearch(v); setNsPage(0); }} placeholder="Search customer, ID…" />
              <SortMenu value={nsSort} onChange={(v) => { setNsSort(v as SortKey); setNsPage(0); }} options={[{ value: "date_desc", label: "Newest first" }, { value: "date_asc", label: "Oldest first" }]} />
            </div>
          </div>

          <Card className="!p-0 md:flex md:flex-col md:min-h-0">
          <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none flex-1">
            <TableHeader cols={["Booking details", "Scheduled time", "Commission", "Status"]} />
            {nsPaginated.length === 0 ? (
              <EmptyState inline icon="check" title="No no-shows" description="This expert has no no-show records." />
            ) : (
              nsPaginated.map((c) => <ConsultationRow key={c.id} c={c} />)
            )}
          </div>
        </Card>
        <Pagination page={nsPage} totalPages={nsTotalPages} totalItems={nsFiltered.length} perPage={PAGE_SIZE} onPageChange={setNsPage} />
        </>
      )}

      {/* ========= RECOMMENDATIONS TAB ========= */}
      {activeTab === "recommendations" && (
        <>
          <div className="hidden sm:flex flex-wrap items-center gap-2 pt-4 mb-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
            <div className="flex flex-wrap items-center gap-2">
              <InlineFilter label="Stone" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20.6 13.4 12 22l-9-9V4h9z" /><circle cx="7.5" cy="7.5" r="1.3" /></svg>} count={recFilterStone ? 1 : 0}>
                <MultiCheck options={recStones.map((s) => ({ value: s, label: s }))} value={recFilterStone ? [recFilterStone] : []} onChange={(v) => { setRecFilterStone(v[0] || ""); setRecPage(0); }} />
              </InlineFilter>
              <InlineFilter label="Status" icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M3 5h18l-7 8v6l-4-2v-4z" /></svg>} count={recFilterStatus ? 1 : 0}>
                <MultiCheck options={[{ value: "submitted", label: "Submitted" }, { value: "converted_to_order", label: "Converted" }]} value={recFilterStatus ? [recFilterStatus] : []} onChange={(v) => { setRecFilterStatus(v[0] || ""); setRecPage(0); }} />
              </InlineFilter>
              {(recFilterStone || recFilterStatus) && <button onClick={() => { setRecFilterStone(""); setRecFilterStatus(""); setRecPage(0); }} className="shrink-0 text-[12px] font-medium h-8 px-2.5 rounded-[8px] cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)]" style={{ color: T.muted }}>Clear all</button>}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ToolbarSearch value={recSearch} onChange={(v) => { setRecSearch(v); setRecPage(0); }} placeholder="Search gemstone, customer…" />
              <SortMenu value={recSort} onChange={(v) => { setRecSort(v as SortKey); setRecPage(0); }} options={[{ value: "date_desc", label: "Newest first" }, { value: "date_asc", label: "Oldest first" }]} />
            </div>
          </div>

          <Card className="!p-0 md:flex md:flex-col md:min-h-0">
          <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none flex-1">
            <div className="hidden sm:grid grid-cols-[1fr_130px_100px_100px_120px_120px] gap-3 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]" style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}>
              <span>Stone</span>
              <span>Customer</span>
              <span className="text-right">Price</span>
              <span className="text-right">Commission</span>
              <span>Recommended</span>
              <span>Status</span>
            </div>
            {recPaginated.length === 0 ? (
              <EmptyState inline icon="search" title="No recommendations" description="No recommendations match your filters." />
            ) : (
              recPaginated.map((r) => {
                const href = r.orderId ? `/orders/${r.orderId}` : `/consultations/${r.consultationId}`;
                const price = getEstimatedPrice(r);
                const recComm = price != null && r.status === "converted_to_order" ? Math.round(price * parseFloat(commissionRates.stone) / 100) : 0;
                return (
                  <Link
                    key={r.id}
                    href={href}
                    className="group grid grid-cols-1 sm:grid-cols-[1fr_130px_100px_100px_120px_120px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors duration-150 even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)] last:rounded-b-[15px]"
                    style={{ borderBottom: `1px solid ${T.borderSoft}` }}
                  >
                    <div className="min-w-0">
                      <span className="text-[13.5px] font-medium group-hover:underline" style={{ color: T.accent }}>{r.gemstone}</span>
                      <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{r.weightRange}</div>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[12px] truncate block" style={{ color: T.text }}>{r.customerName}</span>
                    </div>
                    <div className="min-w-0 text-right">
                      <span className="text-[12px] tabular-nums font-medium" style={{ color: T.text }}>{price != null ? inr(price) : "—"}</span>
                    </div>
                    <div className="min-w-0 text-right">
                      <span className="text-[12px] tabular-nums" style={{ color: recComm > 0 ? T.accent : T.faint }}>{recComm > 0 ? inr(recComm) : "—"}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[12px] tabular-nums" style={{ color: T.text }}>
                        {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/ (\d{4})$/, ", $1")}
                      </span>
                    </div>
                    <div>
                      <Chip tone={r.status === "converted_to_order" ? "good" : "gold"}>
                        {recommendationStatusLabel(r)}
                      </Chip>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </Card>
        <Pagination page={recPage} totalPages={recTotalPages} totalItems={recFiltered.length} perPage={PAGE_SIZE} onPageChange={setRecPage} />
        </>
      )}

      {/* ========= PAYMENTS TAB ========= */}
      {activeTab === "payments" && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <StatCard label="Total earnings" value={inr(totalEarnings)} featured />
            <StatCard label="Total payments" value={expertPayments.length} />
            <StatCard label="Pending" value={expertPayments.filter((p) => p.status !== "paid").length} />
          </div>

          <div className="hidden sm:flex flex-wrap items-center gap-2 pt-4 mb-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
            <div className="ml-auto flex items-center gap-2">
              <ToolbarSearch value={paySearch} onChange={(v) => { setPaySearch(v); setPayPage(0); }} placeholder="Search payment ID, type…" />
              <SortMenu value={paySort} onChange={(v) => { setPaySort(v as SortKey); setPayPage(0); }} options={[{ value: "date_desc", label: "Newest first" }, { value: "date_asc", label: "Oldest first" }]} />
            </div>
          </div>

          <Card className="!p-0 md:flex md:flex-col md:min-h-0">
          <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none flex-1">
            <div className="hidden sm:grid grid-cols-[120px_1fr_1fr_160px_120px] gap-3 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]" style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}>
              <span>Payment ID</span>
              <span>Payment type</span>
              <span>Paid by</span>
              <span>Date &amp; time</span>
              <span className="text-right">Amount</span>
            </div>
            {payPaginated.length === 0 ? (
              <EmptyState inline icon="inbox" title="No payouts" description="No payouts recorded yet." />
            ) : (
              payPaginated.map((p) => {
                const dt = new Date(p.paidAt ?? p.createdAt);
                return (
                  <div key={p.id} className="grid grid-cols-1 sm:grid-cols-[120px_1fr_1fr_160px_120px] gap-3 items-center px-4 py-2.5 even:bg-[rgba(89,82,54,0.025)] last:rounded-b-[15px]" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                    <div className="text-[11px] tracking-[0.06em] uppercase font-medium" style={{ color: T.accent }}>{p.id}</div>
                    <div className="text-[13px] truncate" style={{ color: T.text }}>{p.medium ?? "Bank Transfer"}</div>
                    <div className="text-[13px] truncate" style={{ color: T.text }}>{p.ownerName}</div>
                    <div className="text-[12px] tabular-nums" style={{ color: T.muted }}>
                      {dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      <span className="ml-1 opacity-60">{dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}</span>
                    </div>
                    <div className="text-[13px] text-right font-semibold tabular-nums" style={{ color: T.text }}>{inr(p.amount)}</div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
        <Pagination page={payPage} totalPages={payTotalPages} totalItems={payFiltered.length} perPage={PAGE_SIZE} onPageChange={setPayPage} />
        </>
      )}

      {/* Make Payout Modal */}
      <Modal open={showPayoutModal} onClose={() => setShowPayoutModal(false)} title="Make payout">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-[12px]" style={{ background: T.accentFaint, border: `1px solid ${T.borderSoft}` }}>
            <div className="min-w-0">
              <div className="text-[13.5px] font-semibold truncate" style={{ color: T.text }}>{expert.name}</div>
              <div className="text-[12px] mt-0.5 truncate" style={{ color: T.muted }}>{expert.specialization}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px] font-medium uppercase tracking-[0.08em]" style={{ color: T.faint }}>Total earnings</div>
              <div className="text-[16px] font-semibold tabular-nums" style={{ color: T.accent }}>{inr(totalEarnings)}</div>
            </div>
          </div>
          <Input value={payoutForm.amount} onChange={(v) => setPayoutForm((p) => ({ ...p, amount: v }))} label="Amount (₹)" type="number" placeholder={String(totalEarnings)} />
          <Select
            value={payoutForm.paymentType}
            onChange={(v) => setPayoutForm((p) => ({ ...p, paymentType: v }))}
            label="Payment type"
            options={[
              { value: "bank_transfer", label: "Bank Transfer" },
              { value: "upi", label: "UPI" },
              { value: "cheque", label: "Cheque" },
              { value: "cash", label: "Cash" },
              { value: "net_banking", label: "Net Banking" },
            ]}
          />
          <Input value={payoutForm.paidBy} onChange={(v) => setPayoutForm((p) => ({ ...p, paidBy: v }))} label="Paid by" placeholder="e.g. Finance team, Admin" />
          <Input value={payoutForm.notes} onChange={(v) => setPayoutForm((p) => ({ ...p, notes: v }))} label="Notes / period" placeholder="e.g. May – Jul 2026" />
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <GhostBtn onClick={() => setShowPayoutModal(false)}>Cancel</GhostBtn>
            <GoldBtn
              onClick={() => { setShowPayoutModal(false); setPayoutForm({ amount: "", paymentType: "bank_transfer", paidBy: "", notes: "" }); setToast("Payout recorded"); setTimeout(() => setToast(""), 3000); }}
              disabled={Number(payoutForm.amount || totalEarnings) <= 0}
            >
              Record payout
            </GoldBtn>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast} />}

      <ConfirmDialog
        open={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={() => { setIsActive(false); setToast("Gemologist deactivated"); setTimeout(() => setToast(""), 3000); }}
        title={`Deactivate ${expert.name}?`}
        message="They'll lose portal access until reactivated."
        confirmLabel="Deactivate"
        tone="danger"
      />
      </div>
    </>
  );
}
