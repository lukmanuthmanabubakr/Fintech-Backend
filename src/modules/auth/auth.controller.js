import { loginSchema, registerSchema, refreshSchema } from "./auth.validation.js";
import { loginUser, refreshTokens, registerUser } from "./auth.service.js";
import { logger } from "../../config/logger.js";

export async function register(req, res, next) {
  try {
    const payload = registerSchema.parse(req.body);

    const data = await registerUser({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
    });

    logger.info({
      event: 'user_registered',
      userId: data.id,
      email: payload.email,
      ip: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: "User registered",
      data,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const payload = loginSchema.parse(req.body);

    const result = await loginUser(payload);

    logger.info({
      event: 'user_login',
      userId: result.userId,
      email: payload.email,
      ip: req.ip,
    });

    return res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (err) {
    logger.warn({
      event: 'login_failed',
      email: req.body?.email,
      reason: err.message,
      ip: req.ip,
    });
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const payload = refreshSchema.parse(req.body);

    const tokens = await refreshTokens(payload.refreshToken);

    return res.json({
      success: true,
      message: "Tokens refreshed",
      data: tokens,
    });
  } catch (err) {
    next(err);
  }
}
