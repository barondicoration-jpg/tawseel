import { Router } from "express";
import {
  getProgress,
  updateProgress,
  updateDelegateLocation,
} from "../controllers/delegateController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get(
  "/progress",
  restrictTo("admin", "supervisor", "viewer"),
  getProgress,
);
router.put("/progress", restrictTo("delegate"), updateProgress);
router.put(
  "/:id/location",
  restrictTo("admin", "supervisor"),
  updateDelegateLocation,
);

export default router;
