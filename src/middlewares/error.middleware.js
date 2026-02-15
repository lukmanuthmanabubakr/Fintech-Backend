import { logger } from "../utils/logger.js";

export function errorMiddleware(err, req, res, next) {
  const status = err.statusCode || 500;

  try {
    logger.error(err.message || 'Unhandled error', {
      path: req.originalUrl,
      method: req.method,
      body: req.body,
      stack: err.stack,
    });
  } catch (e) {
    console.error('Failed to log error', e);
  }

  if (err.name === "ZodError") {
    return res.status(422).json({
      success: false,
      message: "Validation error",
      errors: err.errors,
    });
  }

  const payload = {
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Something went wrong',
  };

  if (process.env.NODE_ENV !== 'production') {
    payload.errors = err.errors || err.stack;
  }

  return res.status(status).json(payload);
}
