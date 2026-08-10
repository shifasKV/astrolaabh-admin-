"use client";
import { PageHeader, Card, Timeline } from "@/components/ui";
import type { TimelineEvent } from "@/components/ui";
import { MOCK_CONSULTATIONS, MOCK_STONE_RECOMMENDATIONS } from "@/lib/mock";

export default function ActivityPage() {
  const events: TimelineEvent[] = [
    ...MOCK_CONSULTATIONS.filter((c) => c.summarySubmittedAt).map((c) => ({
      id: `sum-${c.id}`,
      title: `Summary submitted — ${c.customerName}`,
      description: c.type.replace(/_/g, " "),
      time: c.summarySubmittedAt!,
      tone: "good" as const,
    })),
    ...MOCK_CONSULTATIONS.filter((c) => c.status === "reschedule_requested").map((c) => ({
      id: `resc-${c.id}`,
      title: `Reschedule requested — ${c.customerName}`,
      description: c.rescheduleReason || "",
      time: c.updatedAt,
      tone: "danger" as const,
    })),
    ...MOCK_STONE_RECOMMENDATIONS.map((r) => ({
      id: `rec-${r.id}`,
      title: `Recommendation ${r.status.replace(/_/g, " ")} — ${r.customerName}`,
      description: `${r.gemstone} · ${r.weightRange}`,
      time: r.updatedAt,
      tone: "gold" as const,
    })),
    ...MOCK_CONSULTATIONS.filter((c) => c.status === "scheduled").map((c) => ({
      id: `sched-${c.id}`,
      title: `Consultation scheduled — ${c.customerName}`,
      time: c.createdAt,
      tone: "muted" as const,
    })),
  ].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <>
      <PageHeader title="Activity" sub="Recent actions and events across your consultations" />
      <Card>
        <Timeline events={events} />
      </Card>
    </>
  );
}
