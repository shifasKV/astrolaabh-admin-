"use client";
import { useEffect, useCallback } from "react";
import { T } from "@/lib/theme";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  wide?: boolean;
}

export function Modal({ open, onClose, title, children, wide }: ModalProps) {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={title ? "modal-title" : undefined}>
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: "rgba(43,42,34,0.38)", animation: "modal-backdrop-in 200ms ease-out" }}
        onClick={onClose}
      />
      <div
        className={`relative rounded-[18px] w-full max-h-[90vh] overflow-y-auto ${wide ? "max-w-[640px]" : "max-w-[480px]"}`}
        style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: "0 2px 6px rgba(43,42,34,0.06), 0 44px 90px -40px rgba(43,42,34,0.45), inset 0 1px 0 rgba(255,255,255,0.5)", animation: "modal-in 250ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        {title && (
          <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
            <h3 id="modal-title" className="text-[15.5px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 -mr-1 rounded-[9px] flex items-center justify-center shrink-0 transition-colors duration-200 cursor-pointer hover:bg-[rgba(89,82,54,0.08)]"
              style={{ color: T.muted }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="w-[17px] h-[17px]"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
