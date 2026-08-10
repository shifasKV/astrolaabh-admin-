/**
 * Expert (astro-gemologist) profiles for consultations and energisation.
 */

export interface ExpertProfile {
  id: string;
  name: string;
  specialization: string;
  experience: string;
  languages: string[];
  fee: number;
  status: "active" | "inactive";
  joinedAt: string;
}

export const EXPERT_PROFILES: ExpertProfile[] = [
  {
    id: "usr_expert_01",
    name: "Pt. Sandeep Kochaar",
    specialization: "Vedic Astrology & Gemstone Therapy",
    experience: "28 years",
    languages: ["Hindi", "English"],
    fee: 5000,
    status: "active",
    joinedAt: "2025-11-01",
  },
  {
    id: "usr_expert_02",
    name: "Dr. Meenakshi Joshi",
    specialization: "Nadi Astrology & Remedial Solutions",
    experience: "18 years",
    languages: ["Hindi", "English", "Marathi"],
    fee: 4500,
    status: "active",
    joinedAt: "2026-01-15",
  },
  {
    id: "usr_expert_03",
    name: "Acharya V. Tripathi",
    specialization: "KP Astrology & Prashna Kundli",
    experience: "22 years",
    languages: ["Hindi", "English", "Sanskrit"],
    fee: 5500,
    status: "active",
    joinedAt: "2026-03-01",
  },
];
