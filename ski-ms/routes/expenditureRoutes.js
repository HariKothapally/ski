import express from "express";
import {
  createExpenditure,
  getExpenditures,
  getExpenditureById,
  updateExpenditure,
  deleteExpenditure,
} from "../controllers/expenditureController.js";

const router = express.Router();

router.post("/", createExpenditure);
router.get("/", getExpenditures);
router.get("/:id", getExpenditureById);
router.put("/:id", updateExpenditure);
router.delete("/:id", deleteExpenditure);

export default router;
