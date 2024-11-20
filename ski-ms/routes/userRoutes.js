import express from "express";
import { 
  registerUser, 
  loginUser, 
  getAvailableEmployees,
  forgotPassword,
  resetPassword 
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/employees/available", authenticateToken, getAvailableEmployees);

export default router;
