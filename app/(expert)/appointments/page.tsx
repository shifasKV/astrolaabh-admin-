"use client";
import { useState } from "react";
import Link from "next/link";
import { PageHeader, Card, StatCard, Chip, Tabs, SearchFilter, GoldBtn } from "@/components/ui";
import { T } from "@/lib/theme";
import { MOCK_CONSULTATIONS, MOCK_STONE_RECOMMENDATIONS } from "@/lib/mock";

const TABS = [
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
  { key: "pending", label: "Action needed" },
  { key: "completed", label: "Completed" },
  { key: "all", label: "All" },
];

export default function ExpertDashboardAndAppointments() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const today = "2026-08-07";
  const myConsultations = MOCK_CONSULTATIONS;
  const pendingSummaries = myConsultations.filter((c) => c.status === "summary_pending").length;
  const rescheduleReqs = myConsultations.filter((c) => c.status === "reschedule_requested").length;
  const draftRecs = MOCK_STONE_RECOMMENDATIONS.filter((r) => r.status === "draft").length;
  const completedThisMonth = myConsultations.filter((c) => (c.status === "closed" || c.status === "completed")).length;

  const filtered = myConsultations.filter((c) => {
    if (tab === "today") return c.scheduledAt.startsWith(today);
    if (tab === "upcoming") return c.status === "scheduled";
    if (tab === "pending") return c.status === "summary_pending" || c.status === "reschedule_requested";
    if (tab === "completed") return c.status === "closed" || c.status === "completed";
    return true;
  }).filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.customerName.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
  });

  const statusTone = (s: string) => {
    if (s === "closed" || s === "completed") return "good" as const;
    if (s === "scheduled") return "gold" as const;
    if (s === "summary_pending" || s === "reschedule_requested") return "danger" as const;
    return "muted" as const;
  };

  return (
    <>
      <PageHeader title="My appointments" sub="Your workload — consultations, pending actions, and follow-ups" />

      {/* Dashboard KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Upcoming" value={myConsultations.filter((c) => c.status === "scheduled").length} />
        <StatCard label="Summaries due" value={pendingSummaries} sub={pendingSummaries > 0 ? "action needed" : undefined} />
        <StatCard label="Reschedule requests" value={rescheduleReqs} />
        <StatCard label="Completed" value={completedThisMonth} sub="total" />
      </div>

      {/* Draft recommendations alert */}
      {draftRecs > 0 && (
        <Card className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[12.5px]" style={{ color: T.text }}>{draftRecs} recommendation{draftRecs > 1 ? "s" : ""} in draft</span>
              <span className="text-[11.5px] ml-2" style={{ color: T.muted }}>— submit to move forward</span>
            </div>
            <Link href="/recommendations"><GoldBtn>View drafts</GoldBtn></Link>
          </div>
        </Card>
      )}

      {/* Appointments list */}
      <div className="mb-4">
        <Tabs
          tabs={TABS.map((t) => ({
            ...t,
            count: myConsultations.filter((c) => {
              if (t.key === "today") return c.scheduledAt.startsWith(today);
              if (t.key === "upcoming") return c.status === "scheduled";
              if (t.key === "pending") return c.status === "summary_pending" || c.status === "reschedule_requested";
              if (t.key === "completed") return c.status === "closed" || c.status === "completed";
              return true;
            }).length,
          }))}
          active={tab}
          onChange={setTab}
        />
      </div>

      <div className="mb-4">
        <SearchFilter search={search} onSearchChange={setSearch} placeholder="Search customer, consultation ID…" />
      </div>

      <Card>
        {filtered.length === 0 ? (
          <p className="text-[13px] text-center py-6" style={{ color: T.muted }}>No appointments in this view.</p>
        ) : (
          filtered.map((c) => (
            <Link
              key={c.id}
              href={`/appointments/${c.id}`}
              className="flex flex-wrap items-center justify-between gap-3 py-3.5 hover:brightness-110 transition-colors"
              style={{ borderBottom: `1px solid ${T.borderSoft}` }}
            >
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium" style={{ color: T.text }}>{c.customerName}</div>
                <div className="text-[12px] mt-0.5" style={{ color: T.muted }}>
                  {c.type.replace(/_/g, " ")} · {new Date(c.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {c.duration}min
                </div>
                {c.problemStatement && (
                  <div className="text-[11.5px] mt-0.5 truncate max-w-[400px]" style={{ color: T.faint }}>{c.problemStatement}</div>
                )}
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <Chip tone={statusTone(c.status)}>{c.status.replace(/_/g, " ")}</Chip>
              </div>
            </Link>
          ))
        )}
      </Card>
    </>
  );
}
