import { Router } from "express";
import {
  getAllUsers,
  getDelegates,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { protect, restrictTo } from "../middleware/auth.js";

const router = Router();

// All routes require authentication
router.use(protect);

// Any authenticated user can list delegates (needed for Orders assignment UI)
router.get("/delegates", getDelegates);

// Admin-only user management
router.get("/", restrictTo("admin"), getAllUsers);
router.post("/", restrictTo("admin"), createUser);
router.put("/:id", restrictTo("admin"), updateUser);
router.delete("/:id", restrictTo("admin"), deleteUser);

export default router;
