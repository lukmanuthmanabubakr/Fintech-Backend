import { Router } from "express";
import { login, refresh, register } from "./auth.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, email, password, passwordConfirm]
 *             properties:
 *               fullName: { type: string, example: "Legend" }
 *               email: { type: string, example: "legend111@gmail.com" }
 *               password: { type: string, example: "StrongPass123!" }
 *               passwordConfirm: { type: string, example: "StrongPass123!" }
 *     responses:
 *       201:
 *         description: User registered
 *       409:
 *         description: Email already in use
 */
router.post("/register", register);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: "legend111@gmail.com" }
 *               password: { type: string, example: "StrongPass123!" }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", login);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string, example: "your-refresh-token" }
 *     responses:
 *       200:
 *         description: Tokens refreshed
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", refresh);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: Test protected route
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Returns token payload
 *       401:
 *         description: Missing/invalid token
 */

router.get("/me", requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});



export default router;
