import express from "express";
import {
  createMealTracker,
  getMealTrackers,
  getMealTrackerById,
  updateMealTracker,
  deleteMealTracker,
} from "../controllers/mealTrackerController.js";

const router = express.Router();

router.post("/", createMealTracker);
router.get("/", getMealTrackers);
router.get("/:id", getMealTrackerById);
router.put("/:id", updateMealTracker);
router.delete("/:id", deleteMealTracker);

export default router;
