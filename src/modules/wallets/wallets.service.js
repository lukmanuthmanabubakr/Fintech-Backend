import { prisma } from "../../config/db.js";

async function getClearingWallet(tx, currency = "NGN") {
  const w = await tx.wallet.findFirst({
    where: { isSystem: true, currency },
    select: { id: true },
  });

  if (!w) {
    const err = new Error("Clearing wallet missing. ensureClearingWallet should create it.");
    err.statusCode = 500;
    throw err;
  }

  return w;
}

//Used by webhook: credit wallet + ledger using an existing transactionId
export async function creditWalletFromWebhook(tx, { transactionId, userId, amount, currency = "NGN" }) {
  const userWallet = await tx.wallet.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!userWallet) {
    const err = new Error("User wallet not found");
    err.statusCode = 404;
    throw err;
  }

  const clearing = await getClearingWallet(tx, currency);

  // update balances
  await tx.wallet.update({
    where: { id: userWallet.id },
    data: { balance: { increment: amount } },
  });

  await tx.wallet.update({
    where: { id: clearing.id },
    data: { balance: { decrement: amount } },
  });

  // ledger entries (double-entry)
  await tx.ledgerEntry.createMany({
    data: [
      { transactionId, walletId: userWallet.id, entryType: "CREDIT", amount },
      { transactionId, walletId: clearing.id, entryType: "DEBIT", amount },
    ],
  });
}


function makeRef() {
  return `TX-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export async function creditWallet({ userId, amount, currency = "NGN" }) {
  if (!Number.isInteger(amount) || amount <= 0) {
    const err = new Error("amount must be a positive integer (kobo)");
    err.statusCode = 400;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const userWallet = await tx.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!userWallet) {
      const err = new Error("User wallet not found");
      err.statusCode = 404;
      throw err;
    }

    const clearing = await getClearingWallet(tx, currency);

    const txn = await tx.transaction.create({
      data: {
        userId,
        type: "DEPOSIT",
        amount,
        status: "PENDING",
        reference: makeRef(),
      },
    });

    await tx.wallet.update({
      where: { id: userWallet.id },
      data: { balance: { increment: amount } },
    });

    await tx.wallet.update({
      where: { id: clearing.id },
      data: { balance: { decrement: amount } },
    });

    // ledger entries (double-entry)
    await tx.ledgerEntry.createMany({
      data: [
        { transactionId: txn.id, walletId: userWallet.id, entryType: "CREDIT", amount },
        { transactionId: txn.id, walletId: clearing.id, entryType: "DEBIT", amount },
      ],
    });

    return tx.transaction.update({
      where: { id: txn.id },
      data: { status: "SUCCESS" },
      include: { entries: true },
    });
  });
}

export async function debitWallet({ userId, amount, currency = "NGN" }) {
  if (!Number.isInteger(amount) || amount <= 0) {
    const err = new Error("amount must be a positive integer (kobo)");
    err.statusCode = 400;
    throw err;
  }

  return prisma.$transaction(async (tx) => {
    const userWallet = await tx.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!userWallet) {
      const err = new Error("User wallet not found");
      err.statusCode = 404;
      throw err;
    }

    const clearing = await getClearingWallet(tx, currency);

    const txn = await tx.transaction.create({
      data: {
        userId,
        type: "WITHDRAWAL",
        amount,
        status: "PENDING",
        reference: makeRef(),
      },
    });

    // To Prevent negative balance (atomic)
    const updated = await tx.wallet.updateMany({
      where: { id: userWallet.id, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });

    if (updated.count !== 1) {
      await tx.transaction.update({
        where: { id: txn.id },
        data: { status: "FAILED" },
      });

      const err = new Error("Insufficient balance");
      err.statusCode = 400;
      throw err;
    }

    await tx.wallet.update({
      where: { id: clearing.id },
      data: { balance: { increment: amount } },
    });

    await tx.ledgerEntry.createMany({
      data: [
        { transactionId: txn.id, walletId: userWallet.id, entryType: "DEBIT", amount },
        { transactionId: txn.id, walletId: clearing.id, entryType: "CREDIT", amount },
      ],
    });

    return tx.transaction.update({
      where: { id: txn.id },
      data: { status: "SUCCESS" },
      include: { entries: true },
    });
  });
}

