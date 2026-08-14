"use client";
import { useState, useMemo } from "react";
import { PageHeader, Card, Chip, Tabs, SearchFilter, Select, Pagination } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_REFERRAL_EVENTS } from "@/lib/mock";
import { inr } from "@/lib/types";

const PER_PAGE = 8;

const TABS = [
  { key: "orders", label: "Orders" },
  { key: "bookings", label: "Bookings" },
];

type SortKey = "date_desc" | "date_asc" | "amount_high" | "amount_low";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function ReferralsPage() {
  const [tab, setTab] = useState("orders");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);

  const myReferrals = MOCK_REFERRAL_EVENTS.filter((r) => r.affiliateId === "aff_001");
  const orders = myReferrals.filter((r) => r.eventType === "order");
  const bookings = myReferrals.filter((r) => r.eventType === "booking");

  const filteredOrders = useMemo(() => {
    let items = [...orders];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((r) => r.maskedCustomer?.toLowerCase().includes(q) || r.campaign?.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
    }
    if (statusFilter) items = items.filter((r) => r.commissionStatus === statusFilter);
    items.sort((a, b) => {
      if (sort === "date_desc") return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
      if (sort === "date_asc") return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      if (sort === "amount_high") return (b.orderValue ?? 0) - (a.orderValue ?? 0);
      return (a.orderValue ?? 0) - (b.orderValue ?? 0);
    });
    return items;
  }, [orders, search, statusFilter, sort]);

  const filteredBookings = useMemo(() => {
    let items = [...bookings];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((r) => r.maskedCustomer?.toLowerCase().includes(q) || r.campaign?.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
    }
    if (statusFilter) items = items.filter((r) => r.commissionStatus === statusFilter);
    items.sort((a, b) => {
      if (sort === "date_desc") return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
      if (sort === "date_asc") return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      if (sort === "amount_high") return (b.orderValue ?? 0) - (a.orderValue ?? 0);
      return (a.orderValue ?? 0) - (b.orderValue ?? 0);
    });
    return items;
  }, [bookings, search, statusFilter, sort]);

  const activeItems = tab === "orders" ? filteredOrders : filteredBookings;
  const totalPages = Math.max(1, Math.ceil(activeItems.length / PER_PAGE));
  const paged = activeItems.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const orderSortOptions = [
    { value: "date_desc", label: "Newest" },
    { value: "date_asc", label: "Oldest" },
    { value: "amount_high", label: "Amount: High" },
    { value: "amount_low", label: "Amount: Low" },
  ];

  const bookingSortOptions = [
    { value: "date_desc", label: "Newest" },
    { value: "date_asc", label: "Oldest" },
  ];

  return (
    <>
      <PageHeader title="Referrals & conversions" sub="Track how your links perform — orders and consultation bookings" />

      <div className="mb-4">
        <Tabs
          tabs={TABS.map((t) => ({ ...t, count: t.key === "orders" ? orders.length : bookings.length }))}
          active={tab}
          onChange={(k) => { setTab(k); setSearch(""); setStatusFilter(""); setPage(0); setSort("date_desc"); }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5 mb-4">
        <div className="flex-1 min-w-[200px] max-w-[350px]">
          <SearchFilter search={search} onSearchChange={(v) => { setSearch(v); setPage(0); }} placeholder={tab === "orders" ? "Search customer, campaign…" : "Search customer, campaign…"} />
        </div>
        <div className="w-[150px]">
          <Select value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(0); }} compact placeholder="All status" options={[{ value: "", label: "All status" }, { value: "paid", label: "Paid" }, { value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }]} />
        </div>
        <div className="ml-auto w-[170px]">
          <Select value={sort} onChange={(v) => { setSort(v as SortKey); setPage(0); }} compact prefix="Sort: " options={orderSortOptions} />
        </div>
      </div>

      {/* ===== ORDERS TAB ===== */}
      {tab === "orders" && (
        <Card>
          <div className="hidden sm:grid grid-cols-[minmax(120px,1fr)_110px_120px_120px_100px_100px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase" style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
            <span>Order details</span>
            <span>Date</span>
            <span>Customer</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Commission</span>
            <span>Status</span>
          </div>
          {paged.length === 0 && <div className="text-center py-8 text-[13px]" style={{ color: T.muted }}>No orders found.</div>}
          {paged.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-1 sm:grid-cols-[minmax(120px,1fr)_110px_120px_120px_100px_100px] gap-2 sm:gap-3 items-center px-3 py-3 transition-all duration-150 rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <div className="min-w-0">
                <div className="text-[12px] font-medium" style={{ color: T.accent }}>{r.id.toUpperCase()}</div>
                <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>{r.campaign || "Direct referral"}</div>
              </div>
              <div className="text-[12px] tabular-nums" style={{ color: T.muted }}>{fmtDate(r.eventDate)}</div>
              <div className="text-[13px]" style={{ color: T.text }}>{r.maskedCustomer}</div>
              <div className="text-[13px] text-right tabular-nums font-medium" style={{ color: T.text }}>{r.orderValue ? inr(r.orderValue) : "—"}</div>
              <div className="text-[12px] text-right tabular-nums font-medium" style={{ color: r.commissionAmount ? T.accent : T.faint }}>{r.commissionAmount ? inr(r.commissionAmount) : "—"}</div>
              <div>
                <Chip tone={r.commissionStatus === "paid" ? "good" : r.commissionStatus === "approved" ? "gold" : "muted"}>
                  {r.commissionStatus ?? "—"}
                </Chip>
              </div>
            </div>
          ))}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} perPage={PER_PAGE} totalItems={activeItems.length} />
        </Card>
      )}

      {/* ===== BOOKINGS TAB ===== */}
      {tab === "bookings" && (
        <Card>
          <div className="hidden sm:grid grid-cols-[minmax(120px,1fr)_110px_120px_120px_100px_100px] gap-3 px-3 py-2 text-[11px] tracking-[0.06em] uppercase" style={{ color: T.faint, borderBottom: `1px solid ${T.borderSoft}` }}>
            <span>Booking details</span>
            <span>Date</span>
            <span>Customer</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Commission</span>
            <span>Status</span>
          </div>
          {paged.length === 0 && <div className="text-center py-8 text-[13px]" style={{ color: T.muted }}>No bookings found.</div>}
          {paged.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-1 sm:grid-cols-[minmax(120px,1fr)_110px_120px_120px_100px_100px] gap-2 sm:gap-3 items-center px-3 py-3 transition-all duration-150 rounded-[8px] hover:bg-[rgba(160,125,56,0.07)]"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <div className="min-w-0">
                <div className="text-[12px] font-medium" style={{ color: T.accent }}>{r.id.toUpperCase()}</div>
                <div className="text-[11px] mt-0.5" style={{ color: T.muted }}>{r.campaign || "Consultation booking"}</div>
              </div>
              <div className="text-[12px] tabular-nums" style={{ color: T.muted }}>{fmtDate(r.eventDate)}</div>
              <div className="text-[13px]" style={{ color: T.text }}>{r.maskedCustomer}</div>
              <div className="text-[13px] text-right tabular-nums font-medium" style={{ color: T.text }}>{r.orderValue ? inr(r.orderValue) : "—"}</div>
              <div className="text-[12px] text-right tabular-nums font-medium" style={{ color: r.commissionAmount ? T.accent : T.faint }}>{r.commissionAmount ? inr(r.commissionAmount) : "—"}</div>
              <div>
                <Chip tone={r.commissionStatus === "paid" ? "good" : r.commissionStatus === "approved" ? "gold" : "muted"}>
                  {r.commissionStatus ?? "—"}
                </Chip>
              </div>
            </div>
          ))}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} perPage={PER_PAGE} totalItems={activeItems.length} />
        </Card>
      )}
    </>
  );
}
