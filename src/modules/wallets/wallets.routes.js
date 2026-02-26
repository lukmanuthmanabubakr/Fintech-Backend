/**
 * @openapi
 * components:
 *   schemas:
 *     WalletAmountRequest:
 *       type: object
 *       required: [amount]
 *       properties:
 *         amount:
 *           type: integer
 *           example: 3000
 *           description: Amount in smallest unit (kobo/cents). Must be a positive integer.
 *         currency:
 *           type: string
 *           example: NGN
 *     WalletTestRequest:
 *       type: object
 *       required: [userId, amount]
 *       properties:
 *         userId:
 *           type: integer
 *           example: 1
 *         amount:
 *           type: integer
 *           example: 3000
 *         currency:
 *           type: string
 *           example: NGN
 *     ConcurrencyTestRequest:
 *       type: object
 *       required: [userId, amount, attempts]
 *       properties:
 *         userId:
 *           type: integer
 *           example: 1
 *         amount:
 *           type: integer
 *           example: 1000
 *         attempts:
 *           type: integer
 *           example: 10
 *         currency:
 *           type: string
 *           example: NGN
 */


import { Router } from "express";
import { credit, debit, transfer } from "./wallets.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { testConcurrency, testCredit, testDebit } from "./wallets.test.controller.js";

const router = Router();


/**
 * @openapi
 * /api/v1/wallets/credit:
 *   post:
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     summary: Credit the logged-in user's wallet (system-triggered in production)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WalletAmountRequest'
 *           examples:
 *             example1:
 *               value:
 *                 amount: 3000
 *                 currency: NGN
 *     responses:
 *       200:
 *         description: Wallet credited successfully
 *       401:
 *         description: Missing or invalid token
 *       400:
 *         description: Validation error (e.g., invalid amount)
 */
router.post("/credit", requireAuth, credit);

/**
 * @openapi
 * /api/v1/wallets/debit:
 *   post:
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     summary: Debit the logged-in user's wallet (withdrawal/fees repayment etc.)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WalletAmountRequest'
 *           examples:
 *             example1:
 *               value:
 *                 amount: 1000
 *                 currency: NGN
 *     responses:
 *       200:
 *         description: Wallet debited successfully
 *       400:
 *         description: Insufficient balance or invalid amount
 *       401:
 *         description: Missing or invalid token
 */
router.post("/debit", requireAuth, debit);


/**
 * @openapi
 * /api/v1/wallets/test/credit:
 *   post:
 *     tags: [Dev]
 *     security:
 *       - bearerAuth: []
 *     summary: Dev-only - credit any user wallet (testing)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WalletTestRequest'
 *     responses:
 *       200:
 *         description: Test credit success
 */
router.post("/test/credit", requireAuth, testCredit);

/**
 * @openapi
 * /api/v1/wallets/test/debit:
 *   post:
 *     tags: [Dev]
 *     security:
 *       - bearerAuth: []
 *     summary: Dev-only - debit any user wallet (testing)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WalletTestRequest'
 *     responses:
 *       200:
 *         description: Test debit success
 */
router.post("/test/debit", requireAuth, testDebit);

/**
 * @openapi
 * /api/v1/wallets/test/concurrency:
 *   post:
 *     tags: [Dev]
 *     security:
 *       - bearerAuth: []
 *     summary: Dev-only - run multiple debits at once to test race conditions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConcurrencyTestRequest'
 *     responses:
 *       200:
 *         description: Concurrency test result summary
 */
router.post("/test/concurrency", requireAuth, testConcurrency);
router.post("/transfer", requireAuth, transfer);


export default router;
