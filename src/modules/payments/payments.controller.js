import { initializeDeposit } from "./payments.service.js";
import { initializePaymentSchema } from "./payments.validation.js";

export async function initializePayment(req, res, next) {
  try {
    const payload = initializePaymentSchema.parse(req.body);
    const userId = Number(req.user.sub);

    const result = await initializeDeposit({
      userId,
      amountNaira: payload.amount,
    });

    return res.status(201).json({
      success: true,
      message: "Payment initialized",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
