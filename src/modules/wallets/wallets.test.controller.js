import { creditWallet, debitWallet } from "./wallets.service.js";

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

/**
 * TEST CREDIT
 * This is for dev/testing only.
 * You can choose any userId to credit.
 */
export async function testCredit(req, res, next) {
  try {
    const userId = toPositiveInt(req.body.userId, "userId");
    const amount = toPositiveInt(req.body.amount, "amount");
    const currency = typeof req.body.currency === "string" ? req.body.currency : "NGN";

    const result = await creditWallet({ userId, amount, currency });

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
 * TEST DEBIT
 * This is for dev/testing only.
 * You can choose any userId to debit.
 */
export async function testDebit(req, res, next) {
  try {
    const userId = toPositiveInt(req.body.userId, "userId");
    const amount = toPositiveInt(req.body.amount, "amount");
    const currency = typeof req.body.currency === "string" ? req.body.currency : "NGN";

    const result = await debitWallet({ userId, amount, currency });

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
 * CONCURRENCY TEST
 * Sends multiple debits at the same time to the same wallet.
 * Goal: only some should succeed, others should fail with "Insufficient balance".
 */
export async function testConcurrency(req, res, next) {
  try {
    const userId = toPositiveInt(req.body.userId, "userId");
    const amount = toPositiveInt(req.body.amount, "amount");
    const attemptsRaw = toInt(req.body.attempts, "attempts");
    const attempts = Math.min(Math.max(attemptsRaw, 1), 50); // clamp 1..50
    const currency = typeof req.body.currency === "string" ? req.body.currency : "NGN";

    const tasks = Array.from({ length: attempts }, async (_, i) => {
      try {
        const r = await debitWallet({ userId, amount, currency });
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
