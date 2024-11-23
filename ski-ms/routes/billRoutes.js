import express from "express";
import {
  createBill,
  getBills,
  getBillById,
  updateBill,
  deleteBill,
  cancelBill,
  refundBill
} from "../controllers/billController.js";
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Bill management routes
router.post("/", restrictTo('admin', 'manager'), createBill);
router.get("/", getBills);
router.get("/:id", getBillById);
router.patch("/:id", restrictTo('admin', 'manager'), updateBill);
router.delete("/:id", restrictTo('admin'), deleteBill);

// Bill operations
router.post("/:id/cancel", restrictTo('admin', 'manager'), cancelBill);
router.post("/:id/refund", restrictTo('admin', 'manager'), refundBill);

export default router;
