"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, Chip, StatCard, GoldBtn, ToolbarSearch, SortMenu, InlineFilter, MultiCheck, EmptyState, TableSkeleton } from "@/components/ui";

const STATUS_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
const STATUS_OPTIONS = [{ value: "active", label: "Active" }, { value: "deactivated", label: "Deactivated" }];

const NAME_SORT = [
  { value: "name_asc", label: "Name A to Z" },
  { value: "name_desc", label: "Name Z to A" },
];
import { T } from "@/lib/theme";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import { EXPERT_PROFILES, MOCK_CONSULTATIONS, MOCK_STONE_RECOMMENDATIONS } from "@/lib/mock";
import { inr } from "@/lib/types";

function getExpertStats(expertId: string) {
  const consultations = MOCK_CONSULTATIONS.filter((c) => c.expertId === expertId);
  const completed = consultations.filter((c) => c.status === "closed" || c.status === "completed").length;
  const purchases = MOCK_STONE_RECOMMENDATIONS.filter((r) => r.expertId === expertId && r.status === "converted_to_order").length;
  const pendingSummaries = consultations.filter((c) => c.status === "summary_pending").length;
  const totalCommission = completed * 5000 * 0.15;
  const commissionDue = pendingSummaries * 5000 * 0.15;

  return { completed, purchases, pendingSummaries, totalCommission, commissionDue };
}

export default function AstroGemologistsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name_asc");
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const loading = useSimulatedLoad();

  const totalUpcoming = MOCK_CONSULTATIONS.filter((c) => c.status === "scheduled").length;
  const totalPendingSummaries = MOCK_CONSULTATIONS.filter((c) => c.status === "summary_pending").length;
  const totalNoShows = MOCK_CONSULTATIONS.filter((c) => c.status === "no_show" && c.noShowBy === "expert").length;
  const totalRecommendations = MOCK_STONE_RECOMMENDATIONS.length;

  const filtered = EXPERT_PROFILES.filter((ep) => {
    if (filterStatus.length && !filterStatus.includes(ep.status === "active" ? "active" : "deactivated")) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return ep.name.toLowerCase().includes(q) || ep.specialization.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => sort === "name_desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name));

  return (
    <>
      <div className="md:h-[calc(100dvh-78px)] md:flex md:flex-col md:min-h-0">
      <PageHeader
        title="Astro-Gemologists"
        action={<GoldBtn onClick={() => router.push("/astro-gemologists/create")}>+ New Astro-Gemologist</GoldBtn>}
      />



      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Active experts" value={EXPERT_PROFILES.filter((e) => e.status === "active").length} featured />
        <StatCard label="Upcoming sessions" value={totalUpcoming} onClick={() => router.push("/consultations")} />
        <StatCard label="Summaries pending" value={totalPendingSummaries} onClick={() => router.push("/consultations")} />
        <StatCard label="No show" value={totalNoShows} onClick={() => router.push("/consultations")} />
        <StatCard label="Recommendations" value={totalRecommendations} onClick={() => router.push(`/astro-gemologists/${EXPERT_PROFILES[0]?.id}/recommendations`)} />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <InlineFilter label="Status" icon={STATUS_ICON} count={filterStatus.length} width={200}>
          <MultiCheck options={STATUS_OPTIONS} value={filterStatus} onChange={setFilterStatus} />
        </InlineFilter>
        {filterStatus.length > 0 && (
          <button onClick={() => setFilterStatus([])} className="text-[12px] font-medium px-1.5 cursor-pointer hover:underline underline-offset-4 whitespace-nowrap" style={{ color: T.danger }}>Clear all</button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <ToolbarSearch value={search} onChange={setSearch} placeholder="Search name, specialization…" />
          <SortMenu value={sort} onChange={setSort} options={NAME_SORT} />
        </div>
      </div>

      {/* Experts table */}
      <Card className="!p-0 md:flex md:flex-col md:min-h-0">
        {loading ? (
          <TableSkeleton cols={8} rows={8} />
        ) : (
        <>
        <div
          className="hidden md:grid grid-cols-[minmax(240px,1.4fr)_120px_150px_90px_90px_100px_110px_130px] gap-x-4 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]"
          style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
        >
          <span>Expert</span>
          <span>Experience</span>
          <span>Languages</span>
          <span className="text-right">Fee</span>
          <span className="text-right">Sessions</span>
          <span className="text-right">Purchases</span>
          <span className="text-right">Comm. due</span>
          <span>Status</span>
        </div>
        <div className="md:flex-1 md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none">
          {sorted.length === 0 ? (
            <EmptyState inline icon="search" title="No astro-gemologists" description="No experts match your search." />
          ) : (
            sorted.map((expert, idx) => {
              const stats = getExpertStats(expert.id);
              return (
                <Link
                  key={expert.id}
                  href={`/astro-gemologists/${expert.id}`}
                  className="group grid grid-cols-1 md:grid-cols-[minmax(240px,1.4fr)_120px_150px_90px_90px_100px_110px_130px] gap-2 md:gap-x-4 items-center px-4 py-2.5 transition-colors duration-150 last:rounded-b-[15px] even:bg-[rgba(89,82,54,0.025)] hover:!bg-[rgba(119,123,98,0.08)]"
                  style={{ borderBottom: idx < sorted.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-9 h-9 rounded-[11px] flex items-center justify-center text-[12px] font-semibold shrink-0"
                      style={{ background: T.accentFaint, border: `1px solid ${T.borderSoft}`, color: T.accent }}
                    >
                      {expert.name.split(" ").map((w) => w[0]).slice(-2).join("")}
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold truncate" style={{ color: T.text }}>{expert.name}</div>
                      <div className="text-[12px] truncate mt-px" style={{ color: T.muted }}>{expert.specialization}</div>
                    </div>
                  </div>
                  <span className="text-[12px] md:pl-0 pl-12" style={{ color: T.muted }}>{expert.experience}</span>
                  <span className="text-[12px] truncate md:pl-0 pl-12" style={{ color: T.muted }}>{expert.languages.join(", ")}</span>
                  <span className="text-[12.5px] font-medium tabular-nums md:text-right md:pl-0 pl-12" style={{ color: T.text }}>{inr(expert.fee)}</span>
                  <span className="text-[12.5px] tabular-nums md:text-right md:pl-0 pl-12" style={{ color: T.text }}>{stats.completed}</span>
                  <span className="text-[12.5px] tabular-nums md:text-right md:pl-0 pl-12" style={{ color: T.text }}>{stats.purchases}</span>
                  <span className="md:text-right md:pl-0 pl-12">
                    {stats.commissionDue > 0 ? (
                      <span
                        className="inline-flex items-center text-[12px] font-semibold tabular-nums px-2 py-0.5 rounded-[6px]"
                        style={{ background: "rgba(160,125,56,0.14)", color: "#8a6a2f" }}
                      >
                        {inr(stats.commissionDue)}
                      </span>
                    ) : (
                      <span className="text-[12.5px]" style={{ color: T.faint }}>—</span>
                    )}
                  </span>
                  <div className="md:pl-0 pl-12">
                    {expert.status === "active" && expert.calendlyStatus === "pending" ? (
                      <Chip tone="gold">Calendly pending</Chip>
                    ) : (
                      <Chip tone={expert.status === "active" ? "good" : "muted"}>{expert.status === "active" ? "Active" : "Deactivated"}</Chip>
                    )}
                  </div>
                </Link>
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
