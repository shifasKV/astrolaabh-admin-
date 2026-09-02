"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PageHeader,
  Card,
  Chip,
  GoldBtn,
  Pagination,
  ToolbarSearch,
  InlineFilter,
  MultiCheck,
  SortMenu,
  EmptyState,
  TableSkeleton,
  MobileListCard,
  Monogram,
  MobileToolbar,
  SheetSection,
  MobileFab,
  DateRangePanel,
} from "@/components/ui";
import { T } from "@/lib/theme";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import { useAuth } from "@/lib/store/auth";
import { useLeads, type ApprovalStatus } from "@/lib/store/leads";
import { inr } from "@/lib/types";

const STONE_COMMISSION_RATE = 0.08;
const PER_PAGE = 10;

const APPROVAL_CHIP: Record<ApprovalStatus, { tone: "gold" | "good" | "muted" | "danger" | "info"; label: string }> = {
  pending: { tone: "gold", label: "Awaiting admin review" },
  approved: { tone: "good", label: "Admin approved" },
  completed: { tone: "good", label: "Completed" },
  on_hold: { tone: "info", label: "On hold" },
  rejected: { tone: "danger", label: "Rejected" },
};

const STATUS_OPTIONS = [
  { value: "pending", label: "Awaiting admin review" },
  { value: "approved", label: "Admin approved" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
  { value: "rejected", label: "Rejected" },
];

const STONE_TYPE_OPTIONS = [
  { value: "pukhraj", label: "Pukhraj (Yellow Sapphire)" },
  { value: "neelam", label: "Neelam (Blue Sapphire)" },
  { value: "manik", label: "Manik (Ruby)" },
  { value: "panna", label: "Panna (Emerald)" },
  { value: "heera", label: "Heera (Diamond)" },
  { value: "moonga", label: "Moonga (Coral)" },
  { value: "moti", label: "Moti (Pearl)" },
  { value: "gomed", label: "Gomed (Hessonite)" },
  { value: "lehsunia", label: "Lehsunia (Cat's Eye)" },
];

const STONE_TYPE_MATCH: Record<string, string[]> = {
  pukhraj: ["pukhraj", "yellow sapphire"],
  neelam: ["neelam", "blue sapphire"],
  manik: ["manik", "ruby"],
  panna: ["panna", "emerald"],
  heera: ["heera", "diamond"],
  moonga: ["moonga", "coral"],
  moti: ["moti", "pearl"],
  gomed: ["gomed", "hessonite"],
  lehsunia: ["lehsunia", "cat's eye", "cats eye"],
};

const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "amount_high", label: "Amount: high to low" },
  { value: "amount_low", label: "Amount: low to high" },
];

const F_ICONS = {
  status: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M3 5h18l-7 8v6l-4-2v-4z" /></svg>,
  date: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  stone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M20.6 13.4 12 22l-9-9V4h9z" /><circle cx="7.5" cy="7.5" r="1.3" /></svg>,
};

type SortKey = "date_desc" | "date_asc" | "amount_high" | "amount_low";

function matchesStoneType(summary: string, types: string[]): boolean {
  if (types.length === 0) return true;
  const lower = summary.toLowerCase();
  return types.some((t) => (STONE_TYPE_MATCH[t] ?? [t]).some((kw) => lower.includes(kw)));
}

export default function ExpertOrdersPage() {
  const loading = useSimulatedLoad();
  const { user } = useAuth();
  const myId = user?.id;
  const { pendingApprovals, reviewedFulfillments, markReviewSeen } = useLeads();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterStoneType, setFilterStoneType] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [page, setPage] = useState(1);

  const mySubmissions = useMemo(() => {
    const all = [...pendingApprovals, ...reviewedFulfillments].filter((r) => r.fulfillment.submittedBy === myId);
    return all.sort((a, b) => +new Date(b.fulfillment.submittedAt) - +new Date(a.fulfillment.submittedAt));
  }, [pendingApprovals, reviewedFulfillments, myId]);

  useEffect(() => {
    for (const r of mySubmissions) {
      if (r.fulfillment.approval !== "pending") markReviewSeen(r.id, r.fulfillment.reviewedAt);
    }
  }, [mySubmissions, markReviewSeen]);

  const filtered = useMemo(() => {
    return mySubmissions
      .filter((r) => {
        const f = r.fulfillment;
        if (filterStatus.length > 0 && !filterStatus.includes(f.approval)) return false;
        if (!matchesStoneType(f.summary, filterStoneType)) return false;
        const d = f.submittedAt.slice(0, 10);
        if (filterDateFrom && d < filterDateFrom) return false;
        if (filterDateTo && d > filterDateTo) return false;
        if (search) {
          const q = search.toLowerCase();
          if (
            !r.customerName.toLowerCase().includes(q) &&
            !f.summary.toLowerCase().includes(q) &&
            !r.id.toLowerCase().includes(q)
          ) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === "amount_high") return b.fulfillment.total - a.fulfillment.total;
        if (sort === "amount_low") return a.fulfillment.total - b.fulfillment.total;
        const da = +new Date(a.fulfillment.submittedAt);
        const db = +new Date(b.fulfillment.submittedAt);
        return sort === "date_asc" ? da - db : db - da;
      });
  }, [mySubmissions, filterStatus, filterStoneType, filterDateFrom, filterDateTo, search, sort]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const hasActiveFilters = filterStatus.length > 0 || filterStoneType.length > 0 || !!filterDateFrom || !!filterDateTo;

  const clearFilters = () => {
    setFilterStatus([]);
    setFilterStoneType([]);
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(1);
  };

  const commissionFor = (approval: ApprovalStatus, total: number) =>
    approval === "approved" || approval === "completed" ? Math.round(total * STONE_COMMISSION_RATE) : 0;

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
        <PageHeader
          title="Orders"
          action={<Link href="/expert-orders/create" className="hidden sm:block"><GoldBtn>+ Create order</GoldBtn></Link>}
        />

        {mySubmissions.length === 0 && !loading ? (
          <Card className="!p-10 text-center">
            <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ background: T.accentFaint, color: T.accent }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6"><path d="M5 8.5h14l-1.2 11a1.8 1.8 0 0 1-1.8 1.6H8a1.8 1.8 0 0 1-1.8-1.6z" strokeLinejoin="round" /><path d="M9 10.5V6.8a3 3 0 0 1 6 0v3.7" strokeLinecap="round" /></svg>
            </div>
            <div className="text-[15px] font-semibold mt-3" style={{ color: T.text }}>No orders yet</div>
            <p className="text-[12.5px] mt-1 max-w-[340px] mx-auto" style={{ color: T.muted }}>Place an order for a customer after a consultation. It goes to the admin team for approval before it is confirmed.</p>
            <div className="mt-5"><Link href="/expert-orders/create"><GoldBtn>+ Create order</GoldBtn></Link></div>
          </Card>
        ) : (
          <>
            <div className="sticky top-0 z-30 -mx-5 md:-mx-10 px-5 md:px-10 pt-1 pb-1 mb-1" style={{ background: T.bg }}>
              <MobileToolbar
                className="sm:hidden mb-3"
                filterCount={(filterStatus.length ? 1 : 0) + (filterStoneType.length ? 1 : 0) + (filterDateFrom || filterDateTo ? 1 : 0)}
                onClearAll={clearFilters}
                search={search}
                onSearch={(v) => { setSearch(v); setPage(1); }}
                searchPlaceholder="Search orders, customers…"
                sort={<SortMenu value={sort} onChange={(v) => { setSort(v as SortKey); setPage(1); }} options={SORT_OPTIONS} />}
                filters={
                  <>
                    <SheetSection label="Status">
                      <MultiCheck options={STATUS_OPTIONS} value={filterStatus} onChange={(v) => { setFilterStatus(v); setPage(1); }} />
                    </SheetSection>
                    <SheetSection label="Date">
                      <DateRangePanel from={filterDateFrom} to={filterDateTo} onChange={(f, t) => { setFilterDateFrom(f); setFilterDateTo(t); setPage(1); }} />
                    </SheetSection>
                    <SheetSection label="Stone type">
                      <MultiCheck options={STONE_TYPE_OPTIONS} value={filterStoneType} onChange={(v) => { setFilterStoneType(v); setPage(1); }} />
                    </SheetSection>
                  </>
                }
              />

              <div className="hidden sm:flex flex-wrap items-center gap-2 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <div className="flex flex-wrap items-center gap-2">
                  <InlineFilter label="Status" icon={F_ICONS.status} count={filterStatus.length}>
                    <MultiCheck options={STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} onAfter={() => setPage(1)} />
                  </InlineFilter>
                  <InlineFilter label="Date" icon={F_ICONS.date} count={filterDateFrom || filterDateTo ? 1 : 0} width={440}>
                    <DateRangePanel from={filterDateFrom} to={filterDateTo} onChange={(f, t) => { setFilterDateFrom(f); setFilterDateTo(t); setPage(1); }} />
                  </InlineFilter>
                  <InlineFilter label="Stone type" icon={F_ICONS.stone} count={filterStoneType.length}>
                    <MultiCheck options={STONE_TYPE_OPTIONS} value={filterStoneType} onChange={setFilterStoneType} onAfter={() => setPage(1)} />
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
                  <ToolbarSearch value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search orders, customers…" />
                  <SortMenu value={sort} onChange={(v) => { setSort(v as SortKey); setPage(1); }} options={SORT_OPTIONS} />
                </div>
              </div>
            </div>

            <Card className="!p-0 md:flex md:flex-col md:min-h-0">
              {loading ? (
                <TableSkeleton cols={5} rows={8} />
              ) : (
                <>
                  <div
                    className="hidden sm:grid grid-cols-[1fr_100px_200px_100px_110px] gap-3 items-center px-4 h-10 text-[11px] font-medium tracking-[0.06em] uppercase sticky top-0 z-10 rounded-t-[15px]"
                    style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
                  >
                    <span>Order details</span>
                    <span>Created</span>
                    <span>Order status</span>
                    <span className="text-right">Commission</span>
                    <span className="text-right">Amount</span>
                  </div>
                  <div className="md:flex-1 md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">
                    {paginated.length === 0 ? (
                      <EmptyState inline icon="search" title="No orders" description="Try a different search or clear the filters." />
                    ) : (
                      paginated.map((r, idx) => {
                        const f = r.fulfillment;
                        const st = APPROVAL_CHIP[f.approval];
                        const commission = commissionFor(f.approval, f.total);
                        return (
                          <div key={r.id} className="group">
                            <MobileListCard
                              className="sm:hidden"
                              leading={<Monogram name={r.customerName} />}
                              title={r.customerName}
                              sub={f.summary}
                              right={inr(f.total)}
                              status={{ label: st.label, tone: st.tone, extra: commission > 0 ? inr(commission) : undefined }}
                              time={f.submittedAt}
                            />
                            <div
                              className="hidden sm:grid sm:grid-cols-[1fr_100px_200px_100px_110px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors duration-150 hover:!bg-[rgba(119,123,98,0.08)]"
                              style={{ borderBottom: idx < paginated.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                            >
                              <div className="min-w-0">
                                <span className="text-[13px] font-semibold truncate block" style={{ color: T.text }}>{r.customerName}</span>
                                <div className="text-[12px] truncate mt-px" style={{ color: T.muted }}>{f.summary}</div>
                              </div>
                              <span className="text-[12px] tabular-nums" style={{ color: T.muted }}>
                                {new Date(f.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                              <div>
                                <Chip tone={st.tone}>{st.label}</Chip>
                              </div>
                              <span className="text-[13px] tabular-nums text-right" style={{ color: commission > 0 ? T.accent : T.faint }}>
                                {commission > 0 ? inr(commission) : "—"}
                              </span>
                              <span className="text-[13px] font-semibold tabular-nums text-right" style={{ color: T.text }}>
                                {inr(f.total)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </Card>

            <Pagination
              page={currentPage - 1}
              totalPages={totalPages}
              totalItems={filtered.length}
              perPage={PER_PAGE}
              onPageChange={(p) => setPage(p + 1)}
            />
          </>
        )}
      </div>

      <MobileFab href="/expert-orders/create" label="New order" />
    </>
  );
}
