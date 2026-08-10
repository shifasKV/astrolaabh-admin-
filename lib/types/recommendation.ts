import { z } from "zod";

export const RECOMMENDATION_STATUSES = [
  "draft",
  "submitted",
  "needs_clarification",
  "approved",
  "shared",
  "converted_to_order",
  "closed",
  "rejected",
] as const;

export const StoneRecommendationSchema = z.object({
  id: z.string(),
  consultationId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  expertId: z.string(),
  expertName: z.string(),
  status: z.enum(RECOMMENDATION_STATUSES),
  gemstone: z.string(),
  rationale: z.string(),
  purpose: z.string(),
  weightRange: z.string(),
  qualityCriteria: z.string().optional(),
  metalSetting: z.string().optional(),
  fingerGuidance: z.string().optional(),
  timingGuidance: z.string().optional(),
  energisationNotes: z.string().optional(),
  priority: z.enum(["primary", "alternative"]),
  matchedSku: z.string().optional(),
  orderId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const RemedyRecommendationSchema = z.object({
  id: z.string(),
  consultationId: z.string(),
  customerId: z.string(),
  expertId: z.string(),
  type: z.enum(["mantra", "yantra", "donation", "puja", "fasting", "lifestyle", "other"]),
  instructions: z.string(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  startTiming: z.string().optional(),
  precautions: z.string().optional(),
  followUpRequired: z.boolean(),
  createdAt: z.string(),
});

export type StoneRecommendation = z.infer<typeof StoneRecommendationSchema>;
export type RemedyRecommendation = z.infer<typeof RemedyRecommendationSchema>;
