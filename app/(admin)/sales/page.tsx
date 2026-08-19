"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, Chip, StatCard, GoldBtn, ToolbarSearch, SortMenu, InlineFilter, MultiCheck, EmptyState, TableSkeleton, MobileListCard } from "@/components/ui";

const STATUS_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
const STATUS_OPTIONS = [{ value: "active", label: "Active" }, { value: "deactivated", label: "Deactivated" }];

const NAME_SORT = [
  { value: "name_asc", label: "Name A to Z" },
  { value: "name_desc", label: "Name Z to A" },
];
import { T } from "@/lib/theme";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import { MOCK_SALES_MEMBERS, MOCK_INCOMPLETE_ORDERS, MOCK_INCOMPLETE_CONSULTATIONS } from "@/lib/mock";

function getMemberStats(memberId: string) {
  const stoneLeads = MOCK_INCOMPLETE_ORDERS.filter((o) => o.assignedTo === memberId);
  const consultationLeads = MOCK_INCOMPLETE_CONSULTATIONS.filter((c) => c.assignedTo === memberId);
  const totalLeads = stoneLeads.length + consultationLeads.length;
  const activeLeads = [...stoneLeads, ...consultationLeads].filter((l) => l.leadStatus === "new" || l.leadStatus === "contacted" || l.leadStatus === "follow_up").length;
  const converted = [...stoneLeads, ...consultationLeads].filter((l) => l.leadStatus === "converted").length;
  return { totalLeads, activeLeads, converted, stoneLeads: stoneLeads.length, consultationLeads: consultationLeads.length };
}

export default function SalesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name_asc");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const loading = useSimulatedLoad();

  const totalActiveLeads = [...MOCK_INCOMPLETE_ORDERS, ...MOCK_INCOMPLETE_CONSULTATIONS].filter(
    (l) => l.assignedTo && (l.leadStatus === "new" || l.leadStatus === "contacted" || l.leadStatus === "follow_up"),
  ).length;
  const totalConverted = [...MOCK_INCOMPLETE_ORDERS, ...MOCK_INCOMPLETE_CONSULTATIONS].filter(
    (l) => l.assignedTo && l.leadStatus === "converted",
  ).length;
  const unassigned = [...MOCK_INCOMPLETE_ORDERS, ...MOCK_INCOMPLETE_CONSULTATIONS].filter((l) => !l.assignedTo).length;

  const filtered = MOCK_SALES_MEMBERS.filter((m) => {
    if (filterStatus.length && !filterStatus.includes(m.status === "active" ? "active" : "deactivated")) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => sort === "name_desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <PageHeader
        title="Sales"
        action={<GoldBtn onClick={() => router.push("/sales/create")}>+ New Sales Member</GoldBtn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Active members" value={MOCK_SALES_MEMBERS.filter((m) => m.status === "active").length} featured />
        <StatCard label="Active leads" value={totalActiveLeads} />
        <StatCard label="Converted" value={totalConverted} />
        <StatCard label="Unassigned leads" value={unassigned} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <InlineFilter label="Status" icon={STATUS_ICON} count={filterStatus.length} width={200}>
          <MultiCheck options={STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
        </InlineFilter>
        {filterStatus.length > 0 && (
          <button onClick={() => setFilterStatus([])} className="text-[12px] font-medium px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap" style={{ color: T.danger }}>Clear all</button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <ToolbarSearch value={search} onChange={setSearch} placeholder="Search name, role…" />
          <SortMenu value={sort} onChange={setSort} options={NAME_SORT} />
        </div>
      </div>

      <Card className="!p-0 md:flex md:flex-col md:min-h-0">
        {loading ? (
          <TableSkeleton cols={7} rows={8} />
        ) : (
        <>
        <div
          className="hidden md:grid grid-cols-[minmax(220px,1.3fr)_1fr_100px_90px_110px_140px_110px] gap-x-4 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]"
          style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
        >
          <span>Member</span>
          <span>Contact</span>
          <span className="text-right">Total leads</span>
          <span className="text-right">Active</span>
          <span className="text-right">Stone leads</span>
          <span className="text-right">Consult leads</span>
          <span>Status</span>
        </div>
        <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">
          {sorted.length === 0 ? (
            <EmptyState inline icon="search" title="No sales members" description="No members match your search." />
          ) : (
            sorted.map((member, idx) => {
              const stats = getMemberStats(member.id);
              return (
                <div key={member.id}>
                <MobileListCard
                  className="md:hidden"
                  href={`/sales/${member.id}`}
                  title={member.name}
                  sub={`${member.role} · ${member.email}`}
                  chips={<Chip tone={member.status === "active" ? "good" : "muted"}>{member.status === "active" ? "Active" : "Deactivated"}</Chip>}
                  facts={[{ label: "Total leads", value: stats.totalLeads }, { label: "Active leads", value: stats.activeLeads }]}
                />
                <Link
                  href={`/sales/${member.id}`}
                  className="group hidden md:grid md:grid-cols-[minmax(220px,1.3fr)_1fr_100px_90px_110px_140px_110px] gap-2 md:gap-x-4 items-center px-4 py-2.5 transition-colors duration-150 last:rounded-b-[15px] even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
                  style={{ borderBottom: idx < sorted.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-9 h-9 rounded-[11px] flex items-center justify-center text-[12px] font-semibold shrink-0"
                      style={{ background: T.accentFaint, border: `1px solid ${T.borderSoft}`, color: T.accent }}
                    >
                      {member.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{member.name}</div>
                      <div className="text-[12px] truncate mt-px" style={{ color: T.muted }}>{member.role}</div>
                    </div>
                  </div>
                  <span className="text-[12px] truncate md:pl-0 pl-12 tabular-nums" style={{ color: T.muted }}>
                    {member.email} <span style={{ color: T.faint }}>· {member.phone}</span>
                  </span>
                  <span className="text-[12.5px] tabular-nums md:text-right md:pl-0 pl-12" style={{ color: T.text }}>{stats.totalLeads}</span>
                  <span className="text-[12.5px] font-semibold tabular-nums md:text-right md:pl-0 pl-12" style={{ color: stats.activeLeads > 0 ? T.accent : T.faint }}>
                    {stats.activeLeads}
                  </span>
                  <span className="text-[12.5px] tabular-nums md:text-right md:pl-0 pl-12" style={{ color: T.text }}>{stats.stoneLeads}</span>
                  <span className="text-[12.5px] tabular-nums md:text-right md:pl-0 pl-12" style={{ color: T.text }}>{stats.consultationLeads}</span>
                  <div className="md:pl-0 pl-12">
                    <Chip tone={member.status === "active" ? "good" : "muted"}>{member.status === "active" ? "Active" : "Deactivated"}</Chip>
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
