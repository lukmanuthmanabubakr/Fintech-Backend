import { Router } from "express";
import { credit, debit } from "./wallets.controller.js";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { testConcurrency, testCredit, testDebit } from "./wallets.test.controller.js";

const router = Router();


router.post("/credit", requireAuth, credit);
router.post("/debit", requireAuth, debit);

router.post("/test/credit", requireAuth, testCredit);
router.post("/test/debit", requireAuth, testDebit);
router.post("/test/concurrency", requireAuth, testConcurrency);


export default router;
