import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { getProfile, updateMyProfile } from "../controllers/profile.controllers.js";

const router = Router();
router.get("/:username", getProfile);
router.patch("/me/profile", authMiddleware(), updateMyProfile);
export default router;
