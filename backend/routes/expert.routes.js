import { Router } from "express";
import { list } from "../controllers/expert.controllers.js";

const router = Router();
router.get("/", list);
export default router;
