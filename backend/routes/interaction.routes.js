import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  vote,
  bookmark,
  unbookmark,
  listBookmarks,
  follow,
  unfollow,
} from "../controllers/interaction.controllers.js";

const router = Router();

router.post("/votes", authMiddleware(), vote);
router.get("/bookmarks", authMiddleware(), listBookmarks);
router.post("/bookmarks/:postId", authMiddleware(), bookmark);
router.delete("/bookmarks/:postId", authMiddleware(), unbookmark);
router.post("/follows/:userId", authMiddleware(), follow);
router.delete("/follows/:userId", authMiddleware(), unfollow);

export default router;
