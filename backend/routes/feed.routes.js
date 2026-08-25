import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { feed, followingFeed, search } from "../controllers/feed.controllers.js";

const router = Router();
router.get("/", feed);
router.get("/following", authMiddleware(), followingFeed);
router.get("/search", search);
export default router;
