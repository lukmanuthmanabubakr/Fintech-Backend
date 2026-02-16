import { z } from "zod";

/**
 * Schema for initializing a deposit payment
 * amount: user provides in NAIRA (e.g., 2000 for 2000 naira)
 * server converts to kobo internally
 */
export const initializePaymentSchema = z.object({
  amount: z
    .number("Amount must be a number")
    .int("Amount must be a whole number (no decimals)")
    .positive("Amount must be greater than 0")
    .max(10000000, "Amount cannot exceed 10,000,000 NGN (to prevent accidental huge transfers)"),
});
