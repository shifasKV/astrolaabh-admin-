"use client";
import { T } from "@/lib/theme";
import type { StatusTone } from "@/lib/theme";

interface NotificationItemProps {
  title: string;
  description?: string;
  time: string;
  tone?: StatusTone;
  read?: boolean;
  onClick?: () => void;
}

export function NotificationItem({ title, description, time, tone = "muted", read, onClick }: NotificationItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex gap-3 px-4 py-3 transition-colors ${read ? "hover:bg-[rgba(89,82,54,0.04)]" : "hover:brightness-[0.98]"}`}
      style={{
        background: read ? undefined : "rgba(160,125,56,0.07)",
        borderBottom: `1px solid ${T.borderSoft}`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
        style={{ background: read ? "transparent" : T.accent }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-medium truncate" style={{ color: T.text }}>{title}</div>
        {description && <div className="text-[12px] mt-0.5 truncate" style={{ color: T.muted }}>{description}</div>}
        <div className="text-[11px] mt-1 tabular-nums" style={{ color: T.faint }}>{time}</div>
      </div>
    </button>
  );
}
