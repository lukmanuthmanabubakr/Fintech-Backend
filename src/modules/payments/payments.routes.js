import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { initializePayment } from "./payments.controller.js";

const router = Router();

router.post("/initialize", requireAuth, initializePayment);

export default router;
