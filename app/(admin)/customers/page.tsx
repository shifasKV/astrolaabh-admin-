"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader, Card, StatCard, SearchFilter, GoldBtn, Chip } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CUSTOMERS, MOCK_ORDERS, MOCK_CONSULTATIONS } from "@/lib/mock";
import { inr } from "@/lib/types";

export default function CustomersPage() {
  const [search, setSearch] = useState("");

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
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q) || c.birthPlace.toLowerCase().includes(q);
  });

  return (
    <>
      <PageHeader
        title="Customer records"
        sub="Unified customer context — birth details, chart, consultations, orders, and timeline"
        action={
          <Link href="/customers/create"><GoldBtn>+ Add customer</GoldBtn></Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total customers" value={stats.total} />
        <StatCard label="With chart" value={stats.withChart} />
        <StatCard label="With orders" value={stats.withOrders} />
        <StatCard label="With consultations" value={stats.withConsultations} />
        <StatCard label="Affiliate referred" value={stats.withAffiliate} />
      </div>

      <div className="mb-4">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search name, email, phone, location…" />
      </div>

      <Card>
        <div
          className="hidden md:grid grid-cols-[minmax(240px,1.4fr)_150px_minmax(140px,1fr)_90px_90px_120px_24px] gap-x-4 px-3 py-2.5 rounded-[8px] text-[11px] tracking-[0.07em] uppercase font-semibold"
          style={{ color: T.muted, background: "rgba(89,82,54,0.035)" }}
        >
          <span>Customer</span>
          <span>Phone</span>
          <span>Birth place</span>
          <span className="text-right">Orders</span>
          <span className="text-right">Consults</span>
          <span className="text-right">Total spent</span>
          <span />
        </div>
        {filtered.map((c, i, arr) => {
          const a = activity[c.id] ?? { orders: 0, consults: 0, spent: 0 };
          return (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="group grid md:grid-cols-[minmax(240px,1.4fr)_150px_minmax(140px,1fr)_90px_90px_120px_24px] grid-cols-1 gap-x-4 gap-y-1 items-center px-3 py-3 rounded-[8px] transition-colors hover:bg-[rgba(160,125,56,0.06)]"
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
                  <span className="block text-[14px] font-medium truncate group-hover:underline" style={{ color: T.text }}>{c.name}</span>
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
              <span className="hidden md:block transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: T.faint }}>→</span>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-[13.5px] py-6 text-center" style={{ color: T.muted }}>No customers match the search.</p>
        )}
      </Card>
    </>
  );
}
