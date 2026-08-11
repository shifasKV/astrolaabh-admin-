"use client";
import { STATUS_COLORS, type StatusTone } from "@/lib/theme";

interface ChipProps {
  children: React.ReactNode;
  tone?: StatusTone;
}

export function Chip({ children, tone = "muted" }: ChipProps) {
  const colors = STATUS_COLORS[tone];
  return (
    <span
      className="inline-flex items-center text-[10.5px] tracking-[0.06em] font-medium px-2 py-[3px] rounded-[6px] whitespace-nowrap"
      style={{ color: colors.color, background: colors.bg }}
    >
      {children}
    </span>
  );
}

interface StatusDotProps {
  tone?: StatusTone;
  label?: string;
}

export function StatusDot({ tone = "muted", label }: StatusDotProps) {
  const colors = STATUS_COLORS[tone];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors.color }} />
      {label && <span className="text-[11px]" style={{ color: colors.color }}>{label}</span>}
    </span>
  );
}
