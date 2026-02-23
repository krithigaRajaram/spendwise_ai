import { Router } from "express";
import { createTransaction, getTransactions, getSummary, deleteTransaction, updateTransaction, getMerchantCategories } from "../controllers/transaction.controller.js";
const router = Router();

import authMiddleware from "../middlewares/auth.middleware.js";

router.use(authMiddleware);

router.post("/", createTransaction);
router.get("/", getTransactions);
router.get("/summary", getSummary);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);
router.get("/merchant-categories", getMerchantCategories);



export default router; 