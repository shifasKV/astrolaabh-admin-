"use client";
import { T } from "@/lib/theme";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalItems, perPage = 8, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const displayPage = page + 1;
  const first = page * perPage + 1;
  const last = Math.min((page + 1) * perPage, totalItems);

  const btnClass = "w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-[12px]" style={{ color: T.faint }}>
        Showing {first}–{last} of {totalItems}
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(0)} disabled={page === 0} className={btnClass} style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>«</button>
        <button onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0} className={btnClass} style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>‹</button>
        {Array.from({ length: totalPages }).map((_, i) => {
          if (totalPages > 7 && Math.abs(i - page) > 2 && i !== 0 && i !== totalPages - 1) {
            if (i === page - 3 || i === page + 3) return <span key={i} className="w-6 text-center text-[11px]" style={{ color: T.faint }}>…</span>;
            return null;
          }
          return (
            <button key={i} onClick={() => onPageChange(i)} className={`${btnClass} font-medium`} style={{ background: i === page ? T.accent : T.panel, border: `1px solid ${i === page ? T.accent : T.borderSoft}`, color: i === page ? T.accentInk : T.text }}>{i + 1}</button>
          );
        })}
        <button onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className={btnClass} style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>›</button>
        <button onClick={() => onPageChange(totalPages - 1)} disabled={page >= totalPages - 1} className={btnClass} style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>»</button>
      </div>
    </div>
  );
}
