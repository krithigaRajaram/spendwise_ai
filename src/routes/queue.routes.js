import { Router } from "express";
const router = Router();
import { enqueueTestJob } from "../controllers/queue.controller.js";

router.post("/enqueue", enqueueTestJob);

export default router;