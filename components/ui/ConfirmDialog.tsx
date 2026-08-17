"use client";
import { T } from "@/lib/theme";
import { Modal } from "./Modal";
import { GoldBtn, GhostBtn, DangerBtn } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel", variant = "default" }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="text-center px-2">
        <div
          className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{
            background: variant === "danger" ? "rgba(163,73,63,0.1)" : `${T.accent}14`,
            border: `1.5px solid ${variant === "danger" ? "rgba(163,73,63,0.25)" : `${T.accent}35`}`,
          }}
        >
          {variant === "danger" ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.danger} strokeWidth="1.5" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
            </svg>
          )}
        </div>
        <h3 className="text-[16px] font-semibold mb-2" style={{ color: T.text }}>{title}</h3>
        {description && <p className="text-[13.5px] mb-6 leading-relaxed" style={{ color: T.muted }}>{description}</p>}
        <div className="flex items-center justify-center gap-3">
          <GhostBtn onClick={onClose}>{cancelLabel}</GhostBtn>
          {variant === "danger" ? (
            <DangerBtn onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</DangerBtn>
          ) : (
            <GoldBtn onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</GoldBtn>
          )}
        </div>
      </div>
    </Modal>
  );
}
