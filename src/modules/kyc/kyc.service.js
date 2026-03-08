import { prisma } from "../../config/db.js";

export async function submitKyc({ userId, bvn, nin }) {

  // Check if a KYC record already exists for this exact user.
  const existing = await prisma.kycRecord.findUnique({
    where: { userId },
    select: { status: true },
  });

  if (existing && existing.status === "PENDING") {
    const err = new Error("Your KYC is already under review");
    err.statusCode = 400;
    throw err;
  }

  if (existing && existing.status === "VERIFIED") {
    const err = new Error("Your KYC is already verified");
    err.statusCode = 400;
    throw err;
  }

  // Either create or update the record
  const record = await prisma.kycRecord.upsert({
    where: { userId },
    update: {
      bvn: bvn || null,
      nin: nin || null,
      status: "PENDING",
      submittedAt: new Date(),
    },
    create: {
      userId,
      bvn: bvn || null,
      nin: nin || null,
      status: "PENDING",
      submittedAt: new Date(),
    },
    select: {
      id: true,
      status: true,
      submittedAt: true,
    },
  });

  return record;
}

export async function getKycStatus({ userId }) {
  const record = await prisma.kycRecord.findUnique({
    where: { userId },
    select: {
      status: true,
      submittedAt: true,
      reviewedAt: true,
    },
  });

  if (!record) {
    return { status: "NOT_SUBMITTED" };
  }

  return record;
}