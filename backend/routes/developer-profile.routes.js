import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  deleteMyAccount,
  getMyDeveloperProfile,
  getPublicDeveloperProfile,
  listCandidates,
  syncMyAccount,
  upsertMyAccount,
} from "../controllers/developer-profile.controllers.js";

const router = Router();

router.get("/", listCandidates);
router.get("/me", authMiddleware(), getMyDeveloperProfile);
router.put("/me/accounts/:platform", authMiddleware(), upsertMyAccount);
router.post("/me/accounts/:platform/sync", authMiddleware(), syncMyAccount);
router.delete("/me/accounts/:platform", authMiddleware(), deleteMyAccount);
router.get("/:username", getPublicDeveloperProfile);

export default router;
