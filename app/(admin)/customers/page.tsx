"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader, Card, StatCard, ToolbarSearch, SortMenu, InlineFilter, MultiCheck, GoldBtn, Chip, Pagination, EmptyState, TableSkeleton, MobileListCard, Monogram } from "@/components/ui";

const STATUS_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
const STATUS_OPTIONS = [{ value: "active", label: "Active" }, { value: "deactivated", label: "Deactivated" }];
// Demo: a couple of records shown as deactivated (customers have no status field in mock data)
const DEACTIVATED_CUSTOMERS = new Set(["cust_003", "cust_008"]);
const customerStatus = (id: string) => (DEACTIVATED_CUSTOMERS.has(id) ? "deactivated" : "active");
import { T } from "@/lib/theme";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import { MOCK_CUSTOMERS, MOCK_ORDERS, MOCK_CONSULTATIONS } from "@/lib/mock";
import { inr } from "@/lib/types";

const CUSTOMER_SORT = [
  { value: "name_asc", label: "Name A to Z" },
  { value: "orders_desc", label: "Most orders" },
  { value: "spent_desc", label: "Highest spend" },
  { value: "consults_desc", label: "Most consults" },
];

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name_asc");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const loading = useSimulatedLoad();

  const stats = useMemo(() => {
    const total = MOCK_CUSTOMERS.length;
    const withChart = MOCK_CUSTOMERS.filter((c) => c.chartRef).length;
    const withAffiliate = MOCK_CUSTOMERS.filter((c) => c.affiliateCode).length;
    const withOrders = new Set(MOCK_ORDERS.map((o) => o.customerId)).size;
    const withConsultations = new Set(MOCK_CONSULTATIONS.map((c) => c.customerId)).size;
    return { total, withChart, withAffiliate, withOrders, withConsultations };
  }, []);

  const activity = useMemo(() => {
    const map: Record<string, { orders: number; consults: number; spent: number }> = {};
    for (const c of MOCK_CUSTOMERS) map[c.id] = { orders: 0, consults: 0, spent: 0 };
    for (const o of MOCK_ORDERS) {
      const a = map[o.customerId];
      if (a) { a.orders += 1; a.spent += o.total; }
    }
    for (const cn of MOCK_CONSULTATIONS) {
      const a = map[cn.customerId];
      if (a) a.consults += 1;
    }
    return map;
  }, []);

  const filtered = MOCK_CUSTOMERS.filter((c) => {
    if (filterStatus.length && !filterStatus.includes(customerStatus(c.id))) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q) || c.birthPlace.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    const aa = activity[a.id] ?? { orders: 0, consults: 0, spent: 0 };
    const ba = activity[b.id] ?? { orders: 0, consults: 0, spent: 0 };
    if (sort === "orders_desc") return ba.orders - aa.orders;
    if (sort === "spent_desc") return ba.spent - aa.spent;
    if (sort === "consults_desc") return ba.consults - aa.consults;
    return a.name.localeCompare(b.name);
  });

  const PER_PAGE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = sorted.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <PageHeader
        title="Customer records"
        action={
          <Link href="/customers/create"><GoldBtn>+ Add customer</GoldBtn></Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total customers" value={stats.total} featured />
        <StatCard label="With chart" value={stats.withChart} />
        <StatCard label="With orders" value={stats.withOrders} />
        <StatCard label="With consultations" value={stats.withConsultations} />
        <StatCard label="Affiliate referred" value={stats.withAffiliate} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <InlineFilter label="Status" icon={STATUS_ICON} count={filterStatus.length} width={200}>
          <MultiCheck options={STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} onAfter={() => setPage(1)} />
        </InlineFilter>
        {filterStatus.length > 0 && (
          <button onClick={() => { setFilterStatus([]); setPage(1); }} className="text-[12px] font-medium px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap" style={{ color: T.danger }}>Clear all</button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <ToolbarSearch value={search} onChange={setSearch} placeholder="Search name, email, phone, location…" />
          <SortMenu value={sort} onChange={setSort} options={CUSTOMER_SORT} />
        </div>
      </div>

      <Card className="!p-0 md:flex md:flex-col md:min-h-0">
        {loading ? (
          <TableSkeleton cols={7} rows={8} />
        ) : (
        <>
        <div
          className="hidden md:grid grid-cols-[minmax(240px,1.4fr)_150px_minmax(140px,1fr)_90px_90px_120px_24px] gap-x-4 items-center px-4 h-10 rounded-t-[15px] text-[11px] tracking-[0.06em] uppercase font-medium"
          style={{ color: T.faint, borderBottom: `1px solid ${T.border}` }}
        >
          <span>Customer</span>
          <span>Phone</span>
          <span>Birth place</span>
          <span className="text-right">Orders</span>
          <span className="text-right">Consults</span>
          <span className="text-right">Total spent</span>
          <span />
        </div>
        <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">
        {paginated.map((c, i, arr) => {
          const a = activity[c.id] ?? { orders: 0, consults: 0, spent: 0 };
          return (
            <div key={c.id}>
            <MobileListCard
              className="md:hidden"
              href={`/customers/${c.id}`}
              leading={<Monogram name={c.name} />}
              title={c.name}
              right={a.spent ? inr(a.spent) : undefined}
              sub={c.email}
              status={customerStatus(c.id) === "deactivated" ? { label: "Deactivated", tone: "muted" } : undefined}
              facts={a.orders || a.consults ? [{ label: "orders", value: a.orders || "—" }, { label: "consults", value: a.consults || "—" }] : undefined}
            />
            <Link
              href={`/customers/${c.id}`}
              className="group hidden md:grid md:grid-cols-[minmax(240px,1.4fr)_150px_minmax(140px,1fr)_90px_90px_120px_24px] gap-x-4 gap-y-1 items-center px-4 py-2.5 transition-colors last:rounded-b-[15px] even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
              style={{ borderBottom: i < arr.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
            >
              <span className="flex items-center gap-3 min-w-0">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
                  style={{ background: `${T.accent}15`, border: `1px solid ${T.accent}30`, color: T.accent }}
                >
                  {c.name[0]}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-[14px] font-medium truncate" style={{ color: T.text }}>{c.name}</span>
                    {customerStatus(c.id) === "deactivated" && <Chip tone="muted">Deactivated</Chip>}
                  </span>
                  <span className="block text-[12px] truncate" style={{ color: T.muted }}>{c.email}</span>
                </span>
              </span>
              <span className="text-[13px] tabular-nums" style={{ color: T.muted }}>{c.phone}</span>
              <span className="text-[13px] truncate" style={{ color: T.muted }}>{c.birthPlace}</span>
              <span className="text-[13.5px] tabular-nums md:text-right" style={{ color: a.orders ? T.text : T.faint }}>{a.orders || "—"}</span>
              <span className="text-[13.5px] tabular-nums md:text-right" style={{ color: a.consults ? T.text : T.faint }}>{a.consults || "—"}</span>
              <span className="text-[13.5px] font-semibold tabular-nums md:text-right" style={{ color: a.spent ? T.text : T.faint }}>
                {a.spent ? inr(a.spent) : "—"}
              </span>
              <span className="hidden md:block" />
            </Link>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <EmptyState inline icon="search" title="No customers" description="No customers match your search." />
        )}
        </div>
        </>
        )}
      </Card>
      <Pagination page={currentPage - 1} totalPages={totalPages} totalItems={filtered.length} perPage={PER_PAGE} onPageChange={(p) => setPage(p + 1)} />
      </div>
    </>
  );
}
