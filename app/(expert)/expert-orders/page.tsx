"use client";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { PageHeader, Card, GoldBtn, MobileFab, timeAgo } from "@/components/ui";
import { T } from "@/lib/theme";
import { useAuth } from "@/lib/store/auth";
import { useLeads, type ApprovalStatus } from "@/lib/store/leads";
import { inr } from "@/lib/types";

/*
 * Expert (astro-gemologist) orders — every order they placed for a customer,
 * each sent to admin for approval. Mirrors the sales "My submissions" flow.
 */

const STATUS_META: Record<ApprovalStatus, { label: string; color: string }> = {
  pending: { label: "Awaiting admin review", color: T.gold },
  approved: { label: "Admin approved", color: T.good },
  completed: { label: "Completed", color: T.good },
  on_hold: { label: "On hold", color: T.info },
  rejected: { label: "Rejected", color: T.danger },
};

export default function ExpertOrdersPage() {
  const { user } = useAuth();
  const myId = user?.id;
  const { pendingApprovals, reviewedFulfillments, markReviewSeen } = useLeads();

  const mySubmissions = useMemo(() => {
    const all = [...pendingApprovals, ...reviewedFulfillments].filter((r) => r.fulfillment.submittedBy === myId);
    return all.sort((a, b) => +new Date(b.fulfillment.submittedAt) - +new Date(a.fulfillment.submittedAt));
  }, [pendingApprovals, reviewedFulfillments, myId]);

  // Viewing statuses counts as "seen".
  useEffect(() => {
    for (const r of mySubmissions) {
      if (r.fulfillment.approval !== "pending") markReviewSeen(r.id, r.fulfillment.reviewedAt);
    }
  }, [mySubmissions, markReviewSeen]);

  const pendingCount = mySubmissions.filter((r) => r.fulfillment.approval === "pending").length;

  return (
    <>
      <PageHeader
        title="Orders"
        action={<Link href="/expert-orders/create" className="hidden sm:block"><GoldBtn>+ Create order</GoldBtn></Link>}
      />

      {mySubmissions.length === 0 ? (
        <Card className="!p-10 text-center">
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ background: T.accentFaint, color: T.accent }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6"><path d="M5 8.5h14l-1.2 11a1.8 1.8 0 0 1-1.8 1.6H8a1.8 1.8 0 0 1-1.8-1.6z" strokeLinejoin="round" /><path d="M9 10.5V6.8a3 3 0 0 1 6 0v3.7" strokeLinecap="round" /></svg>
          </div>
          <div className="text-[15px] font-semibold mt-3" style={{ color: T.text }}>No orders yet</div>
          <p className="text-[12.5px] mt-1 max-w-[340px] mx-auto" style={{ color: T.muted }}>Place an order for a customer after a consultation. It goes to the admin team for approval before it is confirmed.</p>
          <div className="mt-5"><Link href="/expert-orders/create"><GoldBtn>+ Create order</GoldBtn></Link></div>
        </Card>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 pt-4 pb-3">
            <div className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>My orders</div>
            {pendingCount > 0 && (
              <span className="text-[11.5px] font-semibold px-2 py-0.5 rounded-full tabular-nums" style={{ background: "rgba(160,125,56,0.12)", color: T.gold }}>
                {pendingCount} pending
              </span>
            )}
          </div>
          {mySubmissions.map((r) => {
            const f = r.fulfillment;
            const m = STATUS_META[f.approval];
            return (
              <div key={r.id} className="flex items-start gap-3 px-4 sm:px-5 py-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[13.5px] font-semibold truncate" style={{ color: T.text }}>{r.customerName}</span>
                    <span className="text-[13.5px] font-semibold tabular-nums shrink-0" style={{ color: T.text }}>{inr(f.total)}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 mt-0.5">
                    <span className="text-[12px] truncate" style={{ color: T.muted }}>{f.summary}</span>
                    <span className="text-[11px] shrink-0" style={{ color: T.faint }}>{timeAgo(f.submittedAt)}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[12px] font-medium mt-1.5" style={{ color: m.color }}>
                    <span className="w-[7px] h-[7px] rounded-full" style={{ background: m.color }} />
                    {m.label}{f.reviewNote && f.approval === "rejected" ? <span style={{ color: T.faint }}> · {f.reviewNote}</span> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <MobileFab href="/expert-orders/create" label="New order" />
    </>
  );
}
