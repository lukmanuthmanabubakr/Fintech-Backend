import { creditWallet, debitWallet } from "./wallets.service.js";

export async function credit(req, res, next) {
  try {
    const userId = Number(req.user.sub);
    const { amount, currency } = req.body;

    const result = await creditWallet({
      userId,
      amount: Number(amount),
      currency: currency || "USD",
    });

    res.json({ success: true, message: "Wallet credited", data: result });
  } catch (err) {
    next(err);
  }
}

export async function debit(req, res, next) {
  try {
    const userId = Number(req.user.sub);
    const { amount, currency } = req.body;

    const result = await debitWallet({
      userId,
      amount: Number(amount),
      currency: currency || "USD",
    });

    res.json({ success: true, message: "Wallet debited", data: result });
  } catch (err) {
    next(err);
  }
}
