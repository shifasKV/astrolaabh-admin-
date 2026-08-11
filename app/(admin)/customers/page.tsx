"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader, Card, StatCard, SearchFilter, GoldBtn } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CUSTOMERS, MOCK_ORDERS, MOCK_CONSULTATIONS } from "@/lib/mock";

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
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            className="flex flex-wrap items-center justify-between gap-3 py-3.5 row-interactive rounded-[9px] px-2 -mx-2"
            style={{ borderBottom: `1px solid ${T.borderSoft}` }}
          >
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-medium" style={{ color: T.text }}>{c.name}</div>
              <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>
                {c.email} · {c.phone}
              </div>
            </div>
          </Link>
        ))}
      </Card>
    </>
  );
}
