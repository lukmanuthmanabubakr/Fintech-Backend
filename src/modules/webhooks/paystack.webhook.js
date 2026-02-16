import crypto from "crypto";
import { prisma } from "../../config/db.js";
import { creditWalletFromWebhook } from "../wallets/wallets.service.js";
import { paystackWebhookSchema } from "./webhooks.validation.js";

function verifyPaystackSignature(req) {
  const signature = req.headers["x-paystack-signature"];
  if (!signature) return false;

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.rawBody)
    .digest("hex");

  return hash === signature;
}

export async function paystackWebhook(req, res) {
  let logId = null;

  try {
    const signature = req.headers["x-paystack-signature"] || null;
    const event = req.body;

    // Validate webhook payload structure first.
    const validatedEvent = paystackWebhookSchema.parse(event);

    const eventType = validatedEvent.event;
    const reference = validatedEvent.data.reference;

    // Day 5–6: log webhook FIRST (evidence)
    try {
      const log = await prisma.webhookEvent.create({
        data: {
          provider: "PAYSTACK",
          eventType,
          reference,
          signature,
          payload: event,
        },
        select: { id: true },
      });
      logId = log.id;
    } catch (e) {
      // If unique constraint hits (duplicate), it's fine.
      // We'll still keep the webhook idempotent.
    }

    const ok = verifyPaystackSignature(req);
    if (!ok) {
      if (logId) {
        await prisma.webhookEvent.update({
          where: { id: logId },
          data: { errorMessage: "Invalid signature" },
        });
      }
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }

    // Only handle successful payment
    if (eventType !== "charge.success") {
      if (logId) {
        await prisma.webhookEvent.update({
          where: { id: logId },
          data: { processed: true, processedAt: new Date() },
        });
      }
      return res.json({ received: true });
    }

    const amountPaid = validatedEvent.data.amount; // kobo
    const currency = validatedEvent.data.currency || "NGN";

    if (!reference || !amountPaid) {
      if (logId) {
        await prisma.webhookEvent.update({
          where: { id: logId },
          data: { errorMessage: "Missing reference or amount" },
        });
      }
      return res.json({ received: true });
    }

    await prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.findUnique({
        where: { reference },
        select: { id: true, userId: true, status: true, amount: true, type: true },
      });

      if (!txn) return;
      if (txn.type !== "DEPOSIT") return;

      // idempotency: already SUCCESS => do nothing
      if (txn.status === "SUCCESS") return;

      // extra safety: confirm amount matches what you created on initialize
      if (txn.amount !== amountPaid) {
        await tx.transaction.update({
          where: { id: txn.id },
          data: { status: "FAILED" },
        });
        return;
      }

      // atomic update (prevents double success)
      const updated = await tx.transaction.updateMany({
        where: { id: txn.id, status: "PENDING" },
        data: { status: "SUCCESS" },
      });

      if (updated.count !== 1) return;

      await creditWalletFromWebhook(tx, {
        transactionId: txn.id,
        userId: txn.userId,
        amount: txn.amount,
        currency,
      });

      // mark log processed inside same transaction
      if (logId) {
        await tx.webhookEvent.update({
          where: { id: logId },
          data: { processed: true, processedAt: new Date() },
        });
      }
    });

    return res.json({ received: true });
  } catch (err) {
    if (logId) {
      try {
        await prisma.webhookEvent.update({
          where: { id: logId },
          data: { errorMessage: err.message },
        });
      } catch {}
    }

    return res.status(500).json({
      success: false,
      message: "Webhook error",
      error: err.message,
    });
  }
}
