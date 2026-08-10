"use client";
import { T } from "@/lib/theme";

interface StatusBadgeProps {
  stages: string[];
  current: number;
  className?: string;
}

export function StatusBadge({ stages, current, className = "" }: StatusBadgeProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-1">
        {stages.map((_, i) => (
          <span
            key={i}
            className="h-[4px] flex-1 rounded-full"
            style={{ background: i <= current ? T.accent : "rgba(235,230,215,0.1)" }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[12px]" style={{ color: T.muted }}>
          {current + 1}/{stages.length} · <span style={{ color: T.text }}>{stages[current]}</span>
        </span>
      </div>
    </div>
  );
}

interface StatusPipelineProps {
  stages: string[];
  current: number;
}

export function StatusPipeline({ stages, current }: StatusPipelineProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1">
      {stages.map((s, i) => (
        <div key={s} className="flex items-center gap-2 shrink-0">
          {i > 0 && <span className="text-[10px]" style={{ color: T.faint }}>→</span>}
          <span
            className="text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{
              background: i === current ? "rgba(195,160,88,0.15)" : "transparent",
              border: `1px solid ${i <= current ? "rgba(195,160,88,0.4)" : T.borderSoft}`,
              color: i <= current ? T.accent : T.faint,
              fontWeight: i === current ? 600 : 400,
            }}
          >
            {s}
          </span>
        </div>
      ))}
    </div>
  );
}
