import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { create, insights } from "../controllers/salary.controllers.js";

const router = Router();
router.get("/insights", insights);
router.post("/contributions", authMiddleware(), create);
export default router;
