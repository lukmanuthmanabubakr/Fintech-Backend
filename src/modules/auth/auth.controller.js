import { loginSchema, registerSchema } from "./auth.validation.js";
import { loginUser, refreshTokens, registerUser } from "./auth.service.js";

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

export async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);

    const result = await loginUser(payload);

    return res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken || typeof refreshToken !== "string") {
      return res.status(400).json({
        success: false,
        message: "refreshToken is required",
      });
    }

    const tokens = await refreshTokens(refreshToken);

    return res.json({
      success: true,
      message: "Tokens refreshed",
      data: tokens,
    });
  } catch (err) {
    next(err);
  }
}