"use client";
import { T } from "@/lib/theme";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalItems, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between pt-4 mt-2" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
      <span className="text-[11.5px]" style={{ color: T.faint }}>
        Page {page + 1} of {totalPages} · {totalItems} results
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
          className="text-[11.5px] px-3 py-1.5 rounded-[9px] transition-all duration-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:brightness-125"
          style={{ border: `1px solid ${T.border}`, color: T.text }}
        >
          ← Prev
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
          className="text-[11.5px] px-3 py-1.5 rounded-[9px] transition-all duration-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:brightness-125"
          style={{ border: `1px solid ${T.border}`, color: T.text }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
