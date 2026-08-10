"use client";
import { T } from "@/lib/theme";

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  time: string;
  actor?: string;
  tone?: "gold" | "good" | "muted" | "danger";
}

interface TimelineProps {
  events: TimelineEvent[];
}

const TONE_COLORS = {
  gold: T.accent,
  good: T.good,
  muted: T.faint,
  danger: T.danger,
};

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-[7px] top-2 bottom-2 w-px" style={{ background: T.borderSoft }} />
      {events.map((ev) => (
        <div key={ev.id} className="relative pb-5 last:pb-0">
          <div
            className="absolute left-[-17px] top-[6px] w-[9px] h-[9px] rounded-full border-2"
            style={{
              borderColor: TONE_COLORS[ev.tone || "muted"],
              background: ev.tone && ev.tone !== "muted" ? TONE_COLORS[ev.tone] : T.bg,
            }}
          />
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="text-[13px] font-medium" style={{ color: T.text }}>{ev.title}</span>
            {ev.actor && <span className="text-[11.5px]" style={{ color: T.muted }}>{ev.actor}</span>}
            <span className="text-[11px] tabular-nums ml-auto" style={{ color: T.faint }}>{ev.time}</span>
          </div>
          {ev.description && (
            <p className="text-[12.5px] mt-0.5" style={{ color: T.muted }}>{ev.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
