import { Router } from "express";
import { paystackWebhook } from "./paystack.webhook.js";

const router = Router();

router.post("/paystack", paystackWebhook);

export default router;
