"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Tabs, GoldBtn, ShopifyButton, Pagination, downloadXLS, downloadPDF, ExportBtn, DateRangePanel, ToolbarSearch, InlineFilter, MultiCheck, SortMenu, EmptyState, TableSkeleton, MobileListCard, Monogram, MobileToolbar, SheetSection, MobileFab } from "@/components/ui";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import { T } from "@/lib/theme";
import { placedByInfo } from "@/lib/store/leads";
import { MOCK_ORDERS } from "@/lib/mock";
import { inr } from "@/lib/types";

const TABS = [
  { key: "all", label: "All orders" },
  { key: "not_shipped", label: "Not shipped" },
  { key: "cert_missing", label: "Cert missing" },
  { key: "energ_missing", label: "Energ missing" },
];

type SortKey = "date_desc" | "date_asc" | "amount_high" | "amount_low";

const STATUS_FILTER_LABEL: Record<string, string> = {
  payment_pending: "Payment pending",
  cert_missing: "Cert missing",
  energ_missing: "Energ missing",
  not_shipped: "Not shipped",
  in_transit: "In transit",
  delivered: "Delivered",
};

const STONE_TYPE_OPTIONS = [
  { value: "", label: "All stone types" },
  { value: "pukhraj", label: "Pukhraj (Yellow Sapphire)" },
  { value: "manik", label: "Manik (Ruby)" },
  { value: "neelam", label: "Neelam (Blue Sapphire)" },
  { value: "panna", label: "Panna (Emerald)" },
  { value: "heera", label: "Heera (Diamond)" },
  { value: "gomed", label: "Gomed (Hessonite)" },
  { value: "moonga", label: "Moonga (Red Coral)" },
  { value: "moti", label: "Moti (Pearl)" },
  { value: "lehsunia", label: "Lehsunia (Cat's Eye)" },
];

const STONE_TYPE_MATCH: Record<string, string[]> = {
  pukhraj: ["pukhraj", "yellow sapphire"],
  manik: ["manik", "ruby"],
  neelam: ["neelam", "blue sapphire"],
  panna: ["panna", "emerald"],
  heera: ["heera", "diamond"],
  gomed: ["gomed", "hessonite"],
  moonga: ["moonga", "coral"],
  moti: ["moti", "pearl"],
  lehsunia: ["lehsunia", "cat's eye"],
};

const ORDER_BY_OPTIONS = [
  { value: "customer", label: "Customer" },
  { value: "ops", label: "Ops" },
];
const SORT_OPTIONS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "amount_high", label: "Amount: high to low" },
  { value: "amount_low", label: "Amount: low to high" },
];

const F_ICONS = {
  status: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>,
  date: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  stone: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
};

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterPlacedBy, setFilterPlacedBy] = useState<string[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterStoneType, setFilterStoneType] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const PER_PAGE = 10;
  const loading = useSimulatedLoad();

  const matchesStatus = (o: (typeof MOCK_ORDERS)[number], status: string) => {
    if (!status) return true;
    if (status === "payment_pending") return o.paymentStatus === "pending";
    if (status === "cert_missing") return o.certificateStatus === "missing" && o.paymentStatus === "paid";
    if (status === "energ_missing") return o.energisationStatus === "pending" && o.paymentStatus === "paid";
    if (status === "not_shipped") return o.paymentStatus === "paid" && o.shopifyStatus !== "fulfilled" && !o.tracking;
    if (status === "in_transit") return !!o.tracking && o.shopifyStatus !== "fulfilled";
    if (status === "delivered") return o.shopifyStatus === "fulfilled";
    return true;
  };

  const filtered = MOCK_ORDERS.filter((o) => (tab === "all" ? true : matchesStatus(o, tab))).filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.items.some((i) => i.name.toLowerCase().includes(q));
  }).filter((o) => {
    if (filterCustomer && o.customerName !== filterCustomer) return false;
    return true;
  }).filter((o) => {
    if (filterStatus.length === 0) return true;
    return filterStatus.some((s) => matchesStatus(o, s));
  }).filter((o) => {
    if (filterDateFrom && o.placedAt < filterDateFrom) return false;
    if (filterDateTo && o.placedAt > filterDateTo) return false;
    return true;
  }).filter((o) => {
    if (filterPlacedBy.length === 0) return true;
    if (filterPlacedBy.includes("customer") && !o.placedBy) return true;
    if (filterPlacedBy.includes("ops") && !!o.placedBy) return true;
    return false;
  }).filter((o) => {
    if (filterStoneType.length === 0) return true;
    return filterStoneType.some((st) => {
      const keywords = STONE_TYPE_MATCH[st] || [];
      return o.items.some((item) => {
        const name = item.name.toLowerCase();
        const gem = (item.gemstone || "").toLowerCase();
        return keywords.some((kw) => name.includes(kw) || gem.includes(kw));
      });
    });
  }).sort((a, b) => {
    if (sort === "date_desc") return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();
    if (sort === "date_asc") return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
    if (sort === "amount_high") return b.total - a.total;
    if (sort === "amount_low") return a.total - b.total;
    return 0;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = page > totalPages && totalPages > 0 ? totalPages : page;
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const hasActiveFilters = !!filterCustomer || filterStatus.length > 0 || !!filterDateFrom || !!filterDateTo || filterPlacedBy.length > 0 || filterStoneType.length > 0;
  const activeFilterCount = [filterCustomer, filterStatus.length > 0 ? "1" : "", filterStoneType.length > 0 ? "1" : "", filterPlacedBy.length > 0 ? "1" : "", filterDateFrom || filterDateTo].filter(Boolean).length;
  const statusCounts = Object.fromEntries(
    Object.keys(STATUS_FILTER_LABEL).map((k) => [k, MOCK_ORDERS.filter((o) => matchesStatus(o, k)).length]),
  );

  /* Global export — respects active tab + filters, scoped to the chosen period */
  const handleExport = ({ from, to, format, periodLabel }: { from: string; to: string; format: "pdf" | "xls"; periodLabel: string }) => {
    const inRange = (d: string) => (!from || d.slice(0, 10) >= from) && (!to || d.slice(0, 10) <= to);
    {
      const header = ["Order ID", "Customer", "Items", "Created date", "Created by", "Shipment status", "Payment status", "Amount (INR)"];
      const rows = filtered.filter((o) => inRange(o.placedAt)).map((o) => [
        o.id,
        o.customerName,
        o.items.map((i) => i.name).join("; "),
        o.placedAt,
        placedByInfo(o.placedBy).name,
        o.shopifyStatus === "fulfilled" ? "Delivered" : o.tracking ? "In transit" : "Not shipped",
        o.paymentStatus,
        o.total,
      ]);
      if (format === "xls") downloadXLS(header, rows, `orders-${from}-to-${to}.xls`);
      else downloadPDF(`Orders — ${periodLabel}`, header, rows);
    }
  };

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <PageHeader
        title="Orders & fulfilment"
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <ExportBtn onExport={handleExport} />
            <ShopifyButton href="https://admin.shopify.com/orders">Open Shopify</ShopifyButton>
            <span className="hidden sm:block"><Link href="/orders/create"><GoldBtn>+ Create order</GoldBtn></Link></span>
          </div>
        }
      />



      {/* Pinned controls — tabs, search, and filters stay visible while the table scrolls */}
      <div
        className="sticky top-0 z-30 -mx-5 md:-mx-10 px-5 md:px-10 pt-1 pb-1 mb-1"
        style={{ background: "transparent" }}
      >
      {/* Tabs row */}
      <div className="flex flex-wrap items-center gap-2 pb-2.5">
        <Tabs
          tabs={TABS.map((t) => ({
            ...t,
            count: t.key === "all" ? MOCK_ORDERS.length : (statusCounts[t.key] ?? 0),
          }))}
          active={tab}
          onChange={(k) => { setTab(k); setPage(1); }}
        />
      </div>

      {/* Mobile: single collapsed toolbar row (filters sheet + expanding search + sort) */}
      <MobileToolbar
          className="sm:hidden pt-3"
          filterCount={activeFilterCount}
          onClearAll={() => { setFilterCustomer(""); setFilterStatus([]); setFilterPlacedBy([]); setFilterDateFrom(""); setFilterDateTo(""); setFilterStoneType([]); setPage(1); }}
          search={search}
          onSearch={setSearch}
          searchPlaceholder="Search orders, customers…"
          sort={<SortMenu value={sort} onChange={(v) => setSortBy(v)} options={SORT_OPTIONS} />}
          filters={
            <>
              <SheetSection label="Status">
                <MultiCheck options={Object.entries(STATUS_FILTER_LABEL).map(([k, v]) => ({ value: k, label: v }))} value={filterStatus} onChange={setFilterStatus} onAfter={() => setPage(1)} />
              </SheetSection>
              <SheetSection label="Date">
                <DateRangePanel from={filterDateFrom} to={filterDateTo} onChange={(f, t) => { setFilterDateFrom(f); setFilterDateTo(t); setPage(1); }} />
              </SheetSection>
              <SheetSection label="Stone type">
                <MultiCheck options={STONE_TYPE_OPTIONS.filter((o) => o.value !== "")} value={filterStoneType} onChange={setFilterStoneType} onAfter={() => setPage(1)} />
              </SheetSection>
              <SheetSection label="Placed by">
                <MultiCheck options={ORDER_BY_OPTIONS} value={filterPlacedBy} onChange={setFilterPlacedBy} onAfter={() => setPage(1)} />
              </SheetSection>
            </>
          }
        />

      {/* Filter strip — subtle band below the divider: filters left, search + sort right */}
      <div className="hidden sm:flex flex-wrap items-center gap-2 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
        <div className="flex flex-wrap items-center gap-2">
              <InlineFilter label="Status" icon={F_ICONS.status} count={filterStatus.length}>
                <MultiCheck options={Object.entries(STATUS_FILTER_LABEL).map(([k, v]) => ({ value: k, label: v }))} value={filterStatus} onChange={setFilterStatus} onAfter={() => setPage(1)} />
              </InlineFilter>
              <InlineFilter label="Date" icon={F_ICONS.date} count={filterDateFrom || filterDateTo ? 1 : 0} width={440}>
                <DateRangePanel from={filterDateFrom} to={filterDateTo} onChange={(f, t) => { setFilterDateFrom(f); setFilterDateTo(t); setPage(1); }} />
              </InlineFilter>
              <InlineFilter label="Stone type" icon={F_ICONS.stone} count={filterStoneType.length}>
                <MultiCheck options={STONE_TYPE_OPTIONS.filter((o) => o.value !== "")} value={filterStoneType} onChange={setFilterStoneType} onAfter={() => setPage(1)} />
              </InlineFilter>
              <InlineFilter label="Placed by" icon={F_ICONS.user} count={filterPlacedBy.length} width={190}>
                <MultiCheck options={ORDER_BY_OPTIONS} value={filterPlacedBy} onChange={setFilterPlacedBy} onAfter={() => setPage(1)} />
              </InlineFilter>
              {hasActiveFilters && (
                <button
                  onClick={() => { setFilterCustomer(""); setFilterStatus([]); setFilterPlacedBy([]); setFilterDateFrom(""); setFilterDateTo(""); setFilterStoneType([]); setPage(1); }}
                  className="text-[12px] font-medium px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap"
                  style={{ color: T.danger }}
                >
                  Clear all
                </button>
              )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ToolbarSearch value={search} onChange={setSearch} placeholder="Search orders, customers…" />
          <SortMenu value={sort} onChange={(v) => setSortBy(v)} options={SORT_OPTIONS} />
        </div>
      </div>

      </div>

      <Card className="!p-0 md:flex md:flex-col md:min-h-0">
        {loading ? (
          <TableSkeleton cols={6} rows={8} />
        ) : (
          <>
        {/* Sticky header — survives long scrolls */}
        <div
          className="hidden sm:grid grid-cols-[64px_1fr_100px_170px_200px_110px] gap-3 items-center px-4 h-10 text-[11px] font-medium tracking-[0.06em] uppercase sticky top-0 z-10 rounded-t-[15px]"
          style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
        >
          <span>Order</span>
          <span>Customer</span>
          <span>Created</span>
          <span>Created by</span>
          <span>Status</span>
          <span className="text-right">Amount</span>
        </div>
        <div className="md:flex-1 md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">

        {paginated.length === 0 ? (
          <EmptyState inline icon="search" title="No orders" description="Try clearing filters or a different search." />
        ) : (
          paginated.map((o, idx) => {
            const paid = o.paymentStatus === "paid";
            /* Every flag that applies — an order can be not-shipped AND missing its cert */
            const flags: { tone: "gold" | "danger" | "good" | "info" | "muted"; label: string }[] = [];
            if (!paid) flags.push({ tone: "gold", label: "Payment pending" });
            else {
              if (o.certificateStatus === "missing") flags.push({ tone: "danger", label: "Cert missing" });
              if (o.energisationStatus === "pending") flags.push({ tone: "gold", label: "Energ missing" });
              if (o.shopifyStatus === "fulfilled") flags.push({ tone: "good", label: "Delivered" });
              else if (o.tracking) flags.push({ tone: "info", label: "In transit" });
              else flags.push({ tone: "muted", label: "Not shipped" });
            }
            const st = flags[0];
            return (
              <div key={o.id}>
              <MobileListCard
                className="sm:hidden"
                href={`/orders/${o.id}`}
                leading={<Monogram name={o.customerName} />}
                title={o.customerName}
                right={inr(o.total)}
                sub={o.items.length > 1 ? `${o.items[0]?.name} + ${o.items.length - 1} more` : o.items[0]?.name}
                status={{ label: st.label, tone: st.tone, extra: flags.length > 1 ? flags.slice(1).map((fl) => fl.label).join(" · ") : o.id }}
                time={o.placedAt}
              />
              <Link
                href={`/orders/${o.id}`}
                className="group hidden sm:grid sm:grid-cols-[64px_1fr_100px_170px_200px_110px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors duration-150 hover:!bg-[rgba(119,123,98,0.08)]"
                style={{ borderBottom: idx < paginated.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
              >
                <span className="text-[11.5px] tabular-nums" style={{ color: T.faint }}>#{o.id.replace("AL-ORD-", "")}</span>
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{o.customerName}</div>
                  <div className="text-[12px] truncate mt-px" style={{ color: T.muted }}>
                    {o.items[0]?.name}
                    {o.items.length > 1 && <span style={{ color: T.faint }}> +{o.items.length - 1}</span>}
                  </div>
                </div>
                <span className="text-[12px] tabular-nums" style={{ color: T.muted }}>
                  {new Date(o.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                <span className="flex items-center gap-2 min-w-0">{(() => { const p = placedByInfo(o.placedBy); return (<><span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}`, color: T.accent }}>{p.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span><span className="min-w-0"><span className="block text-[12.5px] font-medium truncate" style={{ color: T.text }}>{p.name}</span><span className="block text-[10.5px] truncate" style={{ color: T.faint }}>{p.role}</span></span></>); })()}</span>
                <div className="flex flex-wrap items-center gap-1">{flags.map((fl) => <Chip key={fl.label} tone={fl.tone}>{fl.label}</Chip>)}</div>
                <span className="text-[13px] font-semibold tabular-nums text-right" style={{ color: T.text }}>{inr(o.total)}</span>
              </Link>
              </div>
            );
          })
        )}
        </div>
          </>
        )}
      </Card>

      <Pagination page={currentPage - 1} totalPages={totalPages} totalItems={filtered.length} perPage={PER_PAGE} onPageChange={(p) => setPage(p + 1)} />

      </div>
      <MobileFab href="/orders/create" label="New order" />
    </>
  );

  function setSortBy(val: string) {
    setSort(val as SortKey);
    setPage(1);
  }
}
