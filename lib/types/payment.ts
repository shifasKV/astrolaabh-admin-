import { z } from "zod";

export const PAYMENT_STATUSES = [
  "draft",
  "sent",
  "opened",
  "paid",
  "expired",
  "cancelled",
  "failed",
] as const;

export const PaymentRequestSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  purpose: z.string(),
  description: z.string().optional(),
  amount: z.number(),
  currency: z.literal("INR"),
  status: z.enum(PAYMENT_STATUSES),
  linkedAppointmentId: z.string().optional(),
  linkedRecommendationId: z.string().optional(),
  linkedOrderId: z.string().optional(),
  paymentLink: z.string().optional(),
  expiresAt: z.string().optional(),
  paidAt: z.string().optional(),
  transactionRef: z.string().optional(),
  ownerId: z.string(),
  ownerName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PaymentRequest = z.infer<typeof PaymentRequestSchema>;
