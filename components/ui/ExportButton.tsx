"use client";
import { useState } from "react";
import { T } from "@/lib/theme";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  filename?: string;
  className?: string;
}

function toCsv(data: Record<string, unknown>[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = String(row[h] ?? "");
      return val.includes(",") || val.includes('"') || val.includes("\n")
        ? `"${val.replace(/"/g, '""')}"`
        : val;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export function ExportButton({ data, filename = "export", className = "" }: ExportButtonProps) {
  const [done, setDone] = useState(false);

  const handleExport = () => {
    if (data.length === 0) return;
    const csv = toCsv(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12px] font-medium transition-all hover:bg-[rgba(89,82,54,0.06)] active:scale-[0.97] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{ border: `1px solid ${T.border}`, color: T.muted }}
    >
      {done ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.good} strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          Exported
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export
        </>
      )}
    </button>
  );
}
