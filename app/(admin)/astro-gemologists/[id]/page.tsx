"use client";
import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Chip, StatCard, GhostBtn, GoldBtn, SectionLink, BackLink, Tabs, SearchFilter, Pagination, Select, Modal, Input, ConfirmDialog, LoadingState } from "@/components/ui";
import { T } from "@/lib/theme";
import { EXPERT_PROFILES, EXPERT_AVAILABILITY, MOCK_CONSULTATIONS, MOCK_STONE_RECOMMENDATIONS, MOCK_ORDERS, MOCK_PAYMENTS } from "@/lib/mock";
import { inr } from "@/lib/types";
import type { StoneRecommendation } from "@/lib/types";

const PAGE_SIZE = 8;
type SortKey = "date_desc" | "date_asc";

const DETAIL_TABS = [
  { key: "upcoming", label: "Consultations" },
  { key: "availability", label: "Availability" },
  { key: "summary_due", label: "Recommendation due" },
  { key: "no_show", label: "No show" },
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const expert = EXPERT_PROFILES.find((e) => e.id === id);
  const availability = EXPERT_AVAILABILITY.find((e) => e.expertId === id);

  if (!expert) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[14px]" style={{ color: T.muted }}>Expert not found.</p>
      </div>
    );
  }

  const consultations = MOCK_CONSULTATIONS.filter((c) => c.expertId === id);
  const allUpcoming = consultations.filter((c) => c.status === "scheduled");
  const allPendingSummaries = consultations.filter((c) => c.status === "summary_pending");
  const allCompleted = consultations.filter((c) => c.status === "closed" || c.status === "completed");
  const allNoShows = consultations.filter((c) => c.status === "no_show" && c.noShowBy === "expert");
  const allRecommendations = MOCK_STONE_RECOMMENDATIONS.filter((r) => r.expertId === id);
  const next7Days = availability?.availability.slice(0, 7) ?? [];

  const bookedSlotMap = useMemo(() => {
    const map = new Map<string, { id: string; customerName: string }>();
    for (const c of consultations) {
      if (c.status === "cancelled" || c.status === "no_show") continue;
      const dt = new Date(c.scheduledAt);
      const dateKey = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
      const h = dt.getHours();
      const m = dt.getMinutes();
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      const timeKey = m === 0 ? `${h12}:00 ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
      map.set(`${dateKey}_${timeKey}`, { id: c.id, customerName: c.customerName });
    }
    return map;
  }, [consultations]);

  const router = useRouter();
  const [isActive, setIsActive] = useState(expert.status === "active");
  const [showMenu, setShowMenu] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState("");
  const [commissionEditing, setCommissionEditing] = useState(false);
  const [commissionToast, setCommissionToast] = useState("");
  const [commissionRates, setCommissionRates] = useState({ stone: "8", jewellery: "6", consultation: "15" });
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: "", notes: "" });

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu]);

  const [activeTab, setActiveTab] = useState("upcoming");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("calendar");

  // Consultations tab state (list + calendar)
  const [consSearch, setConsSearch] = useState("");
  const [consSort, setConsSort] = useState<SortKey>("date_desc");
  const [consFilterStatus, setConsFilterStatus] = useState("");
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
  const consHasActiveFilters = !!consFilterCustomer || !!consFilterStatus || !!consFilterDateFrom || !!consFilterDateTo;
  const consFiltered = sortByDate(
    searchFilter(consultations, consSearch).filter((c) => {
      if (consFilterCustomer && c.customerName !== consFilterCustomer) return false;
      if (consFilterStatus === "scheduled" && c.status !== "scheduled") return false;
      if (consFilterStatus === "completed" && c.status !== "closed" && c.status !== "completed") return false;
      if (consFilterStatus === "summary_pending" && c.status !== "summary_pending") return false;
      if (consFilterStatus === "no_show" && c.status !== "no_show") return false;
      if (consFilterStatus === "reschedule_requested" && c.status !== "reschedule_requested") return false;
      if (consFilterStatus === "payment_pending" && c.paymentStatus !== "pending") return false;
      return true;
    }).filter((c) => {
      const d = c.scheduledAt?.slice(0, 10);
      if (consFilterDateFrom && d && d < consFilterDateFrom) return false;
      if (consFilterDateTo && d && d > consFilterDateTo) return false;
      return true;
    }),
    consSort,
  );
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
    availability: next7Days.length,
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
    return (
      <Link
        href={`/consultations/${c.id}`}
        className="group grid grid-cols-1 sm:grid-cols-[1fr_140px_100px_120px] gap-2 sm:gap-3 items-center px-3 py-3.5 transition-all duration-150 rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]"
        style={{ borderBottom: `1px solid ${T.borderSoft}` }}
      >
        <div className="min-w-0">
          <span className="text-[11px] tracking-[0.06em] uppercase font-medium" style={{ color: T.accent }}>{c.id}</span>
          <div className="text-[14px] mt-0.5 truncate" style={{ color: T.text }}>{c.customerName}</div>
        </div>
        <div className="min-w-0">
          <span className="text-[12px] tabular-nums" style={{ color: T.text }}>
            {new Date(c.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/ (\d{4})$/, ", $1")}
          </span>
        </div>
        <div className="text-[12px] tabular-nums text-right" style={{ color: comm > 0 ? T.accent : T.faint }}>
          {comm > 0 ? inr(comm) : "—"}
        </div>
        <div>
          {showStatus === "summary" ? (
            c.summarySubmittedAt ? <Chip tone="good">Provided</Chip> : <Chip tone="danger">Pending</Chip>
          ) : (
            <Chip tone={statusTone(c.status)}>
              {c.status === "scheduled" ? "Scheduled" :
               c.status === "summary_pending" ? "Recommendation due" :
               c.status === "no_show" ? (c.noShowBy === "expert" ? "Expert no show" : "Customer no show") :
               c.status === "closed" || c.status === "completed" ? "Completed" :
               c.status.replace(/_/g, " ")}
            </Chip>
          )}
        </div>
      </Link>
    );
  }

  function TableHeader({ cols }: { cols: string[] }) {
    return (
      <div className={`hidden sm:grid gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase`} style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}`, gridTemplateColumns: "1fr 140px 100px 120px" }}>
        {cols.map((c) => <span key={c}>{c}</span>)}
      </div>
    );
  }

  function SortControl({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
    return (
      <div className="flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-[12px]" style={{ border: `1px solid ${T.borderSoft}`, color: T.muted }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M6 12h12M9 18h6"/></svg>
        <Select
          value={value}
          onChange={(val) => onChange(val as SortKey)}
          compact
          options={[
            { value: "date_desc", label: "Newest" },
            { value: "date_asc", label: "Oldest" },
          ]}
          className="w-[80px]"
        />
      </div>
    );
  }

  return (
    <>
      <div className="mb-5">
        <BackLink label="Astro-Gemologists" href="/astro-gemologists" />
      </div>

      {loading ? (
        <Card className="mb-6"><LoadingState lines={8} /></Card>
      ) : (
      <>
      {/* Profile + Commission + Account — combined card */}
      <div className="rounded-[14px] p-6 mb-6" style={{ background: `linear-gradient(135deg, ${T.card} 0%, ${T.panel} 100%)`, border: `1px solid ${T.border}` }}>
        {/* Expert info + 3-dot menu */}
        <div className="flex flex-wrap items-start gap-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-bold shrink-0" style={{ background: `${T.accent}15`, border: `2px solid ${T.accent}40`, color: T.accent }}>{expert.name[0]}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-[17px] font-semibold" style={{ color: T.text }}>{expert.name}</span>
              {isActive ? (expert.calendlyStatus === "pending" ? <Chip tone="gold">Calendly invite pending</Chip> : <Chip tone="good">active</Chip>) : <Chip tone="danger">inactive</Chip>}
            </div>
            <div className="text-[13.5px] mt-1" style={{ color: T.muted }}>{expert.specialization}</div>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-[12px]" style={{ color: T.faint }}>
              <span>{expert.experience}</span><span>·</span>
              <span>{expert.languages.join(", ")}</span><span>·</span>
              <span style={{ color: T.accent }}>{inr(expert.fee)}/session</span><span>·</span>
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {expert.phone}
              </span>
            </div>
          </div>
          <div className="relative shrink-0" ref={menuRef}>
            <button type="button" onClick={() => setShowMenu((v) => !v)} className="w-9 h-9 rounded-[9px] flex items-center justify-center transition-colors hover:bg-[rgba(89,82,54,0.08)] cursor-pointer" style={{ border: `1px solid ${T.border}`, color: T.muted }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 z-50 rounded-[10px] overflow-hidden shadow-lg py-1 min-w-[190px]" style={{ background: T.popover, border: `1px solid ${T.border}`, animation: "fadeIn 120ms ease-out" }}>
                <button type="button" onClick={() => { setShowMenu(false); router.push(`/astro-gemologists/${id}/edit`); }} className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(160,125,56,0.08)] cursor-pointer" style={{ color: T.text }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                  Edit profile
                </button>
                {expert.calendlyStatus === "pending" && isActive && (
                  <button type="button" onClick={() => { setShowMenu(false); setToast("Calendly invitation resent"); setTimeout(() => setToast(""), 3000); }} className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(160,125,56,0.08)] cursor-pointer" style={{ color: T.text }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4z"/></svg>
                    Resend invitation
                  </button>
                )}
                <button type="button" onClick={() => { setShowMenu(false); setShowPayoutModal(true); }} className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(160,125,56,0.08)] cursor-pointer" style={{ color: T.text }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2v20M6 6h9a3 3 0 0 1 0 6H5M7 12h8a3 3 0 0 1 0 6H6"/></svg>
                  Make payout
                </button>
                <div className="mx-2 my-1" style={{ borderTop: `1px solid ${T.borderSoft}` }} />
                <button type="button" onClick={() => { setShowMenu(false); if (isActive) { setConfirmDeactivate(true); } else { setIsActive(true); setToast("Gemologist activated"); setTimeout(() => setToast(""), 3000); } }} className="w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2.5 transition-colors hover:bg-[rgba(160,125,56,0.08)] cursor-pointer" style={{ color: isActive ? T.danger : T.good }}>
                  {isActive ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>Deactivate</> : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>Activate</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Commission rates */}
        <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-[11px] tracking-[0.08em] uppercase font-medium" style={{ color: T.faint }}>Commission rates</span>
              {commissionToast && <span className="text-[12px] font-medium" style={{ color: T.good }}>✓ {commissionToast}</span>}
            </div>
            {commissionEditing ? (
              <GoldBtn className="!h-7 !px-3 !text-[11px]" onClick={() => { setCommissionEditing(false); setCommissionToast("Commission saved"); setTimeout(() => setCommissionToast(""), 3000); }}>Save</GoldBtn>
            ) : (
              <GhostBtn className="!h-7 !px-3 !text-[11px]" onClick={() => setCommissionEditing(true)}>Edit</GhostBtn>
            )}
          </div>
          <div className="grid grid-cols-3 gap-4">
            {(["stone", "jewellery", "consultation"] as const).map((cat) => (
              <div key={cat} className="rounded-[10px] p-3" style={{ background: "rgba(250,246,236,0.6)", border: `1px solid ${T.borderSoft}` }}>
                <div className="text-[10px] tracking-[0.06em] uppercase mb-1" style={{ color: T.faint }}>{cat}</div>
                {commissionEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input type="number" value={commissionRates[cat]} onChange={(e) => setCommissionRates((p) => ({ ...p, [cat]: e.target.value }))} className="w-full h-8 px-2 rounded-[7px] text-[13px] outline-none" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text }} />
                    <span className="text-[12px] font-medium shrink-0" style={{ color: T.muted }}>%</span>
                  </div>
                ) : (
                  <div className="text-[16px] font-semibold tabular-nums" style={{ color: T.text }}>{commissionRates[cat]}%</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bank details */}
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div><div className="text-[10px] uppercase tracking-wider" style={{ color: T.faint }}>Bank</div><div className="text-[13px] mt-0.5" style={{ color: T.text }}>HDFC Bank</div></div>
            <div><div className="text-[10px] uppercase tracking-wider" style={{ color: T.faint }}>Account</div><div className="text-[13px] mt-0.5" style={{ color: T.text }}>1234 5678 6789</div></div>
            <div><div className="text-[10px] uppercase tracking-wider" style={{ color: T.faint }}>IFSC</div><div className="text-[13px] mt-0.5" style={{ color: T.text }}>HDFC0001234</div></div>
            <div><div className="text-[10px] uppercase tracking-wider" style={{ color: T.faint }}>UPI</div><div className="text-[13px] mt-0.5" style={{ color: T.accent }}>{expert.name.split(" ").pop()?.toLowerCase()}@upi</div></div>
          </div>
        </div>
      </div>

      {/* Dashboard stats — header / value / status */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Consultations", value: allCompleted.length, status: "completed", tone: T.good },
          { label: "Purchases", value: allRecommendations.filter((r) => r.status === "converted_to_order").length, status: "completed", tone: T.good },
          { label: "Recommendation", value: allPendingSummaries.length, status: "due", tone: allPendingSummaries.length > 0 ? T.danger : T.good },
          { label: "Commission", value: inr(Math.max(0, totalEarnings - expertPayments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0))), status: "due", tone: T.accent },
          { label: "Commission", value: inr(totalEarnings), status: "earned", tone: T.good },
        ].map((stat, i) => (
          <div key={i} className="rounded-[12px] p-5" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>{stat.label}</div>
            <div className="text-[20px] font-semibold mt-1 tabular-nums" style={{ color: T.text }}>{stat.value}</div>
            <div className="text-[11px] font-medium mt-1" style={{ color: stat.tone }}>{stat.status}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4">
        <Tabs
          tabs={DETAIL_TABS.map((t) => ({ ...t, count: tabCounts[t.key] }))}
          active={activeTab}
          onChange={(key) => { setActiveTab(key); }}
        />
      </div>

      {/* ========= CONSULTATIONS TAB ========= */}
      {activeTab === "upcoming" && (
        <>
          {/* Search + View toggle — fixed height row */}
          <div className="flex items-center gap-3 mb-3 h-10">
            <div className="flex-1 min-w-0">
              {viewMode === "list" && (
                <div className="w-1/2">
                  <SearchFilter search={consSearch} onSearchChange={(v) => { setConsSearch(v); setConsPage(0); }} placeholder="Search customer, consultation ID…" />
                </div>
              )}
            </div>
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
          </div>

          {/* ---- List view ---- */}
          {viewMode === "list" && (
            <>
              {/* Filters & Sort */}
              <div className="flex flex-wrap items-center gap-2.5 mb-4">
                <div className="w-[200px]">
                  <Select value={consFilterCustomer} onChange={(v) => { setConsFilterCustomer(v); setConsPage(0); }} searchable compact placeholder="All customers" options={[{ value: "", label: "All customers" }, ...uniqueConsCustomers.map((n) => ({ value: n, label: n }))]} />
                </div>
                <div className="w-[180px]">
                  <Select value={consFilterStatus} onChange={(v) => { setConsFilterStatus(v); setConsPage(0); }} compact placeholder="All status" options={[
                    { value: "", label: "All status" },
                    { value: "payment_pending", label: "Payment pending" },
                    { value: "scheduled", label: "Scheduled" },
                    { value: "reschedule_requested", label: "Reschedule" },
                    { value: "no_show", label: "No show" },
                    { value: "completed", label: "Completed" },
                  ]} />
                </div>
                {/* Date range */}
                <div className="relative">
                  <button onClick={() => setShowConsDatePicker(!showConsDatePicker)} className="h-9 px-3.5 rounded-[9px] text-[13.5px] flex items-center gap-2 cursor-pointer transition-all" style={{ background: T.popover, border: `1px solid ${(consFilterDateFrom || consFilterDateTo) ? T.accentBorder : T.border}`, color: T.text }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 9h18"/></svg>
                    {(consFilterDateFrom || consFilterDateTo)
                      ? `${consFilterDateFrom ? new Date(consFilterDateFrom + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Start"} — ${consFilterDateTo ? new Date(consFilterDateTo + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "End"}`
                      : "All dates"}
                  </button>
                  {showConsDatePicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowConsDatePicker(false)} />
                      <div className="absolute top-full left-0 mt-1 z-50 flex rounded-[9px] shadow-lg overflow-hidden" style={{ background: T.popover, border: `1px solid ${T.border}` }}>
                        <div className="w-[130px] py-2 px-1.5 shrink-0" style={{ borderRight: `1px solid ${T.borderSoft}` }}>
                          <div className="text-[9px] tracking-[0.06em] uppercase px-2 mb-1.5" style={{ color: T.faint }}>Quick select</div>
                          {[
                            { label: "Today", from: new Date().toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
                            { label: "Last 7 days", from: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
                            { label: "Last 30 days", from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
                          ].map((preset) => (
                            <button key={preset.label} onClick={() => { setConsFilterDateFrom(preset.from); setConsFilterDateTo(preset.to); setShowConsDatePicker(false); setConsPage(0); }} className="w-full text-left px-2.5 py-2 rounded-[7px] text-[12px] transition-colors cursor-pointer hover:bg-[rgba(160,125,56,0.10)]" style={{ color: T.text }}>{preset.label}</button>
                          ))}
                          {(consFilterDateFrom || consFilterDateTo) && (
                            <button onClick={() => { setConsFilterDateFrom(""); setConsFilterDateTo(""); setShowConsDatePicker(false); setConsPage(0); }} className="w-full text-left px-2.5 py-2 rounded-[7px] text-[11px] mt-1 transition-colors cursor-pointer hover:bg-[rgba(176,84,84,0.06)]" style={{ color: T.danger }}>Clear dates</button>
                          )}
                        </div>
                        <div className="p-4 w-[280px]">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex-1">
                              <div className="text-[9px] uppercase tracking-[0.06em] mb-1" style={{ color: T.faint }}>After</div>
                              <input type="date" value={consFilterDateFrom} onChange={(e) => { setConsFilterDateFrom(e.target.value); setConsPage(0); }} className="w-full h-8 px-2 rounded-[7px] text-[11px] outline-none" style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }} />
                            </div>
                            <span className="text-[11px] mt-3" style={{ color: T.faint }}>—</span>
                            <div className="flex-1">
                              <div className="text-[9px] uppercase tracking-[0.06em] mb-1" style={{ color: T.faint }}>Before</div>
                              <input type="date" value={consFilterDateTo} onChange={(e) => { setConsFilterDateTo(e.target.value); setConsPage(0); }} className="w-full h-8 px-2 rounded-[7px] text-[11px] outline-none" style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between mb-2">
                            <button type="button" onClick={() => { if (consDpMonth === 0) { setConsDpMonth(11); setConsDpYear((y) => y - 1); } else setConsDpMonth((m) => m - 1); }} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(160,125,56,0.15)]" style={{ color: T.muted }}>‹</button>
                            <span className="text-[11px] font-medium" style={{ color: T.text }}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][consDpMonth]} {consDpYear}</span>
                            <button type="button" onClick={() => { if (consDpMonth === 11) { setConsDpMonth(0); setConsDpYear((y) => y + 1); } else setConsDpMonth((m) => m + 1); }} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(160,125,56,0.15)]" style={{ color: T.muted }}>›</button>
                          </div>
                          <div className="grid grid-cols-7 gap-0.5 mb-1">
                            {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => <div key={d} className="text-center text-[9px] py-0.5" style={{ color: T.faint }}>{d}</div>)}
                          </div>
                          <div className="grid grid-cols-7 gap-0.5">
                            {Array.from({ length: (() => { const fd = new Date(consDpYear, consDpMonth, 1).getDay(); return fd === 0 ? 6 : fd - 1; })() }).map((_, i) => <div key={`e${i}`} />)}
                            {Array.from({ length: new Date(consDpYear, consDpMonth + 1, 0).getDate() }).map((_, i) => {
                              const day = i + 1;
                              const iso = `${consDpYear}-${String(consDpMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                              const isFrom = consFilterDateFrom === iso;
                              const isTo = consFilterDateTo === iso;
                              const inRange = consFilterDateFrom && consFilterDateTo && iso >= consFilterDateFrom && iso <= consFilterDateTo;
                              return (
                                <button key={day} type="button" onClick={() => { if (!consFilterDateFrom || (consFilterDateFrom && consFilterDateTo)) { setConsFilterDateFrom(iso); setConsFilterDateTo(""); } else { if (iso < consFilterDateFrom) { setConsFilterDateTo(consFilterDateFrom); setConsFilterDateFrom(iso); } else { setConsFilterDateTo(iso); } } setConsPage(0); }}
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
                  {consHasActiveFilters && (
                    <button onClick={() => { setConsFilterCustomer(""); setConsFilterStatus(""); setConsFilterDateFrom(""); setConsFilterDateTo(""); setConsPage(0); }} className="text-[11px] px-2.5 py-1.5 rounded-[7px] cursor-pointer transition-opacity hover:opacity-80" style={{ color: T.danger, background: "rgba(176,84,84,0.08)", border: "1px solid rgba(176,84,84,0.15)" }}>Clear filters</button>
                  )}
                  <div className="w-[180px]">
                    <Select value={consSort} onChange={(val) => { setConsSort(val as SortKey); setConsPage(0); }} compact prefix="Sort: " options={[{ value: "date_desc", label: "Newest first" }, { value: "date_asc", label: "Oldest first" }]} />
                  </div>
                </div>
              </div>

              <Card>
                <TableHeader cols={["Consultation", "Date", "Commission", "Status"]} />
                {consPaginated.length === 0 ? (
                  <p className="text-[13.5px] py-8 text-center" style={{ color: T.muted }}>No consultations match your filters.</p>
                ) : (
                  consPaginated.map((c) => <ConsultationRow key={c.id} c={c} />)
                )}
                <Pagination page={consPage} totalPages={consTotalPages} totalItems={consFiltered.length} perPage={PAGE_SIZE} onPageChange={setConsPage} />
              </Card>
            </>
          )}

          {/* ---- Calendar view ---- */}
          {viewMode === "calendar" && (
            <>
              {/* Week navigation */}
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
                                  const tone = ev.status === "closed" || ev.status === "completed" ? T.good : ev.status === "scheduled" ? "#6d8ea0" : ev.status === "reschedule_requested" ? T.accent : ev.status === "summary_pending" || ev.status === "no_show" ? T.danger : T.muted;
                                  return (
                                    <Link key={ev.id} href={`/consultations/${ev.id}`} className="block rounded-[6px] px-1.5 py-1 mb-0.5 text-[10px] leading-tight truncate transition-all hover:brightness-110" style={{ background: `${tone}18`, borderLeft: `3px solid ${tone}`, color: tone }} title={`${ev.customerName} — ${ev.expertName}`}>
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

      {/* ========= AVAILABILITY TAB ========= */}
      {activeTab === "availability" && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[15px] font-semibold" style={{ color: T.text }}>Week availability</span>
            <Link
              href={`/astro-gemologists/${id}/availability`}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[9px] text-[12px] font-medium transition-all duration-200 hover:brightness-110 cursor-pointer"
              style={{ background: T.accent, color: T.accentInk }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              Manage availability
            </Link>
          </div>
          {next7Days.length === 0 ? (
            <p className="text-[13.5px] py-6 text-center" style={{ color: T.muted }}>No availability data.</p>
          ) : (
            <div>
              {next7Days.map((day, i) => {
                const bookedCount = day.slots.filter((s: { time: string; available: boolean }) => bookedSlotMap.has(`${day.date}_${s.time}`)).length;
                const freeSlots = day.slots.filter((s: { available: boolean }) => s.available).length;
                const visibleSlots = freeSlots + bookedCount;
                return (
                  <div
                    key={day.date}
                    className="flex items-start justify-between gap-4 py-3"
                    style={{ borderBottom: i < next7Days.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-[13px] font-medium" style={{ color: T.text }}>
                          {new Date(day.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                        </span>
                        <span className="text-[11.5px] tabular-nums" style={{ color: freeSlots > 0 ? T.good : T.faint }}>
                          {freeSlots > 0 ? `${freeSlots} available` : "Fully booked"}
                          {bookedCount > 0 && <span style={{ color: T.accent }}> · {bookedCount} booked</span>}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {day.slots.filter((slot: { time: string; available: boolean }) => slot.available || bookedSlotMap.has(`${day.date}_${slot.time}`)).map((slot: { time: string; available: boolean }) => {
                          const booking = bookedSlotMap.get(`${day.date}_${slot.time}`);
                          if (booking) {
                            return (
                              <Link
                                key={slot.time}
                                href={`/consultations/${booking.id}`}
                                className="text-[11px] tabular-nums px-2 py-1 rounded-[6px] transition-all hover:brightness-125 cursor-pointer"
                                style={{ background: "rgba(195,160,88,0.12)", color: T.accent, border: `1px solid rgba(195,160,88,0.3)` }}
                                title={`Booked — ${booking.customerName}`}
                              >
                                {slot.time}
                              </Link>
                            );
                          }
                          return (
                            <span
                              key={slot.time}
                              className="text-[11px] tabular-nums px-2 py-1 rounded-[6px]"
                              style={{ background: "rgba(95,112,64,0.10)", color: T.good, border: "1px solid rgba(95,112,64,0.22)" }}
                            >
                              {slot.time}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}


      {/* ========= SUMMARY DUE TAB ========= */}
      {activeTab === "summary_due" && (
        <>
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <div className="flex-1 min-w-[200px]">
              <SearchFilter search={sdSearch} onSearchChange={(v) => { setSdSearch(v); setSdPage(0); }} placeholder="Search customer, ID…" />
            </div>
            <SortControl value={sdSort} onChange={(v) => { setSdSort(v); setSdPage(0); }} />
          </div>

          <Card>
            <TableHeader cols={["Customer", "Date", "Commission", "Status"]} />
            {sdPaginated.length === 0 ? (
              <p className="text-[13.5px] py-8 text-center" style={{ color: T.muted }}>No summaries pending.</p>
            ) : (
              sdPaginated.map((c) => <ConsultationRow key={c.id} c={c} />)
            )}
            <Pagination page={sdPage} totalPages={sdTotalPages} totalItems={sdFiltered.length} perPage={PAGE_SIZE} onPageChange={setSdPage} />
          </Card>
        </>
      )}

      {/* ========= NO SHOW TAB ========= */}
      {activeTab === "no_show" && (
        <>
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <div className="flex-1 min-w-[200px]">
              <SearchFilter search={nsSearch} onSearchChange={(v) => { setNsSearch(v); setNsPage(0); }} placeholder="Search customer, ID…" />
            </div>
            <SortControl value={nsSort} onChange={(v) => { setNsSort(v); setNsPage(0); }} />
          </div>

          <Card>
            <TableHeader cols={["Customer", "Date", "Commission", "Status"]} />
            {nsPaginated.length === 0 ? (
              <p className="text-[13.5px] py-8 text-center" style={{ color: T.muted }}>No no-show records.</p>
            ) : (
              nsPaginated.map((c) => <ConsultationRow key={c.id} c={c} />)
            )}
            <Pagination page={nsPage} totalPages={nsTotalPages} totalItems={nsFiltered.length} perPage={PAGE_SIZE} onPageChange={setNsPage} />
          </Card>
        </>
      )}

      {/* ========= RECOMMENDATIONS TAB ========= */}
      {activeTab === "recommendations" && (
        <>
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <div className="flex-1 min-w-[200px]">
              <SearchFilter search={recSearch} onSearchChange={(v) => { setRecSearch(v); setRecPage(0); }} placeholder="Search gemstone, customer…" />
            </div>
            <Select
              value={recFilterStone}
              onChange={(v) => { setRecFilterStone(v); setRecPage(0); }}
              compact
              placeholder="Stone: All"
              prefix="Stone: "
              options={[
                { value: "", label: "All" },
                ...recStones.map((s) => ({ value: s, label: s })),
              ]}
              className="w-[200px]"
            />
            <Select
              value={recFilterStatus}
              onChange={(v) => { setRecFilterStatus(v); setRecPage(0); }}
              compact
              placeholder="Status: All"
              prefix="Status: "
              options={[
                { value: "", label: "All" },
                { value: "submitted", label: "Submitted" },
                { value: "converted_to_order", label: "Converted" },
              ]}
              className="w-[150px]"
            />
            <SortControl value={recSort} onChange={(v) => { setRecSort(v); setRecPage(0); }} />
          </div>

          <Card>
            <div className="hidden sm:grid grid-cols-[1fr_130px_100px_100px_120px_120px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase" style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
              <span>Stone</span>
              <span>Customer</span>
              <span className="text-right">Price</span>
              <span className="text-right">Commission</span>
              <span>Recommended</span>
              <span>Status</span>
            </div>
            {recPaginated.length === 0 ? (
              <p className="text-[13.5px] py-8 text-center" style={{ color: T.muted }}>No recommendations found.</p>
            ) : (
              recPaginated.map((r) => {
                const href = r.orderId ? `/orders/${r.orderId}` : `/consultations/${r.consultationId}`;
                const price = getEstimatedPrice(r);
                const recComm = price != null && r.status === "converted_to_order" ? Math.round(price * parseFloat(commissionRates.stone) / 100) : 0;
                return (
                  <Link
                    key={r.id}
                    href={href}
                    className="group grid grid-cols-1 sm:grid-cols-[1fr_130px_100px_100px_120px_120px] gap-2 sm:gap-3 items-center px-3 py-3.5 transition-all duration-150 rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]"
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
            <Pagination page={recPage} totalPages={recTotalPages} totalItems={recFiltered.length} perPage={PAGE_SIZE} onPageChange={setRecPage} />
          </Card>
        </>
      )}

      {/* ========= PAYMENTS TAB ========= */}
      {activeTab === "payments" && (
        <>
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <div className="flex-1 min-w-[200px]">
              <SearchFilter search={paySearch} onSearchChange={(v) => { setPaySearch(v); setPayPage(0); }} placeholder="Search customer, payment ID…" />
            </div>
            <SortControl value={paySort} onChange={(v) => { setPaySort(v); setPayPage(0); }} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <StatCard label="Total earnings" value={inr(totalEarnings)} />
            <StatCard label="Total payments" value={expertPayments.length} />
            <StatCard label="Pending" value={expertPayments.filter((p) => p.status !== "paid").length} />
          </div>

          <Card>
            <div className="hidden sm:grid grid-cols-[1fr_1fr_120px_100px_120px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase" style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
              <span>Payment</span>
              <span>Customer</span>
              <span>Date</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
            </div>
            {payPaginated.length === 0 ? (
              <p className="text-[13.5px] py-8 text-center" style={{ color: T.muted }}>No payments found.</p>
            ) : (
              payPaginated.map((p) => (
                <div key={p.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_120px_100px_120px] gap-3 items-center px-3 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
                  <div className="min-w-0">
                    <div className="text-[11px] tracking-[0.06em] uppercase font-medium" style={{ color: T.accent }}>{p.id}</div>
                    <div className="text-[12px] mt-0.5 truncate" style={{ color: T.muted }}>{p.purpose}</div>
                  </div>
                  <div className="text-[13px]" style={{ color: T.text }}>{p.customerName}</div>
                  <div className="text-[12px] tabular-nums" style={{ color: T.muted }}>
                    {new Date(p.paidAt ?? p.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/ (\d{4})$/, ", $1")}
                  </div>
                  <div><Chip tone={p.status === "paid" ? "good" : p.status === "sent" ? "gold" : "muted"}>{p.status}</Chip></div>
                  <div className="text-[13px] text-right font-semibold tabular-nums" style={{ color: T.text }}>{inr(p.amount)}</div>
                </div>
              ))
            )}
            <Pagination page={payPage} totalPages={payTotalPages} totalItems={payFiltered.length} perPage={PAGE_SIZE} onPageChange={setPayPage} />
          </Card>
        </>
      )}
      </>
      )}

      {/* Make Payout Modal */}
      <Modal open={showPayoutModal} onClose={() => setShowPayoutModal(false)} title="Initiate payout">
        <div className="space-y-5">
          <div className="p-4 rounded-[10px]" style={{ background: T.panel, border: `1px solid ${T.borderSoft}` }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13.5px] font-medium" style={{ color: T.text }}>{expert.name}</div>
                <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{expert.specialization}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>Total earnings</div>
                <div className="text-[16px] font-semibold" style={{ color: T.accent }}>{inr(totalEarnings)}</div>
              </div>
            </div>
          </div>
          <Input value={payoutForm.amount} onChange={(v) => setPayoutForm((p) => ({ ...p, amount: v }))} label="Payout amount (₹)" placeholder={String(totalEarnings)} />
          <Input value={payoutForm.notes} onChange={(v) => setPayoutForm((p) => ({ ...p, notes: v }))} label="Period / notes" placeholder="e.g. May – Jul 2026" />
          <div className="pt-2">
            <GoldBtn onClick={() => { setShowPayoutModal(false); setToast("Payout initiated"); setTimeout(() => setToast(""), 3000); }}>Proceed to payment →</GoldBtn>
          </div>
          <p className="text-[11px] text-center" style={{ color: T.faint }}>You will be redirected to the payment gateway to complete the transfer.</p>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmDeactivate}
        onClose={() => setConfirmDeactivate(false)}
        onConfirm={() => { setIsActive(false); setToast("Gemologist deactivated"); setTimeout(() => setToast(""), 3000); }}
        title="Deactivate expert?"
        description="This expert will be removed from scheduling."
        variant="danger"
        confirmLabel="Deactivate"
      />

      {toast && (
        <div
          className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium animate-in"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
