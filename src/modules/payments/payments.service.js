import { prisma } from "../../config/db.js";
import { paystackInitializeTransaction } from "../../utils/paystack.js";
import { nairaToKobo } from "../../utils/money.js";

function makeRef() {
  return `TX-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export async function initializeDeposit({
  userId,
  amountNaira,
  idempotencyKey,
}) {
  const amountKobo = nairaToKobo(amountNaira);
  if (!amountKobo) {
    const err = new Error("amount must be a valid naira value");
    err.statusCode = 400;
    throw err;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  const reference = makeRef();

  if (idempotencyKey) {
    const existing = await prisma.transaction.findFirst({
      where: { userId, idempotencyKey },
      select: { id: true, reference: true, amount: true, status: true },
    });

    if (existing) {
      return {
        transaction: existing,
        alreadyExists: true,
      };
    }
  }

  const txn = await prisma.transaction.create({
    data: {
      userId,
      type: "DEPOSIT",
      amount: amountKobo,
      status: "PENDING",
      reference,
      idempotencyKey: idempotencyKey || null,
    },
    select: { id: true, reference: true, amount: true, status: true },
  });

  // 2) call Paystack initialize
  const paystackData = await paystackInitializeTransaction({
    email: user.email,
    amountKobo,
    reference,
  });

  // keep it simple: return the URL; we don't need to save paystack response yet
  return {
    transaction: txn,
    authorizationUrl: paystackData.authorization_url,
    reference: paystackData.reference,
  };
}
