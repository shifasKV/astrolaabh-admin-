"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Select, Pagination, ToolbarSearch, FiltersPopover, FilterField, SortMenu, TableSkeleton, MobileListCard } from "@/components/ui";
import { T } from "@/lib/theme";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
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
  const loading = useSimulatedLoad();
  const [search, setSearch] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterStone, setFilterStone] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

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
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <PageHeader title="Recommendations" />

      {/* Toolbar — filters left, search + sort right */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <FiltersPopover
          align="left"
          count={[filterCustomer, filterStone, filterStatus].filter(Boolean).length}
          open={showFilters}
          onToggle={() => setShowFilters(!showFilters)}
        >
          <FilterField label="Customer">
            <Select value={filterCustomer} onChange={(v) => { setFilterCustomer(v); setPage(1); }} searchable compact placeholder="All customers" options={[{ value: "", label: "All customers" }, ...uniqueCustomers.map((n) => ({ value: n, label: n }))]} />
          </FilterField>
          <FilterField label="Stone">
            <Select value={filterStone} onChange={(v) => { setFilterStone(v); setPage(1); }} searchable compact placeholder="All stones" options={[{ value: "", label: "All stones" }, ...uniqueStones.map((n) => ({ value: n, label: n }))]} />
          </FilterField>
          <FilterField label="Status">
            <Select value={filterStatus} onChange={(v) => { setFilterStatus(v); setPage(1); }} compact placeholder="All statuses" options={STATUS_OPTIONS} />
          </FilterField>
          {hasActiveFilters && (
            <div className="pt-1" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
              <button onClick={() => { setFilterCustomer(""); setFilterStone(""); setFilterStatus(""); setPage(1); }} className="text-[12px] font-medium cursor-pointer hover:underline underline-offset-4" style={{ color: T.danger }}>Clear all filters</button>
            </div>
          )}
        </FiltersPopover>
        <div className="ml-auto flex items-center gap-2">
          <ToolbarSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search customer, gemstone, ID…" />
          <SortMenu
            value={sort}
            onChange={(v) => { setSort(v as SortKey); setPage(1); }}
            options={[
              { value: "newest", label: "Newest scheduled" },
              { value: "oldest", label: "Oldest scheduled" },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <Card className="!p-0 md:min-h-0 md:overflow-y-auto">
        {loading ? <TableSkeleton cols={5} rows={8} /> : <>
        {/* Column headers */}
        <div
          className="hidden sm:grid items-center gap-4 px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]"
          style={{ gridTemplateColumns: "1.4fr 1fr 0.9fr 0.9fr 1fr", color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
        >
          <span>Stone</span>
          <span>Customer</span>
          <span>Appointment</span>
          <span>Status</span>
          <span className="text-right">Order</span>
        </div>

        {paginated.length === 0 ? (
          <p className="text-[13.5px] text-center py-6" style={{ color: T.muted }}>No recommendations match your filters.</p>
        ) : (
          paginated.map((r, i) => {
            const appointmentDate = consultationMap.get(r.consultationId);
            const order = orderMap.get(r.id);

            return (
              <div key={r.id} className="group">
              <MobileListCard
                className="sm:hidden"
                href={`/appointments/${r.consultationId}`}
                title={r.customerName}
                sub={r.gemstone}
                rightSub={appointmentDate ? fmtDate(appointmentDate) : undefined}
                chips={<Chip tone={statusTone(r.status)}>{r.status.replace(/_/g, " ")}</Chip>}
                facts={order ? [{ label: "Order", value: order.id }] : undefined}
              />
              <Link
                href={`/appointments/${r.consultationId}`}
                className={`hidden sm:grid items-center gap-4 px-4 py-2.5 transition-colors cursor-pointer ${i % 2 === 0 ? "bg-[rgba(89,82,54,0.025)]" : ""} hover:!bg-[rgba(119,123,98,0.08)] group-last:rounded-b-[15px]`}
                style={{ borderBottom: `1px solid ${T.borderSoft}`, gridTemplateColumns: "1.4fr 1fr 0.9fr 0.9fr 1fr", textDecoration: "none" }}
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
              </div>
            );
          })
        )}
        </>}

      </Card>

      <Pagination page={currentPage - 1} totalPages={totalPages} totalItems={filtered.length} perPage={PER_PAGE} onPageChange={(p) => setPage(p + 1)} />
      </div>
    </>
  );
}
