import crypto from "crypto";
import { prisma } from "../../config/db.js";
import { creditWalletFromWebhook } from "../wallets/wallets.service.js";

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
  try {
    const ok = verifyPaystackSignature(req);
    if (!ok) {
      return res.status(401).json({ success: false, message: "Invalid signature" });
    }

    const event = req.body;

    if (event?.event !== "charge.success") {
      return res.json({ received: true });
    }

    const paystackRef = event?.data?.reference;
    const amountPaid = event?.data?.amount;
    const currency = event?.data?.currency || "NGN";

    if (!paystackRef || !amountPaid) {
      return res.json({ received: true });
    }

    await prisma.$transaction(async (tx) => {
      const txn = await tx.transaction.findUnique({
        where: { reference: paystackRef },
        select: { id: true, userId: true, status: true, amount: true, type: true },
      });

      if (!txn) return;

      if (txn.type !== "DEPOSIT") return;

      if (txn.status === "SUCCESS") return;

      if (txn.amount !== amountPaid) {
        await tx.transaction.update({
          where: { id: txn.id },
          data: { status: "FAILED" },
        });
        return;
      }

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
    });

    return res.json({ received: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Webhook error", error: err.message });
  }
}
