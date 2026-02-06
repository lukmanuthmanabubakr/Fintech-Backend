import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "fullName is too short"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 chars"),
    passwordConfirm: z.string().min(8),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});
