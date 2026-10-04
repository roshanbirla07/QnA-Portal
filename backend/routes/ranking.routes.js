import { Router } from "express";
import { list } from "../controllers/ranking.controllers.js";

const router = Router();
router.get("/", list);
export default router;
