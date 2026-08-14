import { z } from "zod";

export const UserRoleSchema = z.enum(["admin", "expert", "affiliate", "sales_admin", "sales_exec"]);

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: UserRoleSchema,
  status: z.enum(["active", "inactive", "suspended"]),
  specialization: z.string().optional(),
  languages: z.array(z.string()).optional(),
  consultationTypes: z.array(z.string()).optional(),
  calendlyId: z.string().optional(),
  lastLoginAt: z.string().optional(),
  createdAt: z.string(),
  createdBy: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
