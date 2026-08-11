"use client";
import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Chip, StatCard, GhostBtn, Modal, Input, GoldBtn, SectionLink } from "@/components/ui";
import { T } from "@/lib/theme";
import { EXPERT_PROFILES, EXPERT_AVAILABILITY, MOCK_CONSULTATIONS, MOCK_STONE_RECOMMENDATIONS } from "@/lib/mock";
import { inr } from "@/lib/types";
import type { StoneRecommendation } from "@/lib/types";

function recommendationStatusLabel(rec: StoneRecommendation): string {
  return rec.status === "converted_to_order" ? "Converted to order" : "Submitted";
}

export default function AstroGemologistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const expert = EXPERT_PROFILES.find((e) => e.id === id);
  const availability = EXPERT_AVAILABILITY.find((e) => e.expertId === id);

  if (!expert) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-[14px]" style={{ color: T.muted }}>Expert not found.</p>
      </div>
    );
  }

  const consultations = MOCK_CONSULTATIONS.filter((c) => c.expertId === id);
  const upcoming = consultations.filter((c) => c.status === "scheduled");
  const pendingSummaries = consultations.filter((c) => c.status === "summary_pending");
  const completed = consultations.filter((c) => c.status === "closed" || c.status === "completed");
  const revenue = completed.reduce((sum, c) => sum + (c.fee ?? 0), 0);
  const recommendations = MOCK_STONE_RECOMMENDATIONS.filter((r) => r.expertId === id);

  const next7Days = availability?.availability.slice(0, 7) ?? [];
  const [isActive, setIsActive] = useState(expert.status === "active");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: expert.name,
    email: `${expert.name.split(" ").pop()?.toLowerCase()}@astrolaabh.house`,
    phone: "+91 98765 43210",
    specialization: expert.specialization,
    fee: String(expert.fee),
  });
  const [toast, setToast] = useState("");

  const scrollTo = useCallback((sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      {/* Back link */}
      <div className="mb-5">
        <Link href="/astro-gemologists" className="inline-flex items-center gap-1.5 text-[13px] font-medium hover:opacity-80 transition-opacity duration-200" style={{ color: T.accent }}>
          ← Astro-Gemologists
        </Link>
      </div>

      {/* Profile Card */}
      <div className="rounded-[14px] p-6 mb-6" style={{ background: `linear-gradient(135deg, ${T.card} 0%, ${T.panel} 100%)`, border: `1px solid ${T.border}` }}>
        <div className="flex flex-wrap items-start gap-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-[20px] font-bold shrink-0"
            style={{ background: `${T.accent}15`, border: `2px solid ${T.accent}40`, color: T.accent }}
          >
            {expert.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-[17px] font-semibold" style={{ color: T.text }}>{expert.name}</span>
              <Chip tone={isActive ? "good" : "danger"}>{isActive ? "active" : "inactive"}</Chip>
            </div>
            <div className="text-[13px] mt-1" style={{ color: T.muted }}>{expert.specialization}</div>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-[12px]" style={{ color: T.faint }}>
              <span>{expert.experience}</span>
              <span>·</span>
              <span>{expert.languages.join(", ")}</span>
              <span>·</span>
              <span style={{ color: T.accent }}>{inr(expert.fee)}/session</span>
              <span>·</span>
              <span>Joined {new Date(expert.joinedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <GhostBtn onClick={() => setShowEditModal(true)}>Edit</GhostBtn>
            <GhostBtn onClick={() => {
              if (isActive) {
                setIsActive(false);
                setToast("Gemologist deactivated");
                setTimeout(() => setToast(""), 3000);
              } else {
                setIsActive(true);
              }
            }}>
              {isActive ? "Deactivate" : "Activate"}
            </GhostBtn>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Upcoming" value={upcoming.length} sub="next sessions" onClick={() => scrollTo("section-upcoming")} />
        <StatCard label="Summaries due" value={pendingSummaries.length} sub={pendingSummaries.length > 0 ? "action needed" : "all clear"} onClick={() => scrollTo("section-completed")} />
        <StatCard label="Completed" value={completed.length} sub="total sessions" onClick={() => scrollTo("section-completed")} />
        <StatCard label="Recommendations" value={recommendations.length} sub="given" onClick={() => scrollTo("section-recommendations")} />
      </div>

      {/* Two-column: Upcoming + Availability */}
      <div id="section-upcoming" className="grid lg:grid-cols-2 gap-5 mb-6 scroll-mt-6">
        {/* Upcoming Schedule */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] tracking-[0.08em] uppercase font-medium" style={{ color: T.faint }}>Upcoming schedule</span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: `${T.accent}12`, color: T.accent }}>{upcoming.length}</span>
              <SectionLink href="/consultations" />
            </div>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-[13px] py-6 text-center" style={{ color: T.muted }}>No upcoming sessions.</p>
          ) : (
            upcoming.map((c) => (
              <Link
                key={c.id}
                href={`/consultations/${c.id}`}
                className="flex items-center justify-between gap-4 py-3.5 row-interactive rounded-[9px] px-2 -mx-2"
                style={{ borderBottom: `1px solid ${T.borderSoft}` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] tracking-[0.06em] uppercase" style={{ color: T.accent }}>{c.id}</span>
                    <span className="text-[11px]" style={{ color: T.faint }}>·</span>
                    <span className="text-[13px] font-medium" style={{ color: T.text }}>{c.customerName}</span>
                  </div>
                  <div className="text-[12px]" style={{ color: T.muted }}>{c.expertName}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Chip tone="gold">Scheduled</Chip>
                  <div className="text-[11px] tabular-nums" style={{ color: T.faint }}>
                    {new Date(c.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </div>
                </div>
              </Link>
            ))
          )}
        </Card>

        {/* Available Slots */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] tracking-[0.08em] uppercase font-medium" style={{ color: T.faint }}>Availability</span>
            <div className="flex items-center gap-3">
              <span className="text-[11px]" style={{ color: T.faint }}>Next 7 days</span>
              <Link
                href={`/astro-gemologists/${id}/availability`}
                className="text-[11px] font-medium hover:opacity-80 transition-opacity"
                style={{ color: T.accent }}
              >
                Edit →
              </Link>
            </div>
          </div>
          {next7Days.length === 0 ? (
            <p className="text-[13px] py-6 text-center" style={{ color: T.muted }}>No availability data.</p>
          ) : (
            <div className="space-y-2.5">
              {next7Days.map((day) => {
                const freeSlots = day.slots.filter((s) => s.available).length;
                const totalSlots = day.slots.length;
                return (
                  <div key={day.date} className="flex items-center justify-between py-2 px-3 rounded-[10px]" style={{ background: T.panel }}>
                    <div>
                      <div className="text-[12px] font-medium" style={{ color: T.text }}>
                        {new Date(day.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {day.slots.map((slot) => (
                          <span
                            key={slot.time}
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                              background: slot.available ? `${T.accent}15` : `${T.faint}10`,
                              color: slot.available ? T.accent : T.faint,
                              border: `1px solid ${slot.available ? `${T.accent}30` : `${T.faint}15`}`,
                            }}
                          >
                            {slot.time}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <div className="text-[13px] font-semibold" style={{ color: freeSlots > 0 ? T.accent : T.faint }}>{freeSlots}</div>
                      <div className="text-[10px]" style={{ color: T.faint }}>of {totalSlots}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Completed Consultations */}
      <Card className="mb-6 scroll-mt-6" id="section-completed">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] tracking-[0.08em] uppercase font-medium" style={{ color: T.faint }}>Recent completed</span>
          <SectionLink href={`/consultations`} />
        </div>
        {completed.length === 0 ? (
          <p className="text-[13px] py-6 text-center" style={{ color: T.muted }}>No completed sessions yet.</p>
        ) : (
          completed.slice(0, 5).map((c) => (
            <Link
              key={c.id}
              href={`/consultations/${c.id}`}
              className="flex items-center justify-between gap-4 py-3.5 row-interactive rounded-[9px] px-2 -mx-2"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[11px] tracking-[0.06em] uppercase" style={{ color: T.accent }}>{c.id}</span>
                  <span className="text-[11px]" style={{ color: T.faint }}>·</span>
                  <span className="text-[13px] font-medium" style={{ color: T.text }}>{c.customerName}</span>
                  {!c.summarySubmittedAt && <Chip tone="danger">Summary due</Chip>}
                </div>
                <div className="text-[12px]" style={{ color: T.muted }}>{c.expertName}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Chip tone="good">Completed</Chip>
                <div className="text-[11px] tabular-nums" style={{ color: T.faint }}>
                  {new Date(c.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            </Link>
          ))
        )}
      </Card>

      {/* Recommendations Given */}
      <Card id="section-recommendations" className="scroll-mt-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] tracking-[0.08em] uppercase font-medium" style={{ color: T.faint }}>Recommendations given</span>
          <SectionLink href={`/astro-gemologists/${id}/recommendations`} />
        </div>
        {recommendations.length === 0 ? (
          <p className="text-[13px] py-6 text-center" style={{ color: T.muted }}>No recommendations yet.</p>
        ) : (
          recommendations.slice(0, 5).map((r) => {
            const href = r.orderId ? `/orders/${r.orderId}` : `/consultations/${r.consultationId}`;
            return (
              <Link
                key={r.id}
                href={href}
                className="flex items-center justify-between gap-4 py-3.5 row-interactive rounded-[9px] px-2 -mx-2"
                style={{ borderBottom: `1px solid ${T.borderSoft}` }}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                  <span className="text-[13px] font-semibold truncate" style={{ color: T.accent }}>{r.gemstone}</span>
                  <span className="text-[11px] shrink-0" style={{ color: T.faint }}>·</span>
                  <span className="text-[12px] truncate" style={{ color: T.muted }}>{r.customerName}</span>
                  <span className="text-[11px] shrink-0" style={{ color: T.faint }}>·</span>
                  <span className="text-[12px] shrink-0" style={{ color: T.muted }}>{r.weightRange}</span>
                </div>
                <div className="shrink-0">
                  <Chip tone={r.status === "converted_to_order" ? "good" : "gold"}>
                    {recommendationStatusLabel(r)}
                  </Chip>
                </div>
              </Link>
            );
          })
        )}
      </Card>

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit expert details">
        <div className="space-y-4">
          <Input value={editForm.name} onChange={(v) => setEditForm((p) => ({ ...p, name: v }))} label="Full name" placeholder="Name" />
          <Input value={editForm.email} onChange={(v) => setEditForm((p) => ({ ...p, email: v }))} label="Email" type="email" placeholder="email@astrolaabh.house" />
          <Input value={editForm.phone} onChange={(v) => setEditForm((p) => ({ ...p, phone: v }))} label="Phone number" placeholder="+91 98765 43210" />
          <Input value={editForm.specialization} onChange={(v) => setEditForm((p) => ({ ...p, specialization: v }))} label="Specialization" placeholder="Vedic Astrology & Gemology" />
          <Input value={editForm.fee} onChange={(v) => setEditForm((p) => ({ ...p, fee: v }))} label="Fee per session (₹)" placeholder="5000" />
          <div className="pt-2">
            <GoldBtn onClick={() => { setShowEditModal(false); setToast("Profile updated"); setTimeout(() => setToast(""), 3000); }}>Save changes</GoldBtn>
          </div>
        </div>
      </Modal>

      {toast && (
        <div
          className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-3 rounded-[10px] shadow-lg text-[13px] font-medium animate-in"
          style={{ background: T.card, border: `1px solid ${T.border}`, color: T.good }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
          {toast}
        </div>
      )}
    </>
  );
}
