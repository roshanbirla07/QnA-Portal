import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  create,
  getBySlug,
  update,
  publish,
  remove,
  listMine,
  incrementView,
} from "../controllers/post.controllers.js";

const router = Router();

router.get("/me", authMiddleware(), listMine);
router.post("/", authMiddleware(), create);
router.get("/:slug", getBySlug);
router.post("/:slug/view", incrementView);
router.patch("/:postId", authMiddleware(), update);
router.post("/:postId/publish", authMiddleware(), publish);
router.delete("/:postId", authMiddleware(), remove);

export default router;
