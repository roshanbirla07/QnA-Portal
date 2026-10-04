import { Router } from "express";
import { directory, detail } from "../controllers/company.controllers.js";

const router = Router();
router.get("/", directory);
router.get("/:slug", detail);
export default router;
