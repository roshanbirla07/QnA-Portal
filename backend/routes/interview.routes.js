import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { create, list } from "../controllers/interview.controllers.js";

const router = Router();
router.get("/", list);
router.post("/", authMiddleware(), create);
export default router;
