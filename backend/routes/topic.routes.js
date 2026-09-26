import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { list, getBySlug, follow, unfollow } from "../controllers/topic.controllers.js";

const router = Router();

router.get("/", list);
router.get("/:slug", getBySlug);
router.post("/:slug/follow", authMiddleware(), follow);
router.delete("/:slug/follow", authMiddleware(), unfollow);

export default router;
