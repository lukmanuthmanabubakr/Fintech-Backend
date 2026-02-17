import { initializeDeposit } from "./payments.service.js";
import { initializePaymentSchema } from "./payments.validation.js";
import { logger } from "../../config/logger.js";

export async function initializePayment(req, res, next) {
  try {
    const payload = initializePaymentSchema.parse(req.body);
    const userId = Number(req.user.sub);

    const result = await initializeDeposit({
      userId,
      amountNaira: payload.amount,
    });

    logger.info({
      event: 'payment_initialized',
      userId,
      amount: payload.amount,
      reference: result.transaction.reference,
      ip: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "Payment initialized",
      data: result,
    });
  } catch (err) {
    logger.error({
      event: 'payment_initialization_failed',
      userId: req.user?.sub,
      amount: req.body?.amount,
      reason: err.message,
      ip: req.ip,
    });
    next(err);
  }
}
