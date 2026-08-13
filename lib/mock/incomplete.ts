export type IncompleteOrderStatus = "new" | "contacted" | "follow_up" | "converted" | "lost";

export interface IncompleteOrder {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  itemName: string;
  itemSku: string;
  amount: number;
  reason: "payment_failed" | "abandoned_cart" | "payment_expired" | "card_declined" | "requested_call";
  failedAt: string;
  paymentAttempts?: number;
  lastCardDigits?: string;
  leadStatus: IncompleteOrderStatus;
  assignedTo?: string;
  remarks?: string;
  lastContactedAt?: string;
}

export type IncompleteConsultationStatus = "new" | "contacted" | "follow_up" | "converted" | "lost";

export interface IncompleteConsultation {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  expertId: string;
  expertName: string;
  consultationType: string;
  reason: "slot_check" | "payment_failed" | "requested_call";
  date: string;
  leadStatus: IncompleteConsultationStatus;
  assignedTo?: string;
  remarks?: string;
  lastContactedAt?: string;
}

export const MOCK_INCOMPLETE_ORDERS: IncompleteOrder[] = [
  { id: "inc_ord_001", customerId: "cust_001", customerName: "Radhika Oberoi", customerEmail: "radhika@gmail.com", customerPhone: "+91 98100 42310", itemName: "Emerald (Panna) — Colombian, 4.2 ratti", itemSku: "AL-PNA-0312", amount: 245000, reason: "payment_failed", failedAt: "2026-07-28T14:30:00+05:30", paymentAttempts: 2, lastCardDigits: "4821", leadStatus: "contacted", assignedTo: "sales_01", remarks: "Customer said she'll retry after salary credit", lastContactedAt: "2026-07-29T11:00:00+05:30" },
  { id: "inc_ord_002", customerId: "cust_001", customerName: "Radhika Oberoi", customerEmail: "radhika@gmail.com", customerPhone: "+91 98100 42310", itemName: "Coral (Moonga) — Italian Red, 6.0 ratti", itemSku: "AL-MNG-0142", amount: 78000, reason: "abandoned_cart", failedAt: "2026-08-05T11:15:00+05:30", leadStatus: "new" },
  { id: "inc_ord_003", customerId: "cust_005", customerName: "Kavya Menon", customerEmail: "kavya.menon@outlook.com", customerPhone: "+91 87654 32109", itemName: "Pearl (Moti) — South Sea, 8.5 ratti", itemSku: "AL-MTI-0155", amount: 125000, reason: "payment_expired", failedAt: "2026-08-02T09:00:00+05:30", leadStatus: "follow_up", assignedTo: "sales_02", remarks: "Interested but wants to consult astrologer first", lastContactedAt: "2026-08-03T14:00:00+05:30" },
  { id: "inc_ord_004", customerId: "cust_004", customerName: "Rajesh Iyer", customerEmail: "rajesh.iyer@yahoo.com", customerPhone: "+91 76543 21098", itemName: "Gomed Ring — 22K Gold Setting", itemSku: "AL-GMD-0088", amount: 185000, reason: "card_declined", failedAt: "2026-07-25T16:45:00+05:30", paymentAttempts: 3, lastCardDigits: "9103", leadStatus: "lost", remarks: "Not interested anymore, found alternate vendor" },
  { id: "inc_ord_005", customerId: "cust_002", customerName: "Amit Khanna", customerEmail: "amit.khanna@icloud.com", customerPhone: "+91 99887 76655", itemName: "Pukhraj Pendant — Platinum mount", itemSku: "AL-PKJ-0610", amount: 320000, reason: "abandoned_cart", failedAt: "2026-08-09T20:10:00+05:30", leadStatus: "new" },
  { id: "inc_ord_006", customerId: "cust_009", customerName: "Meera Patel", customerEmail: "meera.patel@gmail.com", customerPhone: "+91 88776 65544", itemName: "Neelam (Blue Sapphire) — Sri Lankan, 3.8 ratti", itemSku: "AL-NLM-0156", amount: 410000, reason: "payment_failed", failedAt: "2026-08-01T13:20:00+05:30", paymentAttempts: 1, lastCardDigits: "7762", leadStatus: "contacted", assignedTo: "sales_03", lastContactedAt: "2026-08-02T10:30:00+05:30" },
  { id: "inc_ord_007", customerId: "cust_003", customerName: "Vikram Singh Randhawa", customerEmail: "vikram.randhawa@hotmail.com", customerPhone: "+91 98765 43210", itemName: "Yellow Sapphire (Pukhraj) — Ceylon, 5.1 ratti", itemSku: "AL-PKJ-0417", amount: 275000, reason: "requested_call", failedAt: "2026-08-10T10:00:00+05:30", leadStatus: "follow_up", assignedTo: "sales_01", remarks: "Wants callback on Monday", lastContactedAt: "2026-08-10T10:30:00+05:30" },
  { id: "inc_ord_008", customerId: "cust_006", customerName: "Divya Kapoor", customerEmail: "divya.k@gmail.com", customerPhone: "+91 77665 54433", itemName: "Ruby (Manik) — Burmese, 3.5 ratti", itemSku: "AL-MNK-0208", amount: 390000, reason: "requested_call", failedAt: "2026-08-12T15:30:00+05:30", leadStatus: "new", assignedTo: "sales_02" },
];

export const MOCK_INCOMPLETE_CONSULTATIONS: IncompleteConsultation[] = [
  { id: "inc_con_001", customerId: "cust_001", customerName: "Radhika Oberoi", customerEmail: "radhika@gmail.com", customerPhone: "+91 98100 42310", expertId: "usr_expert_01", expertName: "Pt. Sandeep Kochaar", consultationType: "Gemstone consultation", reason: "slot_check", date: "2026-08-10T09:30:00+05:30", leadStatus: "contacted", assignedTo: "sales_01", remarks: "Waiting for preferred slot to open up", lastContactedAt: "2026-08-10T14:00:00+05:30" },
  { id: "inc_con_002", customerId: "cust_005", customerName: "Kavya Menon", customerEmail: "kavya.menon@outlook.com", customerPhone: "+91 87654 32109", expertId: "usr_expert_02", expertName: "Dr. Meenakshi Joshi", consultationType: "Kundali analysis", reason: "payment_failed", date: "2026-08-08T18:45:00+05:30", leadStatus: "follow_up", assignedTo: "sales_02", remarks: "Customer wants to pay via UPI instead", lastContactedAt: "2026-08-09T09:30:00+05:30" },
  { id: "inc_con_003", customerId: "cust_004", customerName: "Rajesh Iyer", customerEmail: "rajesh.iyer@yahoo.com", customerPhone: "+91 76543 21098", expertId: "usr_expert_01", expertName: "Pt. Sandeep Kochaar", consultationType: "Gemstone consultation", reason: "requested_call", date: "2026-08-11T21:00:00+05:30", leadStatus: "new", assignedTo: "sales_03" },
  { id: "inc_con_004", customerId: "cust_002", customerName: "Amit Khanna", customerEmail: "amit.khanna@icloud.com", customerPhone: "+91 99887 76655", expertId: "usr_expert_03", expertName: "Acharya V. Tripathi", consultationType: "Kundali analysis", reason: "payment_failed", date: "2026-08-09T10:15:00+05:30", leadStatus: "lost", remarks: "Customer booked with a different service" },
  { id: "inc_con_005", customerId: "cust_009", customerName: "Meera Patel", customerEmail: "meera.patel@gmail.com", customerPhone: "+91 88776 65544", expertId: "usr_expert_01", expertName: "Pt. Sandeep Kochaar", consultationType: "Gemstone consultation", reason: "slot_check", date: "2026-08-11T14:30:00+05:30", leadStatus: "new", assignedTo: "sales_01" },
  { id: "inc_con_006", customerId: "cust_003", customerName: "Vikram Singh Randhawa", customerEmail: "vikram.randhawa@hotmail.com", customerPhone: "+91 98765 43210", expertId: "usr_expert_02", expertName: "Dr. Meenakshi Joshi", consultationType: "Kundali analysis", reason: "requested_call", date: "2026-08-12T11:00:00+05:30", leadStatus: "contacted", assignedTo: "sales_02", lastContactedAt: "2026-08-12T14:00:00+05:30" },
  { id: "inc_con_007", customerId: "cust_006", customerName: "Divya Kapoor", customerEmail: "divya.k@gmail.com", customerPhone: "+91 77665 54433", expertId: "usr_expert_03", expertName: "Acharya V. Tripathi", consultationType: "Gemstone consultation", reason: "slot_check", date: "2026-08-13T16:20:00+05:30", leadStatus: "new" },
];
