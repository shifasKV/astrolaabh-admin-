"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, StatCard, Chip, GoldBtn, ToolbarSearch, SortMenu, InlineFilter, MultiCheck, EmptyState, TableSkeleton, MobileListCard, Monogram } from "@/components/ui";

const STATUS_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
const AFF_STATUS_OPTIONS = [{ value: "active", label: "Active" }, { value: "under_review", label: "Under review" }, { value: "deactivated", label: "Deactivated" }];

const NAME_SORT = [
  { value: "name_asc", label: "Name A to Z" },
  { value: "name_desc", label: "Name Z to A" },
];
import { T } from "@/lib/theme";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import { MOCK_AFFILIATES, MOCK_CUSTOMERS, MOCK_ORDERS, MOCK_CONSULTATIONS } from "@/lib/mock";
import { inr } from "@/lib/types";

function getAffiliateStats(affiliate: typeof MOCK_AFFILIATES[number]) {
  const referredCustomers = MOCK_CUSTOMERS.filter((c) => c.affiliateCode === affiliate.code);
  const customerIds = new Set(referredCustomers.map((c) => c.id));
  const orders = MOCK_ORDERS.filter((o) => customerIds.has(o.customerId));
  const consultations = MOCK_CONSULTATIONS.filter((c) => customerIds.has(c.customerId));
  const rate = affiliate.commissionRate / 100;
  const totalCommission =
    orders.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + Math.round(o.total * rate), 0) +
    consultations.filter((c) => c.paymentStatus === "paid").reduce((s, c) => s + Math.round((c.fee ?? 0) * rate), 0);

  return {
    purchases: orders.length,
    consultations: consultations.length,
    registrations: referredCustomers.length,
    pendingCommission: totalCommission,
  };
}

export default function AffiliatesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending">("all");
  const [sort, setSort] = useState("name_asc");
  const [filterStatusToolbar, setFilterStatusToolbar] = useState<string[]>([]);
  const loading = useSimulatedLoad();

  const totalRegs = MOCK_AFFILIATES.reduce((s, a) => s + a.totalRegistrations, 0);
  const totalPurchases = MOCK_AFFILIATES.reduce((s, a) => s + a.totalPurchases, 0);
  const activeCount = MOCK_AFFILIATES.filter((a) => a.status === "active").length;
  const pendingCount = MOCK_AFFILIATES.filter((a) => a.status === "under_review").length;

  const filtered = MOCK_AFFILIATES.filter((a) => {
    if (statusFilter === "active" && a.status !== "active") return false;
    if (statusFilter === "pending" && a.status !== "under_review") return false;
    if (filterStatusToolbar.length && !filterStatusToolbar.includes(a.status)) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => sort === "name_desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <PageHeader
        title="Affiliate operations"
        action={<GoldBtn onClick={() => router.push("/affiliates/create")}>+ New Affiliate</GoldBtn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div
          className="rounded-[12px] p-5 text-left transition-all duration-200 cursor-pointer"
          style={{
            background: statusFilter === "active" ? `${T.accent}14` : T.card,
            border: `1.5px solid ${statusFilter === "active" ? T.accent : T.border}`,
            boxShadow: statusFilter === "active" ? `0 0 0 1px ${T.accent}30` : T.shadow,
          }}
          onClick={() => setStatusFilter(statusFilter === "active" ? "all" : "active")}
        >
          <div className="text-[11px] tracking-[0.08em] uppercase font-semibold mb-1.5" style={{ color: T.faint }}>Active affiliates</div>
          <div className="text-[22px] font-bold tabular-nums" style={{ color: T.text }}>{activeCount}</div>
        </div>
        <div
          className="rounded-[12px] p-5 text-left transition-all duration-200 cursor-pointer"
          style={{
            background: statusFilter === "pending" ? `${T.accent}14` : T.card,
            border: `1.5px solid ${statusFilter === "pending" ? T.accent : T.border}`,
            boxShadow: statusFilter === "pending" ? `0 0 0 1px ${T.accent}30` : T.shadow,
          }}
          onClick={() => setStatusFilter(statusFilter === "pending" ? "all" : "pending")}
        >
          <div className="text-[11px] tracking-[0.08em] uppercase font-semibold mb-1.5" style={{ color: T.faint }}>Pending for approval</div>
          <div className="text-[22px] font-bold tabular-nums" style={{ color: T.text }}>{pendingCount}</div>
        </div>
        <StatCard label="Referred registrations" value={totalRegs} />
        <StatCard label="Referred purchases" value={totalPurchases} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <InlineFilter label="Status" icon={STATUS_ICON} count={filterStatusToolbar.length} width={210}>
          <MultiCheck options={AFF_STATUS_OPTIONS} value={filterStatusToolbar} onChange={setFilterStatusToolbar} />
        </InlineFilter>
        {filterStatusToolbar.length > 0 && (
          <button onClick={() => setFilterStatusToolbar([])} className="text-[12px] font-medium px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap" style={{ color: T.danger }}>Clear all</button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <ToolbarSearch value={search} onChange={setSearch} placeholder="Search name, code, email…" />
          <SortMenu value={sort} onChange={setSort} options={NAME_SORT} />
        </div>
      </div>

      <Card className="!p-0 md:flex md:flex-col md:min-h-0">
        {loading ? (
          <TableSkeleton cols={8} rows={8} />
        ) : (
        <>
        <div
          className="hidden md:grid grid-cols-[minmax(220px,1.3fr)_120px_70px_120px_110px_110px_130px_140px] gap-x-4 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]"
          style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
        >
          <span>Affiliate</span>
          <span>Code</span>
          <span className="text-right">Rate</span>
          <span className="text-right">Registrations</span>
          <span className="text-right">Purchases</span>
          <span className="text-right">Consults</span>
          <span className="text-right">Commission</span>
          <span>Status</span>
        </div>
        <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">
          {sorted.length === 0 ? (
            <EmptyState inline icon="search" title="No affiliates" description="No affiliates match your search." />
          ) : (
            sorted.map((a, idx) => {
              const stats = getAffiliateStats(a);
              return (
                <div key={a.id}>
                <MobileListCard
                  className="md:hidden"
                  href={`/affiliates/${a.id}`}
                  leading={<Monogram name={a.name} />}
                  title={a.name}
                  right={stats.pendingCommission > 0 ? inr(stats.pendingCommission) : undefined}
                  rightSub={stats.pendingCommission > 0 ? "commission due" : undefined}
                  sub={`${a.code} · ${a.email}`}
                  status={{
                    label: a.status.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
                    tone: a.status === "active" ? "good" : a.status === "under_review" ? "gold" : "danger",
                    extra: `${a.commissionRate}%`,
                  }}
                  facts={[{ label: "registrations", value: stats.registrations }]}
                />
                <Link
                  href={`/affiliates/${a.id}`}
                  className="group hidden md:grid md:grid-cols-[minmax(220px,1.3fr)_120px_70px_120px_110px_110px_130px_140px] gap-2 md:gap-x-4 items-center px-4 py-2.5 transition-colors duration-150 last:rounded-b-[15px] even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
                  style={{ borderBottom: idx < sorted.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-9 h-9 rounded-[11px] flex items-center justify-center text-[12px] font-semibold shrink-0"
                      style={{ background: T.accentFaint, border: `1px solid ${T.borderSoft}`, color: T.accent }}
                    >
                      {a.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{a.name}</div>
                      <div className="text-[12px] truncate mt-px" style={{ color: T.muted }}>{a.email}</div>
                    </div>
                  </div>
                  <span className="text-[11.5px] font-medium tracking-[0.05em] uppercase tabular-nums md:pl-0 pl-12" style={{ color: T.accent }}>{a.code}</span>
                  <span className="text-[12.5px] tabular-nums md:text-right md:pl-0 pl-12" style={{ color: T.muted }}>{a.commissionRate}%</span>
                  <span className="text-[12.5px] tabular-nums md:text-right md:pl-0 pl-12" style={{ color: T.text }}>{stats.registrations}</span>
                  <span className="text-[12.5px] tabular-nums md:text-right md:pl-0 pl-12" style={{ color: T.text }}>{stats.purchases}</span>
                  <span className="text-[12.5px] tabular-nums md:text-right md:pl-0 pl-12" style={{ color: T.text }}>{stats.consultations}</span>
                  <span className="md:text-right md:pl-0 pl-12">
                    {stats.pendingCommission > 0 ? (
                      <span
                        className="inline-flex items-center text-[12px] font-semibold tabular-nums px-2 py-0.5 rounded-[6px]"
                        style={{ background: "rgba(160,125,56,0.14)", color: "#8a6a2f" }}
                      >
                        {inr(stats.pendingCommission)}
                      </span>
                    ) : (
                      <span className="text-[12.5px]" style={{ color: T.faint }}>—</span>
                    )}
                  </span>
                  <div className="md:pl-0 pl-12">
                    <Chip tone={a.status === "active" ? "good" : a.status === "under_review" ? "gold" : "danger"}>
                      {a.status.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())}
                    </Chip>
                  </div>
                </Link>
                </div>
              );
            })
          )}
        </div>
        </>
        )}
      </Card>
      </div>
    </>
  );
}
