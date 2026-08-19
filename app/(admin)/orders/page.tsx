"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, Tabs, GoldBtn, ShopifyButton, Pagination, downloadXLS, downloadPDF, ExportBtn, DateRangePanel, ToolbarSearch, InlineFilter, MultiCheck, SortMenu, EmptyState, TableSkeleton } from "@/components/ui";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import { T } from "@/lib/theme";
import { MOCK_ORDERS, MOCK_INCOMPLETE_ORDERS } from "@/lib/mock";
import { inr } from "@/lib/types";

const TABS = [
  { key: "all", label: "All orders" },
  { key: "payment_pending", label: "Payment pending" },
  { key: "not_shipped", label: "Not shipped" },
  { key: "cert_missing", label: "Cert missing" },
  { key: "energ_missing", label: "Energ missing" },
  { key: "incomplete", label: "Incomplete" },
];

const INCOMPLETE_REASON_LABEL: Record<string, string> = {
  payment_failed: "Payment failed",
  abandoned_cart: "Cart abandoned",
  payment_expired: "Payment expired",
  card_declined: "Card declined",
  requested_call: "Requested call",
};

const INCOMPLETE_REASON_TONE: Record<string, "danger" | "gold" | "muted"> = {
  payment_failed: "danger",
  abandoned_cart: "gold",
  payment_expired: "muted",
  card_declined: "danger",
  requested_call: "gold",
};

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

  // Incomplete tab filters
  const [incFilterCustomer, setIncFilterCustomer] = useState("");
  const [incFilterStone, setIncFilterStone] = useState<string[]>([]);
  const [incFilterReason, setIncFilterReason] = useState<string[]>([]);
  const [incFilterDateFrom, setIncFilterDateFrom] = useState("");
  const [incFilterDateTo, setIncFilterDateTo] = useState("");
  const [incSort, setIncSort] = useState<SortKey>("date_desc");
  const [incPage, setIncPage] = useState(1);

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

  const filtered = MOCK_ORDERS.filter((o) => (tab === "all" || tab === "incomplete") ? true : matchesStatus(o, tab)).filter((o) => {
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
  const statusCounts = Object.fromEntries(
    Object.keys(STATUS_FILTER_LABEL).map((k) => [k, MOCK_ORDERS.filter((o) => matchesStatus(o, k)).length]),
  );

  // Incomplete tab — computed at component scope so global export can reach it
  const incStones = [...new Set(MOCK_INCOMPLETE_ORDERS.map((o) => o.itemName))].sort();
  const hasIncFilters = !!incFilterCustomer || incFilterStone.length > 0 || incFilterReason.length > 0 || !!incFilterDateFrom || !!incFilterDateTo;

  const incFiltered = MOCK_INCOMPLETE_ORDERS
    .filter((o) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return o.customerName.toLowerCase().includes(q) || o.itemName.toLowerCase().includes(q);
    })
    .filter((o) => !incFilterCustomer || o.customerName === incFilterCustomer)
    .filter((o) => incFilterStone.length === 0 || incFilterStone.includes(o.itemName))
    .filter((o) => incFilterReason.length === 0 || incFilterReason.includes(o.reason))
    .filter((o) => {
      if (incFilterDateFrom && o.failedAt < incFilterDateFrom) return false;
      if (incFilterDateTo && o.failedAt > incFilterDateTo) return false;
      return true;
    })
    .sort((a, b) => {
      if (incSort === "date_asc") return new Date(a.failedAt).getTime() - new Date(b.failedAt).getTime();
      if (incSort === "amount_high") return b.amount - a.amount;
      if (incSort === "amount_low") return a.amount - b.amount;
      return new Date(b.failedAt).getTime() - new Date(a.failedAt).getTime();
    });

  const incTotalPages = Math.ceil(incFiltered.length / PER_PAGE);
  const incCurrentPage = incPage > incTotalPages && incTotalPages > 0 ? incTotalPages : incPage;
  const incPaginated = incFiltered.slice((incCurrentPage - 1) * PER_PAGE, incCurrentPage * PER_PAGE);

  /* Global export — respects active tab + filters, scoped to the chosen period */
  const handleExport = ({ from, to, format, periodLabel }: { from: string; to: string; format: "pdf" | "xls"; periodLabel: string }) => {
    const inRange = (d: string) => (!from || d.slice(0, 10) >= from) && (!to || d.slice(0, 10) <= to);
    if (tab === "incomplete") {
      const header = ["Customer", "Item", "Failed at", "Reason", "Amount (INR)"];
      const rows = incFiltered.filter((o) => inRange(o.failedAt)).map((o) => [o.customerName, o.itemName, o.failedAt, INCOMPLETE_REASON_LABEL[o.reason] || o.reason, o.amount]);
      if (format === "xls") downloadXLS(header, rows, `incomplete-orders-${from}-to-${to}.xls`);
      else downloadPDF(`Incomplete orders — ${periodLabel}`, header, rows);
    } else {
      const header = ["Order ID", "Customer", "Items", "Created date", "Created by", "Shipment status", "Payment status", "Amount (INR)"];
      const rows = filtered.filter((o) => inRange(o.placedAt)).map((o) => [
        o.id,
        o.customerName,
        o.items.map((i) => i.name).join("; "),
        o.placedAt,
        o.placedBy || "Customer",
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
            <Link href="/orders/create"><GoldBtn>+ Create order</GoldBtn></Link>
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
            count: t.key === "all" ? MOCK_ORDERS.length : t.key === "incomplete" ? MOCK_INCOMPLETE_ORDERS.length : (statusCounts[t.key] ?? 0),
          }))}
          active={tab}
          onChange={(k) => { setTab(k); setPage(1); }}
        />
      </div>

      {/* Filter strip — subtle band below the divider: filters left, search + sort right */}
      <div className="flex flex-wrap items-center gap-2 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
        <div className="flex flex-wrap items-center gap-2">
          {tab !== "incomplete" ? (
            <>
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
            </>
          ) : (
            <>
              <InlineFilter label="Status" icon={F_ICONS.status} count={incFilterReason.length}>
                <MultiCheck options={Object.entries(INCOMPLETE_REASON_LABEL).map(([k, v]) => ({ value: k, label: v }))} value={incFilterReason} onChange={setIncFilterReason} onAfter={() => setIncPage(1)} />
              </InlineFilter>
              <InlineFilter label="Stone" icon={F_ICONS.stone} count={incFilterStone.length}>
                <MultiCheck options={incStones.map((s) => ({ value: s, label: s }))} value={incFilterStone} onChange={setIncFilterStone} onAfter={() => setIncPage(1)} />
              </InlineFilter>
              <InlineFilter label="Date" icon={F_ICONS.date} count={incFilterDateFrom || incFilterDateTo ? 1 : 0} width={440}>
                <DateRangePanel from={incFilterDateFrom} to={incFilterDateTo} onChange={(f, t) => { setIncFilterDateFrom(f); setIncFilterDateTo(t); setIncPage(1); }} />
              </InlineFilter>
              {hasIncFilters && (
                <button
                  onClick={() => { setIncFilterCustomer(""); setIncFilterStone([]); setIncFilterReason([]); setIncFilterDateFrom(""); setIncFilterDateTo(""); setIncPage(1); }}
                  className="text-[12px] font-medium px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap"
                  style={{ color: T.danger }}
                >
                  Clear all
                </button>
              )}
            </>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ToolbarSearch value={search} onChange={setSearch} placeholder="Search orders, customers…" />
          {tab !== "incomplete" ? (
            <SortMenu value={sort} onChange={(v) => setSortBy(v)} options={SORT_OPTIONS} />
          ) : (
            <SortMenu value={incSort} onChange={(v) => { setIncSort(v as SortKey); setIncPage(1); }} options={SORT_OPTIONS} />
          )}
        </div>
      </div>

      </div>

      {tab !== "incomplete" && <>
      <Card className="!p-0 md:flex md:flex-col md:min-h-0">
        {loading ? (
          <TableSkeleton cols={6} rows={8} />
        ) : (
          <>
        {/* Sticky header — survives long scrolls */}
        <div
          className="hidden sm:grid grid-cols-[64px_1fr_110px_120px_150px_110px] gap-3 items-center px-4 h-10 text-[11px] font-medium tracking-[0.06em] uppercase sticky top-0 z-10 rounded-t-[15px]"
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
            /* One status per row, most urgent wins — payment > cert > energisation > shipment */
            const st =
              o.paymentStatus === "pending"
                ? { tone: "gold" as const, label: "Payment pending" }
                : o.certificateStatus === "missing" && paid
                  ? { tone: "danger" as const, label: "Cert missing" }
                  : o.energisationStatus === "pending" && paid
                    ? { tone: "danger" as const, label: "Energ pending" }
                    : o.shopifyStatus === "fulfilled"
                      ? { tone: "good" as const, label: "Delivered" }
                      : o.tracking
                        ? { tone: "info" as const, label: "In transit" }
                        : { tone: "muted" as const, label: "Not shipped" };
            return (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className="group grid grid-cols-1 sm:grid-cols-[64px_1fr_110px_120px_150px_110px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors duration-150 last:rounded-b-[15px] even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
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
                <span className="text-[12px] truncate capitalize" style={{ color: T.muted }}>
                  {o.placedBy ? o.placedBy.split("@")[0] : "Customer"}
                </span>
                <div><Chip tone={st.tone}>{st.label}</Chip></div>
                <span className="text-[13px] font-semibold tabular-nums text-right" style={{ color: T.text }}>{inr(o.total)}</span>
              </Link>
            );
          })
        )}
        </div>
          </>
        )}
      </Card>

      <Pagination page={currentPage - 1} totalPages={totalPages} totalItems={filtered.length} perPage={PER_PAGE} onPageChange={(p) => setPage(p + 1)} />
      </>}

      {/* ============ INCOMPLETE ORDERS ============ */}
      {tab === "incomplete" && (
        <>
          <Card className="!p-0 md:flex md:flex-col md:min-h-0">
            {loading ? (
              <TableSkeleton cols={6} rows={8} />
            ) : (
              <>
              <div
                className="hidden sm:grid grid-cols-[1fr_1fr_100px_140px_100px_110px] gap-3 items-center px-4 h-10 text-[11px] font-medium tracking-[0.06em] uppercase sticky top-0 z-10 rounded-t-[15px]"
                style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
              >
                <span>Customer</span>
                <span>Stone / Item</span>
                <span>Date</span>
                <span>Status</span>
                <span>Assignee</span>
                <span className="text-right">Amount</span>
              </div>
            <div className="md:flex-1 md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">
              {incFiltered.length === 0 ? (
                <EmptyState inline icon="check" title="No incomplete orders" description="Nothing needs recovery right now." />
              ) : (
                incPaginated.map((o, idx) => (
                  <Link
                    key={o.id}
                    href={`/orders/incomplete/${o.id}`}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_140px_100px_110px] gap-2 sm:gap-3 items-center px-4 py-2.5 transition-colors duration-150 last:rounded-b-[15px] even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
                    style={{ borderBottom: idx < incPaginated.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                  >
                    <div className="min-w-0">
                      <span className="text-[13px] font-semibold truncate block" style={{ color: T.text }}>{o.customerName}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[13px] truncate block" style={{ color: T.muted }}>{o.itemName}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[12px]" style={{ color: T.text }}>{new Date(o.failedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
                    </div>
                    <div>
                      <Chip tone={INCOMPLETE_REASON_TONE[o.reason] || "muted"}>{INCOMPLETE_REASON_LABEL[o.reason] || o.reason}</Chip>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[12px]" style={{ color: T.faint }}>—</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[14px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(o.amount)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
              </>
            )}
            </Card>
          <Pagination page={incCurrentPage - 1} totalPages={incTotalPages} totalItems={incFiltered.length} perPage={PER_PAGE} onPageChange={(p) => setIncPage(p + 1)} />
        </>
      )}
      </div>
    </>
  );

  function setSortBy(val: string) {
    setSort(val as SortKey);
    setPage(1);
  }
}
