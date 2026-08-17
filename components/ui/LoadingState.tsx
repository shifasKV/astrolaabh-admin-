"use client";
import { T } from "@/lib/theme";

interface LoadingStateProps {
  lines?: number;
  className?: string;
}

export function LoadingState({ lines = 5, className = "" }: LoadingStateProps) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {i === 0 && <div className="w-10 h-10 rounded-[10px] shrink-0" style={{ background: T.borderSoft }} />}
          <div className="flex-1 space-y-2">
            <div className="h-3 rounded-full" style={{ background: T.borderSoft, width: `${70 + Math.random() * 30}%` }} />
            {i < 2 && <div className="h-2.5 rounded-full" style={{ background: T.borderSoft, width: `${40 + Math.random() * 30}%` }} />}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      <div className="flex gap-4 px-3 py-3 mb-1">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 h-3 rounded-full" style={{ background: T.borderSoft }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-3 py-4 items-center" style={{ borderBottom: `1px solid ${T.borderSoft}` }}>
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="flex-1 h-3 rounded-full" style={{ background: T.borderSoft, width: `${50 + Math.random() * 40}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[12px] p-5" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-full shrink-0" style={{ background: T.borderSoft }} />
            <div className="flex-1 space-y-2.5">
              <div className="h-3.5 rounded-full" style={{ background: T.borderSoft, width: "45%" }} />
              <div className="h-2.5 rounded-full" style={{ background: T.borderSoft, width: "60%" }} />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-1.5">
                <div className="h-2 rounded-full" style={{ background: T.borderSoft, width: "60%" }} />
                <div className="h-3.5 rounded-full" style={{ background: T.borderSoft, width: "40%" }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-3 animate-pulse`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[12px] p-5" style={{ background: T.card, border: `1px solid ${T.border}` }}>
          <div className="h-2.5 rounded-full mb-3" style={{ background: T.borderSoft, width: "60%" }} />
          <div className="h-6 rounded-full" style={{ background: T.borderSoft, width: "40%" }} />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-5 animate-pulse max-w-[500px]">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <div className="h-2 rounded-full mb-2" style={{ background: T.borderSoft, width: "25%" }} />
          <div className="h-10 rounded-[9px]" style={{ background: T.borderSoft }} />
        </div>
      ))}
    </div>
  );
}
