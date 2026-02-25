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

export async function getAllTransactions({ page = 1, limit = 20, status }) {
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

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