import express from "express";
import {
  createStockMovement,
  getStockMovements,
  getStockMovementById,
  updateStockMovement,
  deleteStockMovement,
} from "../controllers/stockMovementController.js";

const router = express.Router();

router.post("/", createStockMovement);
router.get("/", getStockMovements);
router.get("/:id", getStockMovementById);
router.put("/:id", updateStockMovement);
router.delete("/:id", deleteStockMovement);

export default router;
