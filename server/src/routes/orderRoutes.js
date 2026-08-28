import { Router } from "express";
import {
  getOrders,
  getMyOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
} from "../controllers/orderController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = Router();

router.use(protect);

// Delegate-specific — must come before /:id to avoid conflict
router.get("/my-orders", restrictTo("delegate"), getMyOrders);

router.get("/", getOrders);
router.get("/:id", getOrder);
router.post("/", restrictTo("admin", "supervisor"), createOrder);
router.put("/:id", restrictTo("admin", "supervisor", "delegate"), updateOrder);
router.delete("/:id", restrictTo("admin", "supervisor"), deleteOrder);

export default router;
