import { Router } from "express";
import authMiddleware from "../middlewares/auth.middleware.js";
import {
  deleteMyAccount,
  getMyDeveloperProfile,
  getPublicDeveloperProfile,
  listCandidates,
  syncMyAccount,
  upsertMyAccount,
  updateMyAccountVisibility,
} from "../controllers/developer-profile.controllers.js";

const router = Router();

router.get("/", listCandidates);
router.get("/me", authMiddleware(), getMyDeveloperProfile);
router.put("/me/accounts/:platform", authMiddleware(), upsertMyAccount);
router.patch("/me/accounts/:platform", authMiddleware(), updateMyAccountVisibility);
router.post("/me/accounts/:platform/sync", authMiddleware(), syncMyAccount);
router.delete("/me/accounts/:platform", authMiddleware(), deleteMyAccount);
router.get("/:username", getPublicDeveloperProfile);

// Return actionable validation errors as JSON instead of Express HTML stack pages.
router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const statusCode = Number.isInteger(error.statusCode) && error.statusCode >= 400 && error.statusCode < 600
    ? error.statusCode : 500;
  return res.status(statusCode).json({
    statusCode,
    success: false,
    message: statusCode === 500 ? "Unable to process developer profile request" : error.message,
  });
});

export default router;
