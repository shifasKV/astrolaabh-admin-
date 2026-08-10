"use client";
import { T } from "@/lib/theme";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      className="rounded-[12px] p-8 text-center"
      style={{ background: T.card, border: `1px solid ${T.border}` }}
    >
      <div className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: T.panel, border: `1px solid ${T.borderSoft}` }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5" style={{ color: T.faint }}>
          <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="text-[14px] font-medium mb-1" style={{ color: T.text }}>{title}</h3>
      {description && <p className="text-[12.5px] mb-4" style={{ color: T.muted }}>{description}</p>}
      {action}
    </div>
  );
}
