"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui";
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
  "#5d5e56",
  "#6d8ea0",
  "#8ea06d",
  "#c3a058",
  "#b05454",
  "#a06d8e",
  "#5d5e56",
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
        className="h-9 px-3 rounded-[8px] text-[12.5px] min-w-[100px] text-left cursor-pointer flex items-center justify-between gap-1.5"
        style={{ background: T.panel, border: `1px solid ${open ? T.accent : T.border}`, color: T.text }}
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
          style={{ background: T.panel, border: `1px solid ${T.border}` }}
        >
          {TIME_OPTIONS.map((t) => {
            const isActive = t === value;
            return (
              <button
                key={t}
                type="button"
                onClick={() => { onChange(t); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-[12.5px] cursor-pointer transition-colors"
                style={{
                  background: isActive ? T.accent : "transparent",
                  color: isActive ? T.accentInk : T.text,
                  fontWeight: isActive ? 600 : 400,
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = "rgba(195,160,88,0.08)"; } }}
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
        className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] transition-colors hover:bg-[rgba(176,84,84,0.15)] cursor-pointer"
        style={{ color: T.muted }}
        title="Remove"
      >
        ✕
      </button>
      {showAdd && (
        <button
          onClick={onAdd}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[15px] transition-colors hover:bg-[rgba(195,160,88,0.1)] cursor-pointer"
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Weekly hours */}
      <Card>
        <div className="mb-4">
          <span className="text-[13.5px] font-semibold" style={{ color: T.text }}>Weekly hours</span>
        </div>
        <div className="text-[11.5px] mb-5" style={{ color: T.muted }}>
          Set when you are typically available for meetings
        </div>

        {weeklyHours.map((day) => (
          <div
            key={day.dayOfWeek}
            className="flex items-start gap-3 py-3"
            style={{ borderBottom: `1px solid ${T.borderSoft}` }}
          >
            <div
              className="w-9 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
              style={{ background: `${DAY_COLORS[day.dayOfWeek]}22`, color: DAY_COLORS[day.dayOfWeek] }}
            >
              {DAY_LABELS[day.dayOfWeek].slice(0, 3)}
            </div>

            <div className="flex-1 min-w-0">
              {!day.available ? (
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px]" style={{ color: T.muted }}>Unavailable</span>
                  <button
                    onClick={() => toggleDayAvailable(day.dayOfWeek)}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[15px] transition-colors hover:bg-[rgba(195,160,88,0.1)] cursor-pointer"
                    style={{ color: T.accent }}
                    title="Make available"
                  >
                    +
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

      {/* Calendar + date hours */}
      <Card>
        <div className="mb-5">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() =>
                setCalMonth((p) => {
                  const d = new Date(p.year, p.month - 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })
              }
              className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] transition-colors hover:bg-[rgba(195,160,88,0.1)] cursor-pointer"
              style={{ color: T.muted }}
            >
              ‹
            </button>
            <span className="text-[14px] font-semibold" style={{ color: T.text }}>{calMonthLabel}</span>
            <button
              onClick={() =>
                setCalMonth((p) => {
                  const d = new Date(p.year, p.month + 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })
              }
              className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] transition-colors hover:bg-[rgba(195,160,88,0.1)] cursor-pointer"
              style={{ color: T.muted }}
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center text-[10.5px] tracking-[0.04em] py-1" style={{ color: T.faint }}>
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {calDays.map((dateISO, idx) => {
              if (!dateISO) return <div key={`empty-${idx}`} />;
              const dayNum = parseInt(dateISO.split("-")[2], 10);
              const avail = hasAvailability(dateISO);
              const isSelected = selectedCalDate === dateISO;
              const isToday = dateISO === todayISO;

              return (
                <button
                  key={dateISO}
                  onClick={() => setSelectedCalDate(dateISO)}
                  className="relative w-full aspect-square rounded-full flex flex-col items-center justify-center text-[13px] transition-all cursor-pointer"
                  style={{
                    background: isSelected ? T.accent : "transparent",
                    color: isSelected ? T.accentInk : avail ? T.text : T.faint,
                    fontWeight: isSelected || isToday ? 700 : 400,
                  }}
                >
                  {dayNum}
                  {avail && !isSelected && (
                    <span
                      className="absolute bottom-1 w-1.5 h-1.5 rounded-full"
                      style={{ background: T.accent }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
          {selectedCalDate ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="text-[13.5px] font-semibold" style={{ color: T.text }}>
                  {selectedDateLabel}
                </div>
                <button
                  onClick={() => addCalSlot(selectedCalDate)}
                  className="text-[12px] font-medium transition-colors hover:opacity-80 cursor-pointer"
                  style={{ color: T.accent }}
                >
                  + Add hours
                </button>
              </div>

              {getDateRanges(selectedCalDate).length === 0 ? (
                <div className="text-[12.5px] py-4 text-center" style={{ color: T.muted }}>
                  No availability. Click &quot;+ Add hours&quot; to add a slot.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {getDateRanges(selectedCalDate).map((range, ri) => (
                    <div key={ri} className="flex items-center gap-2">
                      <TimeSelect value={range.start} onChange={(v) => setCalSlotField(selectedCalDate, ri, "start", v)} />
                      <span className="text-[12px]" style={{ color: T.faint }}>–</span>
                      <TimeSelect value={range.end} onChange={(v) => setCalSlotField(selectedCalDate, ri, "end", v)} />
                      <button
                        onClick={() => removeCalSlot(selectedCalDate, ri)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] transition-colors hover:bg-[rgba(176,84,84,0.15)] cursor-pointer"
                        style={{ color: T.muted }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-[12.5px] py-4 text-center" style={{ color: T.muted }}>
              Select a date to view and edit hours.
            </div>
          )}
        </div>
      </Card>

      {toast && (
        <div
          className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13px] font-medium"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </div>
  );
}
