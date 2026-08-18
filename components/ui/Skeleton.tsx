"use client";
import { T } from "@/lib/theme";

/* Shimmer block — building unit for loading states */
export function Skeleton({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`shimmer rounded-[6px] ${className}`} style={style} />;
}

/* Table loading state — mirrors the standard list layout (header + zebra rows) */
export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div>
      {/* Column header */}
      <div className="grid gap-3 px-4 h-10 items-center rounded-t-[15px]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, background: T.card, borderBottom: `1px solid ${T.border}` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-2.5" style={{ width: i === 0 ? "40%" : "55%" }} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid gap-3 px-4 py-3.5 items-center even:bg-[rgba(89,82,54,0.02)]" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, borderBottom: r < rows - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
          <div className="flex items-center gap-3 min-w-0">
            <Skeleton className="w-9 h-9 rounded-[11px] shrink-0" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3" style={{ width: "60%" }} />
              <Skeleton className="h-2.5" style={{ width: "40%" }} />
            </div>
          </div>
          {Array.from({ length: cols - 1 }).map((_, c) => (
            <Skeleton key={c} className="h-3" style={{ width: `${45 + ((r + c) % 3) * 12}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

/* Generic card loading state */
export function CardSkeleton({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  return (
    <div className={`rounded-[16px] p-5 ${className}`} style={{ background: T.card, border: `1px solid ${T.borderSoft}`, boxShadow: T.shadow }}>
      <Skeleton className="h-3.5 mb-4" style={{ width: "35%" }} />
      <div className="space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3" style={{ width: `${90 - i * 12}%` }} />
        ))}
      </div>
    </div>
  );
}
