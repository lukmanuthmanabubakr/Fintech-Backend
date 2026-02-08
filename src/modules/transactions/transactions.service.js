import { prisma } from "../../config/db.js";

export async function fetchUserTransactions({ userId, page = 1, limit = 20 }) {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: safeLimit,
      include: {
        entries: {
          include: {
            wallet: {
              select: { id: true, userId: true, isSystem: true, currency: true },
            },
          },
        },
      },
    }),
    prisma.transaction.count({ where: { userId } }),
  ]);

  return {
    items,
    meta: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}

export async function fetchTransactionByReference({ userId, reference }) {
  return prisma.transaction.findFirst({
    where: { userId, reference },
    include: {
      entries: {
        include: {
          wallet: {
            select: { id: true, userId: true, isSystem: true, currency: true },
          },
        },
      },
    },
  });
}
