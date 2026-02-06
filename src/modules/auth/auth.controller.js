import { registerSchema } from "./auth.validation.js";
import { registerUser } from "./auth.service.js";

export async function register(req, res, next) {
  try {
    const payload = registerSchema.parse(req.body);

    const user = await registerUser({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
    });

    return res.status(201).json({
      success: true,
      message: "User registered",
      data: user,
    });
  } catch (err) {
    next(err);
  }
}
