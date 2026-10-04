import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { list, getById, create, updateStatus, apply, inbox, respond } from "../controllers/project.controllers.js";

const router = Router();
router.get("/", list);
router.get("/me/requests", authMiddleware(), inbox);
router.post("/", authMiddleware(), create);
router.get("/:id", getById);
router.patch("/:id", authMiddleware(), updateStatus);
router.post("/:id/applications", authMiddleware(), apply);
router.patch("/applications/:id", authMiddleware(), respond);
export default router;
