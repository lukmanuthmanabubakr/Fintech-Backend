import { prisma } from "../../config/db.js";

export async function ensureClearingWallet() {
  const existing = await prisma.wallet.findFirst({
    where: { isSystem: true },
    select: { id: true, currency: true },
  });

  if (existing) {
    console.log("System wallet already exists:", existing.id);
    return;
  }

  const w = await prisma.wallet.create({
    data: {
      isSystem: true,
      currency: "NGN",
      balance: 0,
      userId: null,
    },
    select: { id: true },
  });

  console.log("System wallet created:", w.id);
}
