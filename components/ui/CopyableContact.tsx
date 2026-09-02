"use client";

import type { MouseEvent, ReactNode } from "react";
import { T } from "@/lib/theme";

type CopyableContactProps = {
  value: string;
  /** Shown in toast / for accessibility */
  label?: "Email" | "Phone" | string;
  type?: "email" | "phone" | "plain";
  onCopied?: (message: string) => void;
  className?: string;
  /** Extra classes for the value text */
  textClassName?: string;
  children?: ReactNode;
  showIcon?: boolean;
  /** Override text color (defaults to inherit) */
  color?: string;
};

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0" style={{ color: T.faint }} aria-hidden>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 shrink-0" style={{ color: T.faint }} aria-hidden>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

/**
 * Click-to-copy email or phone control used on profile / detail headers.
 */
export function CopyableContact({
  value,
  label,
  type = "plain",
  onCopied,
  className = "",
  textClassName = "",
  children,
  showIcon = true,
  color,
}: CopyableContactProps) {
  if (!value) return null;

  const kind = label ?? (type === "email" ? "Email" : type === "phone" ? "Phone" : "Value");

  const handleCopy = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void navigator.clipboard.writeText(value).then(() => {
      onCopied?.(`${kind} copied`);
    });
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy ${kind.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 min-w-0 max-w-full rounded-[6px] -mx-1 px-1 py-0.5 text-left cursor-pointer transition-colors hover:bg-[rgba(119,123,98,0.08)] ${className}`}
      style={{ color: color ?? "inherit", background: "transparent", border: "none" }}
    >
      {showIcon && type === "email" && <EmailIcon />}
      {showIcon && type === "phone" && <PhoneIcon />}
      {children ?? (
        <span className={`truncate ${type === "phone" ? "tabular-nums" : ""} ${textClassName}`}>
          {value}
        </span>
      )}
    </button>
  );
}
