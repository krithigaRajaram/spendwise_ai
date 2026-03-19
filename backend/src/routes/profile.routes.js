import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getProfile, updateName, updatePassword, deleteAccount } from "../controllers/profile.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getProfile);
router.put("/name", updateName);
router.put("/password", updatePassword);
router.delete("/", deleteAccount);

export default router;