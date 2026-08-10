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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ animation: "modal-backdrop-in 200ms ease-out" }}
        onClick={onClose}
      />
      <div
        className={`relative rounded-[14px] p-6 w-full shadow-2xl max-h-[90vh] overflow-y-auto ${wide ? "max-w-[640px]" : "max-w-[480px]"}`}
        style={{ background: T.panel, border: `1px solid ${T.border}`, animation: "modal-in 250ms cubic-bezier(0.22, 1, 0.36, 1)" }}
      >
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h3 id="modal-title" className="text-[15px] font-semibold" style={{ color: T.text }}>{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-[rgba(235,230,215,0.06)]"
              style={{ color: T.muted }}
            >
              ✕
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
