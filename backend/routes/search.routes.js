import { Router } from "express";
import { list } from "../controllers/search.controllers.js";

const router = Router();
router.get("/", list);
export default router;
