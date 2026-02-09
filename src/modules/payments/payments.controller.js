import { initializeDeposit } from "./payments.service.js";

export async function initializePayment(req, res, next) {
  try {
    const userId = Number(req.user.sub);
    const { amount } = req.body;

    const result = await initializeDeposit({
      userId,
      amountNaira: amount,
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
