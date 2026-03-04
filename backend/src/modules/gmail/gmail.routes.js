import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { startGmailAuth, gmailCallback } from "./gmail.auth.js";
import { fetchGmailMessages } from "./gmail.fetch.js";

const router = Router();

router.get("/auth", authMiddleware, startGmailAuth);
router.get("/callback", authMiddleware, gmailCallback);
router.post("/fetch", authMiddleware, fetchGmailMessages);

export default router;