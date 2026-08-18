"use client";
import { T } from "@/lib/theme";

type IconKind = "table" | "search" | "calendar" | "inbox" | "check" | "gem";

function EmptyIcon({ kind }: { kind: IconKind }) {
  const common = { fill: "none" as const, stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, className: "w-5 h-5" };
  switch (kind) {
    case "search":
      return <svg viewBox="0 0 24 24" {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
    case "calendar":
      return <svg viewBox="0 0 24 24" {...common}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 9h18" /></svg>;
    case "inbox":
      return <svg viewBox="0 0 24 24" {...common}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></svg>;
    case "check":
      return <svg viewBox="0 0 24 24" {...common}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>;
    case "gem":
      return <svg viewBox="0 0 24 24" {...common}><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></svg>;
    default:
      return <svg viewBox="0 0 24 24" {...common}><path d="M3 6h18M3 12h18M3 18h12" /></svg>;
  }
}

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: IconKind;
  /** Inline — no card frame, sits inside an existing table/panel */
  inline?: boolean;
}

export function EmptyState({ title, description, action, icon = "table", inline }: EmptyStateProps) {
  const inner = (
    <div className={`text-center ${inline ? "py-12 px-6" : ""}`}>
      <div
        className="w-11 h-11 rounded-[13px] mx-auto mb-3.5 flex items-center justify-center"
        style={{ background: T.accentFaint, border: `1px solid ${T.borderSoft}`, color: T.accent }}
      >
        <EmptyIcon kind={icon} />
      </div>
      <h3 className="text-[13.5px] font-semibold" style={{ color: T.text }}>{title}</h3>
      {description && <p className="text-[12.5px] mt-1 max-w-[320px] mx-auto leading-relaxed" style={{ color: T.muted }}>{description}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );

  if (inline) return inner;

  return (
    <div className="rounded-[16px] p-8" style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }}>
      {inner}
    </div>
  );
}
