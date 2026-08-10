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
      className={`inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[9px] text-[12.5px] font-semibold transition-all duration-200 disabled:opacity-40 hover:opacity-90 active:scale-[0.97] cursor-pointer disabled:cursor-not-allowed ${className}`}
      style={{ background: T.accent, color: T.accentInk }}
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
      className={`inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[9px] text-[12.5px] transition-all duration-200 disabled:opacity-40 hover:brightness-125 active:scale-[0.97] cursor-pointer disabled:cursor-not-allowed ${className}`}
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
      className={`inline-flex items-center justify-center gap-2 h-10 px-5 rounded-[9px] text-[12.5px] font-semibold transition-all duration-200 disabled:opacity-40 hover:opacity-90 active:scale-[0.97] cursor-pointer disabled:cursor-not-allowed ${className}`}
      style={{ background: T.danger, color: T.text }}
    >
      {children}
    </button>
  );
}

export function LinkBtn({ children, onClick, className = "" }: Omit<ButtonProps, "disabled">) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 text-[12.5px] hover:underline cursor-pointer transition-all duration-200 ${className}`}
      style={{ color: T.accent }}
    >
      {children}
    </button>
  );
}
