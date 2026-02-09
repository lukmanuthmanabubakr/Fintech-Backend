import { creditWallet, debitWallet } from "./wallets.service.js";
import { nairaToKobo } from "../../utils/money.js";
import { formatTransactionForUser } from "../../utils/formatters.js";

export async function credit(req, res, next) {
  try {
    const userId = Number(req.user.sub);
    const { amount, currency = "NGN" } = req.body;

    const kobo = nairaToKobo(amount);
    if (!kobo) {
      return res.status(400).json({
        success: false,
        message: "amount must be a valid naira value",
      });
    }

    const result = await creditWallet({
      userId,
      amount: kobo,
      currency,
    });

    return res.json({
      success: true,
      message: "Wallet credited",
      data: formatTransactionForUser(result),
    });

  } catch (err) {
    next(err);
  }
}

export async function debit(req, res, next) {
  try {
    const userId = Number(req.user.sub);
    const { amount, currency = "NGN" } = req.body;

    const kobo = nairaToKobo(amount);
    if (!kobo) {
      return res.status(400).json({
        success: false,
        message: "amount must be a valid naira value",
      });
    }

    const result = await debitWallet({
      userId,
      amount: kobo,
      currency,
    });

    return res.json({
      success: true,
      message: "Wallet debited",
      data: formatTransactionForUser(result),
    });

  } catch (err) {
    next(err);
  }
}
