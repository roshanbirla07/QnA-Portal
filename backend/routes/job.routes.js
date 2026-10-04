import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { preview, publish, list, getById } from "../controllers/job.controllers.js";
import jobCommunityRouter from "./job-community.routes.js";

const router = Router();
router.get("/", list);
router.get("/:id", getById);
router.use("/:id", jobCommunityRouter);
router.post("/preview", authMiddleware(), preview);
router.post("/", authMiddleware(), publish);

export default router;
