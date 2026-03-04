import { prisma } from "../../config/db.js";

export async function getAllUsers({ page = 1, limit = 20 }) {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        createdAt: true,
        wallet: {
          select: { balance: true, currency: true },
        },
      },
    }),
    prisma.user.count(),
  ]);

  return { users, total, page, limit };
}

export async function getAllTransactions({ page = 1, limit = 20, status, email }) {
  const skip = (page - 1) * limit;

  const where = {
    ...(status && { status }),
    ...(email && {
      user: {
        email: { contains: email, mode: "insensitive" },
      },
    }),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        reference: true,
        createdAt: true,
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return { transactions, total, page, limit };
}

export async function getPendingKyc() {
  return prisma.kycRecord.findMany({
    where: { status: "PENDING" },
    orderBy: { submittedAt: "asc" },
    select: {
      id: true,
      status: true,
      bvn: true,
      nin: true,
      submittedAt: true,
      user: {
        select: { id: true, fullName: true, email: true },
      },
    },
  });
}

export async function reviewKyc({ userId, status }) {
  if (!["VERIFIED", "REJECTED"].includes(status)) {
    const err = new Error("Status must be VERIFIED or REJECTED");
    err.statusCode = 400;
    throw err;
  }

  const record = await prisma.kycRecord.findUnique({
    where: { userId },
  });

  if (!record) {
    const err = new Error("KYC record not found for this user");
    err.statusCode = 404;
    throw err;
  }

  if (record.status !== "PENDING") {
    const err = new Error("Only PENDING records can be reviewed");
    err.statusCode = 400;
    throw err;
  }

  return prisma.kycRecord.update({
    where: { userId },
    data: {
      status,
      reviewedAt: new Date(),
    },
    select: {
      userId: true,
      status: true,
      reviewedAt: true,
    },
  });
}