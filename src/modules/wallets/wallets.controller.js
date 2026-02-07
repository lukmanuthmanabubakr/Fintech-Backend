import { creditWallet, debitWallet } from "./wallets.service.js";

export async function credit(req, res, next) {
  try {
    const { userId, amount, currency } = req.body;

    const result = await creditWallet({
      userId: Number(userId),
      amount: Number(amount),
      currency: currency || "USD",
    });

    return res.status(200).json({
      success: true,
      message: "Wallet credited",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function debit(req, res, next) {
  try {
    const { userId, amount, currency } = req.body;

    const result = await debitWallet({
      userId: Number(userId),
      amount: Number(amount),
      currency: currency || "USD",
    });

    return res.status(200).json({
      success: true,
      message: "Wallet debited",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
