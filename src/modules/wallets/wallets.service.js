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

//This is used by webhook: credit wallet + ledger using an existing transactionId.
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

export async function transferFunds({ senderId, recipientEmail, amount }) {

  // Step 1 — Basic validation
  if (!Number.isInteger(amount) || amount <= 0) {
    const err = new Error("Amount must be a positive integer (kobo)");
    err.statusCode = 400;
    throw err;
  }

  // Step 2 — Find recipient by email
  const recipient = await prisma.user.findUnique({
    where: { email: recipientEmail },
    select: { id: true, email: true, fullName: true },
  });

  if (!recipient) {
    const err = new Error("Recipient not found");
    err.statusCode = 404;
    throw err;
  }

  // Step 3 — Prevent self transfer
  if (senderId === recipient.id) {
    const err = new Error("You cannot transfer to yourself");
    err.statusCode = 400;
    throw err;
  }

  // Step 4 — KYC check before touching any money
  const kyc = await prisma.kycRecord.findUnique({
    where: { userId: senderId },
    select: { status: true },
  });

  if (!kyc || kyc.status !== "VERIFIED") {
    const err = new Error("KYC verification required to make transfers");
    err.statusCode = 403;
    throw err;
  }

  // Step 5 — Everything below is atomic
  return prisma.$transaction(async (tx) => {

    // Step 6 — Fetch both wallets
    const senderWallet = await tx.wallet.findUnique({
      where: { userId: senderId },
      select: { id: true, balance: true },
    });

    const recipientWallet = await tx.wallet.findUnique({
      where: { userId: recipient.id },
      select: { id: true },
    });

    if (!senderWallet) {
      const err = new Error("Sender wallet not found");
      err.statusCode = 404;
      throw err;
    }

    if (!recipientWallet) {
      const err = new Error("Recipient wallet not found");
      err.statusCode = 404;
      throw err;
    }

    // Step 7 — Create transaction intent
    const txn = await tx.transaction.create({
      data: {
        userId: senderId,
        recipientId: recipient.id,
        type: "TRANSFER",
        amount,
        status: "PENDING",
        reference: makeRef(),
      },
    });

    // Step 8 — Debit sender conditionally (prevents negative balance + race condition..)
    const debited = await tx.wallet.updateMany({
      where: { id: senderWallet.id, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });

    if (debited.count !== 1) {
      await tx.transaction.update({
        where: { id: txn.id },
        data: { status: "FAILED" },
      });

      const err = new Error("Insufficient balance");
      err.statusCode = 400;
      throw err;
    }

    // Step 9 — Credit recipient.
    await tx.wallet.update({
      where: { id: recipientWallet.id },
      data: { balance: { increment: amount } },
    });

    // Step 10 — Write ledger entries.
    await tx.ledgerEntry.createMany({
      data: [
        { transactionId: txn.id, walletId: senderWallet.id, entryType: "DEBIT", amount },
        { transactionId: txn.id, walletId: recipientWallet.id, entryType: "CREDIT", amount },
      ],
    });

    // Step 11 — Mark success and return.
    return tx.transaction.update({
      where: { id: txn.id },
      data: { status: "SUCCESS" },
      include: { entries: true },
    });
  });
}