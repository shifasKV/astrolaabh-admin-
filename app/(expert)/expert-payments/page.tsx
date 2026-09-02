"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PageHeader,
  Card,
  StatCard,
  Pagination,
  ToolbarSearch,
  SortMenu,
  EmptyState,
  TableSkeleton,
  GhostBtn,
} from "@/components/ui";
import { T } from "@/lib/theme";
import { useSimulatedLoad } from "@/lib/useSimulatedLoad";
import {
  MOCK_CONSULTATIONS,
  MOCK_STONE_RECOMMENDATIONS,
  MOCK_ORDERS,
  MOCK_EXPERT_PAYOUTS,
} from "@/lib/mock";
import { inr } from "@/lib/types";

const EXPERT_ID = "usr_expert_01";
const PAGE_SIZE = 8;

const COMMISSION_RATES = {
  stone: 8,
  jewellery: 6,
  consultation: 15,
} as const;

const PAYOUT_ACCOUNT = {
  bank: "HDFC Bank",
  account: "1234 5678 6789",
  ifsc: "HDFC0001234",
  upi: "kochaar@upi",
};

type SortKey = "date_desc" | "date_asc";

/**
 * Expert payments — commission summary, rates, and payout history.
 */
export default function ExpertPaymentsPage() {
  const router = useRouter();
  const loading = useSimulatedLoad();
  const [paySearch, setPaySearch] = useState("");
  const [paySort, setPaySort] = useState<SortKey>("date_desc");
  const [payPage, setPayPage] = useState(0);

  const { totalCommission, totalPaid, totalPending, payouts } = useMemo(() => {
    const consultRate = COMMISSION_RATES.consultation / 100;
    const stoneRate = COMMISSION_RATES.stone / 100;

    const consultations = MOCK_CONSULTATIONS.filter((c) => c.expertId === EXPERT_ID);
    const consultCommission = consultations
      .filter((c) => c.paymentStatus === "paid")
      .reduce((sum, c) => sum + Math.round((c.fee ?? 0) * consultRate), 0);

    const recommendations = MOCK_STONE_RECOMMENDATIONS.filter((r) => r.expertId === EXPERT_ID);
    const stoneCommission = recommendations
      .filter((r) => r.status === "converted_to_order" && r.orderId)
      .reduce((sum, r) => {
        const order = MOCK_ORDERS.find((o) => o.id === r.orderId);
        return sum + (order ? Math.round(order.total * stoneRate) : 0);
      }, 0);

    const commission = consultCommission + stoneCommission;
    const myPayouts = MOCK_EXPERT_PAYOUTS.filter((p) => p.expertId === EXPERT_ID);
    const paid = myPayouts.reduce((sum, p) => sum + p.amount, 0);

    return {
      totalCommission: commission,
      totalPaid: paid,
      totalPending: Math.max(0, commission - paid),
      payouts: myPayouts,
    };
  }, []);

  const payFiltered = useMemo(() => {
    return [...payouts]
      .filter((p) => {
        if (!paySearch) return true;
        const q = paySearch.toLowerCase();
        return (
          p.id.toLowerCase().includes(q) ||
          p.paymentType.toLowerCase().includes(q) ||
          p.paidBy.toLowerCase().includes(q) ||
          (p.notes ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const aTime = new Date(a.paidAt).getTime();
        const bTime = new Date(b.paidAt).getTime();
        return paySort === "date_asc" ? aTime - bTime : bTime - aTime;
      });
  }, [payouts, paySearch, paySort]);

  const payTotalPages = Math.ceil(payFiltered.length / PAGE_SIZE);
  const payPaginated = payFiltered.slice(payPage * PAGE_SIZE, (payPage + 1) * PAGE_SIZE);

  return (
    <>
      <PageHeader title="Payments" />

      {loading ? (
        <TableSkeleton rows={6} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <StatCard label="Total commission" value={inr(totalCommission)} featured />
            <StatCard label="Paid" value={inr(totalPaid)} />
            <StatCard label="Pending" value={inr(totalPending)} />
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <Card className="!p-6">
              <h2 className="text-[15px] font-semibold tracking-[-0.01em] mb-4" style={{ color: T.text }}>
                Commission rates
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {([
                  ["stone", COMMISSION_RATES.stone],
                  ["jewellery", COMMISSION_RATES.jewellery],
                  ["consultation", COMMISSION_RATES.consultation],
                ] as const).map(([cat, rate]) => (
                  <div key={cat}>
                    <div className="text-[11px] tracking-[0.07em] uppercase" style={{ color: T.faint }}>{cat}</div>
                    <div className="font-title text-[22px] font-semibold tabular-nums mt-1" style={{ color: T.text }}>{rate}%</div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="!p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: T.text }}>
                  Payout account
                </h2>
                <GhostBtn className="!h-7 !px-3 !text-[11px]" onClick={() => router.push("/expert-profile#payout")}>
                  Edit
                </GhostBtn>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {[
                  ["Bank", PAYOUT_ACCOUNT.bank],
                  ["Account", PAYOUT_ACCOUNT.account],
                  ["IFSC", PAYOUT_ACCOUNT.ifsc],
                  ["UPI", PAYOUT_ACCOUNT.upi],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="text-[11px] tracking-[0.07em] uppercase" style={{ color: T.faint }}>{k}</div>
                    <div className="text-[13px] font-medium tabular-nums mt-0.5" style={{ color: T.text }}>{v}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="hidden sm:flex flex-wrap items-center gap-2 pt-4 mb-3" style={{ borderTop: `1px solid ${T.borderSoft}` }}>
            <div className="ml-auto flex items-center gap-2">
              <ToolbarSearch
                value={paySearch}
                onChange={(v) => {
                  setPaySearch(v);
                  setPayPage(0);
                }}
                placeholder="Search payment ID, notes…"
              />
              <SortMenu
                value={paySort}
                onChange={(v) => {
                  setPaySort(v as SortKey);
                  setPayPage(0);
                }}
                options={[
                  { value: "date_desc", label: "Newest first" },
                  { value: "date_asc", label: "Oldest first" },
                ]}
              />
            </div>
          </div>

          <Card className="!p-0 md:flex md:flex-col md:min-h-0">
            <div className="md:min-h-0 overflow-y-auto max-h-[560px] md:max-h-none flex-1">
              <div
                className="hidden sm:grid grid-cols-[110px_120px_120px_1.2fr_150px_110px] gap-3 items-center px-4 h-10 text-[11px] tracking-[0.06em] uppercase font-medium rounded-t-[15px]"
                style={{ color: T.faint, background: T.card, borderBottom: `1px solid ${T.borderSoft}` }}
              >
                <span>Payment ID</span>
                <span>Payment type</span>
                <span>Paid by</span>
                <span>Notes</span>
                <span>Date &amp; time</span>
                <span className="text-right">Amount</span>
              </div>
              {payPaginated.length === 0 ? (
                <EmptyState inline icon="inbox" title="No payouts" description="No payouts recorded yet." />
              ) : (
                payPaginated.map((p) => {
                  const dt = new Date(p.paidAt);
                  return (
                    <div
                      key={p.id}
                      className="grid grid-cols-1 sm:grid-cols-[110px_120px_120px_1.2fr_150px_110px] gap-3 items-center px-4 py-2.5 even:bg-[rgba(89,82,54,0.025)] last:rounded-b-[15px]"
                      style={{ borderBottom: `1px solid ${T.borderSoft}` }}
                    >
                      <div className="text-[11px] tracking-[0.06em] uppercase font-medium" style={{ color: T.accent }}>{p.id}</div>
                      <div className="text-[13px] truncate" style={{ color: T.text }}>{p.paymentType}</div>
                      <div className="text-[13px] truncate" style={{ color: T.text }}>{p.paidBy}</div>
                      <div className="text-[13px] truncate" style={{ color: p.notes ? T.text : T.faint }}>{p.notes || "—"}</div>
                      <div className="text-[12px] tabular-nums" style={{ color: T.muted }}>
                        {dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        <span className="ml-1 opacity-60">
                          {dt.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}
                        </span>
                      </div>
                      <div className="text-[13px] text-right font-semibold tabular-nums" style={{ color: T.text }}>{inr(p.amount)}</div>
                      {/* Mobile: show notes under amount */}
                      {p.notes && (
                        <div className="sm:hidden text-[12px] col-span-full -mt-1" style={{ color: T.muted }}>{p.notes}</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>
          <Pagination
            page={payPage}
            totalPages={payTotalPages}
            totalItems={payFiltered.length}
            perPage={PAGE_SIZE}
            onPageChange={setPayPage}
          />
        </>
      )}
    </>
  );
}
