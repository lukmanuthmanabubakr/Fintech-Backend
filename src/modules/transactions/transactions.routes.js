import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { getMyTransactionByReference, getMyTransactions } from "./transactions.controller.js";

const router = Router();

/**
 * @openapi
 * /api/v1/transactions:
 *   get:
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     summary: Get logged-in user's transaction history (statement)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *         description: Items per page (max 100)
 *     responses:
 *       200:
 *         description: List of transactions with ledger entries
 *       401:
 *         description: Missing or invalid token
 */
router.get("/", requireAuth, getMyTransactions);

/**
 * @openapi
 * /api/v1/transactions/{reference}:
 *   get:
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     summary: Get one transaction by reference (must belong to logged-in user)
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *           example: TX-1770548520880-290451
 *     responses:
 *       200:
 *         description: Transaction detail
 *       401:
 *         description: Missing or invalid token
 *       404:
 *         description: Transaction not found
 */
router.get("/:reference", requireAuth, getMyTransactionByReference);


export default router;
