"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, SearchFilter, Tabs, GoldBtn, Select, ShopifyButton, TableSkeleton, Pagination, ExportButton } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_ORDERS, MOCK_INCOMPLETE_ORDERS } from "@/lib/mock";
import { inr } from "@/lib/types";

const TABS = [
  { key: "all", label: "All orders" },
  { key: "pending_payment", label: "Payment pending" },
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

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterShipment, setFilterShipment] = useState("");
  const [filterPlacedBy, setFilterPlacedBy] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dpYear, setDpYear] = useState(new Date().getFullYear());
  const [dpMonth, setDpMonth] = useState(new Date().getMonth());
  const [page, setPage] = useState(0);

  // Incomplete tab filters
  const [incFilterCustomer, setIncFilterCustomer] = useState("");
  const [incFilterStone, setIncFilterStone] = useState("");
  const [incFilterReason, setIncFilterReason] = useState("");
  const [incFilterDateFrom, setIncFilterDateFrom] = useState("");
  const [incFilterDateTo, setIncFilterDateTo] = useState("");
  const [incShowDatePicker, setIncShowDatePicker] = useState(false);
  const [incDpYear, setIncDpYear] = useState(new Date().getFullYear());
  const [incDpMonth, setIncDpMonth] = useState(new Date().getMonth());
  const [incSort, setIncSort] = useState<SortKey>("date_desc");
  const [loading, setLoading] = useState(true);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 700); return () => clearTimeout(t); }, []);

  const PER_PAGE = 9;

  const filtered = MOCK_ORDERS.filter((o) => {
    if (tab === "pending_payment") return o.paymentStatus === "pending";
    if (tab === "not_shipped") return o.paymentStatus === "paid" && o.shopifyStatus !== "fulfilled" && !o.tracking;
    if (tab === "cert_missing") return o.certificateStatus === "missing" && o.paymentStatus === "paid";
    if (tab === "energ_missing") return o.energisationStatus === "pending" && o.paymentStatus === "paid";
    return true;
  }).filter((o) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.items.some((i) => i.name.toLowerCase().includes(q));
  }).filter((o) => {
    if (filterCustomer && o.customerName !== filterCustomer) return false;
    return true;
  }).filter((o) => {
    if (!filterShipment) return true;
    if (filterShipment === "not_shipped") return o.shopifyStatus !== "fulfilled" && !o.tracking;
    if (filterShipment === "in_transit") return !!o.tracking && o.shopifyStatus !== "fulfilled";
    if (filterShipment === "delivered") return o.shopifyStatus === "fulfilled";
    return true;
  }).filter((o) => {
    if (filterDateFrom && o.placedAt < filterDateFrom) return false;
    if (filterDateTo && o.placedAt > filterDateTo) return false;
    return true;
  }).filter((o) => {
    if (!filterPlacedBy) return true;
    if (filterPlacedBy === "customer") return !o.placedBy;
    return o.placedBy === filterPlacedBy;
  }).sort((a, b) => {
    if (sort === "date_desc") return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();
    if (sort === "date_asc") return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
    if (sort === "amount_high") return b.total - a.total;
    if (sort === "amount_low") return a.total - b.total;
    return 0;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const exportData = filtered.map((o) => ({
    id: o.id,
    customer: o.customerName,
    date: o.placedAt,
    total: o.total,
    status: o.shopifyStatus === "fulfilled" ? "Delivered" : o.tracking ? "In transit" : "Not shipped",
    paymentStatus: o.paymentStatus,
  }));

  const uniqueCustomers = [...new Set(MOCK_ORDERS.map((o) => o.customerName))].sort();
  const uniquePlacedBy = [...new Set(MOCK_ORDERS.map((o) => o.placedBy).filter(Boolean))] as string[];
  const hasActiveFilters = !!filterCustomer || !!filterShipment || !!filterDateFrom || !!filterDateTo || !!filterPlacedBy;

  return (
    <>
      <PageHeader
        title="Orders & fulfilment"
        sub="Captured in Shopify · operational status and custody owned here"
        action={
          <div className="flex items-center gap-2.5">
            <Link href="/orders/create"><GoldBtn>+ Create order</GoldBtn></Link>
            <ShopifyButton href="https://admin.shopify.com/orders">Open Shopify</ShopifyButton>
          </div>
        }
      />

      <div className="mb-4">
        <Tabs
          tabs={TABS.map((t) => ({
            ...t,
            count: t.key === "all"
              ? MOCK_ORDERS.length
              : t.key === "pending_payment"
                ? MOCK_ORDERS.filter((o) => o.paymentStatus === "pending").length
                : t.key === "not_shipped"
                  ? MOCK_ORDERS.filter((o) => o.paymentStatus === "paid" && o.shopifyStatus !== "fulfilled" && !o.tracking).length
                  : t.key === "cert_missing"
                    ? MOCK_ORDERS.filter((o) => o.certificateStatus === "missing" && o.paymentStatus === "paid").length
                    : t.key === "energ_missing"
                      ? MOCK_ORDERS.filter((o) => o.energisationStatus === "pending" && o.paymentStatus === "paid").length
                      : t.key === "incomplete"
                        ? MOCK_INCOMPLETE_ORDERS.length
                        : undefined,
          }))}
          active={tab}
          onChange={(key) => { setTab(key); setPage(0); }}
        />
      </div>

      {tab !== "incomplete" && <>
      {/* Full-width search */}
      <div className="mb-3">
        <SearchFilter search={search} onSearchChange={(v) => { setSearch(v); setPage(0); }} placeholder="Search orders, customers, products…" />
      </div>

      {/* Filters & Sort */}
      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="w-[200px]">
          <Select
            value={filterCustomer}
            onChange={(v) => { setFilterCustomer(v); setPage(0); }}
            searchable
            compact
            placeholder="All customers"
            options={[
              { value: "", label: "All customers" },
              ...uniqueCustomers.map((name) => ({ value: name, label: name })),
            ]}
          />
        </div>

        <div className="w-[180px]">
          <Select
            value={filterShipment}
            onChange={(v) => { setFilterShipment(v); setPage(0); }}
            compact
            placeholder="All shipment status"
            options={[
              { value: "", label: "All status" },
              { value: "not_shipped", label: "Not shipped" },
              { value: "in_transit", label: "In transit" },
              { value: "delivered", label: "Delivered" },
            ]}
          />
        </div>

        <div className="w-[180px]">
          <Select
            value={filterPlacedBy}
            onChange={(v) => { setFilterPlacedBy(v); setPage(0); }}
            compact
            placeholder="All created by"
            options={[
              { value: "", label: "All created by" },
              { value: "customer", label: "Customer" },
              ...uniquePlacedBy.map((email) => ({ value: email, label: email })),
            ]}
          />
        </div>

        {/* Date range picker */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="h-9 px-3.5 rounded-[9px] text-[13.5px] flex items-center gap-2 cursor-pointer transition-all"
            style={{ background: T.popover, border: `1px solid ${(filterDateFrom || filterDateTo) ? T.accentBorder : T.border}`, color: (filterDateFrom || filterDateTo) ? T.text : T.text }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 9h18" />
            </svg>
            {(filterDateFrom || filterDateTo)
              ? `${filterDateFrom ? new Date(filterDateFrom + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Start"} — ${filterDateTo ? new Date(filterDateTo + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "End"}`
              : "All dates"
            }
          </button>

          {showDatePicker && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDatePicker(false)} />
              <div
                className="absolute top-full left-0 mt-1 z-50 flex rounded-[9px] shadow-lg overflow-hidden"
                style={{ background: T.popover, border: `1px solid ${T.border}` }}
              >
                <div className="w-[130px] py-2 px-1.5 shrink-0" style={{ borderRight: `1px solid ${T.borderSoft}` }}>
                  <div className="text-[9px] tracking-[0.06em] uppercase px-2 mb-1.5" style={{ color: T.faint }}>Quick select</div>
                  {[
                    { label: "Today", from: new Date().toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
                    { label: "Yesterday", from: new Date(Date.now() - 86400000).toISOString().slice(0, 10), to: new Date(Date.now() - 86400000).toISOString().slice(0, 10) },
                    { label: "Last 7 days", from: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
                    { label: "Last 30 days", from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => { setFilterDateFrom(preset.from); setFilterDateTo(preset.to); setShowDatePicker(false); setPage(0); }}
                      className="w-full text-left px-2.5 py-2 rounded-[7px] text-[12px] transition-colors cursor-pointer hover:bg-[rgba(160,125,56,0.10)]"
                      style={{ color: T.text }}
                    >
                      {preset.label}
                    </button>
                  ))}
                  {(filterDateFrom || filterDateTo) && (
                    <button
                      onClick={() => { setFilterDateFrom(""); setFilterDateTo(""); setShowDatePicker(false); setPage(0); }}
                      className="w-full text-left px-2.5 py-2 rounded-[7px] text-[11px] mt-1 transition-colors cursor-pointer hover:bg-[rgba(176,84,84,0.06)]"
                      style={{ color: T.danger }}
                    >
                      Clear dates
                    </button>
                  )}
                </div>
                <div className="p-4 w-[280px]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1">
                      <div className="text-[9px] uppercase tracking-[0.06em] mb-1" style={{ color: T.faint }}>After</div>
                      <input type="date" value={filterDateFrom} onChange={(e) => { setFilterDateFrom(e.target.value); setPage(0); }} className="w-full h-8 px-2 rounded-[7px] text-[11px] outline-none" style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }} />
                    </div>
                    <span className="text-[11px] mt-3" style={{ color: T.faint }}>—</span>
                    <div className="flex-1">
                      <div className="text-[9px] uppercase tracking-[0.06em] mb-1" style={{ color: T.faint }}>Before</div>
                      <input type="date" value={filterDateTo} onChange={(e) => { setFilterDateTo(e.target.value); setPage(0); }} className="w-full h-8 px-2 rounded-[7px] text-[11px] outline-none" style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <button type="button" onClick={() => { if (dpMonth === 0) { setDpMonth(11); setDpYear((y) => y - 1); } else setDpMonth((m) => m - 1); }} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(160,125,56,0.15)]" style={{ color: T.muted }}>‹</button>
                    <span className="text-[11px] font-medium" style={{ color: T.text }}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][dpMonth]} {dpYear}</span>
                    <button type="button" onClick={() => { if (dpMonth === 11) { setDpMonth(0); setDpYear((y) => y + 1); } else setDpMonth((m) => m + 1); }} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(160,125,56,0.15)]" style={{ color: T.muted }}>›</button>
                  </div>
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => <div key={d} className="text-center text-[9px] py-0.5" style={{ color: T.faint }}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: (() => { const fd = new Date(dpYear, dpMonth, 1).getDay(); return fd === 0 ? 6 : fd - 1; })() }).map((_, i) => <div key={`e${i}`} />)}
                    {Array.from({ length: new Date(dpYear, dpMonth + 1, 0).getDate() }).map((_, i) => {
                      const day = i + 1;
                      const iso = `${dpYear}-${String(dpMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const isFrom = filterDateFrom === iso;
                      const isTo = filterDateTo === iso;
                      const inRange = filterDateFrom && filterDateTo && iso >= filterDateFrom && iso <= filterDateTo;
                      return (
                        <button key={day} type="button" onClick={() => { if (!filterDateFrom || (filterDateFrom && filterDateTo)) { setFilterDateFrom(iso); setFilterDateTo(""); } else { if (iso < filterDateFrom) { setFilterDateTo(filterDateFrom); setFilterDateFrom(iso); } else { setFilterDateTo(iso); } } setPage(0); }}
                          className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] transition-colors cursor-pointer"
                          style={{ background: (isFrom || isTo) ? T.accent : inRange ? "rgba(160,125,56,0.16)" : "transparent", color: (isFrom || isTo) ? T.accentInk : T.text, fontWeight: (isFrom || isTo) ? 700 : 400 }}
                        >{day}</button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={() => { setFilterCustomer(""); setFilterShipment(""); setFilterPlacedBy(""); setFilterDateFrom(""); setFilterDateTo(""); setPage(0); }}
              className="text-[11px] px-2.5 py-1.5 rounded-[7px] cursor-pointer transition-opacity hover:opacity-80"
              style={{ color: T.danger, background: "rgba(176,84,84,0.08)", border: "1px solid rgba(176,84,84,0.15)" }}
            >
              Clear filters
            </button>
          )}
          <div className="w-[180px]">
            <Select
              value={sort}
              onChange={(val) => setSortBy(val)}
              compact
              prefix="Sort: "
              options={[
                { value: "date_desc", label: "Newest first" },
                { value: "date_asc", label: "Oldest first" },
                { value: "amount_high", label: "Amount: high to low" },
                { value: "amount_low", label: "Amount: low to high" },
              ]}
            />
          </div>
          <ExportButton data={exportData} filename="orders" className="ml-2" />
        </div>
      </div>

      {loading ? (
        <Card><TableSkeleton rows={6} cols={6} /></Card>
      ) : (
        <>
          <Card>
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_100px_140px_100px_110px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase" style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
              <span>Order details</span>
              <span>Created date</span>
              <span>Created by</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
            </div>

            {paginated.length === 0 ? (
              <p className="text-[13.5px] py-6 text-center" style={{ color: T.muted }}>No orders match your filters.</p>
            ) : (
              paginated.map((o) => (
                <Link
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="group grid grid-cols-1 sm:grid-cols-[1fr_100px_140px_100px_110px] gap-2 sm:gap-3 items-center px-3 py-3.5 transition-all duration-150 rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]"
                  style={{ borderBottom: `1px solid ${T.borderSoft}` }}
                >
                  {/* Order details — who, then what, then the reference */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-medium" style={{ color: T.text }}>{o.customerName}</span>
                      {o.paymentStatus === "pending" && <Chip tone="gold">Payment pending</Chip>}
                      {o.certificateStatus === "missing" && o.paymentStatus === "paid" && <Chip tone="danger">Cert missing</Chip>}
                      {o.energisationStatus === "pending" && o.paymentStatus === "paid" && <Chip tone="danger">Energ pending</Chip>}
                    </div>
                    <div className="flex items-baseline gap-3 mt-0.5 min-w-0">
                      <span className="text-[13px] truncate" style={{ color: T.muted }}>
                        {o.items[0]?.name}
                        {o.items.length > 1 && <span style={{ color: T.faint }}> +{o.items.length - 1} more</span>}
                      </span>
                      <span className="text-[11px] tracking-[0.05em] uppercase tabular-nums shrink-0" style={{ color: T.faint }}>{o.id}</span>
                    </div>
                  </div>

                  {/* Created date */}
                  <div className="min-w-0">
                    <span className="text-[12px]" style={{ color: T.text }}>{new Date(o.placedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).replace(/ (\d{4})$/, ", $1")}</span>
                  </div>

                  {/* Created by */}
                  <div className="min-w-0">
                    <span className="text-[12px] truncate block" style={{ color: T.muted }}>
                      {o.placedBy || "Customer"}
                    </span>
                  </div>

                  {/* Status */}
                  <div>
                    <Chip tone={o.shopifyStatus === "fulfilled" ? "good" : o.tracking ? "gold" : "muted"}>
                      {o.shopifyStatus === "fulfilled" ? "Delivered" : o.tracking ? "In transit" : "Not shipped"}
                    </Chip>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <span className="text-[14px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(o.total)}</span>
                  </div>
                </Link>
              ))
            )}
          </Card>

          {/* Pagination */}
          {filtered.length > PER_PAGE && (
            <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />
          )}
        </>
      )}
      </>}

      {/* ============ INCOMPLETE ORDERS ============ */}
      {tab === "incomplete" && (() => {
        const incCustomers = [...new Set(MOCK_INCOMPLETE_ORDERS.map((o) => o.customerName))].sort();
        const incStones = [...new Set(MOCK_INCOMPLETE_ORDERS.map((o) => o.itemName))].sort();
        const hasIncFilters = !!incFilterCustomer || !!incFilterStone || !!incFilterReason || !!incFilterDateFrom || !!incFilterDateTo;

        const incFiltered = MOCK_INCOMPLETE_ORDERS
          .filter((o) => {
            if (!search) return true;
            const q = search.toLowerCase();
            return o.customerName.toLowerCase().includes(q) || o.itemName.toLowerCase().includes(q);
          })
          .filter((o) => !incFilterCustomer || o.customerName === incFilterCustomer)
          .filter((o) => !incFilterStone || o.itemName === incFilterStone)
          .filter((o) => !incFilterReason || o.reason === incFilterReason)
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

        return (
          <>
            <div className="mb-3">
              <SearchFilter search={search} onSearchChange={(v) => { setSearch(v); setPage(0); }} placeholder="Search customer, stone…" />
            </div>
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <div className="w-[200px]">
                <Select value={incFilterCustomer} onChange={(v) => { setIncFilterCustomer(v); setPage(0); }} searchable compact placeholder="All customers" options={[{ value: "", label: "All customers" }, ...incCustomers.map((n) => ({ value: n, label: n }))]} />
              </div>
              <div className="w-[200px]">
                <Select value={incFilterStone} onChange={(v) => { setIncFilterStone(v); setPage(0); }} searchable compact placeholder="All stones" options={[{ value: "", label: "All stones" }, ...incStones.map((n) => ({ value: n, label: n }))]} />
              </div>
              <div className="w-[180px]">
                <Select value={incFilterReason} onChange={(v) => { setIncFilterReason(v); setPage(0); }} compact placeholder="All reasons" options={[{ value: "", label: "All reasons" }, ...Object.entries(INCOMPLETE_REASON_LABEL).map(([k, v]) => ({ value: k, label: v }))]} />
              </div>

              {/* Date range picker */}
              <div className="relative">
                <button
                  onClick={() => setIncShowDatePicker(!incShowDatePicker)}
                  className="h-9 px-3.5 rounded-[9px] text-[13.5px] flex items-center gap-2 cursor-pointer transition-all"
                  style={{ background: T.popover, border: `1px solid ${(incFilterDateFrom || incFilterDateTo) ? T.accentBorder : T.border}`, color: T.text }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M8 2v4M16 2v4M3 9h18" /></svg>
                  {(incFilterDateFrom || incFilterDateTo)
                    ? `${incFilterDateFrom ? new Date(incFilterDateFrom + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Start"} — ${incFilterDateTo ? new Date(incFilterDateTo + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "End"}`
                    : "All dates"
                  }
                </button>
                {incShowDatePicker && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIncShowDatePicker(false)} />
                    <div className="absolute top-full left-0 mt-1 z-50 flex rounded-[9px] shadow-lg overflow-hidden" style={{ background: T.popover, border: `1px solid ${T.border}` }}>
                      <div className="w-[130px] py-2 px-1.5 shrink-0" style={{ borderRight: `1px solid ${T.borderSoft}` }}>
                        <div className="text-[9px] tracking-[0.06em] uppercase px-2 mb-1.5" style={{ color: T.faint }}>Quick select</div>
                        {[
                          { label: "Today", from: new Date().toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
                          { label: "Yesterday", from: new Date(Date.now() - 86400000).toISOString().slice(0, 10), to: new Date(Date.now() - 86400000).toISOString().slice(0, 10) },
                          { label: "Last 7 days", from: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
                          { label: "Last 30 days", from: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) },
                        ].map((preset) => (
                          <button key={preset.label} onClick={() => { setIncFilterDateFrom(preset.from); setIncFilterDateTo(preset.to); setIncShowDatePicker(false); setPage(0); }} className="w-full text-left px-2.5 py-2 rounded-[7px] text-[12px] transition-colors cursor-pointer hover:bg-[rgba(160,125,56,0.10)]" style={{ color: T.text }}>{preset.label}</button>
                        ))}
                        {(incFilterDateFrom || incFilterDateTo) && (
                          <button onClick={() => { setIncFilterDateFrom(""); setIncFilterDateTo(""); setIncShowDatePicker(false); setPage(0); }} className="w-full text-left px-2.5 py-2 rounded-[7px] text-[11px] mt-1 transition-colors cursor-pointer hover:bg-[rgba(176,84,84,0.06)]" style={{ color: T.danger }}>Clear dates</button>
                        )}
                      </div>
                      <div className="p-4 w-[280px]">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex-1">
                            <div className="text-[9px] uppercase tracking-[0.06em] mb-1" style={{ color: T.faint }}>After</div>
                            <input type="date" value={incFilterDateFrom} onChange={(e) => { setIncFilterDateFrom(e.target.value); setPage(0); }} className="w-full h-8 px-2 rounded-[7px] text-[11px] outline-none" style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }} />
                          </div>
                          <span className="text-[11px] mt-3" style={{ color: T.faint }}>—</span>
                          <div className="flex-1">
                            <div className="text-[9px] uppercase tracking-[0.06em] mb-1" style={{ color: T.faint }}>Before</div>
                            <input type="date" value={incFilterDateTo} onChange={(e) => { setIncFilterDateTo(e.target.value); setPage(0); }} className="w-full h-8 px-2 rounded-[7px] text-[11px] outline-none" style={{ background: T.bg, border: `1px solid ${T.borderSoft}`, color: T.text }} />
                          </div>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <button type="button" onClick={() => { if (incDpMonth === 0) { setIncDpMonth(11); setIncDpYear((y) => y - 1); } else setIncDpMonth((m) => m - 1); }} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(160,125,56,0.15)]" style={{ color: T.muted }}>‹</button>
                          <span className="text-[11px] font-medium" style={{ color: T.text }}>{["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][incDpMonth]} {incDpYear}</span>
                          <button type="button" onClick={() => { if (incDpMonth === 11) { setIncDpMonth(0); setIncDpYear((y) => y + 1); } else setIncDpMonth((m) => m + 1); }} className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer hover:bg-[rgba(160,125,56,0.15)]" style={{ color: T.muted }}>›</button>
                        </div>
                        <div className="grid grid-cols-7 gap-0.5 mb-1">
                          {["Mo","Tu","We","Th","Fr","Sa","Su"].map((d) => <div key={d} className="text-center text-[9px] py-0.5" style={{ color: T.faint }}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
                          {Array.from({ length: (() => { const fd = new Date(incDpYear, incDpMonth, 1).getDay(); return fd === 0 ? 6 : fd - 1; })() }).map((_, i) => <div key={`e${i}`} />)}
                          {Array.from({ length: new Date(incDpYear, incDpMonth + 1, 0).getDate() }).map((_, i) => {
                            const day = i + 1;
                            const iso = `${incDpYear}-${String(incDpMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            const isFrom = incFilterDateFrom === iso;
                            const isTo = incFilterDateTo === iso;
                            const inRange = incFilterDateFrom && incFilterDateTo && iso >= incFilterDateFrom && iso <= incFilterDateTo;
                            return (
                              <button key={day} type="button" onClick={() => { if (!incFilterDateFrom || (incFilterDateFrom && incFilterDateTo)) { setIncFilterDateFrom(iso); setIncFilterDateTo(""); } else { if (iso < incFilterDateFrom) { setIncFilterDateTo(incFilterDateFrom); setIncFilterDateFrom(iso); } else { setIncFilterDateTo(iso); } } setPage(0); }}
                                className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] transition-colors cursor-pointer"
                                style={{ background: (isFrom || isTo) ? T.accent : inRange ? "rgba(160,125,56,0.16)" : "transparent", color: (isFrom || isTo) ? T.accentInk : T.text, fontWeight: (isFrom || isTo) ? 700 : 400 }}
                              >{day}</button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="ml-auto flex items-center gap-2">
                {hasIncFilters && (
                  <button onClick={() => { setIncFilterCustomer(""); setIncFilterStone(""); setIncFilterReason(""); setIncFilterDateFrom(""); setIncFilterDateTo(""); setPage(0); }} className="text-[11px] px-2.5 py-1.5 rounded-[7px] cursor-pointer transition-opacity hover:opacity-80" style={{ color: T.danger, background: "rgba(176,84,84,0.08)", border: "1px solid rgba(176,84,84,0.15)" }}>Clear filters</button>
                )}
                <div className="w-[200px]">
                  <Select value={incSort} onChange={(v) => { setIncSort(v as SortKey); setPage(0); }} compact prefix="Sort: " options={[{ value: "date_desc", label: "Newest first" }, { value: "date_asc", label: "Oldest first" }, { value: "amount_high", label: "Amount: high" }, { value: "amount_low", label: "Amount: low" }]} />
                </div>
              </div>
            </div>

            {loading ? (
              <Card><TableSkeleton rows={6} cols={6} /></Card>
            ) : (
              <Card>
                <div className="hidden sm:grid grid-cols-[1fr_1fr_100px_120px_100px_110px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase" style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
                  <span>Customer</span>
                  <span>Stone / Item</span>
                  <span>Date</span>
                  <span>Status</span>
                  <span>Assignee</span>
                  <span className="text-right">Amount</span>
                </div>
                {incFiltered.length === 0 ? (
                  <p className="text-[13.5px] py-6 text-center" style={{ color: T.muted }}>No incomplete orders found.</p>
                ) : (
                  incFiltered.map((o) => (
                    <Link
                      key={o.id}
                      href={`/orders/incomplete/${o.id}`}
                      className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px_120px_100px_110px] gap-2 sm:gap-3 items-center px-3 py-3.5 transition-all duration-150 rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]"
                      style={{ borderBottom: `1px solid ${T.borderSoft}` }}
                    >
                      <div className="min-w-0">
                        <span className="text-[14px] font-medium" style={{ color: T.text }}>{o.customerName}</span>
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
              </Card>
            )}
          </>
        );
      })()}
    </>
  );

  function setSortBy(val: string) {
    setSort(val as SortKey);
    setPage(0);
  }
}
