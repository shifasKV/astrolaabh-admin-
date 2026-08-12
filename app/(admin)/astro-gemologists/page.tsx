"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader, Card, Chip, StatCard, GoldBtn, Modal, Input, SearchFilter } from "@/components/ui";
import { T } from "@/lib/theme";
import { EXPERT_PROFILES, MOCK_CONSULTATIONS, MOCK_STONE_RECOMMENDATIONS } from "@/lib/mock";
import { inr } from "@/lib/types";

function getExpertStats(expertId: string) {
  const consultations = MOCK_CONSULTATIONS.filter((c) => c.expertId === expertId);
  const upcoming = consultations.filter((c) => c.status === "scheduled").length;
  const pendingSummaries = consultations.filter((c) => c.status === "summary_pending").length;
  const completed = consultations.filter((c) => c.status === "closed" || c.status === "completed").length;
  const recommendations = MOCK_STONE_RECOMMENDATIONS.filter((r) => r.expertId === expertId).length;

  return { upcoming, pendingSummaries, completed, recommendations };
}

export default function AstroGemologistsPage() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [newExpert, setNewExpert] = useState({ name: "", email: "", phone: "" });
  const [search, setSearch] = useState("");

  const totalUpcoming = MOCK_CONSULTATIONS.filter((c) => c.status === "scheduled").length;
  const totalPendingSummaries = MOCK_CONSULTATIONS.filter((c) => c.status === "summary_pending").length;
  const totalRecommendations = MOCK_STONE_RECOMMENDATIONS.length;

  return (
    <>
      <PageHeader
        title="Astro-Gemologists"
        sub="Manage experts — their schedules, consultations, and performance"
        action={<GoldBtn onClick={() => setShowModal(true)}>+ New Astro-Gemologist</GoldBtn>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Active experts" value={EXPERT_PROFILES.filter((e) => e.status === "active").length} />
        <StatCard label="Upcoming sessions" value={totalUpcoming} onClick={() => router.push("/consultations")} />
        <StatCard label="Summaries pending" value={totalPendingSummaries} sub={totalPendingSummaries > 0 ? "action needed" : undefined} onClick={() => router.push("/consultations")} />
        <StatCard label="Recommendations" value={totalRecommendations} onClick={() => router.push(`/astro-gemologists/${EXPERT_PROFILES[0]?.id}/recommendations`)} />
      </div>

      <div className="mb-4">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search name, specialization…" />
      </div>

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
                    <Chip tone={expert.status === "active" ? "good" : "muted"}>{expert.status}</Chip>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>Upcoming</div>
                    <div className="text-[15px] font-semibold mt-0.5" style={{ color: T.text }}>{stats.upcoming}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>Pending summaries</div>
                    <div className="text-[15px] font-semibold mt-0.5" style={{ color: stats.pendingSummaries > 0 ? T.danger : T.text }}>{stats.pendingSummaries}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>Completed</div>
                    <div className="text-[15px] font-semibold mt-0.5" style={{ color: T.text }}>{stats.completed}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider" style={{ color: T.faint }}>Recommendations</div>
                    <div className="text-[15px] font-semibold mt-0.5" style={{ color: T.text }}>{stats.recommendations}</div>
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Astro-Gemologist">
        <div className="space-y-4">
          <Input value={newExpert.name} onChange={(v) => setNewExpert((p) => ({ ...p, name: v }))} label="Full name" placeholder="Pt. Name Surname" />
          <Input value={newExpert.email} onChange={(v) => setNewExpert((p) => ({ ...p, email: v }))} label="Email" type="email" placeholder="name@astrolaabh.house" />
          <Input value={newExpert.phone} onChange={(v) => setNewExpert((p) => ({ ...p, phone: v }))} label="Phone number" placeholder="+91 98765 43210" />
          <div className="pt-2">
            <GoldBtn onClick={() => setShowModal(false)}>Create expert</GoldBtn>
          </div>
        </div>
      </Modal>
    </>
  );
}
