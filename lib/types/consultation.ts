import { z } from "zod";

export const CONSULTATION_STATUSES = [
  "scheduled",
  "reschedule_requested",
  "rescheduled",
  "cancelled",
  "in_progress",
  "completed",
  "summary_pending",
  "closed",
  "no_show",
] as const;

export const ConsultationSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  expertId: z.string(),
  expertName: z.string(),
  type: z.enum(["initial", "follow_up", "remedy_review", "stone_selection"]),
  status: z.enum(CONSULTATION_STATUSES),
  scheduledAt: z.string(),
  duration: z.number(),
  fee: z.number().optional(),
  paymentStatus: z.enum(["paid", "pending"]).optional(),
  timezone: z.string(),
  meetingLink: z.string().optional(),
  calendlyId: z.string().optional(),
  problemStatement: z.string().optional(),
  summary: z.string().optional(),
  summarySubmittedAt: z.string().optional(),
  recommendationId: z.string().optional(),
  paymentRequestId: z.string().optional(),
  rescheduleReason: z.string().optional(),
  noShowBy: z.enum(["customer", "expert"]).optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Consultation = z.infer<typeof ConsultationSchema>;
