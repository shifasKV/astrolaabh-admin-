/**
 * Expert commission payouts recorded by ops (Make payout).
 */
export type ExpertPayout = {
  id: string;
  expertId: string;
  paymentType: "Bank Transfer" | "UPI" | "Cheque" | "Cash" | "Net Banking";
  paidBy: string;
  paidAt: string;
  amount: number;
  notes?: string;
};

export const MOCK_EXPERT_PAYOUTS: ExpertPayout[] = [
  {
    id: "PAY_016",
    expertId: "usr_expert_01",
    paymentType: "Bank Transfer",
    paidBy: "Ops Admin",
    paidAt: "2026-08-19T05:30:00+05:30",
    amount: 4500,
    notes: "Jul – Aug 2026 consultation commissions",
  },
  {
    id: "PAY_005",
    expertId: "usr_expert_01",
    paymentType: "Bank Transfer",
    paidBy: "Ops Admin",
    paidAt: "2026-08-16T14:00:00+05:30",
    amount: 5000,
    notes: "Stone commission — AL-ORD-001 batch",
  },
  {
    id: "PAY_011",
    expertId: "usr_expert_01",
    paymentType: "Bank Transfer",
    paidBy: "Ops Admin",
    paidAt: "2026-08-03T11:00:00+05:30",
    amount: 8200,
    notes: "May – Jun 2026 · consultations + stone sales",
  },
  {
    id: "PAY_009",
    expertId: "usr_expert_01",
    paymentType: "UPI",
    paidBy: "Finance",
    paidAt: "2026-06-28T16:45:00+05:30",
    amount: 12500,
    notes: "Q1 stone commission settlement",
  },
  {
    id: "PAY_003",
    expertId: "usr_expert_01",
    paymentType: "Bank Transfer",
    paidBy: "Ops Admin",
    paidAt: "2026-04-30T10:00:00+05:30",
    amount: 6800,
    notes: "Feb – Apr consultations",
  },
  {
    id: "PAY_020",
    expertId: "usr_expert_02",
    paymentType: "Bank Transfer",
    paidBy: "Ops Admin",
    paidAt: "2026-08-12T09:15:00+05:30",
    amount: 3200,
    notes: "Aug consultation commissions",
  },
  {
    id: "PAY_021",
    expertId: "usr_expert_03",
    paymentType: "UPI",
    paidBy: "Finance",
    paidAt: "2026-08-10T13:20:00+05:30",
    amount: 4100,
    notes: "Jul stone + consultation payout",
  },
];
