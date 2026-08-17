"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, Chip, StatCard, GoldBtn, SearchFilter, CardSkeleton } from "@/components/ui";
import { T } from "@/lib/theme";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 700); return () => clearTimeout(t); }, []);

  const totalUpcoming = MOCK_CONSULTATIONS.filter((c) => c.status === "scheduled").length;
  const totalPendingSummaries = MOCK_CONSULTATIONS.filter((c) => c.status === "summary_pending").length;
  const totalNoShows = MOCK_CONSULTATIONS.filter((c) => c.status === "no_show" && c.noShowBy === "expert").length;
  const totalRecommendations = MOCK_STONE_RECOMMENDATIONS.length;

  return (
    <>
      <PageHeader
        title="Astro-Gemologists"
        sub="Manage experts — their schedules, consultations, and performance"
        action={<GoldBtn onClick={() => router.push("/astro-gemologists/create")}>+ New Astro-Gemologist</GoldBtn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <StatCard label="Active experts" value={EXPERT_PROFILES.filter((e) => e.status === "active").length} />
        <StatCard label="Upcoming sessions" value={totalUpcoming} onClick={() => router.push("/consultations")} />
        <StatCard label="Summaries pending" value={totalPendingSummaries} onClick={() => router.push("/consultations")} />
        <StatCard label="No show" value={totalNoShows} onClick={() => router.push("/consultations")} />
        <StatCard label="Recommendations" value={totalRecommendations} onClick={() => router.push(`/astro-gemologists/${EXPERT_PROFILES[0]?.id}/recommendations`)} />
      </div>

      <div className="mb-4">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search name, specialization…" />
      </div>

      {loading ? (
        <CardSkeleton count={3} />
      ) : (
        <div className="grid gap-4">
          {EXPERT_PROFILES.filter((ep) => {
            if (!search) return true;
            const q = search.toLowerCase();
            return ep.name.toLowerCase().includes(q) || ep.specialization.toLowerCase().includes(q);
          }).map((expert) => {
            const stats = getExpertStats(expert.id);
            return (
              <Link key={expert.id} href={`/astro-gemologists/${expert.id}`}>
                <Card className="card-interactive cursor-pointer">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <span
                        className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-semibold shrink-0"
                        style={{ background: `${T.accent}18`, border: `1.5px solid ${T.accent}40`, color: T.accent }}
                      >
                        {expert.name[0]}
                      </span>
                      <div>
                        <div className="text-[14px] font-semibold" style={{ color: T.text }}>{expert.name}</div>
                        <div className="text-[13px] mt-0.5" style={{ color: T.muted }}>{expert.specialization}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[12px]" style={{ color: T.faint }}>{expert.experience}</span>
                          <span className="text-[12px]" style={{ color: T.faint }}>·</span>
                          <span className="text-[12px]" style={{ color: T.faint }}>{expert.languages.join(", ")}</span>
                          <span className="text-[12px]" style={{ color: T.faint }}>·</span>
                          <span className="text-[12px]" style={{ color: T.faint }}>{inr(expert.fee)}/session</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {expert.status === "active" && expert.calendlyStatus === "pending" ? (
                        <Chip tone="gold">Calendly pending</Chip>
                      ) : (
                        <Chip tone={expert.status === "active" ? "good" : "muted"}>{expert.status}</Chip>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                    {[
                      { label: "Consultations", value: stats.completed, status: "completed", tone: T.good },
                      { label: "Purchases", value: stats.purchases, status: "completed", tone: T.good },
                      { label: "Recommendation", value: stats.pendingSummaries, status: "due", tone: stats.pendingSummaries > 0 ? T.danger : T.good },
                      { label: "Commission", value: inr(stats.commissionDue), status: "due", tone: T.accent },
                    ].map((s, i) => (
                      <div key={i}>
                        <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>{s.label}</div>
                        <div className="text-[15px] font-semibold mt-0.5 tabular-nums" style={{ color: T.text }}>{s.value}</div>
                        <div className="text-[10px] font-medium mt-0.5" style={{ color: s.tone }}>{s.status}</div>
                      </div>
                    ))}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

    </>
  );
}
