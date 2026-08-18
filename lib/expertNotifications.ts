import { MOCK_CONSULTATIONS } from "@/lib/mock";

export interface ExpertNotif {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  linkTo?: string;
}

/* Derives an astro-gemologist's notification feed from their consultation data. */
export function getExpertNotifications(expertId: string): ExpertNotif[] {
  const mine = MOCK_CONSULTATIONS.filter((c) => c.expertId === expertId);
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const list: ExpertNotif[] = [];

  mine.filter((c) => c.status === "reschedule_requested").forEach((c) =>
    list.push({ id: `resched-${c.id}`, title: "Reschedule requested", description: `${c.customerName} asked to move their consultation`, time: fmt(c.scheduledAt), read: false, linkTo: `/appointments/${c.id}` }));

  mine.filter((c) => c.status === "summary_pending").forEach((c) =>
    list.push({ id: `summary-${c.id}`, title: "Recommendation due", description: `Submit your recommendation for ${c.customerName}`, time: fmt(c.scheduledAt), read: false, linkTo: `/appointments/${c.id}` }));

  mine
    .filter((c) => c.status === "scheduled" && new Date(c.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5)
    .forEach((c) =>
      list.push({ id: `up-${c.id}`, title: "Upcoming consultation", description: `${c.customerName} · ${new Date(c.scheduledAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}`, time: fmt(c.scheduledAt), read: true, linkTo: `/appointments/${c.id}` }));

  return list;
}
