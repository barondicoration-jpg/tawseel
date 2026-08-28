import { Router } from "express";
import {
  getZones,
  createZone,
  updateZone,
  deleteZone,
} from "../controllers/zoneController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/", getZones);
router.post("/", restrictTo("admin", "supervisor"), createZone);
router.put("/:id", restrictTo("admin", "supervisor"), updateZone);
router.delete("/:id", restrictTo("admin"), deleteZone);

export default router;
