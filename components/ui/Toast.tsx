"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { T } from "@/lib/theme";

type ToastTone = "success" | "error" | "info";

/* Standardized toast — bottom-right, portalled to body, rises into view.
   Pages keep their own `toast` state and drop <Toast message={toast} /> at the end. */
export function Toast({ message, tone = "success" }: { message: string; tone?: ToastTone }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!message || !mounted) return null;

  const palette: Record<ToastTone, { color: string; bg: string; ring: string }> = {
    success: { color: T.good, bg: "rgba(95,112,64,0.14)", ring: "rgba(95,112,64,0.22)" },
    error: { color: T.danger, bg: "rgba(163,73,63,0.14)", ring: "rgba(163,73,63,0.22)" },
    info: { color: T.accent, bg: T.accentFaint, ring: "rgba(119,123,98,0.22)" },
  };
  const p = palette[tone];

  return createPortal(
    <div className="fixed bottom-6 right-6 z-[300] max-w-[calc(100vw-3rem)]" style={{ animation: "toast-in 0.28s cubic-bezier(0.22,1,0.36,1)" }}>
      <div
        className="flex items-center gap-3 pl-2.5 pr-4 py-2.5 rounded-[13px]"
        style={{
          background: T.card,
          border: `1px solid ${p.ring}`,
          boxShadow: `0 2px 6px rgba(43,42,34,0.08), 0 24px 50px -22px rgba(43,42,34,0.45), inset 0 1px 0 rgba(255,255,255,0.5)`,
        }}
      >
        <span className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: p.bg, color: p.color }}>
          {tone === "success" && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]"><path d="M20 6 9 17l-5-5" /></svg>
          )}
          {tone === "error" && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]"><path d="M18 6 6 18M6 6l12 12" /></svg>
          )}
          {tone === "info" && (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]"><line x1="12" y1="11" x2="12" y2="16.5" /><line x1="12" y1="7.5" x2="12" y2="7.5" /></svg>
          )}
        </span>
        <span className="text-[13px] font-medium pr-1 leading-snug" style={{ color: T.text }}>{message}</span>
      </div>
    </div>,
    document.body,
  );
}
