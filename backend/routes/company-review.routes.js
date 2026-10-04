import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { create, list, verify } from "../controllers/company-review.controllers.js";

const router = Router();
router.get("/", list);
router.post("/", authMiddleware(), create);
router.patch("/:id/verification", authMiddleware(["admin"]), verify);
export default router;
