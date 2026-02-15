import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { initializePayment } from "./payments.controller.js";
import { paymentsLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Payments
 *     description: Deposit initialization (Paystack).
 */

/**
 * @openapi
 * /api/v1/payments/initialize:
 *   post:
 *     summary: Initialize a deposit (creates PENDING transaction + returns Paystack checkout URL)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 2000
 *                 description: Amount in NAIRA (your server converts to kobo)
 *     responses:
 *       201:
 *         description: Payment initialized successfully
 *       400:
 *         description: Invalid amount
 *       401:
 *         description: Missing or invalid token
 */
router.post("/initialize", requireAuth, paymentsLimiter, initializePayment);

export default router;
