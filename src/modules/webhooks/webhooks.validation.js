import { z } from "zod";

/**
 * Schema for Paystack webhook payload
 * Validates the structure of the event sent by Paystack
 */
export const paystackWebhookSchema = z.object({
  event: z
    .string("Event must be a string")
    .min(1, "Event is required"),
  data: z.object({
    reference: z
      .string("Reference must be a string")
      .min(1, "Reference is required"),
    amount: z
      .number("Amount must be a number")
      .int("Amount must be an integer")
      .positive("Amount must be positive"),
    currency: z
      .string("Currency must be a string")
      .optional()
      .default("NGN"),
    status: z
      .string()
      .optional(),
    authorization: z.object({}).optional(),
  }),
});
