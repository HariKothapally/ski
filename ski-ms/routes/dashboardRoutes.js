import express from 'express';
import {
  getDashboardSummary,
  getEmployeeAnalytics,
  getOrderAnalytics
} from '../controllers/dashboardController.js';
import { authenticateToken as protect, authorizeRole as restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Main dashboard routes
router.get('/summary', getDashboardSummary);

// Detailed analytics routes
router.get('/analytics/employees', restrictTo('admin', 'manager'), getEmployeeAnalytics);
router.get('/analytics/orders', restrictTo('admin', 'manager'), getOrderAnalytics);

export default router;
