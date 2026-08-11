/**
 * AstroLaabh Operations Portal — Design System Tokens
 *
 * Dark luxury theme extracted from the original AdminPage.tsx.
 * Single source of truth for colors, spacing, typography, and motion.
 */

export const T = {
  bg: "#0e0f0d",
  panel: "#141512",
  card: "#181a16",
  cardHover: "#1d1f1a",
  border: "rgba(235,230,215,0.08)",
  borderSoft: "rgba(235,230,215,0.05)",
  text: "#ecebe4",
  muted: "#8f9087",
  faint: "#5d5e56",
  accent: "#c3a058",
  accentInk: "#141512",
  accentFaint: "rgba(195,160,88,0.06)",
  accentMuted: "rgba(195,160,88,0.15)",
  accentBorder: "rgba(195,160,88,0.3)",
  accentHover: "rgba(195,160,88,0.04)",
  good: "#8ea06d",
  danger: "#b05454",
  info: "#6d8ea0",
} as const;

export type ThemeColor = keyof typeof T;

export const STATUS_COLORS = {
  gold:   { color: T.accent, bg: "rgba(195,160,88,0.14)" },
  good:   { color: T.good,   bg: "rgba(142,160,109,0.14)" },
  muted:  { color: T.muted,  bg: "rgba(235,230,215,0.06)" },
  danger: { color: T.danger, bg: "rgba(176,84,84,0.14)" },
  info:   { color: T.info,   bg: "rgba(109,142,160,0.14)" },
} as const;

export type StatusTone = keyof typeof STATUS_COLORS;

export const INPUT_CLASS = "h-10 px-3.5 rounded-[9px] text-[13px] outline-none w-full";
export const INPUT_STYLE = { background: T.panel, border: `1px solid ${T.border}`, color: T.text };
