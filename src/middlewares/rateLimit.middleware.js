import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger.js";

const createLimiter = ({ windowMs, max }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      try {
        logger.warn("Rate limit exceeded", { path: req.originalUrl, ip: req.ip, method: req.method });
      } catch (e) {
        console.warn("Failed to log rate limit event", e);
      }
      res.status(429).json({ success: false, message: "Too many requests, please try again later." });
    },
  });

export const authLimiter = createLimiter({
  windowMs: parseInt(process.env.AUTH_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_MAX),
});

export const paymentsLimiter = createLimiter({
  windowMs: parseInt(process.env.PAYMENTS_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.PAYMENTS_MAX),
});

export const webhooksLimiter = createLimiter({
  windowMs: parseInt(process.env.WEBHOOKS_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.WEBHOOKS_MAX),
});

export default createLimiter;
