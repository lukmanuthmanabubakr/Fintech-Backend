import bcrypt from "bcrypt";
import { prisma } from "../../config/db.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../utils/tokens.js";

export async function registerUser({ fullName, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Email already in use");
    err.statusCode = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 12);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { fullName, email, password: hashed },
      select: { id: true, fullName: true, email: true, createdAt: true },
    });

    const wallet = await tx.wallet.create({
      data: {
        userId: user.id,
        currency: "NGN",
      },
      select: { id: true, currency: true, createdAt: true },
    });

    return { user, wallet };
  });

  return result;
}

export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.statusCode = 401;
    throw err;
  }

  const payload = { sub: user.id, email: user.email };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.session.deleteMany({ where: { userId: user.id } });

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken,
    },
  });

  return {
    user: { id: user.id, fullName: user.fullName, email: user.email },
    accessToken,
    refreshToken,
  };
}

export async function refreshTokens(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (e) {
    const err = new Error("Invalid or expired refresh token");
    err.statusCode = 401;
    throw err;
  }

  const userId = Number(payload.sub);

  const session = await prisma.session.findFirst({
    where: { userId, refreshToken },
  });

  if (!session) {
    const err = new Error("Refresh token not recognised (session not found)");
    err.statusCode = 401;
    throw err;
  }

  const newAccessToken = signAccessToken({ sub: userId, email: payload.email });

  const newRefreshToken = signRefreshToken({ sub: userId, email: payload.email });

  await prisma.session.delete({ where: { id: session.id } });
  await prisma.session.create({
    data: { userId, refreshToken: newRefreshToken },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}