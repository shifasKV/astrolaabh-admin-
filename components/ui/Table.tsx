"use client";
import { T } from "@/lib/theme";

interface Column<R> {
  key: string;
  label: string;
  render?: (row: R) => React.ReactNode;
  width?: string;
  align?: "left" | "right" | "center";
}

interface TableProps<R> {
  columns: Column<R>[];
  data: R[];
  keyField: keyof R;
  onRowClick?: (row: R) => void;
  emptyMessage?: string;
}

export function Table<R extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  onRowClick,
  emptyMessage = "No data",
}: TableProps<R>) {
  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-[13px]" style={{ color: T.muted }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.border}` }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-[10px] tracking-[0.08em] uppercase font-medium py-3 px-3 text-left"
                style={{ color: T.faint, width: col.width, textAlign: col.align || "left" }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={String(row[keyField])}
              onClick={() => onRowClick?.(row)}
              className={`${onRowClick ? "cursor-pointer hover:brightness-110" : ""} transition-colors`}
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="py-3 px-3"
                  style={{ color: T.text, textAlign: col.align || "left" }}
                >
                  {col.render ? col.render(row) : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
