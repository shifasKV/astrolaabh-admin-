"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Pagination, ToolbarSearch, InlineFilter, MultiCheck, SortMenu, TableSkeleton, MobileListCard, Monogram, MobileToolbar, SheetSection, EmptyState } from "@/components/ui";
import { T } from "@/lib/theme";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import { MOCK_STONE_RECOMMENDATIONS, MOCK_ORDERS, MOCK_PAYMENTS } from "@/lib/mock";
import { inr } from "@/lib/types";
import type { StoneRecommendation } from "@/lib/types";

const EXPERT_ID = "usr_expert_01";
const STONE_COMMISSION_RATE = 0.08;

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "needs_clarification", label: "Needs clarification" },
  { value: "converted_to_order", label: "Converted to order" },
];

const F_ICONS = {
  status: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M3 5h18l-7 8v6l-4-2v-4z" /></svg>,
  stone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20.6 13.4 12 22l-9-9V4h9z" /><circle cx="7.5" cy="7.5" r="1.3" /></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></svg>,
};

type SortKey = "newest" | "oldest";
const PER_PAGE = 8;

function getEstimatedPrice(rec: StoneRecommendation): number | null {
  if (rec.orderId) {
    const order = MOCK_ORDERS.find((o) => o.id === rec.orderId);
    if (order) return order.total;
  }
  const payment = MOCK_PAYMENTS.find((p) => p.linkedRecommendationId === rec.id);
  if (payment) return payment.amount;
  return null;
}

function recommendationStatusLabel(r: StoneRecommendation): string {
  if (r.status === "converted_to_order") return "Converted to order";
  return r.status.replace(/_/g, " ").replace(/^./, (ch) => ch.toUpperCase());
}

export default function RecommendationsPage() {
  const loading = useSimulatedLoad();
  const [search, setSearch] = useState("");
  const [filterCustomer, setFilterCustomer] = useState<string[]>([]);
  const [filterStone, setFilterStone] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("newest");
  const [page, setPage] = useState(1);

  const myRecommendations = useMemo(
    () => MOCK_STONE_RECOMMENDATIONS.filter((r) => r.expertId === EXPERT_ID),
    [],
  );

  const uniqueCustomers = useMemo(
    () => [...new Set(myRecommendations.map((r) => r.customerName))].sort(),
    [myRecommendations],
  );

  const uniqueStones = useMemo(
    () => [...new Set(myRecommendations.map((r) => r.gemstone))].sort(),
    [myRecommendations],
  );

  const filtered = useMemo(() => {
    return myRecommendations
      .filter((r) => {
        if (filterCustomer.length > 0 && !filterCustomer.includes(r.customerName)) return false;
        if (filterStone.length > 0 && !filterStone.includes(r.gemstone)) return false;
        if (filterStatus.length > 0 && !filterStatus.includes(r.status)) return false;
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
        const da = new Date(a.createdAt).getTime();
        const db = new Date(b.createdAt).getTime();
        return sort === "newest" ? db - da : da - db;
      });
  }, [myRecommendations, filterCustomer, filterStone, filterStatus, search, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const hasActiveFilters = filterCustomer.length > 0 || filterStone.length > 0 || filterStatus.length > 0;

  const clearFilters = () => {
    setFilterCustomer([]);
    setFilterStone([]);
    setFilterStatus([]);
    setPage(1);
  };

  const statusTone = (s: string) => {
    if (s === "converted_to_order" || s === "approved") return "good" as const;
    if (s === "submitted" || s === "shared") return "gold" as const;
    if (s === "rejected" || s === "needs_clarification") return "danger" as const;
    return "muted" as const;
  };

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <PageHeader title="Recommendations" />

      <MobileToolbar
        className="sm:hidden mb-3"
        filterCount={filterCustomer.length + filterStone.length + filterStatus.length}
        onClearAll={clearFilters}
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search gemstone, customer…"
        sort={<SortMenu
          value={sort}
          onChange={(v) => { setSort(v as SortKey); setPage(1); }}
          options={[
            { value: "newest", label: "Newest first" },
            { value: "oldest", label: "Oldest first" },
          ]}
        />}
        filters={
          <>
            <SheetSection label="Customer">
              <MultiCheck options={uniqueCustomers.map((n) => ({ value: n, label: n }))} value={filterCustomer} onChange={(v) => { setFilterCustomer(v); setPage(1); }} />
            </SheetSection>
            <SheetSection label="Stone">
              <MultiCheck options={uniqueStones.map((n) => ({ value: n, label: n }))} value={filterStone} onChange={(v) => { setFilterStone(v); setPage(1); }} />
            </SheetSection>
            <SheetSection label="Status">
              <MultiCheck options={STATUS_OPTIONS} value={filterStatus} onChange={(v) => { setFilterStatus(v); setPage(1); }} />
            </SheetSection>
          </>
        }
      />

      <div className="hidden sm:flex flex-wrap items-center gap-2 pt-4 mb-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
        <div className="flex flex-wrap items-center gap-2">
          <InlineFilter label="Status" icon={F_ICONS.status} count={filterStatus.length}>
            <MultiCheck options={STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} onAfter={() => setPage(1)} />
          </InlineFilter>
          <InlineFilter label="Stone" icon={F_ICONS.stone} count={filterStone.length}>
            <MultiCheck options={uniqueStones.map((n) => ({ value: n, label: n }))} value={filterStone} onChange={setFilterStone} onAfter={() => setPage(1)} />
          </InlineFilter>
          <InlineFilter label="Customer" icon={F_ICONS.user} count={filterCustomer.length} width={220}>
            <MultiCheck options={uniqueCustomers.map((n) => ({ value: n, label: n }))} value={filterCustomer} onChange={setFilterCustomer} onAfter={() => setPage(1)} />
          </InlineFilter>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-[12px] font-medium px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap"
              style={{ color: T.danger }}
            >
              Clear all
            </button>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ToolbarSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search gemstone, customer…" />
          <SortMenu
            value={sort}
            onChange={(v) => { setSort(v as SortKey); setPage(1); }}
            options={[
              { value: "newest", label: "Newest first" },
              { value: "oldest", label: "Oldest first" },
            ]}
          />
        </div>
      </div>

      <Card className="!p-0 md:flex md:flex-col md:min-h-0">
        {loading ? <TableSkeleton cols={6} rows={8} /> : (
          <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none flex-1">
            <div
              className="hidden sm:grid grid-cols-[1fr_130px_100px_100px_120px_120px] gap-3 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]"
              style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <span>Stone</span>
              <span>Customer</span>
              <span className="text-right">Price</span>
              <span className="text-right">Commission</span>
              <span>Recommended</span>
              <span>Status</span>
            </div>

            {paginated.length === 0 ? (
              <EmptyState inline icon="search" title="No recommendations" description="No recommendations match your filters." />
            ) : (
              paginated.map((r) => {
                const price = getEstimatedPrice(r);
                const recComm = price != null && r.status === "converted_to_order"
                  ? Math.round(price * STONE_COMMISSION_RATE)
                  : 0;

                return (
                  <div key={r.id} className="group">
                    <MobileListCard
                      className="sm:hidden"
                      href={`/appointments/${r.consultationId}`}
                      leading={<Monogram name={r.customerName} />}
                      title={r.gemstone}
                      sub={`${r.customerName}${r.weightRange ? ` · ${r.weightRange}` : ""}`}
                      right={recComm > 0 ? inr(recComm) : price != null ? inr(price) : undefined}
                      status={{
                        label: recommendationStatusLabel(r),
                        tone: statusTone(r.status),
                      }}
                      time={r.createdAt}
                    />
                    <Link
                      href={`/appointments/${r.consultationId}`}
                      className="group hidden sm:grid sm:grid-cols-[1fr_130px_100px_100px_120px_120px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors duration-150 even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)] last:rounded-b-[15px]"
                      style={{ borderBottom: `1px solid ${T.borderSoft}` }}
                    >
                      <div className="min-w-0">
                        <span className="text-[13.5px] font-medium group-hover:underline" style={{ color: T.accent }}>{r.gemstone}</span>
                        <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>{r.weightRange}</div>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[12px] truncate block" style={{ color: T.text }}>{r.customerName}</span>
                      </div>
                      <div className="min-w-0 text-right">
                        <span className="text-[12px] tabular-nums font-medium" style={{ color: T.text }}>{price != null ? inr(price) : "—"}</span>
                      </div>
                      <div className="min-w-0 text-right">
                        <span className="text-[12px] tabular-nums" style={{ color: recComm > 0 ? T.accent : T.faint }}>{recComm > 0 ? inr(recComm) : "—"}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[12px] tabular-nums" style={{ color: T.text }}>
                          {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/ (\d{4})$/, ", $1")}
                        </span>
                      </div>
                      <div>
                        <Chip tone={r.status === "converted_to_order" ? "good" : statusTone(r.status)}>
                          {recommendationStatusLabel(r)}
                        </Chip>
                      </div>
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        )}
      </Card>

      <Pagination page={currentPage - 1} totalPages={totalPages} totalItems={filtered.length} perPage={PER_PAGE} onPageChange={(p) => setPage(p + 1)} />
      </div>
    </>
  );
}
