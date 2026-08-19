"use client";
import { T } from "@/lib/theme";

/* ─── Alert ─── Elegant inline banner for error / success / warning / info states.
   One standard across the platform: icon badge + tinted surface + settle-in motion. */

export type AlertTone = "error" | "success" | "warning" | "info";

const TONES: Record<AlertTone, { rgb: string; color: string }> = {
  error:   { rgb: "163,73,63",  color: T.danger },
  success: { rgb: "95,112,64",  color: T.good },
  warning: { rgb: "160,125,56", color: T.gold },
  info:    { rgb: "88,112,130", color: T.info },
};

function ToneIcon({ tone }: { tone: AlertTone }) {
  const common = { width: 13, height: 13, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (tone === "success") return <svg {...common}><path d="M20 6 9 17l-5-5" /></svg>;
  if (tone === "info") return <svg {...common}><line x1="12" y1="11" x2="12" y2="16.5" /><line x1="12" y1="7.5" x2="12" y2="7.5" /></svg>;
  // error + warning share the exclamation mark
  return <svg {...common}><line x1="12" y1="8" x2="12" y2="13" /><line x1="12" y1="16.5" x2="12" y2="16.5" /></svg>;
}

export function Alert({
  children,
  tone = "error",
  title,
  onDismiss,
  className = "",
}: {
  children: React.ReactNode;
  tone?: AlertTone;
  title?: string;
  onDismiss?: () => void;
  className?: string;
}) {
  const { rgb, color } = TONES[tone];
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={`alert-in flex items-start gap-2.5 px-3 py-2.5 rounded-[10px] ${className}`}
      style={{
        background: `linear-gradient(180deg, rgba(${rgb},0.10), rgba(${rgb},0.055))`,
        border: `1px solid rgba(${rgb},0.24)`,
        color,
        boxShadow: `0 1px 2px rgba(${rgb},0.08), inset 0 1px 0 rgba(255,255,255,0.25)`,
      }}
    >
      <span
        className="mt-px shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center"
        style={{ background: `rgba(${rgb},0.16)` }}
      >
        <ToneIcon tone={tone} />
      </span>
      <div className="min-w-0 flex-1 text-[12.5px] leading-snug">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div className={title ? "font-normal" : "font-medium"} style={title ? { color: T.muted } : undefined}>
          {children}
        </div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="mt-px shrink-0 w-5 h-5 rounded-[6px] flex items-center justify-center cursor-pointer transition-colors hover:bg-black/5"
          style={{ color }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      )}
    </div>
  );
}
