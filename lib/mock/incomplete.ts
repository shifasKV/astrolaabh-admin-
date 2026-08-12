export interface IncompleteOrder {
  id: string;
  customerId: string;
  customerName: string;
  itemName: string;
  amount: number;
  reason: "payment_failed" | "abandoned_cart" | "payment_expired" | "card_declined";
  failedAt: string;
  paymentAttempts?: number;
  lastCardDigits?: string;
}

export interface IncompleteConsultation {
  id: string;
  customerId: string;
  customerName: string;
  expertName: string;
  type: string;
  reason: "slot_viewed" | "slot_selected_not_booked" | "payment_abandoned" | "booking_timeout";
  slotDate?: string;
  viewedAt: string;
}

export const MOCK_INCOMPLETE_ORDERS: IncompleteOrder[] = [
  { id: "inc_ord_001", customerId: "cust_001", customerName: "Radhika Oberoi", itemName: "Emerald (Panna) — Colombian, 4.2 ratti", amount: 245000, reason: "payment_failed", failedAt: "2026-07-28T14:30:00+05:30", paymentAttempts: 2, lastCardDigits: "4821" },
  { id: "inc_ord_002", customerId: "cust_001", customerName: "Radhika Oberoi", itemName: "Coral (Moonga) — Italian Red, 6.0 ratti", amount: 78000, reason: "abandoned_cart", failedAt: "2026-08-05T11:15:00+05:30" },
  { id: "inc_ord_003", customerId: "cust_005", customerName: "Kavya Menon", itemName: "Pearl (Moti) — South Sea, 8.5 ratti", amount: 125000, reason: "payment_expired", failedAt: "2026-08-02T09:00:00+05:30" },
  { id: "inc_ord_004", customerId: "cust_004", customerName: "Rajesh Iyer", itemName: "Gomed Ring — 22K Gold Setting", amount: 185000, reason: "card_declined", failedAt: "2026-07-25T16:45:00+05:30", paymentAttempts: 3, lastCardDigits: "9103" },
  { id: "inc_ord_005", customerId: "cust_002", customerName: "Amit Khanna", itemName: "Pukhraj Pendant — Platinum mount", amount: 320000, reason: "abandoned_cart", failedAt: "2026-08-09T20:10:00+05:30" },
  { id: "inc_ord_006", customerId: "cust_009", customerName: "Meera Patel", itemName: "Neelam (Blue Sapphire) — Sri Lankan, 3.8 ratti", amount: 410000, reason: "payment_failed", failedAt: "2026-08-01T13:20:00+05:30", paymentAttempts: 1, lastCardDigits: "7762" },
];

export const MOCK_INCOMPLETE_CONSULTATIONS: IncompleteConsultation[] = [
  { id: "inc_con_001", customerId: "cust_001", customerName: "Radhika Oberoi", expertName: "Pt. Sandeep Kochaar", type: "follow_up", reason: "slot_selected_not_booked", slotDate: "2026-08-18T10:00:00+05:30", viewedAt: "2026-08-10T09:30:00+05:30" },
  { id: "inc_con_002", customerId: "cust_005", customerName: "Kavya Menon", expertName: "Dr. Meenakshi Joshi", type: "initial", reason: "payment_abandoned", slotDate: "2026-08-15T14:00:00+05:30", viewedAt: "2026-08-08T18:45:00+05:30" },
  { id: "inc_con_003", customerId: "cust_004", customerName: "Rajesh Iyer", expertName: "Pt. Sandeep Kochaar", type: "remedy_review", reason: "slot_viewed", viewedAt: "2026-08-11T21:00:00+05:30" },
  { id: "inc_con_004", customerId: "cust_002", customerName: "Amit Khanna", expertName: "Acharya V. Tripathi", type: "follow_up", reason: "booking_timeout", slotDate: "2026-08-14T11:00:00+05:30", viewedAt: "2026-08-09T10:15:00+05:30" },
  { id: "inc_con_005", customerId: "cust_009", customerName: "Meera Patel", expertName: "Pt. Sandeep Kochaar", type: "stone_selection", reason: "slot_selected_not_booked", slotDate: "2026-08-20T16:00:00+05:30", viewedAt: "2026-08-11T14:30:00+05:30" },
];
