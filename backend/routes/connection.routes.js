import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import { create, listMine, respond } from "../controllers/connection.controllers.js";

const router = Router();
router.use(authMiddleware());
router.get("/me", listMine);
router.post("/requests", create);
router.patch("/requests/:id", respond);
export default router;
