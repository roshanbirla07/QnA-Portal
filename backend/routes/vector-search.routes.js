import { Router } from "express";
import { search, related, duplicates } from "../controllers/vector-search.controllers.js";

const router = Router();
router.post("/", search);
router.post("/duplicates", duplicates);
router.get("/related/:id", related);
export default router;
