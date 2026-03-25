import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import * as kycController from "./kyc.controller.js";

const router = Router();
// Upload Kyc routes
router.post("/submit", requireAuth, kycController.submitKyc);
router.get("/status", requireAuth, kycController.getKycStatus);

export default router;
