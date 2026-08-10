import { z } from "zod";

export const ENERGISATION_STATUSES = [
  "not_required",
  "pending",
  "scheduled",
  "in_progress",
  "completed",
  "exception",
] as const;

export const EnergisationTaskSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  orderNumber: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  stoneSku: z.string(),
  stoneDescription: z.string(),
  status: z.enum(ENERGISATION_STATUSES),
  scheduledAt: z.string().optional(),
  method: z.string().optional(),
  assignedTo: z.string().optional(),
  completedAt: z.string().optional(),
  liveLink: z.string().optional(),
  proofUrl: z.string().optional(),
  proofType: z.enum(["image", "video", "live_link"]).optional(),
  buyerNotified: z.boolean(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type EnergisationTask = z.infer<typeof EnergisationTaskSchema>;
