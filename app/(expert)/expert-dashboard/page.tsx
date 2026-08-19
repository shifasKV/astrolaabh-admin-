"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, EmptyState, TimeInput } from "@/components/ui";

const parseAmPm = (s: string) => {
  const m = s.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return 0;
  let h = Number(m[1]) % 12;
  if (/PM/i.test(m[3])) h += 12;
  return h * 60 + Number(m[2]);
};
import { T } from "@/lib/theme";
import {
  MOCK_CONSULTATIONS,
  MOCK_STONE_RECOMMENDATIONS,
  getExpertSchedule,
  DEFAULT_BOOKING_DURATION_MIN,
} from "@/lib/mock";
import type { TimeRange } from "@/lib/mock";
import { inr } from "@/lib/types";

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function generateSlotsFromRanges(ranges: TimeRange[], durationMin: number): string[] {
  const slots: string[] = [];
  for (const r of ranges) {
    const [sh, sm] = r.start.split(":").map(Number);
    const [eh, em] = r.end.split(":").map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    while (cur + durationMin <= end) {
      const h = Math.floor(cur / 60);
      const m = cur % 60;
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      cur += durationMin;
    }
  }
  return slots;
}

const EXPERT_ID = "usr_expert_01";

export default function ExpertDashboard() {
  const now = new Date();
  const todayISO = toISODate(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowISO = toISODate(tomorrow);

  const schedule = getExpertSchedule(EXPERT_ID);

  const myConsultations = MOCK_CONSULTATIONS.filter((c) => c.expertId === EXPERT_ID);
  const todayAppts = myConsultations.filter((c) => c.scheduledAt.startsWith(todayISO) && c.status !== "cancelled" && c.status !== "no_show");
  const tomorrowAppts = myConsultations.filter((c) => c.scheduledAt.startsWith(tomorrowISO) && c.status !== "cancelled" && c.status !== "no_show");
  const completedCount = myConsultations.filter((c) => c.status === "closed" || c.status === "completed").length;
  const summariesDue = myConsultations.filter((c) => c.status === "summary_pending").length;
  const rescheduleReqs = myConsultations.filter((c) => c.status === "reschedule_requested").length;
  const draftRecs = MOCK_STONE_RECOMMENDATIONS.filter((r) => r.expertId === EXPERT_ID && r.status === "draft").length;
  const purchases = MOCK_STONE_RECOMMENDATIONS.filter((r) => r.expertId === EXPERT_ID && r.status === "converted_to_order").length;
  const totalCommission = completedCount * Math.round(5000 * 0.15);

  const getSlotsForDate = (dateISO: string): string[] => {
    if (!schedule) return [];
    const override = schedule.dateOverrides.find((o) => o.date === dateISO);
    if (override) return generateSlotsFromRanges(override.ranges, DEFAULT_BOOKING_DURATION_MIN);
    const d = new Date(dateISO + "T00:00:00");
    const dow = d.getDay();
    const day = schedule.weeklyHours.find((w) => w.dayOfWeek === dow);
    if (!day || !day.available) return [];
    return generateSlotsFromRanges(day.ranges, DEFAULT_BOOKING_DURATION_MIN);
  };

  const todaySlots = getSlotsForDate(todayISO);
  const tomorrowSlots = getSlotsForDate(tomorrowISO);

  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(() => new Set([
    `${todayISO}-07:00`,
    `${todayISO}-18:00`,
    `${tomorrowISO}-12:00`,
    `${tomorrowISO}-17:00`,
  ]));

  const [addStart, setAddStart] = useState("9:00 AM");
  const [addEnd, setAddEnd] = useState("5:00 PM");
  const [toast, setToast] = useState("");
  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const to12 = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ap}`;
  };
  const addHours = () => {
    if (parseAmPm(addEnd) <= parseAmPm(addStart)) { flash("End time must be after the start time"); return; }
    flash(`Opened ${addStart} – ${addEnd} for today`);
  };
  const toggleBlock = (time: string) => {
    const key = `${todayISO}-${time}`;
    let nowBlocked = false;
    setBlockedSlots((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else { n.add(key); nowBlocked = true; }
      return n;
    });
    flash(nowBlocked ? `Blocked ${to12(time)}` : `Reopened ${to12(time)}`);
  };

  const bookedSlotMap = useMemo(() => {
    const map = new Map<string, { customerName: string; id: string }>();
    for (const c of myConsultations) {
      if (c.status === "cancelled" || c.status === "no_show") continue;
      const dt = new Date(c.scheduledAt);
      const dateKey = toISODate(dt);
      const hh = String(dt.getHours()).padStart(2, "0");
      const mm = String(dt.getMinutes()).padStart(2, "0");
      map.set(`${dateKey}-${hh}:${mm}`, { customerName: c.customerName, id: c.id });
    }
    return map;
  }, [myConsultations]);

  const statusTone = (s: string) => {
    if (s === "closed" || s === "completed") return "good" as const;
    if (s === "scheduled") return "gold" as const;
    if (s === "summary_pending") return "danger" as const;
    if (s === "reschedule_requested") return "gold" as const;
    return "muted" as const;
  };

  const slotCounts = (dateISO: string, slots: string[]) => {
    let open = 0, booked = 0, blocked = 0;
    for (const t of slots) {
      const key = `${dateISO}-${t}`;
      if (bookedSlotMap.has(key)) booked++;
      else if (blockedSlots.has(key)) blocked++;
      else open++;
    }
    return { open, booked, blocked };
  };

  const todayCounts = slotCounts(todayISO, todaySlots);
  const tmwCounts = slotCounts(tomorrowISO, tomorrowSlots);
  const actions = [
    summariesDue > 0 && { href: "/appointments", label: "Summaries due", sub: "Pending post-consultation", count: summariesDue },
    rescheduleReqs > 0 && { href: "/appointments", label: "Reschedule requests", sub: "Customer-initiated", count: rescheduleReqs },
    draftRecs > 0 && { href: "/recommendations", label: "Draft recommendations", sub: "Submit to proceed", count: draftRecs },
  ].filter(Boolean) as { href: string; label: string; sub: string; count: number }[];

  return (
    <>
      <PageHeader title="Dashboard" />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {[
          { label: "Consultations", value: completedCount, status: "completed", tone: T.good },
          { label: "Purchases", value: purchases, status: "completed", tone: T.good },
          { label: "Recommendation", value: summariesDue, status: "due", tone: summariesDue > 0 ? T.danger : T.good },
          { label: "Commission", value: inr(totalCommission), status: "earned", tone: T.good },
          { label: "Today", value: todayAppts.length, status: "appointments", tone: T.accent },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-[16px] p-5"
            style={
              i === 0
                ? { background: "linear-gradient(160deg, #faf0d8 0%, #efdfb8 100%)", border: "1px solid rgba(160,125,56,0.35)", boxShadow: T.shadow }
                : { background: T.card, border: `1px solid ${T.borderSoft}` }
            }
          >
            <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: i === 0 ? "#8a6a2f" : T.faint }}>{stat.label}</div>
            <div className="text-[20px] font-semibold mt-1 tabular-nums" style={{ color: T.text }}>{stat.value}</div>
            <div className="text-[11px] font-medium mt-1" style={{ color: i === 0 ? "#8a6a2f" : stat.tone }}>{stat.status}</div>
          </div>
        ))}
      </div>

      {/* Organised two-column body — schedule on the left, actions + glance on the right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT — today */}
        <div className="lg:col-span-2">
          {/* One "Today" card — schedule up top, availability strip below */}
          <Card className="!p-5">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Today</h2>
              <span className="text-[12px] font-medium" style={{ color: T.muted }}>{now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</span>
            </div>

            {/* Appointments */}
            {todayAppts.length === 0 ? (
              <EmptyState inline icon="calendar" title="No appointments today" description="Your schedule is clear. Enjoy the calm." />
            ) : (
              <div>
                {todayAppts.map((c, i, arr) => (
                  <Link
                    key={c.id}
                    href={`/appointments/${c.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 -mx-2 px-2 rounded-[8px] hover:bg-[rgba(119,123,98,0.06)] transition-colors"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[13.5px] font-medium" style={{ color: T.text }}>{c.customerName}</div>
                      <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>
                        {c.type.replace(/_/g, " ")} · {new Date(c.scheduledAt).toLocaleString("en-IN", { timeStyle: "short" })} · {c.duration}min
                      </div>
                    </div>
                    <Chip tone={statusTone(c.status)}>{c.status.replace(/_/g, " ")}</Chip>
                  </Link>
                ))}
              </div>
            )}

            {/* Availability — summary + expandable "manage today" (block slots + add hours) */}
            <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-[13px] font-semibold" style={{ color: T.text }}>Availability</span>
                  <span className="text-[12px]" style={{ color: T.muted }}>
                    <span className="font-semibold tabular-nums" style={{ color: T.good }}>{todayCounts.open}</span> open · <span className="font-semibold tabular-nums" style={{ color: T.accent }}>{todayCounts.booked}</span> booked · <span className="font-semibold tabular-nums" style={{ color: T.faint }}>{todayCounts.blocked}</span> blocked
                  </span>
                </div>
                <Link href="/availability" className="text-[12.5px] font-medium shrink-0 transition-opacity hover:opacity-75" style={{ color: T.accent }}>Manage all →</Link>
              </div>

              <div className="mt-3.5 p-4 rounded-[12px]" style={{ background: T.bg, border: `1px solid ${T.borderSoft}` }}>
                  {/* Block slots */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-[11px] font-medium tracking-[0.07em] uppercase" style={{ color: T.faint }}>Today&apos;s slots</span>
                    <div className="flex items-center gap-3">
                      {[
                        { c: T.good, l: "Open" },
                        { c: T.faint, l: "Blocked" },
                        { c: T.accent, l: "Booked" },
                      ].map((x) => (
                        <span key={x.l} className="inline-flex items-center gap-1.5 text-[11px]" style={{ color: T.muted }}>
                          <span className="w-2 h-2 rounded-full" style={{ background: x.c }} />{x.l}
                        </span>
                      ))}
                    </div>
                  </div>
                  {todaySlots.length === 0 ? (
                    <p className="text-[12.5px]" style={{ color: T.muted }}>No hours configured today. Add some below.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {todaySlots.map((time) => {
                        const key = `${todayISO}-${time}`;
                        const booking = bookedSlotMap.get(key);
                        const isBlocked = blockedSlots.has(key);
                        if (booking) {
                          return (
                            <span key={key} title={`Booked · ${booking.customerName}`} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[12.5px] font-medium tabular-nums cursor-default" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} />
                              {to12(time)}
                            </span>
                          );
                        }
                        return (
                          <button
                            key={key}
                            onClick={() => toggleBlock(time)}
                            title={isBlocked ? "Blocked — tap to reopen" : "Open — tap to block"}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[12.5px] font-medium tabular-nums cursor-pointer transition-colors hover:brightness-95"
                            style={isBlocked ? { background: "rgba(89,82,54,0.05)", border: `1px solid ${T.borderSoft}`, color: T.faint } : { background: "rgba(95,112,64,0.12)", border: "1px solid rgba(95,112,64,0.28)", color: T.text }}
                          >
                            {isBlocked ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3 h-3"><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6 18.4 18.4" /></svg>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.good }} />
                            )}
                            <span className={isBlocked ? "line-through" : ""}>{to12(time)}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-[11.5px] mt-2.5" style={{ color: T.faint }}>Tap an open slot to block it. Booked slots can&apos;t be changed.</p>

                  {/* Add hours */}
                  <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    <span className="text-[11px] font-medium tracking-[0.07em] uppercase" style={{ color: T.faint }}>Add hours</span>
                    <div className="flex flex-wrap items-center gap-2.5 mt-2.5">
                      <div className="w-[130px]"><TimeInput value={addStart} onChange={setAddStart} /></div>
                      <span className="text-[13px]" style={{ color: T.faint }}>–</span>
                      <div className="w-[130px]"><TimeInput value={addEnd} onChange={setAddEnd} /></div>
                      <button onClick={addHours} className="h-9 px-4 rounded-[9px] text-[12.5px] font-semibold cursor-pointer transition-all duration-200 hover:brightness-110" style={{ background: T.accent, color: T.accentInk }}>Add hours</button>
                    </div>
                  </div>
                </div>
            </div>
          </Card>
        </div>

        {/* RIGHT — actions + tomorrow glance */}
        <aside className="space-y-4">
          <Card className="!p-5">
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-3.5" style={{ color: T.text }}>Actions required</h2>
            {actions.length === 0 ? (
              <EmptyState inline icon="check" title="All caught up" description="No pending summaries or requests." />
            ) : (
              <div className="space-y-1.5">
                {actions.map((a) => (
                  <Link key={a.label} href={a.href} className="flex items-center gap-3 py-2.5 px-2.5 -mx-2.5 rounded-[10px] transition-colors hover:bg-[rgba(119,123,98,0.07)]">
                    <span className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[15px] font-bold tabular-nums shrink-0" style={{ background: "rgba(176,84,84,0.10)", color: T.danger }}>{a.count}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium" style={{ color: T.text }}>{a.label}</span>
                      <span className="block text-[11.5px]" style={{ color: T.muted }}>{a.sub}</span>
                    </span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0" style={{ color: T.faint }}><path d="m9 18 6-6-6-6" /></svg>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="!p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Tomorrow</h2>
              <span className="text-[12px]" style={{ color: T.muted }}>{new Date(tomorrowISO + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
            </div>
            {tomorrowSlots.length === 0 ? (
              <EmptyState inline icon="calendar" title="No hours set" description="Nothing configured for tomorrow yet." />
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[13px] font-semibold tabular-nums" style={{ color: T.text }}>{tomorrowAppts.length}</span>
                  <span className="text-[12.5px]" style={{ color: T.muted }}>appointment{tomorrowAppts.length === 1 ? "" : "s"} booked</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[12px]" style={{ color: T.muted }}><span className="font-semibold tabular-nums" style={{ color: T.good }}>{tmwCounts.open}</span> open</span>
                  <span className="text-[12px]" style={{ color: T.muted }}><span className="font-semibold tabular-nums" style={{ color: T.faint }}>{tmwCounts.blocked}</span> blocked</span>
                </div>
                <Link href="/availability" className="inline-flex items-center gap-1 text-[12.5px] font-medium mt-4 hover:underline underline-offset-4" style={{ color: T.accent }}>
                  Open availability →
                </Link>
              </>
            )}
          </Card>
        </aside>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
