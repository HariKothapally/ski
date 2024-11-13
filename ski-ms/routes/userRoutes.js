import express from "express";
import { registerUser } from "../controllers/userController.js";
import { login, protectedRoute } from "../middleware/authController.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.get("/protected", protectedRoute);

export default router;
