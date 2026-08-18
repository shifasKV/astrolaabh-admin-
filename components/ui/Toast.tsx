"use client";
import { T } from "@/lib/theme";

type ToastTone = "success" | "error" | "info";

/* Standardized toast — render with a message string; hides itself when empty.
   Pages keep their own `toast` state and drop <Toast message={toast} /> at the end. */
export function Toast({ message, tone = "success" }: { message: string; tone?: ToastTone }) {
  if (!message) return null;

  const palette: Record<ToastTone, { color: string; bg: string }> = {
    success: { color: T.good, bg: "rgba(95,112,64,0.12)" },
    error: { color: T.danger, bg: "rgba(163,73,63,0.12)" },
    info: { color: T.accent, bg: T.accentFaint },
  };
  const p = palette[tone];

  return (
    <div className="fixed top-6 right-6 z-[200]" style={{ animation: "toast-in 0.22s cubic-bezier(0.22,1,0.36,1)" }}>
      <div
        className="flex items-center gap-2.5 pl-2.5 pr-4 py-2.5 rounded-[12px]"
        style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: "0 2px 6px rgba(43,42,34,0.06), 0 20px 44px -20px rgba(43,42,34,0.4)" }}
      >
        <span className="w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0" style={{ background: p.bg, color: p.color }}>
          {tone === "success" && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 6 9 17l-5-5" /></svg>
          )}
          {tone === "error" && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 6 6 18M6 6l12 12" /></svg>
          )}
          {tone === "info" && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          )}
        </span>
        <span className="text-[13px] font-medium pr-1" style={{ color: T.text }}>{message}</span>
      </div>
    </div>
  );
}
