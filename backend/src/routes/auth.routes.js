import { Router } from "express";
import { signup, login, verifyEmail, resendVerification } from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/verify", authMiddleware, verifyEmail);
router.post("/resend-verification", authMiddleware, resendVerification);

export default router;