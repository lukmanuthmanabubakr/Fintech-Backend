import { fetchTransactionByReference, fetchUserTransactions } from "./transactions.service.js";

export async function getMyTransactions(req, res, next) {
  try {
    const userId = Number(req.user.sub);

    const { page, limit } = req.query;

    const result = await fetchUserTransactions({
      userId,
      page,
      limit,
    });

    return res.json({
      success: true,
      meta: result.meta,
      data: result.items,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyTransactionByReference(req, res, next) {
  try {
    const userId = Number(req.user.sub);
    const { reference } = req.params;

    const txn = await fetchTransactionByReference({ userId, reference });

    if (!txn) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    return res.json({
      success: true,
      data: txn,
    });
  } catch (err) {
    next(err);
  }
}
