import { z } from "zod";

export const StatusToneSchema = z.enum(["gold", "good", "muted", "danger", "info"]);
export type StatusTone = z.infer<typeof StatusToneSchema>;

export const DateStringSchema = z.string();

export const MoneySchema = z.number().nonnegative();

export function inr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}
