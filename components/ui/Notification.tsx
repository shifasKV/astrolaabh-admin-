"use client";
import Link from "next/link";
import { T } from "@/lib/theme";
import type { StatusTone } from "@/lib/theme";

interface NotificationItemProps {
  title: string;
  description?: string;
  time: string;
  tone?: StatusTone;
  read?: boolean;
  href?: string;
  onClick?: () => void;
}

export function NotificationItem({ title, description, time, read, href, onClick }: NotificationItemProps) {
  const body = (
    <div className="group flex gap-3 px-4 py-3 transition-colors cursor-pointer"
      style={{ background: read ? undefined : "rgba(119,123,98,0.06)", borderBottom: `1px solid ${T.borderSoft}` }}
    >
      <span className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: read ? "transparent" : T.accent, border: read ? `1px solid ${T.borderSoft}` : undefined }} />
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold truncate" style={{ color: T.text }}>{title}</div>
        {description && <div className="text-[12.5px] mt-0.5 truncate" style={{ color: T.muted }}>{description}</div>}
        <div className="text-[11px] mt-1 tabular-nums" style={{ color: T.faint }}>{time}</div>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0 self-center opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" style={{ color: T.faint }}>
        <path d="m9 18 6-6-6-6" />
      </svg>
    </div>
  );
  if (href) {
    return <Link href={href} onClick={onClick} className="block transition-colors hover:bg-[rgba(119,123,98,0.05)]">{body}</Link>;
  }
  return <button onClick={onClick} className="w-full text-left block transition-colors hover:bg-[rgba(119,123,98,0.05)]">{body}</button>;
}
