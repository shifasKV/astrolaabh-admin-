import { z } from "zod";

export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  birthDate: z.string(),
  birthTime: z.string(),
  birthPlace: z.string(),
  shippingAddress: z.string().optional(),
  chartRef: z.string().optional(),
  rashi: z.string().optional(),
  nakshatra: z.string().optional(),
  createdAt: z.string(),
  notes: z.string().optional(),
  affiliateCode: z.string().optional(),
});

export type Customer = z.infer<typeof CustomerSchema>;
