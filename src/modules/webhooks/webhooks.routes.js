import { Router } from "express";
import { paystackWebhook } from "./paystack.webhook.js";

const router = Router();

/**
 * @openapi
 * tags:
 *   - name: Webhooks
 *     description: Provider callbacks (Paystack). Not called by users.
 */

/**
 * @openapi
 * /api/v1/webhooks/paystack:
 *   post:
 *     summary: Paystack webhook endpoint. 
This route is called automatically by Paystack after a successful payment.
It verifies the Paystack signature, marks the transaction SUCCESS, and credits the wallet.

 *     tags: [Webhooks]
 *     parameters:
 *       - in: header
 *         name: x-paystack-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Paystack signature used to verify the webhook payload
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event:
 *                 type: string
 *                 example: charge.success
 *               data:
 *                 type: object
 *                 properties:
 *                   reference:
 *                     type: string
 *                     example: TX-1770679146975-596969
 *                   amount:
 *                     type: integer
 *                     example: 200000
 *                   currency:
 *                     type: string
 *                     example: NGN
 *     responses:
 *       200:
 *         description: Webhook received
 *       401:
 *         description: Invalid signature
 */
router.post("/paystack", paystackWebhook);

export default router;