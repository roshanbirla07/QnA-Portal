import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { community, comment, mySignals, setSignal } from "../controllers/job-community.controllers.js";

const router = Router({ mergeParams: true });
router.get("/community", community);
router.get("/signals/me", authMiddleware(), mySignals);
router.post("/comments", authMiddleware(), comment);
router.put("/signals/:kind", authMiddleware(), setSignal);
router.delete("/signals/:kind", authMiddleware(), setSignal);

export default router;
