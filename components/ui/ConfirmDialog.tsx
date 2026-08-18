"use client";
import { Modal } from "./Modal";
import { GhostBtn, GoldBtn, DangerBtn } from "./Button";
import { T } from "@/lib/theme";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
}

/* Standard confirmation for destructive / major actions */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
}: ConfirmDialogProps) {
  const danger = tone === "danger";
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex items-start gap-3.5">
        <span
          className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
          style={danger
            ? { background: "rgba(163,73,63,0.10)", color: T.danger }
            : { background: T.accentFaint, color: T.accent }}
        >
          {danger ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><path d="M12 9v4M12 17h.01" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
          )}
        </span>
        {message && (
          <p className="text-[13.5px] leading-relaxed pt-1" style={{ color: T.muted }}>{message}</p>
        )}
      </div>
      <div className="flex items-center justify-end gap-2.5 mt-6">
        <GhostBtn onClick={onClose}>{cancelLabel}</GhostBtn>
        {danger ? (
          <DangerBtn onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</DangerBtn>
        ) : (
          <GoldBtn onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</GoldBtn>
        )}
      </div>
    </Modal>
  );
}
