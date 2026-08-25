import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { create, list, accept } from "../controllers/answer.controllers.js";

const router = Router();

router.get("/:questionId/answers", list);
router.post("/:questionId/answers", authMiddleware(), create);
router.post("/:questionId/answers/:answerId/accept", authMiddleware(), accept);

export default router;
