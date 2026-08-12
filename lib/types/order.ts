import { z } from "zod";

export const ORDER_STAGES = [
  "Payment received",
  "Energisation scheduled",
  "Energised — recording vaulted",
  "Jewellery in crafting",
  "Quality check",
  "Dispatched — insured & tracked",
  "In transit",
  "Delivered",
] as const;

export const OrderStageSchema = z.number().min(0).max(7);

export const OrderItemSchema = z.object({
  sku: z.string(),
  name: z.string(),
  qty: z.number().positive(),
  price: z.number(),
  gemstone: z.string().optional(),
  caratWeight: z.string().optional(),
  itemType: z.enum(["stone", "jewellery"]).optional(),
  itemStatus: z.enum(["order_placed", "in_transit", "order_received", "in_crafting", "quality_check", "ready_to_ship"]).optional(),
  vendorName: z.string().optional(),
  vendorOrderId: z.string().optional(),
  receivedAt: z.string().optional(),
  receivedNotes: z.string().optional(),
});

export const OrderSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  items: z.array(OrderItemSchema),
  total: z.number(),
  stage: OrderStageSchema,
  shopifyStatus: z.enum(["unfulfilled", "partially_fulfilled", "fulfilled", "cancelled", "refunded"]),
  operationalStatus: z.enum(["pending", "in_progress", "completed", "exception"]),
  tracking: z.string().optional(),
  affiliateCode: z.string().optional(),
  paymentStatus: z.enum(["paid", "partial", "pending", "failed", "refunded"]),
  energisationStatus: z.enum(["not_required", "pending", "scheduled", "in_progress", "completed", "exception"]),
  energisationTier: z.enum(["shuddhi", "pran_pratishtha", "maha_abhishek", "vishesh_anushthan"]).optional(),
  certificateStatus: z.enum(["not_required", "missing", "uploaded", "verified", "rejected"]),
  consultationId: z.string().optional(),
  recommendationId: z.string().optional(),
  placedAt: z.string(),
  updatedAt: z.string(),
  placedBy: z.string().optional(),
  notes: z.string().optional(),
  returnStatus: z.enum(["requested", "approved", "in_transit", "received", "settled"]).optional(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
