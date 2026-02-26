import { creditWallet, debitWallet, transferFunds } from "./wallets.service.js";
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

export async function transfer(req, res, next) {
  try {
    const senderId = req.user.sub;
    const { recipientEmail, amountNaira } = req.body;

    if (!recipientEmail || !amountNaira) {
      return res.status(400).json({
        success: false,
        message: "recipientEmail and amountNaira are required",
      });
    }

    const amountKobo = nairaToKobo(amountNaira);
    if (!amountKobo) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid naira value greater than zero",
      });
    }

    const result = await transferFunds({
      senderId,
      recipientEmail,
      amount: amountKobo,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}