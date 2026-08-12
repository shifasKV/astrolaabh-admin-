"use client";
import { T } from "@/lib/theme";

interface StepDef {
  key: string;
  label: string;
}

interface StepIndicatorProps {
  steps: StepDef[];
  currentIndex: number;
  onNavigate?: (index: number) => void;
  canNavigateTo?: (index: number) => boolean;
}

export function StepIndicator({ steps, currentIndex, onNavigate, canNavigateTo }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-1 mb-6 overflow-x-auto no-scrollbar">
      {steps.map((s, i) => {
        const isActive = i === currentIndex;
        const isCompleted = i < currentIndex;
        const navigable = canNavigateTo ? canNavigateTo(i) : isCompleted;

        return (
          <div key={s.key} className="flex items-center gap-1 flex-1 min-w-0">
            <button
              onClick={() => navigable && onNavigate?.(i)}
              className="flex items-center gap-2 text-[12px] px-3 py-1.5 rounded-full whitespace-nowrap transition-all duration-200"
              style={{
                background: isActive ? T.accentMuted : isCompleted ? "rgba(95,112,64,0.10)" : "transparent",
                border: `1px solid ${isActive ? T.accentBorder : navigable ? "rgba(160,125,56,0.25)" : T.borderSoft}`,
                color: isActive ? T.accent : isCompleted ? T.good : T.faint,
                fontWeight: isActive ? 600 : 400,
                cursor: navigable ? "pointer" : "default",
                opacity: navigable || isActive ? 1 : 0.5,
              }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                style={{
                  background: isActive ? T.accent : isCompleted ? T.good : T.border,
                  color: isActive || isCompleted ? T.accentInk : T.faint,
                }}
              >
                {isCompleted ? "✓" : i + 1}
              </span>
              <span className="truncate">{s.label}</span>
            </button>
            {i < steps.length - 1 && (
              <span className="flex-1 h-px min-w-[12px]" style={{ background: isCompleted ? T.good : T.borderSoft }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
