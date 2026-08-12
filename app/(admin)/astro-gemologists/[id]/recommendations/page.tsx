"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, Chip, SearchFilter, Pagination, Select } from "@/components/ui";
import { T } from "@/lib/theme";
import { EXPERT_PROFILES, MOCK_STONE_RECOMMENDATIONS, MOCK_ORDERS, MOCK_PAYMENTS } from "@/lib/mock";
import { inr } from "@/lib/types";
import type { StoneRecommendation } from "@/lib/types";

const PAGE_SIZE = 10;

type SortKey = "date_desc" | "date_asc";

function getEstimatedPrice(rec: StoneRecommendation): number | null {
  if (rec.orderId) {
    const order = MOCK_ORDERS.find((o) => o.id === rec.orderId);
    if (order) return order.total;
  }
  const payment = MOCK_PAYMENTS.find((p) => p.linkedRecommendationId === rec.id);
  if (payment) return payment.amount;
  return null;
}

export default function ExpertRecommendationsPage() {
  const { id } = useParams<{ id: string }>();
  const expert = EXPERT_PROFILES.find((e) => e.id === id);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [filterStone, setFilterStone] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [sort, setSort] = useState<SortKey>("date_desc");

  const allRecs = MOCK_STONE_RECOMMENDATIONS.filter((r) => r.expertId === id);

  const stones = [...new Set(allRecs.map((r) => r.gemstone))].sort();
  const customers = [...new Set(allRecs.map((r) => r.customerName))].sort();

  const filtered = allRecs
    .filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.customerName.toLowerCase().includes(q) &&
          !r.gemstone.toLowerCase().includes(q) &&
          !r.purpose.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      if (filterStone && r.gemstone !== filterStone) return false;
      if (filterStatus === "converted_to_order" && r.status !== "converted_to_order") return false;
      if (filterStatus === "submitted" && r.status === "converted_to_order") return false;
      if (filterCustomer && r.customerName !== filterCustomer) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "date_asc") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title={`Recommendations`}
        sub={`All stone recommendations by ${expert?.name ?? "this expert"} (${allRecs.length} total)`}
        back={{ label: expert?.name ?? "Profile", href: `/astro-gemologists/${id}` }}
      />

      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex-1 min-w-[200px]">
            <SearchFilter
              search={search}
              onSearchChange={(v) => { setSearch(v); setPage(0); }}
              placeholder="Search gemstone, customer…"
            />
          </div>
          <Select
            value={filterStone}
            onChange={(v) => { setFilterStone(v); setPage(0); }}
            compact
            placeholder="Stone: All"
            prefix="Stone: "
            options={[
              { value: "", label: "All" },
              ...stones.map((s) => ({ value: s, label: s })),
            ]}
            className="w-[200px]"
          />
          <Select
            value={filterStatus}
            onChange={(v) => { setFilterStatus(v); setPage(0); }}
            compact
            placeholder="Status: All"
            prefix="Status: "
            options={[
              { value: "", label: "All" },
              { value: "submitted", label: "Submitted" },
              { value: "converted_to_order", label: "Converted" },
            ]}
            className="w-[150px]"
          />
          <Select
            value={filterCustomer}
            onChange={(v) => { setFilterCustomer(v); setPage(0); }}
            compact
            placeholder="Customer: All"
            prefix="Customer: "
            options={[
              { value: "", label: "All" },
              ...customers.map((c) => ({ value: c, label: c })),
            ]}
            className="w-[180px]"
          />
          <div className="flex items-center gap-1.5 h-9 px-3 rounded-[9px] text-[12px]" style={{ border: `1px solid ${T.borderSoft}`, color: T.muted }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 6h18M6 12h12M9 18h6"/></svg>
            <Select
              value={sort}
              onChange={(val) => { setSort(val as SortKey); setPage(0); }}
              compact
              options={[
                { value: "date_desc", label: "Newest" },
                { value: "date_asc", label: "Oldest" },
              ]}
              className="w-[110px]"
            />
          </div>
        </div>
      </div>

      <Card>
        {paginated.length === 0 ? (
          <p className="text-[13.5px] py-8 text-center" style={{ color: T.muted }}>No recommendations found.</p>
        ) : (
          paginated.map((r) => {
            const href = r.orderId ? `/orders/${r.orderId}` : `/consultations/${r.consultationId}`;
            const price = getEstimatedPrice(r);
            return (
              <Link
                key={r.id}
                href={href}
                className="flex items-center justify-between gap-4 py-3.5 row-interactive rounded-[9px] px-2 -mx-2"
                style={{ borderBottom: `1px solid ${T.borderSoft}` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[14px] font-medium" style={{ color: T.accent }}>{r.gemstone}</span>
                    <span className="text-[11px]" style={{ color: T.faint }}>·</span>
                    <span className="text-[13px]" style={{ color: T.text }}>{r.customerName}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[12px]" style={{ color: T.muted }}>
                    <span>{r.weightRange}</span>
                    {price != null && (
                      <>
                        <span style={{ color: T.faint }}>·</span>
                        <span className="tabular-nums font-medium" style={{ color: T.text }}>{inr(price)}</span>
                      </>
                    )}
                    <span style={{ color: T.faint }}>·</span>
                    <span>{new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>
                <Chip tone={r.status === "converted_to_order" ? "good" : "gold"}>
                  {r.status === "converted_to_order" ? "Converted to order" : "Submitted"}
                </Chip>
              </Link>
            );
          })
        )}
        <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} onPageChange={setPage} />
      </Card>
    </>
  );
}
