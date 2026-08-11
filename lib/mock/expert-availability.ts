/**
 * Mock expert availability data.
 * Each expert has available dates (generated for next 30 days) with specific time slots.
 */

export type { ExpertProfile } from "./experts";
export { EXPERT_PROFILES } from "./experts";

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface DayAvailability {
  date: string;
  slots: TimeSlot[];
}

export interface ExpertAvailability {
  expertId: string;
  expertName: string;
  availability: DayAvailability[];
}

const BASE_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM",
  "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

function generateAvailability(expertId: string): DayAvailability[] {
  const today = new Date();
  const days: DayAvailability[] = [];

  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) continue;

    const seed = expertId.charCodeAt(expertId.length - 1) + i;
    if (seed % 7 === 0) continue;

    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const slots: TimeSlot[] = BASE_SLOTS.map((time, idx) => ({
      time,
      available: !((seed + idx) % 5 === 0),
    }));

    days.push({ date: iso, slots });
  }

  return days;
}

export const EXPERT_AVAILABILITY: ExpertAvailability[] = [
  { expertId: "usr_expert_01", expertName: "Pt. Sandeep Kochaar", availability: generateAvailability("usr_expert_01") },
  { expertId: "usr_expert_02", expertName: "Dr. Meenakshi Joshi", availability: generateAvailability("usr_expert_02") },
  { expertId: "usr_expert_03", expertName: "Acharya V. Tripathi", availability: generateAvailability("usr_expert_03") },
];

/** Get available dates for a given expert */
export function getExpertDates(expertId: string): string[] {
  const expert = EXPERT_AVAILABILITY.find((e) => e.expertId === expertId);
  if (!expert) return [];
  return expert.availability.map((d) => d.date);
}

/** Get available time slots for a given expert on a specific date */
export function getExpertSlots(expertId: string, date: string): TimeSlot[] {
  const expert = EXPERT_AVAILABILITY.find((e) => e.expertId === expertId);
  if (!expert) return [];
  const day = expert.availability.find((d) => d.date === date);
  return day?.slots ?? [];
}

/* ------------------------------------------------------------------ */
/*  Calendly-style availability model                                 */
/* ------------------------------------------------------------------ */

export const DEFAULT_BOOKING_DURATION_MIN = 60;

export interface TimeRange {
  start: string; // "HH:mm" 24-hour format
  end: string;
}

export interface WeeklyScheduleDay {
  dayOfWeek: number; // 0=Sun … 6=Sat
  available: boolean;
  ranges: TimeRange[];
}

export interface DateOverride {
  date: string; // ISO date "YYYY-MM-DD"
  ranges: TimeRange[];
}

export interface ExpertSchedule {
  expertId: string;
  scheduleName: string;
  weeklyHours: WeeklyScheduleDay[];
  dateOverrides: DateOverride[];
}

const DEFAULT_RANGE: TimeRange = { start: "09:00", end: "17:00" };

export const MOCK_EXPERT_SCHEDULES: ExpertSchedule[] = [
  {
    expertId: "usr_expert_01",
    scheduleName: "Working hours (default)",
    weeklyHours: [
      { dayOfWeek: 0, available: false, ranges: [] },
      { dayOfWeek: 1, available: true, ranges: [{ ...DEFAULT_RANGE }] },
      { dayOfWeek: 2, available: true, ranges: [{ ...DEFAULT_RANGE }] },
      { dayOfWeek: 3, available: true, ranges: [{ ...DEFAULT_RANGE }] },
      { dayOfWeek: 4, available: true, ranges: [{ ...DEFAULT_RANGE }] },
      { dayOfWeek: 5, available: true, ranges: [{ ...DEFAULT_RANGE }] },
      { dayOfWeek: 6, available: false, ranges: [] },
    ],
    dateOverrides: [
      { date: "2026-08-12", ranges: [{ start: "09:00", end: "17:00" }, { start: "18:00", end: "19:00" }] },
      { date: "2026-08-19", ranges: [{ start: "09:00", end: "17:00" }, { start: "18:00", end: "19:00" }] },
      { date: "2026-08-25", ranges: [{ start: "09:00", end: "17:00" }] },
      { date: "2026-08-26", ranges: [{ start: "09:00", end: "17:00" }] },
    ],
  },
  {
    expertId: "usr_expert_02",
    scheduleName: "Working hours (default)",
    weeklyHours: [
      { dayOfWeek: 0, available: false, ranges: [] },
      { dayOfWeek: 1, available: true, ranges: [{ ...DEFAULT_RANGE }] },
      { dayOfWeek: 2, available: true, ranges: [{ ...DEFAULT_RANGE }] },
      { dayOfWeek: 3, available: true, ranges: [{ ...DEFAULT_RANGE }] },
      { dayOfWeek: 4, available: true, ranges: [{ ...DEFAULT_RANGE }] },
      { dayOfWeek: 5, available: true, ranges: [{ ...DEFAULT_RANGE }] },
      { dayOfWeek: 6, available: false, ranges: [] },
    ],
    dateOverrides: [],
  },
  {
    expertId: "usr_expert_03",
    scheduleName: "Working hours (default)",
    weeklyHours: [
      { dayOfWeek: 0, available: false, ranges: [] },
      { dayOfWeek: 1, available: true, ranges: [{ ...DEFAULT_RANGE }] },
      { dayOfWeek: 2, available: true, ranges: [{ ...DEFAULT_RANGE }] },
      { dayOfWeek: 3, available: true, ranges: [{ ...DEFAULT_RANGE }] },
      { dayOfWeek: 4, available: true, ranges: [{ ...DEFAULT_RANGE }] },
      { dayOfWeek: 5, available: true, ranges: [{ ...DEFAULT_RANGE }] },
      { dayOfWeek: 6, available: true, ranges: [{ start: "10:00", end: "14:00" }] },
    ],
    dateOverrides: [],
  },
];

/** Get an expert's schedule (weekly + overrides) */
export function getExpertSchedule(expertId: string): ExpertSchedule | undefined {
  return MOCK_EXPERT_SCHEDULES.find((s) => s.expertId === expertId);
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export { DAY_LABELS };

/** Generate 30-min increment time options for select dropdowns */
export function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      options.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return options;
}

/** Format 24h "HH:mm" to 12h display "h:mm AM/PM" */
export function formatTime24to12(t: string): string {
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
}
