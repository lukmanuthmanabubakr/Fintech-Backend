import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { requireRole } from "../../middlewares/auth.middleware.js";
import * as adminController from "./admin.controller.js";

const router = Router();

router.get("/users", requireAuth, requireRole("ADMIN"), adminController.getUsers);
router.get("/transactions", requireAuth, requireRole("ADMIN"), adminController.getTransactions);

export default router;