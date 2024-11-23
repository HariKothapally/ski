import express from "express";
import {
  createStockMovement,
  getStockMovements,
  getStockMovementById,
  updateStockMovement,
  deleteStockMovement,
  getLowStockAlerts,
  getStockValueReport,
  createBatchMovement,
  getExpiryAlerts,
  getUsageAnalytics,
  getMovementHistory,
  getAdvancedAnalytics,
  getReorderSuggestions,
  getNotifications,
  markNotificationsAsSent,
  getInventoryForecast,
  getVisualizationData,
  getEnhancedVisualizationData,
  getMonitoringData,
  generateSupplierOrders
} from "../controllers/stockMovementController.js";

const router = express.Router();

// CRUD operations
router.post("/", createStockMovement);
router.get("/", getStockMovements);
router.get("/:id", getStockMovementById);
router.put("/:id", updateStockMovement);
router.delete("/:id", deleteStockMovement);

// Batch operations
router.post("/batch", createBatchMovement);

// Reporting endpoints
router.get("/reports/low-stock", getLowStockAlerts);
router.get("/reports/value", getStockValueReport);
router.get("/reports/expiry", getExpiryAlerts);
router.get("/reports/usage", getUsageAnalytics);
router.get("/reports/history", getMovementHistory);

// Advanced analytics
router.get("/analytics/advanced", getAdvancedAnalytics);
router.get("/analytics/reorder", getReorderSuggestions);
router.get("/analytics/forecast", getInventoryForecast);
router.get("/analytics/visualizations", getVisualizationData);

// Enhanced visualization and monitoring
router.get("/analytics/enhanced-visualizations", getEnhancedVisualizationData);
router.get("/analytics/monitoring", getMonitoringData);

// Automated supplier orders
router.get("/orders/generate", generateSupplierOrders);

// Notifications
router.get("/notifications", getNotifications);
router.post("/notifications/mark-sent", markNotificationsAsSent);

export default router;
