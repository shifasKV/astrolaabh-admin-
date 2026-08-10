"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Chip, SearchFilter, Tabs, GoldBtn, Select } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_ORDERS } from "@/lib/mock";
import { inr } from "@/lib/types";

const TABS = [
  { key: "all", label: "All orders" },
  { key: "pending_payment", label: "Payment pending" },
  { key: "not_shipped", label: "Not shipped" },
  { key: "cert_missing", label: "Cert missing" },
  { key: "energ_missing", label: "Energ missing" },
];

type SortKey = "date_desc" | "date_asc" | "price_desc" | "price_asc";

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterShipment, setFilterShipment] = useState("");

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
    if (filterCustomer && !o.customerName.toLowerCase().includes(filterCustomer.toLowerCase())) return false;
    return true;
  }).filter((o) => {
    if (!filterShipment) return true;
    if (filterShipment === "not_shipped") return o.shopifyStatus !== "fulfilled" && !o.tracking;
    if (filterShipment === "in_transit") return !!o.tracking && o.shopifyStatus !== "fulfilled";
    if (filterShipment === "delivered") return o.shopifyStatus === "fulfilled";
    return true;
  }).sort((a, b) => {
    if (sort === "date_desc") return new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime();
    if (sort === "date_asc") return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime();
    if (sort === "price_desc") return b.total - a.total;
    if (sort === "price_asc") return a.total - b.total;
    return 0;
  });

  const uniqueCustomers = [...new Set(MOCK_ORDERS.map((o) => o.customerName))];

  return (
    <>
      <PageHeader
        title="Orders & fulfilment"
        sub="Captured in Shopify · operational status and custody owned here"
        action={
          <div className="flex items-center gap-2.5">
            <Link href="/orders/create"><GoldBtn>+ Create order</GoldBtn></Link>
            <a href="https://admin.shopify.com/orders" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-[8px]" style={{ border: `1px solid ${T.border}`, color: T.good }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.good }} /> Open Shopify
            </a>
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
                      : undefined,
          }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex-1 min-w-[200px]">
            <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search orders, customers, products…" />
          </div>
          <Select
            value={filterShipment}
            onChange={setFilterShipment}
            compact
            placeholder="Shipment status: All"
            prefix="Shipment status: "
            options={[
              { value: "", label: "All" },
              { value: "not_shipped", label: "Not shipped" },
              { value: "in_transit", label: "In transit" },
              { value: "delivered", label: "Delivered" },
            ]}
            className="w-[220px]"
          />
          <Select
            value={filterCustomer}
            onChange={setFilterCustomer}
            searchable
            compact
            placeholder="All customers"
            options={[
              { value: "", label: "All customers" },
              ...uniqueCustomers.map((name) => ({ value: name, label: name })),
            ]}
            className="w-[170px]"
          />
          <div className="flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-[12px]" style={{ border: `1px solid ${T.borderSoft}`, color: T.muted }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M6 12h12M9 18h6"/></svg>
            <Select
              value={sort}
              onChange={(val) => setSort(val as SortKey)}
              compact
              options={[
                { value: "date_desc", label: "Newest" },
                { value: "date_asc", label: "Oldest" },
                { value: "price_desc", label: "Price ↓" },
                { value: "price_asc", label: "Price ↑" },
              ]}
              className="w-[110px]"
            />
          </div>
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <p className="text-[13px] py-6 text-center" style={{ color: T.muted }}>No orders match your filters.</p>
        ) : (
          filtered.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex flex-wrap items-center justify-between gap-3 py-3.5 row-interactive rounded-[9px] px-2 -mx-2"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[11px] tracking-[0.06em] uppercase font-medium" style={{ color: T.accent }}>{o.id}</span>
                  <span className="text-[11px]" style={{ color: T.faint }}>{o.placedAt}</span>
                  {o.paymentStatus === "pending" && <Chip tone="gold">Payment pending</Chip>}
                  {o.certificateStatus === "missing" && o.paymentStatus === "paid" && <Chip tone="danger">Cert missing</Chip>}
                  {o.energisationStatus === "pending" && o.paymentStatus === "paid" && <Chip tone="danger">Energ pending</Chip>}
                </div>
                <div className="text-[13.5px] font-medium mt-0.5 truncate" style={{ color: T.text }}>
                  {o.customerName} · {o.items.map((i) => i.name).join(", ")}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Chip tone={o.shopifyStatus === "fulfilled" ? "good" : o.tracking ? "gold" : "muted"}>
                  {o.shopifyStatus === "fulfilled" ? "Delivered" : o.tracking ? "In transit" : "Not shipped"}
                </Chip>
                <span className="text-[14px] font-semibold tabular-nums" style={{ color: T.text }}>{inr(o.total)}</span>
              </div>
            </Link>
          ))
        )}
      </Card>
    </>
  );
}
