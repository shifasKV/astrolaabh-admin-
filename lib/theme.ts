/**
 * AstroLaabh Operations Portal — Design System Tokens
 *
 * Light luxury theme — warm bone ground, beige surfaces, sage primary accent,
 * champagne-gold secondary, deep-olive ink. Single source of truth for colors,
 * spacing, typography, motion.
 *
 * Palette: sage #777b62 · champagne gold #c3a058 · beige #e5d3b5 ·
 * deep olive #595236 · warm sand #c7af90
 */

export const T = {
  bg: "#f8f5ee",        // page — bright warm white, airy not sleepy
  panel: "#efebdf",     // recessed surfaces — soft warm grey-beige
  card: "#fffefa",      // raised card — near white with warmth
  cardHover: "#f6f3ea",
  popover: "#ffffff",   // floating surfaces — dropdowns, date pickers, small controls
  /* Sage side panel — inverted surface, bone text on deep sage */
  sidebar: "#24271b",       // near-black sage — app frame + side panel ground
  sidebarBorder: "rgba(43, 42, 34, 0.16)",       // outer edge against light page
  sidebarDivider: "rgba(244, 241, 229, 0.14)",   // internal hairlines
  sidebarText: "#f4f1e5",
  sidebarMuted: "rgba(244, 241, 229, 0.82)",
  sidebarFaint: "rgba(244, 241, 229, 0.55)",
  sidebarHover: "rgba(244, 241, 229, 0.09)",
  sidebarActive: "rgba(244, 241, 229, 0.17)",
  border: "rgba(89, 82, 54, 0.16)",       // deep-olive hairlines
  borderSoft: "rgba(89, 82, 54, 0.09)",
  text: "#292617",      // deep-olive ink
  muted: "#5c5641",     // sage-toned secondary — holds 4.5:1 on card
  faint: "#867e64",     // sand-toned tertiary — labels stay legible
  accent: "#65694f",    // sage, deepened for contrast on light ground
  accentInk: "#faf6ec",
  accentFaint: "rgba(119, 123, 98, 0.09)",
  accentMuted: "rgba(119, 123, 98, 0.16)",
  accentBorder: "rgba(119, 123, 98, 0.42)",
  accentHover: "rgba(119, 123, 98, 0.10)",
  gold: "#a07d38",      // champagne gold, kept as secondary metal accent
  good: "#5f7040",      // deep sage
  danger: "#a3493f",
  info: "#587082",
  /* Primary action — matches the side panel's near-black sage */
  primary: "#24271b",
  primaryHover: "#383b2c",
  primaryInk: "#f4f1e5",
  /* Warm-tinted elevation — a luxury surface never casts a grey shadow */
  shadow: "0 1px 2px rgba(43,42,34,0.04), 0 6px 20px -10px rgba(43,42,34,0.10)",
  shadowLift: "0 2px 6px rgba(43,42,34,0.05), 0 16px 32px -16px rgba(43,42,34,0.18)",
  shadowGold: "0 1px 2px rgba(43,42,34,0.06), 0 10px 26px -12px rgba(101,105,79,0.40)",
} as const;

export type ThemeColor = keyof typeof T;

export const STATUS_COLORS = {
  gold:   { color: T.gold, bg: "rgba(160,125,56,0.13)" },
  good:   { color: T.good,   bg: "rgba(95,112,64,0.13)" },
  muted:  { color: T.muted,  bg: "rgba(89,82,54,0.09)" },
  danger: { color: T.danger, bg: "rgba(163,73,63,0.12)" },
  info:   { color: T.info,   bg: "rgba(88,112,130,0.12)" },
} as const;

export type StatusTone = keyof typeof STATUS_COLORS;

export const INPUT_CLASS = "h-10 px-3.5 rounded-[10px] text-[13.5px] outline-none w-full transition-shadow duration-200 shadow-[0_1px_2px_rgba(43,42,34,0.06)] focus:shadow-[0_0_0_3px_rgba(160,125,56,0.16),0_1px_2px_rgba(43,42,34,0.06)]";
export const INPUT_STYLE = { background: T.popover, border: "1px solid rgba(89,82,54,0.22)", color: T.text };
