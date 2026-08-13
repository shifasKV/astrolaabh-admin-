export interface IncompleteOrder {
  id: string;
  customerId: string;
  customerName: string;
  itemName: string;
  amount: number;
  reason: "payment_failed" | "abandoned_cart" | "payment_expired" | "card_declined" | "requested_call";
  failedAt: string;
  paymentAttempts?: number;
  lastCardDigits?: string;
}

export interface IncompleteConsultation {
  id: string;
  customerId: string;
  customerName: string;
  expertId: string;
  expertName: string;
  reason: "slot_check" | "payment_failed" | "requested_call";
  date: string;
}

export const MOCK_INCOMPLETE_ORDERS: IncompleteOrder[] = [
  { id: "inc_ord_001", customerId: "cust_001", customerName: "Radhika Oberoi", itemName: "Emerald (Panna) — Colombian, 4.2 ratti", amount: 245000, reason: "payment_failed", failedAt: "2026-07-28T14:30:00+05:30", paymentAttempts: 2, lastCardDigits: "4821" },
  { id: "inc_ord_002", customerId: "cust_001", customerName: "Radhika Oberoi", itemName: "Coral (Moonga) — Italian Red, 6.0 ratti", amount: 78000, reason: "abandoned_cart", failedAt: "2026-08-05T11:15:00+05:30" },
  { id: "inc_ord_003", customerId: "cust_005", customerName: "Kavya Menon", itemName: "Pearl (Moti) — South Sea, 8.5 ratti", amount: 125000, reason: "payment_expired", failedAt: "2026-08-02T09:00:00+05:30" },
  { id: "inc_ord_004", customerId: "cust_004", customerName: "Rajesh Iyer", itemName: "Gomed Ring — 22K Gold Setting", amount: 185000, reason: "card_declined", failedAt: "2026-07-25T16:45:00+05:30", paymentAttempts: 3, lastCardDigits: "9103" },
  { id: "inc_ord_005", customerId: "cust_002", customerName: "Amit Khanna", itemName: "Pukhraj Pendant — Platinum mount", amount: 320000, reason: "abandoned_cart", failedAt: "2026-08-09T20:10:00+05:30" },
  { id: "inc_ord_006", customerId: "cust_009", customerName: "Meera Patel", itemName: "Neelam (Blue Sapphire) — Sri Lankan, 3.8 ratti", amount: 410000, reason: "payment_failed", failedAt: "2026-08-01T13:20:00+05:30", paymentAttempts: 1, lastCardDigits: "7762" },
  { id: "inc_ord_007", customerId: "cust_003", customerName: "Vikram Singh Randhawa", itemName: "Yellow Sapphire (Pukhraj) — Ceylon, 5.1 ratti", amount: 275000, reason: "requested_call", failedAt: "2026-08-10T10:00:00+05:30" },
  { id: "inc_ord_008", customerId: "cust_006", customerName: "Divya Kapoor", itemName: "Ruby (Manik) — Burmese, 3.5 ratti", amount: 390000, reason: "requested_call", failedAt: "2026-08-12T15:30:00+05:30" },
];

export const MOCK_INCOMPLETE_CONSULTATIONS: IncompleteConsultation[] = [
  { id: "inc_con_001", customerId: "cust_001", customerName: "Radhika Oberoi", expertId: "usr_expert_01", expertName: "Pt. Sandeep Kochaar", reason: "slot_check", date: "2026-08-10T09:30:00+05:30" },
  { id: "inc_con_002", customerId: "cust_005", customerName: "Kavya Menon", expertId: "usr_expert_02", expertName: "Dr. Meenakshi Joshi", reason: "payment_failed", date: "2026-08-08T18:45:00+05:30" },
  { id: "inc_con_003", customerId: "cust_004", customerName: "Rajesh Iyer", expertId: "usr_expert_01", expertName: "Pt. Sandeep Kochaar", reason: "requested_call", date: "2026-08-11T21:00:00+05:30" },
  { id: "inc_con_004", customerId: "cust_002", customerName: "Amit Khanna", expertId: "usr_expert_03", expertName: "Acharya V. Tripathi", reason: "payment_failed", date: "2026-08-09T10:15:00+05:30" },
  { id: "inc_con_005", customerId: "cust_009", customerName: "Meera Patel", expertId: "usr_expert_01", expertName: "Pt. Sandeep Kochaar", reason: "slot_check", date: "2026-08-11T14:30:00+05:30" },
  { id: "inc_con_006", customerId: "cust_003", customerName: "Vikram Singh Randhawa", expertId: "usr_expert_02", expertName: "Dr. Meenakshi Joshi", reason: "requested_call", date: "2026-08-12T11:00:00+05:30" },
  { id: "inc_con_007", customerId: "cust_006", customerName: "Divya Kapoor", expertId: "usr_expert_03", expertName: "Acharya V. Tripathi", reason: "slot_check", date: "2026-08-13T16:20:00+05:30" },
];
