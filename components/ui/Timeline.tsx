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

/** Raw event times arrive as dates or full ISO timestamps — never show the raw string. */
function formatEventTime(time: string): string {
  const d = new Date(time);
  if (isNaN(d.getTime())) return time;
  const date = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  // only show clock time when the source carried one
  if (time.includes("T") && !/T00:00(:00)?/.test(time)) {
    return `${date}, ${d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}`;
  }
  return date;
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="relative pl-7">
      <div
        className="absolute left-[8px] top-2.5 bottom-2.5 w-px"
        style={{ background: "linear-gradient(180deg, rgba(89,82,54,0.18), rgba(89,82,54,0.08))" }}
      />
      {events.map((ev) => {
        const tone = TONE_COLORS[ev.tone || "muted"];
        return (
          <div key={ev.id} className="relative pb-5 last:pb-0">
            <span
              className="absolute left-[-24px] top-[4px] w-[11px] h-[11px] rounded-full flex items-center justify-center"
              style={{ background: T.card, boxShadow: `0 0 0 1.5px ${tone}` }}
            >
              {ev.tone && ev.tone !== "muted" && (
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: tone }} />
              )}
            </span>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="text-[13.5px] font-medium" style={{ color: T.text }}>{ev.title}</span>
              {ev.actor && <span className="text-[12px]" style={{ color: T.muted }}>{ev.actor}</span>}
              <span className="text-[11.5px] tabular-nums ml-auto whitespace-nowrap" style={{ color: T.faint }}>
                {formatEventTime(ev.time)}
              </span>
            </div>
            {ev.description && (
              <p className="text-[13px] mt-0.5" style={{ color: T.muted }}>{ev.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
