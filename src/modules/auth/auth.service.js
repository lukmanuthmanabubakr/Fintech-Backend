import bcrypt from "bcrypt";
import { prisma } from "../../config/db.js";

export async function registerUser({ fullName, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Email already in use");
    err.statusCode = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { fullName, email, password: hashed },
    select: { id: true, fullName: true, email: true, createdAt: true },
  });

  return user;
}
