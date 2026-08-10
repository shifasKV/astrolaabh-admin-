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
      className="w-full text-left flex gap-3 px-4 py-3 transition-colors hover:brightness-110"
      style={{
        background: read ? "transparent" : "rgba(195,160,88,0.03)",
        borderBottom: `1px solid ${T.borderSoft}`,
      }}
    >
      <span
        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
        style={{ background: read ? "transparent" : T.accent }}
      />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium truncate" style={{ color: T.text }}>{title}</div>
        {description && <div className="text-[12px] mt-0.5 truncate" style={{ color: T.muted }}>{description}</div>}
        <div className="text-[11px] mt-1 tabular-nums" style={{ color: T.faint }}>{time}</div>
      </div>
    </button>
  );
}
