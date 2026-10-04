import { Router } from "express";
import { ask } from "../controllers/knowledge-assistant.controllers.js";

const router = Router();
router.post("/", ask);
export default router;
