import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { offers, optIn, setAvailability, request, mine, respond } from "../controllers/referral.controllers.js";

const router = Router();
router.get("/offers", offers);
router.get("/me", authMiddleware(), mine);
router.post("/offers", authMiddleware(), optIn);
router.patch("/offers/:id", authMiddleware(), setAvailability);
router.post("/offers/:id/requests", authMiddleware(), request);
router.patch("/requests/:id", authMiddleware(), respond);
export default router;
