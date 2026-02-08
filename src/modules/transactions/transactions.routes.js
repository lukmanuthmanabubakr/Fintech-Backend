import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { getMyTransactionByReference, getMyTransactions } from "./transactions.controller.js";

const router = Router();

router.get("/", requireAuth, getMyTransactions);
router.get("/:reference", requireAuth, getMyTransactionByReference);

export default router;
