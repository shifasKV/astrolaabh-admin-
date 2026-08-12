"use client";
import { T } from "@/lib/theme";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  className?: string;
}

export function GoldBtn({ children, onClick, disabled, type = "button", className = "" }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[9px] text-[13px] font-semibold transition-all duration-200 disabled:opacity-40 hover:-translate-y-px hover:brightness-110 hover:shadow-[0_1px_2px_rgba(43,42,34,0.06),0_10px_26px_-12px_rgba(83,88,67,0.55)] active:scale-[0.97] active:translate-y-0 cursor-pointer disabled:cursor-not-allowed ${className}`}
      style={{ background: T.primary, color: T.primaryInk, boxShadow: "0 1px 2px rgba(43,42,34,0.08)" }}
    >
      {children}
    </button>
  );
}

export function GhostBtn({ children, onClick, disabled, type = "button", className = "" }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[9px] text-[13px] transition-all duration-200 disabled:opacity-40 hover:bg-[rgba(89,82,54,0.05)] active:scale-[0.97] cursor-pointer disabled:cursor-not-allowed ${className}`}
      style={{ border: `1px solid ${T.border}`, color: T.muted }}
    >
      {children}
    </button>
  );
}

export function DangerBtn({ children, onClick, disabled, type = "button", className = "" }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[9px] text-[13px] font-semibold transition-all duration-200 disabled:opacity-40 hover:opacity-90 active:scale-[0.97] cursor-pointer disabled:cursor-not-allowed ${className}`}
      style={{ background: T.danger, color: "#faf6ec" }}
    >
      {children}
    </button>
  );
}

export function LinkBtn({ children, onClick, className = "" }: Omit<ButtonProps, "disabled">) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-[13px] hover:underline cursor-pointer transition-all duration-200 ${className}`}
      style={{ color: T.accent }}
    >
      {children}
    </button>
  );
}
