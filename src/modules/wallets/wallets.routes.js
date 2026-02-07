import { Router } from "express";
import { credit, debit } from "./wallets.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";

const router = Router();


router.post("/credit", requireAuth, credit);
router.post("/debit", requireAuth, debit);

export default router;
