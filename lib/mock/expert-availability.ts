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
