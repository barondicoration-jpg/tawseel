import { Router } from "express";
import {
  getStats,
  getCollections,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/stats", getStats);
router.get("/collections", getCollections);

export default router;
