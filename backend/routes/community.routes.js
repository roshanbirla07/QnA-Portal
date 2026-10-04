import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { list, create, detail, membership, mine, shareJob } from "../controllers/community.controllers.js";

const router = Router();
router.get("/", list);
router.get("/me", authMiddleware(), mine);
router.post("/", authMiddleware(), create);
router.get("/:slug", detail);
router.post("/:slug/members", authMiddleware(), membership);
router.delete("/:slug/members", authMiddleware(), membership);
router.post("/:slug/jobs", authMiddleware(), shareJob);
export default router;
