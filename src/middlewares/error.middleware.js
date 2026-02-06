export function errorMiddleware(err, req, res, next) {
  const status = err.statusCode || 400;

  if (err.name === "ZodError") {
    return res.status(422).json({
      success: false,
      message: "Validation error",
      errors: err.errors,
    });
  }

  return res.status(status).json({
    success: false,
    message: err.message || "Something went wrong",
    errors: err.errors || undefined,
  });
}
