/**
 * AstroLaabh Operations Portal — Design System Tokens
 *
 * Light luxury theme — warm bone ground, beige surfaces, champagne-gold accent,
 * deep-olive ink. Single source of truth for colors, spacing, typography, motion.
 *
 * Palette: sage #777b62 · champagne gold #c3a058 · beige #e5d3b5 ·
 * deep olive #595236 · warm sand #c7af90
 */

export const T = {
  bg: "#f1ebdc",        // page — warm bone, one step above beige
  panel: "#e9e1cd",     // sidebar & recessed surfaces — deeper beige
  card: "#faf6ec",      // raised card — warm ivory
  cardHover: "#f4eedd",
  popover: "#fffdf5",   // floating surfaces — dropdowns, date pickers, small controls
  border: "rgba(89, 82, 54, 0.16)",       // deep-olive hairlines
  borderSoft: "rgba(89, 82, 54, 0.09)",
  text: "#292617",      // deep-olive ink
  muted: "#5c5641",     // sage-toned secondary — holds 4.5:1 on card
  faint: "#867e64",     // sand-toned tertiary — labels stay legible
  accent: "#a07d38",    // champagne gold, deepened for contrast on light ground
  accentInk: "#faf6ec",
  accentFaint: "rgba(160, 125, 56, 0.07)",
  accentMuted: "rgba(160, 125, 56, 0.14)",
  accentBorder: "rgba(160, 125, 56, 0.38)",
  accentHover: "rgba(160, 125, 56, 0.08)",
  good: "#5f7040",      // deep sage
  danger: "#a3493f",
  info: "#587082",
  /* Primary action — deep sage, darker than the palette's #777b62 for text contrast */
  primary: "#535843",
  primaryHover: "#464b38",
  primaryInk: "#f4f1e5",
  /* Warm-tinted elevation — a luxury surface never casts a grey shadow */
  shadow: "0 1px 2px rgba(43,42,34,0.04), 0 6px 20px -10px rgba(43,42,34,0.10)",
  shadowLift: "0 2px 6px rgba(43,42,34,0.05), 0 16px 32px -16px rgba(43,42,34,0.18)",
  shadowGold: "0 1px 2px rgba(43,42,34,0.06), 0 10px 26px -12px rgba(160,125,56,0.35)",
} as const;

export type ThemeColor = keyof typeof T;

export const STATUS_COLORS = {
  gold:   { color: T.accent, bg: "rgba(160,125,56,0.13)" },
  good:   { color: T.good,   bg: "rgba(95,112,64,0.13)" },
  muted:  { color: T.muted,  bg: "rgba(89,82,54,0.09)" },
  danger: { color: T.danger, bg: "rgba(163,73,63,0.12)" },
  info:   { color: T.info,   bg: "rgba(88,112,130,0.12)" },
} as const;

export type StatusTone = keyof typeof STATUS_COLORS;

export const INPUT_CLASS = "h-10 px-3.5 rounded-[9px] text-[13.5px] outline-none w-full transition-shadow duration-200 focus:shadow-[0_0_0_3px_rgba(160,125,56,0.14)]";
export const INPUT_STYLE = { background: "#fffdf5", border: `1px solid ${T.border}`, color: T.text };
