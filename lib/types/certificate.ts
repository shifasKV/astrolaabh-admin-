import { z } from "zod";

export const CERTIFICATE_STATUSES = ["missing", "uploaded", "verified", "rejected", "superseded"] as const;

export const CertificateSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  orderNumber: z.string(),
  type: z.enum(["lab_authenticity", "energisation"]),
  status: z.enum(CERTIFICATE_STATUSES),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  certificateNumber: z.string().optional(),
  issuingAuthority: z.string().optional(),
  issueDate: z.string().optional(),
  applicableSku: z.string().optional(),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().optional(),
  verificationNotes: z.string().optional(),
  uploadedBy: z.string().optional(),
  uploadedAt: z.string().optional(),
  previousVersionId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Certificate = z.infer<typeof CertificateSchema>;
