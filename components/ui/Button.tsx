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
      className={`inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[10px] text-[13px] font-semibold transition-all duration-200 disabled:opacity-40 hover:-translate-y-px hover:brightness-[1.08] hover:shadow-[0_2px_4px_rgba(43,42,34,0.08),0_14px_30px_-14px_rgba(101,105,79,0.6)] active:scale-[0.98] active:translate-y-0 cursor-pointer disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none ${className}`}
      style={{ background: T.accent, color: T.accentInk, boxShadow: "inset 0 1px 0 rgba(244,241,229,0.14), 0 1px 2px rgba(43,42,34,0.1)" }}
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
      className={`inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[10px] text-[13px] font-medium transition-all duration-200 disabled:opacity-40 hover:bg-[rgba(119,123,98,0.08)] active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed ${className}`}
      style={{ border: `1px solid ${T.border}`, color: T.text }}
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
