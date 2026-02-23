import { Router } from "express";
import { startGmailAuth, gmailCallback } from "./gmail.auth.js";
import { fetchGmailMessages } from "./gmail.fetch.js";
const router = Router();

router.get("/auth", startGmailAuth);
router.get("/callback", gmailCallback);
router.post("/fetch", fetchGmailMessages);

export default router;