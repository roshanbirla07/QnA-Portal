import { Router } from "express";
import { search, related } from "../controllers/vector-search.controllers.js";

const router = Router();
router.post("/", search);
router.get("/related/:id", related);
export default router;
