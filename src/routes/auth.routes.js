import { Router } from "express";
import { signup, login } from "../controllers/auth.controller.js";
import { startGmailAuth, gmailCallback } from "../modules/gmail/gmail.auth.js";

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get("/gmail", startGmailAuth);
router.get("/gmail/callback", gmailCallback);

export default router;