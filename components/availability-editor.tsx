"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Card, Modal, GoldBtn } from "@/components/ui";
import { T } from "@/lib/theme";
import {
  getExpertSchedule,
  DAY_LABELS,
  generateTimeOptions,
  formatTime24to12,
} from "@/lib/mock";
import type { WeeklyScheduleDay, DateOverride, TimeRange } from "@/lib/mock";

const TIME_OPTIONS = generateTimeOptions();

const DAY_COLORS = [
  "#6d6753",
  "#587082",
  "#5f7040",
  "#65694f",
  "#a3493f",
  "#8a5f7e",
  "#6d6753",
];

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToSelected = useCallback(() => {
    if (!listRef.current) return;
    const idx = TIME_OPTIONS.indexOf(value);
    if (idx < 0) return;
    const itemH = 36;
    const listH = listRef.current.clientHeight;
    listRef.current.scrollTop = Math.max(0, idx * itemH - listH / 2 + itemH / 2);
  }, [value]);

  useEffect(() => {
    if (open) scrollToSelected();
  }, [open, scrollToSelected]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="h-9 px-3 rounded-[8px] text-[13px] min-w-[100px] text-left cursor-pointer flex items-center justify-between gap-1.5"
        style={{ background: T.popover, border: `1px solid ${open ? T.accent : T.border}`, color: T.text }}
      >
        {formatTime24to12(value)}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2.5 4L5 6.5L7.5 4" />
        </svg>
      </button>

      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-[130px] max-h-[220px] overflow-y-auto rounded-[10px] py-1 shadow-lg"
          style={{ background: T.popover, border: `1px solid ${T.border}` }}
        >
          {TIME_OPTIONS.map((t) => {
            const isActive = t === value;
            return (
              <button
                key={t}
                type="button"
                onClick={() => { onChange(t); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-[13px] cursor-pointer transition-colors"
                style={{
                  background: isActive ? T.accent : "transparent",
                  color: isActive ? T.accentInk : T.text,
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(119,123,98,0.13)"; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = "transparent"; } }}
              >
                {formatTime24to12(t)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TimeRangeRow({
  range,
  onStartChange,
  onEndChange,
  onRemove,
  onAdd,
  showAdd,
}: {
  range: TimeRange;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  onRemove: () => void;
  onAdd: () => void;
  showAdd: boolean;
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <TimeSelect value={range.start} onChange={onStartChange} />
      <span className="text-[12px]" style={{ color: T.faint }}>–</span>
      <TimeSelect value={range.end} onChange={onEndChange} />
      <button
        onClick={onRemove}
        className="w-7 h-7 rounded-full flex items-center justify-center text-[13.5px] transition-colors hover:bg-[rgba(176,84,84,0.15)] cursor-pointer"
        style={{ color: T.muted }}
        title="Remove"
      >
        ✕
      </button>
      {showAdd && (
        <button
          onClick={onAdd}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[15px] transition-colors hover:bg-[rgba(119,123,98,0.15)] cursor-pointer"
          style={{ color: T.accent }}
          title="Add time range"
        >
          +
        </button>
      )}
    </div>
  );
}

interface AvailabilityEditorProps {
  expertId: string;
}

export function AvailabilityEditor({ expertId }: AvailabilityEditorProps) {
  const schedule = getExpertSchedule(expertId);

  const [weeklyHours, setWeeklyHours] = useState<WeeklyScheduleDay[]>(
    () => schedule?.weeklyHours.map((d) => ({ ...d, ranges: d.ranges.map((r) => ({ ...r })) })) ?? []
  );
  const [dateOverrides, setDateOverrides] = useState<DateOverride[]>(
    () => schedule?.dateOverrides.map((o) => ({ ...o, ranges: o.ranges.map((r) => ({ ...r })) })) ?? []
  );
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const [calMonth, setCalMonth] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(() => toISODate(new Date()));

  const updateDay = (dow: number, updater: (d: WeeklyScheduleDay) => WeeklyScheduleDay) => {
    setWeeklyHours((prev) => prev.map((d) => (d.dayOfWeek === dow ? updater({ ...d, ranges: d.ranges.map((r) => ({ ...r })) }) : d)));
  };

  const toggleDayAvailable = (dow: number) => {
    const day = weeklyHours.find((d) => d.dayOfWeek === dow);
    updateDay(dow, (d) =>
      d.available
        ? { ...d, available: false, ranges: [] }
        : { ...d, available: true, ranges: [{ start: "09:00", end: "17:00" }] }
    );
    showToast(day?.available ? `${DAY_LABELS[dow]} marked unavailable` : `${DAY_LABELS[dow]} marked available`);
  };

  const addRange = (dow: number) => {
    updateDay(dow, (d) => ({ ...d, ranges: [...d.ranges, { start: "17:00", end: "18:00" }] }));
    showToast("Time range added");
  };

  const removeRange = (dow: number, idx: number) => {
    updateDay(dow, (d) => {
      const ranges = d.ranges.filter((_, i) => i !== idx);
      return { ...d, ranges, available: ranges.length > 0 };
    });
    showToast("Time range removed");
  };

  const setRangeField = (dow: number, idx: number, field: "start" | "end", val: string) => {
    updateDay(dow, (d) => ({
      ...d,
      ranges: d.ranges.map((r, i) => (i === idx ? { ...r, [field]: val } : r)),
    }));
  };

  const calDays = useMemo(() => {
    const { year, month } = calMonth;
    const first = new Date(year, month, 1);
    const startDow = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(toISODate(new Date(year, month, d)));
    }
    return cells;
  }, [calMonth]);

  const hasAvailability = (dateISO: string): boolean => {
    if (dateOverrides.some((o) => o.date === dateISO && o.ranges.length > 0)) return true;
    const d = new Date(dateISO + "T00:00:00");
    const dow = d.getDay();
    const day = weeklyHours.find((w) => w.dayOfWeek === dow);
    return !!day?.available;
  };

  const getDateRanges = (dateISO: string): TimeRange[] => {
    const override = dateOverrides.find((o) => o.date === dateISO);
    if (override) return override.ranges;
    const d = new Date(dateISO + "T00:00:00");
    const dow = d.getDay();
    const day = weeklyHours.find((w) => w.dayOfWeek === dow);
    if (!day?.available) return [];
    return day.ranges;
  };

  const calMonthLabel = new Date(calMonth.year, calMonth.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const todayISO = toISODate(new Date());

  const selectedDateLabel = selectedCalDate
    ? new Date(selectedCalDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" })
    : "";

  const ensureOverride = (dateISO: string): DateOverride[] => {
    const existing = dateOverrides.find((o) => o.date === dateISO);
    if (existing) return dateOverrides;
    const defaults = getDateRanges(dateISO);
    return [...dateOverrides, { date: dateISO, ranges: defaults.map((r) => ({ ...r })) }].sort(
      (a, b) => a.date.localeCompare(b.date)
    );
  };

  const hasOverride = (dateISO: string): boolean => dateOverrides.some((o) => o.date === dateISO);

  const resetDateOverride = (dateISO: string) => {
    setDateOverrides(dateOverrides.filter((o) => o.date !== dateISO));
    showToast("Reset to weekly hours");
  };

  const weekdayName = (dateISO: string) => DAY_LABELS[new Date(dateISO + "T00:00:00").getDay()];

  const addCalSlot = (dateISO: string) => {
    const withOverride = ensureOverride(dateISO);
    setDateOverrides(
      withOverride.map((o) =>
        o.date === dateISO ? { ...o, ranges: [...o.ranges, { start: "17:00", end: "18:00" }] } : o
      )
    );
    showToast("Hours added");
  };

  const removeCalSlot = (dateISO: string, idx: number) => {
    const withOverride = ensureOverride(dateISO);
    setDateOverrides(
      withOverride
        .map((o) =>
          o.date === dateISO ? { ...o, ranges: o.ranges.filter((_, i) => i !== idx) } : o
        )
        .filter((o) => o.ranges.length > 0)
    );
    showToast("Hours removed");
  };

  const setCalSlotField = (dateISO: string, idx: number, field: "start" | "end", val: string) => {
    const withOverride = ensureOverride(dateISO);
    setDateOverrides(
      withOverride.map((o) =>
        o.date === dateISO
          ? { ...o, ranges: o.ranges.map((r, i) => (i === idx ? { ...r, [field]: val } : r)) }
          : o
      )
    );
  };

  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const sortedOverrides = [...dateOverrides].sort((a, b) => a.date.localeCompare(b.date));
  const fmtOverrideDate = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-4 max-w-[880px]">
      {/* Weekly schedule — the hero */}
      <Card className="!p-6">
        <div className="mb-1">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Weekly hours</h2>
        </div>
        <div className="text-[12.5px] mb-5 pb-4" style={{ color: T.muted, borderBottom: `1px solid ${T.borderSoft}` }}>
          Set the hours you take consultations, for each day of the week.
        </div>

        {weeklyHours.map((day) => (
          <div key={day.dayOfWeek} className="flex items-start gap-3.5 py-3" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            <div className="w-11 text-[13px] font-semibold shrink-0 pt-1.5" style={{ color: day.available ? T.text : T.faint }}>
              {DAY_LABELS[day.dayOfWeek].slice(0, 3)}
            </div>
            <div className="flex-1 min-w-0">
              {!day.available ? (
                <div className="flex items-center justify-between py-1">
                  <span className="text-[13px]" style={{ color: T.faint }}>Unavailable</span>
                  <button
                    onClick={() => toggleDayAvailable(day.dayOfWeek)}
                    className="inline-flex items-center gap-1.5 text-[12.5px] font-medium cursor-pointer hover:underline underline-offset-4"
                    style={{ color: T.accent }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M12 5v14M5 12h14" /></svg>
                    Add hours
                  </button>
                </div>
              ) : (
                day.ranges.map((range, ri) => (
                  <TimeRangeRow
                    key={ri}
                    range={range}
                    onStartChange={(v) => setRangeField(day.dayOfWeek, ri, "start", v)}
                    onEndChange={(v) => setRangeField(day.dayOfWeek, ri, "end", v)}
                    onRemove={() => removeRange(day.dayOfWeek, ri)}
                    onAdd={() => addRange(day.dayOfWeek)}
                    showAdd={ri === day.ranges.length - 1}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </Card>

      {/* Date-specific hours — opt-in overrides */}
      <Card className="!p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>Date-specific hours</h2>
          <button
            onClick={() => { setSelectedCalDate(null); setOverrideModalOpen(true); }}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-[9px] text-[12.5px] font-medium cursor-pointer transition-colors"
            style={{ background: T.bg, border: `1px solid ${T.border}`, color: T.text }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M12 5v14M5 12h14" /></svg>
            Add a date
          </button>
        </div>
        <div className="text-[12.5px]" style={{ color: T.muted }}>
          Hours here replace your weekly schedule on that day — holidays, extra sessions, or a one-off.
        </div>

        {sortedOverrides.length > 0 && (
          <div className="mt-4 space-y-2">
            {sortedOverrides.map((o) => (
              <div key={o.date} className="flex items-center justify-between gap-3 rounded-[12px] px-3.5 py-3" style={{ background: "rgba(89,82,54,0.03)", border: `1px solid ${T.borderSoft}` }}>
                <div className="min-w-0 flex items-center gap-3 flex-wrap">
                  <span className="text-[13px] font-semibold shrink-0" style={{ color: T.text }}>{fmtOverrideDate(o.date)}</span>
                  {o.ranges.length === 0 ? (
                    <span className="text-[12px] font-medium" style={{ color: T.danger }}>Unavailable</span>
                  ) : (
                    <span className="flex flex-wrap gap-1.5">
                      {o.ranges.map((r, ri) => (
                        <span key={ri} className="text-[11.5px] font-medium tabular-nums px-2 py-0.5 rounded-[6px]" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, color: T.text }}>
                          {formatTime24to12(r.start)} – {formatTime24to12(r.end)}
                        </span>
                      ))}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setSelectedCalDate(o.date); setCalMonth({ year: parseInt(o.date.slice(0, 4)), month: parseInt(o.date.slice(5, 7)) - 1 }); setOverrideModalOpen(true); }}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.10)]"
                    style={{ color: T.muted }}
                    title="Edit"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" /></svg>
                  </button>
                  <button
                    onClick={() => resetDateOverride(o.date)}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(163,73,63,0.08)]"
                    style={{ color: T.muted }}
                    title="Remove"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6 6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add / edit date override modal */}
      <Modal open={overrideModalOpen} onClose={() => setOverrideModalOpen(false)} title="Date-specific hours" wide>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Left: calendar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCalMonth((p) => { const d = new Date(p.year, p.month - 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
                className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[rgba(89,82,54,0.07)] cursor-pointer"
                style={{ color: T.muted, border: `1px solid ${T.borderSoft}` }}
                aria-label="Previous month"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M10 3.5 5.5 8 10 12.5" /></svg>
              </button>
              <span className="text-[14px] font-semibold" style={{ color: T.text }}>{calMonthLabel}</span>
              <button
                onClick={() => setCalMonth((p) => { const d = new Date(p.year, p.month + 1); return { year: d.getFullYear(), month: d.getMonth() }; })}
                className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-[rgba(89,82,54,0.07)] cursor-pointer"
                style={{ color: T.muted, border: `1px solid ${T.borderSoft}` }}
                aria-label="Next month"
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="m6 3.5 4.5 4.5L6 12.5" /></svg>
              </button>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
                <div key={d} className="text-center text-[10.5px] py-1" style={{ color: T.faint }}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {calDays.map((dateISO, idx) => {
                if (!dateISO) return <div key={`e-${idx}`} className="h-9" />;
                const dayNum = parseInt(dateISO.split("-")[2], 10);
                const isSelected = selectedCalDate === dateISO;
                const isToday = dateISO === todayISO;
                const overridden = hasOverride(dateISO);
                return (
                  <button
                    key={dateISO}
                    onClick={() => setSelectedCalDate(dateISO)}
                    className={`relative h-9 w-9 mx-auto rounded-full flex items-center justify-center text-[13px] tabular-nums transition-colors cursor-pointer ${isSelected ? "" : "hover:bg-[rgba(89,82,54,0.07)]"}`}
                    style={{
                      background: isSelected ? T.accent : isToday ? T.accentFaint : undefined,
                      color: isSelected ? T.accentInk : isToday ? T.accent : T.text,
                      fontWeight: isSelected || isToday ? 600 : 400,
                      boxShadow: isToday && !isSelected ? `inset 0 0 0 1px ${T.accentBorder}` : undefined,
                    }}
                  >
                    {dayNum}
                    {!isSelected && overridden && <span className="absolute bottom-[3px] w-[4px] h-[4px] rounded-full" style={{ background: isToday ? T.accent : "#b08a3e" }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: hours for the picked date */}
          <div className="sm:pl-6 sm:border-l" style={{ borderColor: T.borderSoft }}>
            {!selectedCalDate ? (
              <div className="h-full flex items-center justify-center text-center text-[13px] py-8" style={{ color: T.faint }}>
                Pick a date to set its hours.
              </div>
            ) : (() => {
              const overridden = hasOverride(selectedCalDate);
              const ranges = getDateRanges(selectedCalDate);
              return (
                <>
                  <div className="text-[14px] font-semibold mb-1" style={{ color: T.text }}>{selectedDateLabel}</div>
                  <div className="text-[12px] mb-4" style={{ color: T.muted }}>
                    {overridden ? "Custom hours for this date" : `Currently uses your ${weekdayName(selectedCalDate)} hours`}
                  </div>
                  <div className="space-y-2.5">
                    {ranges.map((range, ri) => (
                      <div key={ri} className="flex items-center gap-2">
                        <TimeSelect value={range.start} onChange={(v) => setCalSlotField(selectedCalDate, ri, "start", v)} />
                        <span className="text-[12px]" style={{ color: T.faint }}>–</span>
                        <TimeSelect value={range.end} onChange={(v) => setCalSlotField(selectedCalDate, ri, "end", v)} />
                        <button onClick={() => removeCalSlot(selectedCalDate, ri)} className="w-7 h-7 rounded-full flex items-center justify-center transition-colors hover:bg-[rgba(176,84,84,0.15)] cursor-pointer" style={{ color: T.muted }} title="Remove">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                    {ranges.length === 0 && <div className="text-[13px]" style={{ color: T.danger }}>Marked unavailable for this date.</div>}
                  </div>
                  <button onClick={() => addCalSlot(selectedCalDate)} className="inline-flex items-center gap-1.5 mt-3 text-[12.5px] font-medium cursor-pointer hover:underline underline-offset-4" style={{ color: T.accent }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M12 5v14M5 12h14" /></svg>
                    Add hours
                  </button>
                  {overridden && (
                    <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                      <button onClick={() => { resetDateOverride(selectedCalDate); setSelectedCalDate(null); }} className="text-[12px] font-medium cursor-pointer hover:underline underline-offset-4" style={{ color: T.muted }}>
                        Reset to weekly hours
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <GoldBtn onClick={() => setOverrideModalOpen(false)}>Done</GoldBtn>
        </div>
      </Modal>

      {toast && (
        <div
          className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13.5px] font-medium"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </div>
  );
}
