import { Router } from "express";
import { getMonthlyReport } from "../controllers/report.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authMiddleware);
router.get("/monthly", getMonthlyReport);

export default router;