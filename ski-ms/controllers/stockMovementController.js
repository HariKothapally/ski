import StockMovement from '../models/stockMovementModel.js';
import { AppError } from '../utils/errorHandler.js';
import { validateQuantity, validatePrice } from '../utils/validation.js';
import { getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth, formatDate } from '../utils/dateUtils.js';
import { catchAsync } from '../utils/errorHandler.js';

// CRUD Operations
export const createStockMovement = catchAsync(async (req, res) => {
  const { quantity, unitPrice } = req.body;
  
  // Validate inputs
  if (!validateQuantity(quantity)) {
    throw new AppError('Invalid quantity value', 400);
  }
  if (unitPrice && !validatePrice(unitPrice)) {
    throw new AppError('Invalid unit price value', 400);
  }

  const movement = await StockMovement.create({
    ...req.body,
    created_by: req.user._id
  });
  
  res.status(201).json({
    status: 'success',
    data: { movement }
  });
});

export const getStockMovements = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Date filtering
  const startDate = req.query.startDate ? getStartOfDay(new Date(req.query.startDate)) : null;
  const endDate = req.query.endDate ? getEndOfDay(new Date(req.query.endDate)) : null;

  let dateFilter = {};
  if (startDate && endDate) {
    dateFilter.movementDate = { $gte: startDate, $lte: endDate };
  }

  const movements = await StockMovement.find(dateFilter)
    .populate('ingredientId')
    .populate('supplier')
    .populate('created_by', 'name')
    .sort('-movementDate')
    .skip(skip)
    .limit(limit);

  const total = await StockMovement.countDocuments(dateFilter);

  res.status(200).json({
    status: 'success',
    data: { 
      movements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

export const getStockMovementById = catchAsync(async (req, res) => {
  try {
    const movement = await StockMovement.findById(req.params.id)
      .populate('ingredientId')
      .populate('supplier')
      .populate('created_by', 'name');
      
    if (!movement) {
      return res.status(404).json({
        status: 'fail',
        message: 'No movement found with that ID'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { movement }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export const updateStockMovement = catchAsync(async (req, res) => {
  try {
    const movement = await StockMovement.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        modified_by: req.user._id
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!movement) {
      return res.status(404).json({
        status: 'fail',
        message: 'No movement found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { movement }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
});

export const deleteStockMovement = catchAsync(async (req, res) => {
  try {
    const movement = await StockMovement.findById(req.params.id);

    if (!movement) {
      return res.status(404).json({
        status: 'fail',
        message: 'No movement found with that ID'
      });
    }
    
    // Reverse the quantity change
    const reverseMovement = await StockMovement.create({
      ingredientId: movement.ingredientId,
      quantity: -movement.quantity,
      movementType: 'ADJUSTMENT',
      description: `Reversal of movement ${movement._id}`,
      created_by: req.user._id
    });
    
    await movement.remove();
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Reporting Endpoints
export const getLowStockAlerts = catchAsync(async (req, res) => {
  try {
    const options = {
      supplier: req.query.supplier,
      threshold: req.query.threshold ? parseFloat(req.query.threshold) : undefined
    };
    
    const alerts = await StockMovement.getLowStockAlerts(options);
    
    res.status(200).json({
      status: 'success',
      data: { alerts }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export const getStockValueReport = catchAsync(async (req, res) => {
  // Get start and end of month if not specified
  const startDate = req.query.startDate ? 
    getStartOfDay(new Date(req.query.startDate)) : 
    getStartOfMonth();
  
  const endDate = req.query.endDate ? 
    getEndOfDay(new Date(req.query.endDate)) : 
    getEndOfMonth();

  const movements = await StockMovement.find({
    movementDate: { $gte: startDate, $lte: endDate }
  })
  .populate('ingredientId')
  .select('quantity unitPrice movementDate ingredientId');

  const report = {
    period: `${formatDate(startDate)} to ${formatDate(endDate)}`,
    totalValue: 0,
    movements: []
  };

  movements.forEach(movement => {
    const value = movement.quantity * movement.unitPrice;
    report.totalValue += value;
    report.movements.push({
      date: formatDate(movement.movementDate),
      ingredient: movement.ingredientId.name,
      quantity: movement.quantity,
      unitPrice: movement.unitPrice,
      value: value
    });
  });

  res.status(200).json({
    status: 'success',
    data: report
  });
});

export const getExpiryAlerts = catchAsync(async (req, res) => {
  try {
    const daysThreshold = parseInt(req.query.days) || 30;
    const alerts = await StockMovement.getExpiryAlerts(daysThreshold);
    
    res.status(200).json({
      status: 'success',
      data: { alerts }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export const getUsageAnalytics = catchAsync(async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 30;
    const analytics = await StockMovement.getUsageAnalytics(period);
    
    res.status(200).json({
      status: 'success',
      data: { analytics }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export const getMovementHistory = catchAsync(async (req, res) => {
  try {
    const filters = {
      ingredientId: req.query.ingredientId,
      movementType: req.query.movementType,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      supplier: req.query.supplier,
      batchId: req.query.batchId
    };
    
    const movements = await StockMovement.getMovementHistory(filters);
    
    res.status(200).json({
      status: 'success',
      data: { movements }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Advanced Analytics
export const getAdvancedAnalytics = catchAsync(async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 30;
    const analytics = await StockMovement.getAdvancedAnalytics(period);
    
    res.status(200).json({
      status: 'success',
      data: { analytics }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Reorder Suggestions
export const getReorderSuggestions = catchAsync(async (req, res) => {
  try {
    const suggestions = await StockMovement.getReorderSuggestions();
    
    // Get last order dates
    const lastOrders = await StockMovement.aggregate([
      {
        $match: {
          movementType: 'PURCHASE'
        }
      },
      {
        $group: {
          _id: '$ingredientId',
          lastOrderDate: { $max: '$movementDate' }
        }
      }
    ]);
    
    // Combine suggestions with last order dates
    const enrichedSuggestions = suggestions.map(suggestion => ({
      ...suggestion,
      lastOrderDate: lastOrders.find(
        order => order._id.equals(suggestion.ingredientId)
      )?.lastOrderDate || null
    }));
    
    res.status(200).json({
      status: 'success',
      data: { suggestions: enrichedSuggestions }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Real-time Notifications
export const getNotifications = catchAsync(async (req, res) => {
  try {
    const notifications = await StockMovement.getNotifications();
    
    res.status(200).json({
      status: 'success',
      data: { notifications }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Mark Notifications as Sent
export const markNotificationsAsSent = catchAsync(async (req, res) => {
  try {
    const { notificationIds } = req.body;
    
    await StockMovement.updateMany(
      {
        _id: { $in: notificationIds }
      },
      {
        $set: { notificationSent: true }
      }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Notifications marked as sent'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Inventory Forecasting
export const getInventoryForecast = catchAsync(async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const forecasts = await StockMovement.getForecast(days);
    
    res.status(200).json({
      status: 'success',
      data: { forecasts }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Visualization Data
export const getVisualizationData = catchAsync(async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 90;
    const data = await StockMovement.getVisualizationData(period);
    
    // Add metadata for visualization configuration
    const metadata = {
      timeRange: {
        start: new Date(Date.now() - period * 24 * 60 * 60 * 1000),
        end: new Date(),
        period
      },
      movementTypes: ['PURCHASE', 'USAGE', 'WASTE', 'ADJUSTMENT', 'RETURN', 'TRANSFER', 'BATCH_ADJUSTMENT'],
      metrics: {
        quantity: {
          label: 'Quantity',
          unit: 'units'
        },
        value: {
          label: 'Value',
          unit: 'currency'
        }
      },
      aggregations: ['daily', 'weekly', 'monthly']
    };
    
    res.status(200).json({
      status: 'success',
      data: { 
        visualizations: data,
        metadata
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Enhanced Visualization
export const getEnhancedVisualizationData = catchAsync(async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 90;
    const data = await StockMovement.getEnhancedVisualizationData(period);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Automated Supplier Orders
export const generateSupplierOrders = catchAsync(async (req, res) => {
  try {
    const orders = await StockMovement.generateSupplierOrders();
    res.json(orders);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Real-time Monitoring
export const getMonitoringData = catchAsync(async (req, res) => {
  try {
    const data = await StockMovement.getMonitoringData();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Advanced Features
export const createBatchMovement = catchAsync(async (req, res) => {
  try {
    const { movements } = req.body;
    
    if (!Array.isArray(movements) || movements.length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide an array of movements'
      });
    }
    
    const result = await StockMovement.createBatchMovement(movements, req.user._id);
    
    res.status(201).json({
      status: 'success',
      data: { 
        batchId: result.batchId,
        movements: result.movements
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
});
