import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { preview, publish } from "../controllers/job.controllers.js";

const router = Router();
router.post("/preview", authMiddleware(), preview);
router.post("/", authMiddleware(), publish);

export default router;
