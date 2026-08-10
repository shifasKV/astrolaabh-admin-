"use client";
import { T, INPUT_CLASS, INPUT_STYLE } from "@/lib/theme";
import { Select } from "./Input";

interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface SearchFilterProps {
  search: string;
  onSearchChange: (val: string) => void;
  placeholder?: string;
  filters?: FilterOption[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
}

export function SearchFilter({
  search,
  onSearchChange,
  placeholder = "Search…",
  filters,
  filterValues,
  onFilterChange,
}: SearchFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative flex-1 min-w-[200px]">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: T.faint }}
        >
          <circle cx="11" cy="11" r="7" strokeWidth="1.5" />
          <path d="m16 16 4 4" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className={`${INPUT_CLASS} !pl-9`}
          style={INPUT_STYLE}
        />
      </div>
      {filters?.map((f) => (
        <Select
          key={f.key}
          value={filterValues?.[f.key] ?? ""}
          onChange={(val) => onFilterChange?.(f.key, val)}
          placeholder={f.label}
          compact
          options={[
            { value: "", label: f.label },
            ...f.options,
          ]}
          className="w-[160px]"
        />
      ))}
    </div>
  );
}
