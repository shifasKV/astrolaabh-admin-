export interface MockNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "order" | "consultation" | "payment" | "energisation" | "certificate" | "affiliate" | "system";
  linkTo?: string;
}

export const MOCK_NOTIFICATIONS: MockNotification[] = [
  { id: "notif_001", title: "Reschedule requested", description: "Rohan Malhotra — cons_008 — Expert travel conflict", time: "2 hours ago", read: false, type: "consultation", linkTo: "/consultations" },
  { id: "notif_002", title: "Energisation scheduled", description: "AL-ORD-004 · Neelam Sri Lankan · Aug 9 6:00 PM", time: "5 hours ago", read: false, type: "energisation", linkTo: "/energisation" },
  { id: "notif_003", title: "Payment received", description: "Divya Kapoor · ₹95,000 · Manik Thai Ruby", time: "Yesterday", read: false, type: "payment", linkTo: "/payments" },
  { id: "notif_004", title: "Certificate uploaded", description: "AL-ORD-007 · GIA-2026-82134 awaiting verification", time: "Yesterday", read: true, type: "certificate", linkTo: "/certificates" },
  { id: "notif_005", title: "Summary overdue", description: "cons_004 · Rajesh Iyer — 33 days since consultation", time: "2 days ago", read: true, type: "consultation", linkTo: "/consultations" },
  { id: "notif_006", title: "New consultation booked", description: "Ananya Reddy · Aug 12 11:00 AM · Initial", time: "6 days ago", read: true, type: "consultation", linkTo: "/consultations" },
  { id: "notif_007", title: "Affiliate commission accrued", description: "SANDEEP108 · ₹26,000 from AL-ORD-004", time: "1 week ago", read: true, type: "affiliate", linkTo: "/affiliates" },
  { id: "notif_008", title: "Payment link expired", description: "pay_007 · Rohan Malhotra · ₹5,000", time: "2 weeks ago", read: true, type: "payment", linkTo: "/payments" },
];

export interface AuditEvent {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
}

export const MOCK_AUDIT: AuditEvent[] = [
  { id: "aud_001", actor: "Ops Admin", actorRole: "Admin", action: "status_change", target: "AL-ORD-004", details: "Energisation status → Scheduled", timestamp: "2026-08-02 14:30" },
  { id: "aud_002", actor: "Pt. Sandeep Kochaar", actorRole: "Expert", action: "reschedule_request", target: "cons_008", details: "Requested reschedule — travel conflict", timestamp: "2026-08-06 09:15" },
  { id: "aud_003", actor: "Ops Admin", actorRole: "Admin", action: "payment_created", target: "pay_005", details: "Payment link sent to Ananya Reddy · ₹5,000", timestamp: "2026-08-02 11:00" },
  { id: "aud_004", actor: "Ops Admin", actorRole: "Admin", action: "certificate_upload", target: "cert_007", details: "Lab cert uploaded for AL-ORD-007", timestamp: "2026-06-18 15:30" },
  { id: "aud_005", actor: "Ops Admin", actorRole: "Admin", action: "user_login", target: "usr_admin_01", details: "Login from 192.168.1.x", timestamp: "2026-08-07 09:00" },
  { id: "aud_006", actor: "Pt. Sandeep Kochaar", actorRole: "Expert", action: "summary_submitted", target: "cons_006", details: "Follow-up summary submitted for Vikram Singh", timestamp: "2026-07-20 11:30" },
  { id: "aud_007", actor: "Ops Admin", actorRole: "Admin", action: "payout_approved", target: "pyt_004", details: "Payout ₹96,200 approved for VTRI21", timestamp: "2026-06-28 16:00" },
  { id: "aud_008", actor: "Ops Admin", actorRole: "Admin", action: "commission_rate_change", target: "aff_003", details: "Rate changed 4% → under review pending compliance", timestamp: "2026-07-15 10:42" },
];
