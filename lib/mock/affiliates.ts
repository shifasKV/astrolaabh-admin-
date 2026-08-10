import type { Affiliate, AffiliateLink, ReferralEvent, Payout } from "@/lib/types";

export const MOCK_AFFILIATES: Affiliate[] = [
  { id: "aff_001", name: "Pt. Sandeep Kochaar", email: "sandeep@astrolaabh.house", code: "SANDEEP108", status: "active", commissionRate: 5, totalRegistrations: 62, totalPurchases: 34, totalAccrued: 86400, totalPaid: 412000, joinedAt: "2025-11-01", lastPayoutAt: "2026-05-05" },
  { id: "aff_002", name: "Dr. Meenakshi Joshi", email: "meenakshi@astrolaabh.house", code: "MEENA9", status: "active", commissionRate: 5, totalRegistrations: 41, totalPurchases: 21, totalAccrued: 31200, totalPaid: 188600, joinedAt: "2026-01-15", lastPayoutAt: "2026-06-05" },
  { id: "aff_003", name: "Acharya V. Tripathi", email: "vtripathi@gmail.com", code: "VTRI21", status: "active", commissionRate: 4, totalRegistrations: 19, totalPurchases: 12, totalAccrued: 12516, totalPaid: 96200, joinedAt: "2026-03-01", lastPayoutAt: "2026-07-01" },
  { id: "aff_004", name: "Rajendra Pandey", email: "rajendra.p@wellnessindia.in", code: "RAJENDRA7", status: "under_review", commissionRate: 3.5, totalRegistrations: 8, totalPurchases: 3, totalAccrued: 9021, totalPaid: 0, joinedAt: "2026-06-15" },
];

export const MOCK_AFFILIATE_LINKS: AffiliateLink[] = [
  { id: "link_001", affiliateId: "aff_001", affiliateCode: "SANDEEP108", destination: "https://astrolaabh.house", destinationType: "homepage", shortUrl: "https://astrolaabh.house/r/SANDEEP108", clicks: 1842, conversions: 34, active: true, createdAt: "2025-11-05" },
  { id: "link_002", affiliateId: "aff_001", affiliateCode: "SANDEEP108", destination: "https://astrolaabh.house/consult", destinationType: "consultation", campaign: "youtube-jan", shortUrl: "https://astrolaabh.house/r/SANDEEP108?c=yt-jan", clicks: 956, conversions: 18, active: true, createdAt: "2026-01-10" },
  { id: "link_003", affiliateId: "aff_001", affiliateCode: "SANDEEP108", destination: "https://astrolaabh.house/collection/pukhraj", destinationType: "collection", campaign: "pukhraj-special", shortUrl: "https://astrolaabh.house/r/SANDEEP108?c=pkj", clicks: 423, conversions: 8, active: true, createdAt: "2026-04-15" },
  { id: "link_004", affiliateId: "aff_002", affiliateCode: "MEENA9", destination: "https://astrolaabh.house", destinationType: "homepage", shortUrl: "https://astrolaabh.house/r/MEENA9", clicks: 1120, conversions: 21, active: true, createdAt: "2026-01-20" },
  { id: "link_005", affiliateId: "aff_002", affiliateCode: "MEENA9", destination: "https://astrolaabh.house/consult", destinationType: "consultation", campaign: "insta-feb", shortUrl: "https://astrolaabh.house/r/MEENA9?c=ig-feb", clicks: 678, conversions: 12, active: true, createdAt: "2026-02-01" },
  { id: "link_006", affiliateId: "aff_003", affiliateCode: "VTRI21", destination: "https://astrolaabh.house", destinationType: "homepage", shortUrl: "https://astrolaabh.house/r/VTRI21", clicks: 540, conversions: 12, active: true, createdAt: "2026-03-05" },
  { id: "link_007", affiliateId: "aff_004", affiliateCode: "RAJENDRA7", destination: "https://astrolaabh.house/collection/neelam", destinationType: "collection", campaign: "wellness-podcast", shortUrl: "https://astrolaabh.house/r/RAJENDRA7?c=podcast", clicks: 312, conversions: 3, active: true, createdAt: "2026-06-20" },
  { id: "link_008", affiliateId: "aff_004", affiliateCode: "RAJENDRA7", destination: "https://astrolaabh.house/consult", destinationType: "consultation", shortUrl: "https://astrolaabh.house/r/RAJENDRA7", clicks: 189, conversions: 2, active: true, createdAt: "2026-07-01" },
];

export const MOCK_REFERRAL_EVENTS: ReferralEvent[] = [
  { id: "ref_001", affiliateId: "aff_001", linkId: "link_001", eventType: "order", eventDate: "2026-02-10", orderValue: 285000, commissionAmount: 14250, commissionStatus: "paid", orderStatus: "fulfilled", maskedCustomer: "R***a O." },
  { id: "ref_002", affiliateId: "aff_001", linkId: "link_001", eventType: "order", eventDate: "2026-07-10", orderValue: 558000, commissionAmount: 27900, commissionStatus: "pending", orderStatus: "in_progress", maskedCustomer: "R***h I." },
  { id: "ref_003", affiliateId: "aff_001", linkId: "link_002", eventType: "booking", eventDate: "2026-05-28", maskedCustomer: "M***a P." },
  { id: "ref_004", affiliateId: "aff_001", linkId: "link_001", eventType: "order", eventDate: "2026-06-15", orderValue: 217000, commissionAmount: 10850, commissionStatus: "approved", orderStatus: "in_progress", maskedCustomer: "M***a P." },
  { id: "ref_005", affiliateId: "aff_002", linkId: "link_004", eventType: "order", eventDate: "2026-06-01", orderValue: 198000, commissionAmount: 9900, commissionStatus: "approved", orderStatus: "in_progress", maskedCustomer: "Z***a S." },
  { id: "ref_006", affiliateId: "aff_002", linkId: "link_005", eventType: "order", eventDate: "2026-07-28", orderValue: 95000, commissionAmount: 4750, commissionStatus: "pending", orderStatus: "in_progress", maskedCustomer: "D***a K." },
  { id: "ref_007", affiliateId: "aff_002", linkId: "link_004", eventType: "booking", eventDate: "2026-08-01", maskedCustomer: "A***a R." },
  { id: "ref_008", affiliateId: "aff_003", linkId: "link_006", eventType: "order", eventDate: "2026-05-20", orderValue: 223000, commissionAmount: 8920, commissionStatus: "paid", orderStatus: "in_progress", maskedCustomer: "V***m S." },
  { id: "ref_009", affiliateId: "aff_003", linkId: "link_006", eventType: "order", eventDate: "2026-06-25", orderValue: 82000, commissionAmount: 3280, commissionStatus: "approved", orderStatus: "in_progress", maskedCustomer: "V***m S." },
  { id: "ref_010", affiliateId: "aff_004", linkId: "link_007", eventType: "lead", eventDate: "2026-08-06", campaign: "wellness-podcast", maskedCustomer: "R***n M." },
  { id: "ref_011", affiliateId: "aff_004", linkId: "link_008", eventType: "booking", eventDate: "2026-07-20", maskedCustomer: "R***n M." },
];

export const MOCK_PAYOUTS: Payout[] = [
  { id: "pyt_001", affiliateId: "aff_001", amount: 212000, period: "Nov 2025 – Jan 2026", status: "paid", reference: "PAY-001-SANDEEP", paidAt: "2026-02-05", createdAt: "2026-02-01" },
  { id: "pyt_002", affiliateId: "aff_001", amount: 200000, period: "Feb – Apr 2026", status: "paid", reference: "PAY-002-SANDEEP", paidAt: "2026-05-05", createdAt: "2026-05-01" },
  { id: "pyt_003", affiliateId: "aff_002", amount: 188600, period: "Jan – May 2026", status: "paid", reference: "PAY-001-MEENA", paidAt: "2026-06-05", createdAt: "2026-06-01" },
  { id: "pyt_004", affiliateId: "aff_003", amount: 96200, period: "Mar – Jun 2026", status: "paid", reference: "PAY-001-VTRI", paidAt: "2026-07-01", createdAt: "2026-06-28" },
  { id: "pyt_005", affiliateId: "aff_001", amount: 86400, period: "May – Jul 2026", status: "pending", createdAt: "2026-08-01" },
  { id: "pyt_006", affiliateId: "aff_004", amount: 9021, period: "Jun – Aug 2026", status: "processing", createdAt: "2026-08-05" },
];
