"use client";
import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Chip, StatCard, GhostBtn, Modal, Input, GoldBtn, SectionLink, BackLink, Tabs, SearchFilter, Pagination, Select } from "@/components/ui";
import { T } from "@/lib/theme";
import { EXPERT_PROFILES, EXPERT_AVAILABILITY, MOCK_CONSULTATIONS, MOCK_STONE_RECOMMENDATIONS, MOCK_ORDERS, MOCK_PAYMENTS } from "@/lib/mock";
import { inr } from "@/lib/types";
import type { StoneRecommendation } from "@/lib/types";

const PAGE_SIZE = 8;
type SortKey = "date_desc" | "date_asc";

const DETAIL_TABS = [
  { key: "upcoming", label: "Consultations" },
  { key: "availability", label: "Availability" },
  { key: "summary_due", label: "Summary due" },
  { key: "no_show", label: "No show" },
  { key: "recommendations", label: "Recommendations" },
];

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

  const [isActive, setIsActive] = useState(expert.status === "active");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: expert.name,
    email: `${expert.name.split(" ").pop()?.toLowerCase()}@astrolaabh.house`,
    phone: "+91 98765 43210",
    specialization: expert.specialization,
    fee: String(expert.fee),
  });
  const [toast, setToast] = useState("");

  const [activeTab, setActiveTab] = useState("upcoming");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Consultations tab state (list + calendar)
  const [consSearch, setConsSearch] = useState("");
  const [consSort, setConsSort] = useState<SortKey>("date_desc");
  const [consFilterStatus, setConsFilterStatus] = useState("");
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
  const consFiltered = sortByDate(
    searchFilter(consultations, consSearch).filter((c) => {
      if (consFilterStatus === "scheduled" && c.status !== "scheduled") return false;
      if (consFilterStatus === "completed" && c.status !== "closed" && c.status !== "completed") return false;
      if (consFilterStatus === "summary_pending" && c.status !== "summary_pending") return false;
      if (consFilterStatus === "no_show" && c.status !== "no_show") return false;
      if (consFilterStatus === "reschedule_requested" && c.status !== "reschedule_requested") return false;
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

  const tabCounts: Record<string, number> = {
    availability: next7Days.length,
    recommendations: allRecommendations.length,
    upcoming: consultations.length,
    summary_due: allPendingSummaries.length,
    no_show: allNoShows.length,
  };

  const statusTone = (s: string) => {
    if (s === "closed" || s === "completed") return "good" as const;
    if (s === "scheduled") return "gold" as const;
    if (s === "summary_pending" || s === "reschedule_requested" || s === "no_show") return "danger" as const;
    return "muted" as const;
  };

  function ConsultationRow({ c, showStatus }: { c: typeof consultations[number]; showStatus?: string }) {
    return (
      <Link
        href={`/consultations/${c.id}`}
        className="group grid grid-cols-1 sm:grid-cols-[1fr_130px_140px_120px] gap-2 sm:gap-3 items-center px-3 py-3.5 transition-all duration-150 rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]"
        style={{ borderBottom: `1px solid ${T.borderSoft}` }}
      >
        <div className="min-w-0">
          <span className="text-[11px] tracking-[0.06em] uppercase font-medium group-hover:underline" style={{ color: T.accent }}>{c.id}</span>
          <div className="text-[14px] mt-0.5 truncate" style={{ color: T.text }}>{c.customerName}</div>
        </div>
        <div className="min-w-0">
          <span className="text-[12px]" style={{ color: T.muted }}>{c.type.replace(/_/g, " ")}</span>
        </div>
        <div className="min-w-0">
          <span className="text-[12px] tabular-nums" style={{ color: T.text }}>
            {new Date(c.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/ (\d{4})$/, ", $1")}
          </span>
        </div>
        <div>
          {showStatus === "summary" ? (
            c.summarySubmittedAt ? <Chip tone="good">Provided</Chip> : <Chip tone="danger">Pending</Chip>
          ) : (
            <Chip tone={statusTone(c.status)}>
              {c.status === "scheduled" ? "Scheduled" :
               c.status === "summary_pending" ? "Summary due" :
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
      <div className={`hidden sm:grid gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase`} style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}`, gridTemplateColumns: "1fr 130px 140px 120px" }}>
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

      {/* Profile Card */}
      <div className="rounded-[14px] p-6 mb-6" style={{ background: `linear-gradient(135deg, ${T.card} 0%, ${T.panel} 100%)`, border: `1px solid ${T.border}` }}>
        <div className="flex flex-wrap items-start gap-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-bold shrink-0"
            style={{ background: `${T.accent}15`, border: `2px solid ${T.accent}40`, color: T.accent }}
          >
            {expert.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-[17px] font-semibold" style={{ color: T.text }}>{expert.name}</span>
              <Chip tone={isActive ? "good" : "danger"}>{isActive ? "active" : "inactive"}</Chip>
            </div>
            <div className="text-[13.5px] mt-1" style={{ color: T.muted }}>{expert.specialization}</div>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-[12px]" style={{ color: T.faint }}>
              <span>{expert.experience}</span>
              <span>·</span>
              <span>{expert.languages.join(", ")}</span>
              <span>·</span>
              <span style={{ color: T.accent }}>{inr(expert.fee)}/session</span>
              <span>·</span>
              <span>Joined {new Date(expert.joinedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <GhostBtn onClick={() => setShowEditModal(true)}>Edit</GhostBtn>
            <GhostBtn onClick={() => {
              if (isActive) {
                setIsActive(false);
                setToast("Gemologist deactivated");
                setTimeout(() => setToast(""), 3000);
              } else {
                setIsActive(true);
              }
            }}>
              {isActive ? "Deactivate" : "Activate"}
            </GhostBtn>
          </div>
        </div>
      </div>


      {/* Tabs */}
      <div className="mb-4">
        <Tabs
          tabs={DETAIL_TABS.map((t) => ({ ...t, count: tabCounts[t.key] }))}
          active={activeTab}
          onChange={(key) => { setActiveTab(key); }}
        />
      </div>

      {/* ========= CONSULTATIONS TAB (Calendar only) ========= */}
      {activeTab === "upcoming" && (
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

              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
                <span className="text-[12px]" style={{ color: T.muted }}>Showing this expert&apos;s consultations only</span>
              </div>

              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <div style={{ minWidth: 800 }}>
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

      {/* ========= AVAILABILITY TAB ========= */}
      {activeTab === "availability" && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[15px] font-semibold" style={{ color: T.text }}>Availability <span className="text-[13px] font-normal" style={{ color: T.muted }}>(Next 7 days)</span></span>
            <Link
              href={`/astro-gemologists/${id}/availability`}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[9px] text-[12px] font-medium transition-all duration-200 hover:brightness-110 cursor-pointer"
              style={{ background: T.accent, color: T.accentInk }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              Edit
            </Link>
          </div>
          {next7Days.length === 0 ? (
            <p className="text-[13.5px] py-6 text-center" style={{ color: T.muted }}>No availability data.</p>
          ) : (
            <div>
              {next7Days.map((day, i) => {
                const freeSlots = day.slots.filter((s: { available: boolean }) => s.available).length;
                const totalSlots = day.slots.length;
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
                          {freeSlots > 0 ? `${freeSlots} of ${totalSlots} free` : "Fully booked"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {day.slots.map((slot: { time: string; available: boolean }) => {
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
                              style={
                                slot.available
                                  ? { background: "rgba(95,112,64,0.10)", color: T.good, border: "1px solid rgba(95,112,64,0.22)" }
                                  : { background: "transparent", color: T.faint, border: `1px dashed rgba(89,82,54,0.18)`, textDecoration: "line-through", textDecorationColor: "rgba(89,82,54,0.3)" }
                              }
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
            <TableHeader cols={["Customer", "Type", "Date", "Status"]} />
            {sdPaginated.length === 0 ? (
              <p className="text-[13.5px] py-8 text-center" style={{ color: T.muted }}>No summaries pending.</p>
            ) : (
              sdPaginated.map((c) => <ConsultationRow key={c.id} c={c} />)
            )}
            <Pagination page={sdPage} totalPages={sdTotalPages} totalItems={sdFiltered.length} onPageChange={setSdPage} />
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
            <TableHeader cols={["Customer", "Type", "Date", "Status"]} />
            {nsPaginated.length === 0 ? (
              <p className="text-[13.5px] py-8 text-center" style={{ color: T.muted }}>No no-show records.</p>
            ) : (
              nsPaginated.map((c) => <ConsultationRow key={c.id} c={c} />)
            )}
            <Pagination page={nsPage} totalPages={nsTotalPages} totalItems={nsFiltered.length} onPageChange={setNsPage} />
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
            <div className="hidden sm:grid grid-cols-[1fr_140px_120px_140px_130px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase" style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
              <span>Stone</span>
              <span>Customer</span>
              <span>Price</span>
              <span>Recommended</span>
              <span>Status</span>
            </div>
            {recPaginated.length === 0 ? (
              <p className="text-[13.5px] py-8 text-center" style={{ color: T.muted }}>No recommendations found.</p>
            ) : (
              recPaginated.map((r) => {
                const href = r.orderId ? `/orders/${r.orderId}` : `/consultations/${r.consultationId}`;
                const price = getEstimatedPrice(r);
                return (
                  <Link
                    key={r.id}
                    href={href}
                    className="group grid grid-cols-1 sm:grid-cols-[1fr_140px_120px_140px_130px] gap-2 sm:gap-3 items-center px-3 py-3.5 transition-all duration-150 rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]"
                    style={{ borderBottom: `1px solid ${T.borderSoft}` }}
                  >
                    <div className="min-w-0">
                      <span className="text-[13.5px] font-medium group-hover:underline" style={{ color: T.accent }}>{r.gemstone}</span>
                      <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{r.weightRange}</div>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[12px] truncate block" style={{ color: T.text }}>{r.customerName}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[12px] tabular-nums font-medium" style={{ color: T.text }}>{price != null ? inr(price) : "—"}</span>
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
            <Pagination page={recPage} totalPages={recTotalPages} totalItems={recFiltered.length} onPageChange={setRecPage} />
          </Card>
        </>
      )}

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit expert details">
        <div className="space-y-4">
          <Input value={editForm.name} onChange={(v) => setEditForm((p) => ({ ...p, name: v }))} label="Full name" placeholder="Name" />
          <Input value={editForm.email} onChange={(v) => setEditForm((p) => ({ ...p, email: v }))} label="Email" type="email" placeholder="email@astrolaabh.house" />
          <Input value={editForm.phone} onChange={(v) => setEditForm((p) => ({ ...p, phone: v }))} label="Phone number" placeholder="+91 98765 43210" />
          <Input value={editForm.specialization} onChange={(v) => setEditForm((p) => ({ ...p, specialization: v }))} label="Specialization" placeholder="Vedic Astrology & Gemology" />
          <Input value={editForm.fee} onChange={(v) => setEditForm((p) => ({ ...p, fee: v }))} label="Fee per session (₹)" placeholder="5000" />
          <div className="pt-2">
            <GoldBtn onClick={() => { setShowEditModal(false); setToast("Profile updated"); setTimeout(() => setToast(""), 3000); }}>Save changes</GoldBtn>
          </div>
        </div>
      </Modal>

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
