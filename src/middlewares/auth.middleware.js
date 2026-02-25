import { verifyAccessToken } from "../utils/tokens.js";

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [type, token] = header.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Missing or invalid Authorization header.",
      });
    }

    const payload = verifyAccessToken(token);
    req.user = payload;

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const err = new Error("Forbidden");
      err.statusCode = 403;
      return next(err);
    }
    next();
  };
}