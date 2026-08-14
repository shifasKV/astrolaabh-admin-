import { z } from "zod";

export const COMMISSION_STATUSES = [
  "pending",
  "on_hold",
  "approved",
  "payable",
  "paid",
  "reversed",
  "rejected",
  "adjusted",
] as const;

export const AffiliateSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  code: z.string(),
  status: z.enum(["active", "under_review", "suspended", "inactive"]),
  commissionRate: z.number(),
  totalRegistrations: z.number(),
  totalPurchases: z.number(),
  totalAccrued: z.number(),
  totalPaid: z.number(),
  joinedAt: z.string(),
  lastPayoutAt: z.string().optional(),
});

export const AffiliateLinkSchema = z.object({
  id: z.string(),
  affiliateId: z.string(),
  affiliateCode: z.string(),
  destination: z.string(),
  destinationType: z.enum(["homepage", "product", "collection", "consultation", "campaign", "stone"]),
  productName: z.string().optional(),
  campaign: z.string().optional(),
  shortUrl: z.string(),
  clicks: z.number(),
  conversions: z.number(),
  active: z.boolean(),
  createdAt: z.string(),
});

export const ReferralEventSchema = z.object({
  id: z.string(),
  affiliateId: z.string(),
  linkId: z.string(),
  eventType: z.enum(["click", "lead", "booking", "order"]),
  eventDate: z.string(),
  campaign: z.string().optional(),
  orderValue: z.number().optional(),
  commissionAmount: z.number().optional(),
  commissionStatus: z.enum(COMMISSION_STATUSES).optional(),
  orderStatus: z.string().optional(),
  maskedCustomer: z.string().optional(),
});

export const PayoutSchema = z.object({
  id: z.string(),
  affiliateId: z.string(),
  amount: z.number(),
  period: z.string(),
  status: z.enum(["pending", "processing", "paid", "failed"]),
  reference: z.string().optional(),
  paidAt: z.string().optional(),
  createdAt: z.string(),
});

export type Affiliate = z.infer<typeof AffiliateSchema>;
export type AffiliateLink = z.infer<typeof AffiliateLinkSchema>;
export type ReferralEvent = z.infer<typeof ReferralEventSchema>;
export type Payout = z.infer<typeof PayoutSchema>;
