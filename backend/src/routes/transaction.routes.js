import { Router } from "express";
import {
  createTransaction,
  getTransactions,
  getSummary,
  deleteTransaction,
  updateTransaction,
  getMerchantCategories,
  bulkCategorize,
  merchantMapping
} from "../controllers/transaction.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

router.post("/", createTransaction);
router.get("/", getTransactions);
router.get("/summary", getSummary);
router.get("/merchant-categories", getMerchantCategories);
router.put("/bulk-categorize", bulkCategorize);
router.put("/merchant-mapping", merchantMapping);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;