import { creditWallet, debitWallet } from "./wallets.service.js";
import { nairaToKobo } from "../../utils/money.js";

function toInt(value, fieldName) {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    const err = new Error(`${fieldName} must be an integer`);
    err.statusCode = 400;
    throw err;
  }
  return n;
}

function toPositiveInt(value, fieldName) {
  const n = toInt(value, fieldName);
  if (n <= 0) {
    const err = new Error(`${fieldName} must be a positive integer`);
    err.statusCode = 400;
    throw err;
  }
  return n;
}

function toCurrency(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "NGN";
}

// ✅ amount here is NAIRA (user-friendly)
// convert to KOBO (db-friendly)
function toKobo(amountNaira) {
  const kobo = nairaToKobo(amountNaira);
  if (!kobo) {
    const err = new Error("amount must be a valid naira value");
    err.statusCode = 400;
    throw err;
  }
  return kobo;
}

/**
 * TEST CREDIT (DEV ONLY)
 * Credits ANY userId (not the logged-in user).
 * amount is NAIRA -> converted to KOBO.
 */
export async function testCredit(req, res, next) {
  try {
    const userId = toPositiveInt(req.body.userId, "userId");
    const currency = toCurrency(req.body.currency);

    const amountKobo = toKobo(req.body.amount);

    const result = await creditWallet({
      userId,
      amount: amountKobo,
      currency,
    });

    return res.json({
      success: true,
      message: `Test credit ok: credited userId=${userId}`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * TEST DEBIT (DEV ONLY)
 * Debits ANY userId.
 * amount is NAIRA -> converted to KOBO.
 */
export async function testDebit(req, res, next) {
  try {
    const userId = toPositiveInt(req.body.userId, "userId");
    const currency = toCurrency(req.body.currency);

    const amountKobo = toKobo(req.body.amount);

    const result = await debitWallet({
      userId,
      amount: amountKobo,
      currency,
    });

    return res.json({
      success: true,
      message: `Test debit ok: debited userId=${userId}`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * CONCURRENCY TEST (DEV ONLY)
 * Runs MANY debits at once for same user wallet.
 * amount is NAIRA -> converted to KOBO.
 */
export async function testConcurrency(req, res, next) {
  try {
    const userId = toPositiveInt(req.body.userId, "userId");
    const currency = toCurrency(req.body.currency);

    const amountKobo = toKobo(req.body.amount);

    const attemptsRaw = toInt(req.body.attempts, "attempts");
    const attempts = Math.min(Math.max(attemptsRaw, 1), 50);

    const tasks = Array.from({ length: attempts }, async (_, i) => {
      try {
        const r = await debitWallet({
          userId,
          amount: amountKobo,
          currency,
        });

        return { ok: true, index: i, transactionId: r.id, status: r.status };
      } catch (e) {
        return { ok: false, index: i, error: e.message };
      }
    });

    const results = await Promise.all(tasks);

    const summary = {
      attempts,
      successCount: results.filter((r) => r.ok).length,
      failCount: results.filter((r) => !r.ok).length,
    };

    return res.json({
      success: true,
      message: `Concurrency test done for userId=${userId}`,
      summary,
      results,
    });
  } catch (err) {
    next(err);
  }
}
