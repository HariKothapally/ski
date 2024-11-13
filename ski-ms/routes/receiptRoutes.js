import express from "express";
import {
  createReceipt,
  getReceipts,
  getReceiptById,
  updateReceipt,
  deleteReceipt,
} from "../controllers/receiptController.js";

const router = express.Router();

router.post("/", createReceipt);
router.get("/", getReceipts);
router.get("/:id", getReceiptById);
router.put("/:id", updateReceipt);
router.delete("/:id", deleteReceipt);

export default router;
