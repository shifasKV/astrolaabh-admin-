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
      <div className="py-10 text-center text-[13.5px]" style={{ color: T.muted }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13.5px]">
        <thead>
          <tr style={{ borderBottom: `1px solid ${T.border}`, background: "rgba(89,82,54,0.035)" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-[11px] tracking-[0.07em] uppercase font-semibold py-2.5 px-3 text-left first:rounded-l-[8px] last:rounded-r-[8px]"
                style={{ color: T.muted, width: col.width, textAlign: col.align || "left" }}
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
              className={`${onRowClick ? "cursor-pointer hover:bg-[rgba(160,125,56,0.06)]" : ""} transition-colors`}
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="py-3.5 px-3 leading-snug"
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
