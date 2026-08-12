"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader, Card, StatCard, Chip } from "@/components/ui";
import { T } from "@/lib/theme";
import {
  MOCK_CONSULTATIONS,
  MOCK_STONE_RECOMMENDATIONS,
  getExpertSchedule,
  DEFAULT_BOOKING_DURATION_MIN,
  formatTime24to12,
} from "@/lib/mock";
import type { TimeRange } from "@/lib/mock";

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
  const summariesDue = myConsultations.filter((c) => c.status === "summary_pending").length;
  const rescheduleReqs = myConsultations.filter((c) => c.status === "reschedule_requested").length;
  const draftRecs = MOCK_STONE_RECOMMENDATIONS.filter((r) => r.expertId === EXPERT_ID && r.status === "draft").length;

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

  const [disabledSlots, setDisabledSlots] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const toggleSlot = (key: string) => {
    const wasDisabled = disabledSlots.has(key);
    setDisabledSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    showToast(wasDisabled ? "Slot marked available" : "Slot marked unavailable");
  };

  const bookedSlotMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of myConsultations) {
      if (c.status === "cancelled" || c.status === "no_show") continue;
      const dt = new Date(c.scheduledAt);
      const dateKey = toISODate(dt);
      const hh = String(dt.getHours()).padStart(2, "0");
      const mm = String(dt.getMinutes()).padStart(2, "0");
      map.set(`${dateKey}-${hh}:${mm}`, c.customerName);
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

  const renderSlotGrid = (dateISO: string, slots: string[], label: string) => (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>{label}</div>
        <div className="text-[11px]" style={{ color: T.muted }}>
          {new Date(dateISO + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
        </div>
      </div>
      {slots.length === 0 ? (
        <div className="text-[13px] py-4" style={{ color: T.muted }}>No availability configured for this day.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {slots.map((time) => {
            const key = `${dateISO}-${time}`;
            const customer = bookedSlotMap.get(key);
            const isBooked = !!customer;
            const isDisabled = disabledSlots.has(key);

            let bg = "rgba(95,112,64,0.12)";
            let borderColor = "rgba(95,112,64,0.28)";
            let textColor: string = T.good;
            let statusLabel = "Available";

            if (isBooked) {
              bg = T.accentFaint;
              borderColor = T.accentBorder;
              textColor = T.accent;
              statusLabel = customer;
            } else if (isDisabled) {
              bg = "rgba(93,94,86,0.1)";
              borderColor = "rgba(93,94,86,0.2)";
              textColor = T.faint;
              statusLabel = "Unavailable";
            }

            return (
              <button
                key={key}
                disabled={isBooked}
                onClick={() => !isBooked && toggleSlot(key)}
                className="rounded-[10px] p-3 text-left transition-all duration-150 cursor-pointer disabled:cursor-default"
                style={{ background: bg, border: `1px solid ${borderColor}` }}
              >
                <div className="text-[13.5px] font-medium tabular-nums" style={{ color: textColor }}>
                  {formatTime24to12(time)}
                </div>
                <div className="text-[11px] mt-0.5 truncate" style={{ color: isBooked ? T.accent : isDisabled ? T.faint : T.muted }}>
                  {statusLabel}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      <PageHeader title="Dashboard" sub="Your day at a glance — metrics, actions, and slots" />

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Today" value={todayAppts.length} sub="appointments" />
        <StatCard label="Tomorrow" value={tomorrowAppts.length} sub="appointments" />
        <StatCard label="Summaries due" value={summariesDue} sub={summariesDue > 0 ? "action needed" : "all clear"} />
        <StatCard label="Reschedule requests" value={rescheduleReqs} sub={rescheduleReqs > 0 ? "action needed" : "none"} />
      </div>

      {/* Actions required */}
      {(summariesDue > 0 || rescheduleReqs > 0 || draftRecs > 0) && (
        <>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Actions required</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {summariesDue > 0 && (
              <Link href="/appointments" className="block">
                <div className="rounded-[12px] p-4" style={{ background: T.card, border: `1px solid rgba(176,84,84,0.3)` }}>
                  <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Summaries due</div>
                  <div className="text-[20px] font-bold tabular-nums" style={{ color: T.danger }}>{summariesDue}</div>
                  <div className="text-[11px] mt-1" style={{ color: T.muted }}>Pending post-consultation</div>
                </div>
              </Link>
            )}
            {rescheduleReqs > 0 && (
              <Link href="/appointments" className="block">
                <div className="rounded-[12px] p-4" style={{ background: T.card, border: `1px solid rgba(176,84,84,0.3)` }}>
                  <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Reschedule requests</div>
                  <div className="text-[20px] font-bold tabular-nums" style={{ color: T.danger }}>{rescheduleReqs}</div>
                  <div className="text-[11px] mt-1" style={{ color: T.muted }}>Customer-initiated</div>
                </div>
              </Link>
            )}
            {draftRecs > 0 && (
              <Link href="/recommendations" className="block">
                <div className="rounded-[12px] p-4" style={{ background: T.card, border: `1px solid rgba(176,84,84,0.3)` }}>
                  <div className="text-[11px] tracking-[0.08em] uppercase mb-1" style={{ color: T.faint }}>Draft recommendations</div>
                  <div className="text-[20px] font-bold tabular-nums" style={{ color: T.danger }}>{draftRecs}</div>
                  <div className="text-[11px] mt-1" style={{ color: T.muted }}>Submit to proceed</div>
                </div>
              </Link>
            )}
          </div>
        </>
      )}

      {/* Today's & tomorrow's slot grids */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Upcoming slot availability</div>
        <Link href="/availability" className="text-[12px]" style={{ color: T.accent }}>View all →</Link>
      </div>
      <Card className="mb-6">
        <div className="text-[12px] mb-4" style={{ color: T.muted }}>
          Tap an available slot to mark it unavailable, or tap an unavailable slot to restore it. Booked slots cannot be changed.
        </div>
        {renderSlotGrid(todayISO, todaySlots, "Today")}
        {renderSlotGrid(tomorrowISO, tomorrowSlots, "Tomorrow")}
      </Card>

      {/* Today's appointment list */}
      {todayAppts.length > 0 && (
        <>
          <div className="text-[11px] tracking-[0.08em] uppercase mb-3" style={{ color: T.faint }}>Today&apos;s appointments</div>
          <Card>
            {todayAppts.map((c) => (
              <Link
                key={c.id}
                href={`/appointments/${c.id}`}
                className="flex flex-wrap items-center justify-between gap-3 py-3.5 hover:bg-[rgba(160,125,56,0.06)] transition-colors"
                style={{ borderBottom: `1px solid ${T.borderSoft}` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium" style={{ color: T.text }}>{c.customerName}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>
                    {c.type.replace(/_/g, " ")} · {new Date(c.scheduledAt).toLocaleString("en-IN", { timeStyle: "short" })} · {c.duration}min
                  </div>
                </div>
                <Chip tone={statusTone(c.status)}>{c.status.replace(/_/g, " ")}</Chip>
              </Link>
            ))}
          </Card>
        </>
      )}

      {toast && (
        <div
          className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
