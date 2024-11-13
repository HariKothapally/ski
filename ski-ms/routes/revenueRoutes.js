import express from "express";
import {
  createRevenue,
  getRevenue,
  getRevenueById,
  updateRevenue,
  deleteRevenue,
} from "../controllers/revenueController.js";

const router = express.Router();

router.post("/", createRevenue);
router.get("/", getRevenue);
router.get("/:id", getRevenueById);
router.put("/:id", updateRevenue);
router.delete("/:id", deleteRevenue);

export default router;
