import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { startGmailAuth, gmailCallback } from "./gmail.auth.js";
import { fetchGmailMessages } from "./gmail.fetch.js";
import { disconnectGmail } from "./gmail.disconnect.js";

const router = Router();

router.get("/auth", authMiddleware, startGmailAuth);
router.get("/callback", gmailCallback);
router.post("/fetch", authMiddleware, fetchGmailMessages);
router.delete("/disconnect", authMiddleware, disconnectGmail);

export default router;