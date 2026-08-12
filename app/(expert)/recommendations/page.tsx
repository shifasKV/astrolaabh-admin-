"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, SearchFilter, Select } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_STONE_RECOMMENDATIONS, MOCK_CONSULTATIONS, MOCK_ORDERS } from "@/lib/mock";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "needs_clarification", label: "Needs clarification" },
  { value: "converted_to_order", label: "Converted to order" },
];

type SortKey = "newest" | "oldest";
const PER_PAGE = 5;

export default function RecommendationsPage() {
  const [search, setSearch] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterStone, setFilterStone] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);

  const consultationMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of MOCK_CONSULTATIONS) {
      map.set(c.id, c.scheduledAt);
    }
    return map;
  }, []);

  const orderMap = useMemo(() => {
    const map = new Map<string, { id: string; placedAt: string }>();
    for (const o of MOCK_ORDERS) {
      if (o.recommendationId) map.set(o.recommendationId, { id: o.id, placedAt: o.placedAt });
    }
    return map;
  }, []);

  const uniqueCustomers = useMemo(
    () => [...new Set(MOCK_STONE_RECOMMENDATIONS.map((r) => r.customerName))].sort(),
    [],
  );

  const uniqueStones = useMemo(
    () => [...new Set(MOCK_STONE_RECOMMENDATIONS.map((r) => r.gemstone))].sort(),
    [],
  );

  const filtered = useMemo(() => {
    return MOCK_STONE_RECOMMENDATIONS
      .filter((r) => {
        if (filterCustomer && r.customerName !== filterCustomer) return false;
        if (filterStone && r.gemstone !== filterStone) return false;
        if (filterStatus && r.status !== filterStatus) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !r.customerName.toLowerCase().includes(q) &&
            !r.gemstone.toLowerCase().includes(q) &&
            !r.id.toLowerCase().includes(q)
          ) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const da = new Date(consultationMap.get(a.consultationId) ?? a.createdAt).getTime();
        const db = new Date(consultationMap.get(b.consultationId) ?? b.createdAt).getTime();
        return sort === "newest" ? db - da : da - db;
      });
  }, [filterCustomer, filterStone, filterStatus, search, sort, consultationMap]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const hasActiveFilters = !!filterCustomer || !!filterStone || !!filterStatus;

  const statusTone = (s: string) => {
    if (s === "converted_to_order" || s === "approved") return "good" as const;
    if (s === "submitted" || s === "shared") return "gold" as const;
    if (s === "rejected" || s === "needs_clarification") return "danger" as const;
    return "muted" as const;
  };

  const fmtDate = (iso: string) => {
    const dt = new Date(iso);
    return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <>
      <PageHeader title="Recommendations" sub="Stone recommendations — track status through to order conversion" />

      {/* Search */}
      <div className="mb-3">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search customer, gemstone, ID…" />
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="w-[200px]">
          <Select
            value={filterCustomer}
            onChange={(v) => { setFilterCustomer(v); setPage(1); }}
            searchable
            compact
            placeholder="All customers"
            options={[
              { value: "", label: "All customers" },
              ...uniqueCustomers.map((name) => ({ value: name, label: name })),
            ]}
          />
        </div>

        <div className="w-[220px]">
          <Select
            value={filterStone}
            onChange={(v) => { setFilterStone(v); setPage(1); }}
            searchable
            compact
            placeholder="All stones"
            options={[
              { value: "", label: "All stones" },
              ...uniqueStones.map((name) => ({ value: name, label: name })),
            ]}
          />
        </div>

        <div className="w-[200px]">
          <Select
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setPage(1); }}
            compact
            placeholder="All statuses"
            options={STATUS_OPTIONS}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterCustomer(""); setFilterStone(""); setFilterStatus(""); setPage(1); }}
              className="text-[11px] px-2.5 py-1.5 rounded-[7px] cursor-pointer transition-opacity hover:opacity-80"
              style={{ color: T.danger, background: "rgba(176,84,84,0.08)", border: "1px solid rgba(176,84,84,0.15)" }}
            >
              Clear filters
            </button>
          )}
          <div className="w-[200px]">
            <Select
              value={sort}
              onChange={(v) => { setSort(v as SortKey); setPage(1); }}
              compact
              prefix="Sort: "
              options={[
                { value: "newest", label: "Newest scheduled" },
                { value: "oldest", label: "Oldest scheduled" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <Card>
        {/* Column headers */}
        <div
          className="hidden sm:grid items-center gap-4 pb-3 mb-1"
          style={{ gridTemplateColumns: "1.4fr 1fr 0.8fr 0.8fr 1fr", borderBottom: `1px solid ${T.border}` }}
        >
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Stone details</div>
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Customer</div>
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Appointment date</div>
          <div className="text-[11px] tracking-[0.08em] uppercase" style={{ color: T.faint }}>Status</div>
          <div className="text-[11px] tracking-[0.08em] uppercase text-right" style={{ color: T.faint }}>Order info</div>
        </div>

        {paginated.length === 0 ? (
          <p className="text-[13.5px] text-center py-6" style={{ color: T.muted }}>No recommendations match your filters.</p>
        ) : (
          paginated.map((r) => {
            const appointmentDate = consultationMap.get(r.consultationId);
            const order = orderMap.get(r.id);

            return (
              <Link
                key={r.id}
                href={`/appointments/${r.consultationId}`}
                className="grid items-center gap-4 py-3.5 transition-colors hover:bg-white/[0.02] -mx-5 px-5 cursor-pointer"
                style={{ borderBottom: `1px solid ${T.borderSoft}`, gridTemplateColumns: "1.4fr 1fr 0.8fr 0.8fr 1fr", textDecoration: "none" }}
              >
                {/* Stone details */}
                <div className="min-w-0">
                  <div className="text-[14px] font-medium" style={{ color: T.text }}>{r.gemstone}</div>
                </div>

                {/* Customer */}
                <div className="min-w-0">
                  <div className="text-[13.5px] font-medium" style={{ color: T.text }}>{r.customerName}</div>
                </div>

                {/* Appointment date */}
                <div className="shrink-0">
                  {appointmentDate ? (
                    <div className="text-[13.5px] tabular-nums" style={{ color: T.text }}>{fmtDate(appointmentDate)}</div>
                  ) : (
                    <span className="text-[12px]" style={{ color: T.faint }}>—</span>
                  )}
                </div>

                {/* Status */}
                <div>
                  <Chip tone={statusTone(r.status)}>{r.status.replace(/_/g, " ")}</Chip>
                </div>

                {/* Order info */}
                <div className="text-right min-w-0">
                  {order ? (
                    <>
                      <div className="text-[13.5px] font-medium" style={{ color: T.accent }}>{order.id}</div>
                      <div className="text-[12px] mt-0.5 tabular-nums" style={{ color: T.muted }}>
                        Ordered {fmtDate(order.placedAt)}
                      </div>
                    </>
                  ) : (
                    <span className="text-[12px]" style={{ color: T.faint }}>—</span>
                  )}
                </div>
              </Link>
            );
          })
        )}

      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-[12px]" style={{ color: T.faint }}>
            Showing {(currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} of {filtered.length}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={currentPage === 1} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>«</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>‹</button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              if (totalPages > 7 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
                if (p === currentPage - 3 || p === currentPage + 3) return <span key={p} className="w-6 text-center text-[11px]" style={{ color: T.faint }}>…</span>;
                return null;
              }
              return (
                <button key={p} onClick={() => setPage(p)} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] font-medium transition-all cursor-pointer" style={{ background: p === currentPage ? T.accent : T.panel, border: `1px solid ${p === currentPage ? T.accent : T.borderSoft}`, color: p === currentPage ? T.accentInk : T.text }}>{p}</button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>›</button>
            <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed" style={{ background: T.popover, border: `1px solid ${T.borderSoft}`, color: T.muted }}>»</button>
          </div>
        </div>
      )}
    </>
  );
}
