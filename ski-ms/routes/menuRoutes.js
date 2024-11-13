import express from "express";
import {
  createMenu,
  getMenus,
  getMenuById,
  updateMenu,
  deleteMenu,
  getMenuHistory,
} from "../controllers/menuController.js";

const router = express.Router();

router.post("/", createMenu);
router.get("/", getMenus);
router.get("/:id", getMenuById);
router.put("/:id", updateMenu);
router.delete("/:id", deleteMenu);
router.get("/:menuId/history", getMenuHistory); // Route to get menu history

export default router;
