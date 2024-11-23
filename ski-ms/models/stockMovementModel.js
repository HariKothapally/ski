import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema({
  ingredientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ingredient",
    required: true,
  },
  quantity: { 
    type: Number, 
    required: true,
    validate: {
      validator: function(v) {
        return v !== 0;
      },
      message: 'Quantity cannot be zero'
    }
  },
  movementType: { 
    type: String, 
    required: true,
    enum: ['PURCHASE', 'USAGE', 'WASTE', 'ADJUSTMENT', 'RETURN', 'TRANSFER', 'BATCH_ADJUSTMENT'],
  },
  previousQuantity: { 
    type: Number, 
    required: true 
  },
  newQuantity: { 
    type: Number, 
    required: true 
  },
  unitCost: {
    type: Number,
    required: function() {
      return ['PURCHASE', 'RETURN'].includes(this.movementType);
    }
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: function() {
      return ['PURCHASE', 'RETURN'].includes(this.movementType);
    }
  },
  relatedDocument: {
    type: String,
    enum: ['PURCHASE_ORDER', 'RECIPE', 'INVENTORY_CHECK', 'TRANSFER_NOTE', 'BATCH_OPERATION'],
    required: function() {
      return ['PURCHASE', 'USAGE', 'TRANSFER', 'BATCH_ADJUSTMENT'].includes(this.movementType);
    }
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'relatedDocument'
  },
  batchId: {
    type: String,
    required: function() {
      return this.movementType === 'BATCH_ADJUSTMENT';
    }
  },
  movementDate: { 
    type: Date, 
    required: true,
    default: Date.now 
  },
  description: { 
    type: String,
    required: function() {
      return ['WASTE', 'ADJUSTMENT', 'BATCH_ADJUSTMENT'].includes(this.movementType);
    }
  },
  location: {
    type: String,
    required: function() {
      return this.movementType === 'TRANSFER';
    }
  },
  expiryDate: {
    type: Date,
    required: function() {
      return ['PURCHASE'].includes(this.movementType);
    }
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  created_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true 
  },
  modified_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }
});

// Pre-save middleware to update timestamps
stockMovementSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

// Pre-save middleware to validate quantities
stockMovementSchema.pre('save', async function(next) {
  if (this.isNew) {
    const Ingredient = mongoose.model('Ingredient');
    const ingredient = await Ingredient.findById(this.ingredientId);
    if (!ingredient) {
      next(new Error('Ingredient not found'));
    }
    
    this.previousQuantity = ingredient.currentQuantity;
    this.newQuantity = ingredient.currentQuantity + this.quantity;
    
    if (this.newQuantity < 0) {
      next(new Error('Insufficient stock for this movement'));
    }
  }
  next();
});

// Post-save middleware to update ingredient quantity
stockMovementSchema.post('save', async function(doc) {
  const Ingredient = mongoose.model('Ingredient');
  await Ingredient.findByIdAndUpdate(
    doc.ingredientId,
    { 
      $set: { 
        currentQuantity: doc.newQuantity,
        updated_at: new Date(),
        lastMovementDate: doc.movementDate
      },
      $push: {
        stockMovements: doc._id
      }
    }
  );
});

// Static method to get low stock alerts with advanced filtering
stockMovementSchema.statics.getLowStockAlerts = async function(options = {}) {
  const Ingredient = mongoose.model('Ingredient');
  const query = {
    $expr: { $lte: ['$currentQuantity', '$reorderPoint'] }
  };
  
  if (options.supplier) {
    query.supplier = mongoose.Types.ObjectId(options.supplier);
  }
  
  if (options.threshold) {
    query.$expr = {
      $lte: ['$currentQuantity', { $multiply: ['$reorderPoint', options.threshold] }]
    };
  }
  
  return await Ingredient.find(query)
    .populate('supplier')
    .sort({ currentQuantity: 1 });
};

// Static method to get stock value report with trends
stockMovementSchema.statics.getStockValueReport = async function(period = 30) {
  const Ingredient = mongoose.model('Ingredient');
  const now = new Date();
  const startDate = new Date(now.setDate(now.getDate() - period));
  
  const movements = await this.aggregate([
    {
      $match: {
        movementDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          ingredientId: '$ingredientId',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$movementDate' } }
        },
        totalValue: {
          $sum: { $multiply: ['$quantity', '$unitCost'] }
        }
      }
    }
  ]);
  
  const currentStock = await Ingredient.aggregate([
    {
      $project: {
        name: 1,
        totalValue: { $multiply: ['$currentQuantity', '$costPerUnit'] },
        currentQuantity: 1,
        costPerUnit: 1,
        unit: 1,
        reorderPoint: 1,
        supplier: 1
      }
    },
    {
      $group: {
        _id: null,
        ingredients: { $push: '$$ROOT' },
        totalStockValue: { $sum: '$totalValue' },
        totalItems: { $sum: 1 },
        averageValue: { $avg: '$totalValue' }
      }
    }
  ]);
  
  return {
    current: currentStock[0] || { ingredients: [], totalStockValue: 0, totalItems: 0, averageValue: 0 },
    movements: movements
  };
};

// Static method to get movement history with enhanced filtering
stockMovementSchema.statics.getMovementHistory = async function(filters) {
  const query = {};
  
  if (filters.ingredientId) {
    query.ingredientId = mongoose.Types.ObjectId(filters.ingredientId);
  }
  if (filters.movementType) {
    query.movementType = filters.movementType;
  }
  if (filters.startDate && filters.endDate) {
    query.movementDate = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }
  if (filters.supplier) {
    query.supplier = mongoose.Types.ObjectId(filters.supplier);
  }
  if (filters.batchId) {
    query.batchId = filters.batchId;
  }
  
  return await this.find(query)
    .populate('ingredientId')
    .populate('supplier')
    .populate('created_by', 'name')
    .sort({ movementDate: -1 });
};

// Static method for batch operations
stockMovementSchema.statics.createBatchMovement = async function(movements, userId) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const batchId = new mongoose.Types.ObjectId().toString();
    const createdMovements = [];
    
    for (const movement of movements) {
      const newMovement = new this({
        ...movement,
        movementType: 'BATCH_ADJUSTMENT',
        batchId,
        created_by: userId,
        relatedDocument: 'BATCH_OPERATION'
      });
      await newMovement.save({ session });
      createdMovements.push(newMovement);
    }
    
    await session.commitTransaction();
    return { batchId, movements: createdMovements };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Static method for expiry tracking
stockMovementSchema.statics.getExpiryAlerts = async function(daysThreshold = 30) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysThreshold);
  
  return await this.find({
    expiryDate: { $lte: expiryDate },
    notificationSent: false,
    movementType: 'PURCHASE'
  })
  .populate('ingredientId')
  .populate('supplier');
};

// Static method for usage analytics
stockMovementSchema.statics.getUsageAnalytics = async function(period = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  return await this.aggregate([
    {
      $match: {
        movementDate: { $gte: startDate },
        movementType: 'USAGE'
      }
    },
    {
      $group: {
        _id: '$ingredientId',
        totalUsage: { $sum: '$quantity' },
        usageCount: { $sum: 1 },
        averageUsage: { $avg: '$quantity' },
        lastUsed: { $max: '$movementDate' }
      }
    },
    {
      $lookup: {
        from: 'ingredients',
        localField: '_id',
        foreignField: '_id',
        as: 'ingredient'
      }
    },
    {
      $unwind: '$ingredient'
    },
    {
      $project: {
        ingredient: '$ingredient.name',
        totalUsage: 1,
        usageCount: 1,
        averageUsage: 1,
        lastUsed: 1,
        daysFromLastUsage: {
          $dateDiff: {
            startDate: '$lastUsed',
            endDate: '$$NOW',
            unit: 'day'
          }
        }
      }
    }
  ]);
};

// Static method for advanced analytics
stockMovementSchema.statics.getAdvancedAnalytics = async function(period = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  return await this.aggregate([
    {
      $match: {
        movementDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          ingredientId: '$ingredientId',
          movementType: '$movementType',
          day: { $dateToString: { format: '%Y-%m-%d', date: '$movementDate' } }
        },
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: { $multiply: ['$quantity', '$unitCost'] } },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.ingredientId',
        movements: {
          $push: {
            date: '$_id.day',
            type: '$_id.movementType',
            quantity: '$totalQuantity',
            value: '$totalValue',
            count: '$count'
          }
        },
        totalUsage: {
          $sum: {
            $cond: [
              { $eq: ['$_id.movementType', 'USAGE'] },
              '$totalQuantity',
              0
            ]
          }
        },
        totalWaste: {
          $sum: {
            $cond: [
              { $eq: ['$_id.movementType', 'WASTE'] },
              '$totalQuantity',
              0
            ]
          }
        },
        totalPurchases: {
          $sum: {
            $cond: [
              { $eq: ['$_id.movementType', 'PURCHASE'] },
              '$totalValue',
              0
            ]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'ingredients',
        localField: '_id',
        foreignField: '_id',
        as: 'ingredient'
      }
    },
    {
      $unwind: '$ingredient'
    },
    {
      $project: {
        ingredient: '$ingredient.name',
        movements: 1,
        totalUsage: 1,
        totalWaste: 1,
        totalPurchases: 1,
        wastePercentage: {
          $multiply: [
            { $divide: ['$totalWaste', { $add: ['$totalUsage', '$totalWaste'] }] },
            100
          ]
        },
        averageDailyUsage: { $divide: ['$totalUsage', period] }
      }
    }
  ]);
};

// Static method for reorder suggestions
stockMovementSchema.statics.getReorderSuggestions = async function() {
  const Ingredient = mongoose.model('Ingredient');
  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
  
  // Get usage patterns
  const usagePatterns = await this.aggregate([
    {
      $match: {
        movementType: 'USAGE',
        movementDate: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: '$ingredientId',
        totalUsage: { $sum: '$quantity' },
        usageCount: { $sum: 1 },
        lastUsed: { $max: '$movementDate' }
      }
    }
  ]);
  
  // Get current stock levels and combine with usage patterns
  const ingredients = await Ingredient.find({});
  
  return ingredients.map(ingredient => {
    const usage = usagePatterns.find(u => u._id.equals(ingredient._id)) || {
      totalUsage: 0,
      usageCount: 0
    };
    
    const averageDailyUsage = usage.totalUsage / 30;
    const daysUntilReorder = ingredient.currentQuantity / averageDailyUsage;
    const suggestedOrderQuantity = Math.max(
      ingredient.reorderPoint * 2 - ingredient.currentQuantity,
      averageDailyUsage * 14 // Two weeks worth of stock
    );
    
    return {
      ingredientId: ingredient._id,
      name: ingredient.name,
      currentStock: ingredient.currentQuantity,
      reorderPoint: ingredient.reorderPoint,
      averageDailyUsage,
      daysUntilReorder,
      suggestedOrderQuantity: Math.ceil(suggestedOrderQuantity),
      priority: daysUntilReorder < 7 ? 'HIGH' : daysUntilReorder < 14 ? 'MEDIUM' : 'LOW',
      supplier: ingredient.supplier,
      lastOrderDate: null // Will be populated in controller
    };
  }).filter(item => item.averageDailyUsage > 0); // Only include items with usage
};

// Static method for real-time notifications
stockMovementSchema.statics.getNotifications = async function() {
  const now = new Date();
  const sevenDaysFromNow = new Date(now.setDate(now.getDate() + 7));
  
  const [lowStock, expiringItems, reorderSuggestions] = await Promise.all([
    // Low stock alerts
    this.getLowStockAlerts({ threshold: 1.2 }), // 20% above reorder point
    
    // Expiring items
    this.find({
      expiryDate: { $lte: sevenDaysFromNow },
      notificationSent: false,
      movementType: 'PURCHASE'
    }).populate('ingredientId').populate('supplier'),
    
    // Reorder suggestions
    this.getReorderSuggestions()
  ]);
  
  return {
    lowStock: lowStock.map(item => ({
      type: 'LOW_STOCK',
      priority: 'HIGH',
      message: `${item.name} is below reorder point`,
      details: {
        currentStock: item.currentQuantity,
        reorderPoint: item.reorderPoint
      }
    })),
    
    expiring: expiringItems.map(item => ({
      type: 'EXPIRING',
      priority: 'MEDIUM',
      message: `${item.ingredientId.name} will expire soon`,
      details: {
        expiryDate: item.expiryDate,
        quantity: item.quantity
      }
    })),
    
    reorder: reorderSuggestions
      .filter(item => item.priority === 'HIGH')
      .map(item => ({
        type: 'REORDER',
        priority: item.priority,
        message: `Time to reorder ${item.name}`,
        details: {
          currentStock: item.currentStock,
          suggestedQuantity: item.suggestedOrderQuantity,
          daysUntilReorder: Math.ceil(item.daysUntilReorder)
        }
      }))
  };
};

// Static method for inventory forecasting
stockMovementSchema.statics.getForecast = async function(days = 30) {
  const Ingredient = mongoose.model('Ingredient');
  const now = new Date();
  const startDate = new Date(now.setDate(now.getDate() - 90)); // Use 90 days of history
  
  // Get historical usage patterns
  const usageHistory = await this.aggregate([
    {
      $match: {
        movementType: 'USAGE',
        movementDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          ingredientId: '$ingredientId',
          week: { 
            $week: '$movementDate'
          }
        },
        totalUsage: { $sum: '$quantity' }
      }
    },
    {
      $group: {
        _id: '$_id.ingredientId',
        weeklyUsage: {
          $push: {
            week: '$_id.week',
            usage: '$totalUsage'
          }
        },
        avgWeeklyUsage: { $avg: '$totalUsage' },
        stdDevWeeklyUsage: { $stdDevPop: '$totalUsage' }
      }
    }
  ]);

  // Get seasonal patterns (if any)
  const seasonalPatterns = await this.aggregate([
    {
      $match: {
        movementType: 'USAGE',
        movementDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          ingredientId: '$ingredientId',
          month: { $month: '$movementDate' },
          dayOfWeek: { $dayOfWeek: '$movementDate' }
        },
        avgUsage: { $avg: '$quantity' }
      }
    }
  ]);

  // Get current inventory levels
  const ingredients = await Ingredient.find({}).populate('supplier');

  // Calculate forecasts
  return await Promise.all(ingredients.map(async ingredient => {
    const usage = usageHistory.find(u => u._id.equals(ingredient._id)) || {
      avgWeeklyUsage: 0,
      stdDevWeeklyUsage: 0,
      weeklyUsage: []
    };

    const seasonal = seasonalPatterns
      .filter(p => p._id.ingredientId.equals(ingredient._id))
      .reduce((acc, pattern) => {
        acc[`${pattern._id.month}-${pattern._id.dayOfWeek}`] = pattern.avgUsage;
        return acc;
      }, {});

    // Calculate trend using linear regression
    const trend = calculateTrend(usage.weeklyUsage);

    // Generate daily forecasts
    const forecasts = [];
    let runningStock = ingredient.currentQuantity;
    let lastReorderDate = null;

    for (let i = 0; i < days; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);
      
      const month = forecastDate.getMonth() + 1;
      const dayOfWeek = forecastDate.getDay() + 1;
      const seasonalFactor = seasonal[`${month}-${dayOfWeek}`] || 1;
      
      // Calculate forecasted usage
      const baseUsage = (usage.avgWeeklyUsage / 7) * (1 + trend.slope * i);
      const forecastedUsage = baseUsage * seasonalFactor;
      const confidenceInterval = usage.stdDevWeeklyUsage / 7 * 1.96; // 95% confidence

      // Check if reorder needed
      const willReorder = runningStock - forecastedUsage <= ingredient.reorderPoint;
      if (willReorder) {
        const orderQuantity = Math.max(
          ingredient.reorderPoint * 2,
          forecastedUsage * 14 // 2 weeks worth
        );
        runningStock += orderQuantity;
        lastReorderDate = forecastDate;
      }

      runningStock = Math.max(0, runningStock - forecastedUsage);

      forecasts.push({
        date: forecastDate,
        expectedUsage: forecastedUsage,
        expectedStock: runningStock,
        lowerBound: Math.max(0, forecastedUsage - confidenceInterval),
        upperBound: forecastedUsage + confidenceInterval,
        reorderNeeded: willReorder,
        seasonalFactor
      });
    }

    return {
      ingredientId: ingredient._id,
      name: ingredient.name,
      currentStock: ingredient.currentQuantity,
      reorderPoint: ingredient.reorderPoint,
      supplier: ingredient.supplier,
      averageWeeklyUsage: usage.avgWeeklyUsage,
      trend: trend.slope,
      seasonality: Object.keys(seasonal).length > 0,
      nextReorderDate: lastReorderDate,
      forecasts
    };
  }));
};

// Static method for visualization data
stockMovementSchema.statics.getVisualizationData = async function(period = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  const [movements, stockLevels, trends] = await Promise.all([
    // Daily movements by type
    this.aggregate([
      {
        $match: {
          movementDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$movementDate' } },
            type: '$movementType',
            ingredientId: '$ingredientId'
          },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$unitCost'] } }
        }
      },
      {
        $lookup: {
          from: 'ingredients',
          localField: '_id.ingredientId',
          foreignField: '_id',
          as: 'ingredient'
        }
      },
      {
        $unwind: '$ingredient'
      },
      {
        $group: {
          _id: {
            date: '$_id.date',
            type: '$_id.type'
          },
          movements: {
            $push: {
              ingredient: '$ingredient.name',
              quantity: '$totalQuantity',
              value: '$totalValue'
            }
          },
          totalQuantity: { $sum: '$totalQuantity' },
          totalValue: { $sum: '$totalValue' }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]),

    // Daily stock levels
    this.aggregate([
      {
        $match: {
          movementDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$movementDate' } },
            ingredientId: '$ingredientId'
          },
          endQuantity: { $last: '$newQuantity' }
        }
      },
      {
        $lookup: {
          from: 'ingredients',
          localField: '_id.ingredientId',
          foreignField: '_id',
          as: 'ingredient'
        }
      },
      {
        $unwind: '$ingredient'
      },
      {
        $group: {
          _id: '$_id.date',
          stocks: {
            $push: {
              ingredient: '$ingredient.name',
              quantity: '$endQuantity',
              value: { $multiply: ['$endQuantity', '$ingredient.costPerUnit'] }
            }
          },
          totalValue: { 
            $sum: { $multiply: ['$endQuantity', '$ingredient.costPerUnit'] }
          }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]),

    // Usage trends and patterns
    this.aggregate([
      {
        $match: {
          movementDate: { $gte: startDate },
          movementType: 'USAGE'
        }
      },
      {
        $group: {
          _id: {
            ingredientId: '$ingredientId',
            week: { $week: '$movementDate' },
            dayOfWeek: { $dayOfWeek: '$movementDate' }
          },
          totalUsage: { $sum: '$quantity' }
        }
      },
      {
        $lookup: {
          from: 'ingredients',
          localField: '_id.ingredientId',
          foreignField: '_id',
          as: 'ingredient'
        }
      },
      {
        $unwind: '$ingredient'
      },
      {
        $group: {
          _id: '$ingredient.name',
          weeklyPattern: {
            $push: {
              week: '$_id.week',
              dayOfWeek: '$_id.dayOfWeek',
              usage: '$totalUsage'
            }
          },
          avgUsage: { $avg: '$totalUsage' },
          maxUsage: { $max: '$totalUsage' },
          minUsage: { $min: '$totalUsage' }
        }
      }
    ])
  ]);

  return {
    dailyMovements: movements.reduce((acc, mov) => {
      const date = mov._id.date;
      if (!acc[date]) acc[date] = {};
      acc[date][mov._id.type] = {
        total: mov.totalQuantity,
        value: mov.totalValue,
        details: mov.movements
      };
      return acc;
    }, {}),

    stockLevels: stockLevels.reduce((acc, stock) => {
      acc[stock._id] = {
        totalValue: stock.totalValue,
        details: stock.stocks
      };
      return acc;
    }, {}),

    usageTrends: trends.reduce((acc, trend) => {
      acc[trend._id] = {
        weeklyPattern: trend.weeklyPattern,
        statistics: {
          average: trend.avgUsage,
          maximum: trend.maxUsage,
          minimum: trend.minUsage,
          variance: calculateVariance(trend.weeklyPattern.map(w => w.usage))
        }
      };
      return acc;
    }, {})
  };
};

// Static method for enhanced visualization data
stockMovementSchema.statics.getEnhancedVisualizationData = async function(period = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  const [movements, stockLevels, trends, supplierMetrics, costAnalysis] = await Promise.all([
    // Previous movement aggregation
    this.getVisualizationData(period),
    
    // Supplier performance metrics
    this.aggregate([
      {
        $match: {
          movementDate: { $gte: startDate },
          movementType: 'PURCHASE'
        }
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplier',
          foreignField: '_id',
          as: 'supplierInfo'
        }
      },
      {
        $unwind: '$supplierInfo'
      },
      {
        $group: {
          _id: '$supplier',
          supplierName: { $first: '$supplierInfo.name' },
          totalOrders: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$unitCost'] } },
          averageDeliveryTime: { $avg: { $subtract: ['$movementDate', '$createdAt'] } },
          orderFrequency: { 
            $push: { 
              date: '$movementDate',
              value: { $multiply: ['$quantity', '$unitCost'] }
            }
          }
        }
      }
    ]),
    
    // Cost analysis over time
    this.aggregate([
      {
        $match: {
          movementDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$movementDate' } },
            ingredientId: '$ingredientId'
          },
          costChanges: {
            $push: {
              type: '$movementType',
              unitCost: '$unitCost',
              quantity: '$quantity'
            }
          },
          averageCost: { $avg: '$unitCost' }
        }
      },
      {
        $lookup: {
          from: 'ingredients',
          localField: '_id.ingredientId',
          foreignField: '_id',
          as: 'ingredient'
        }
      },
      {
        $unwind: '$ingredient'
      }
    ])
  ]);
  
  return {
    ...movements,
    supplierMetrics: supplierMetrics.reduce((acc, supplier) => {
      acc[supplier._id] = {
        name: supplier.supplierName,
        metrics: {
          totalOrders: supplier.totalOrders,
          totalValue: supplier.totalValue,
          averageDeliveryTime: supplier.averageDeliveryTime,
          orderFrequency: supplier.orderFrequency
        }
      };
      return acc;
    }, {}),
    costAnalysis: costAnalysis.reduce((acc, item) => {
      const date = item._id.date;
      if (!acc[date]) acc[date] = {};
      acc[date][item.ingredient.name] = {
        costChanges: item.costChanges,
        averageCost: item.averageCost
      };
      return acc;
    }, {})
  };
};

// Static method for automated supplier orders
stockMovementSchema.statics.generateSupplierOrders = async function() {
  const Ingredient = mongoose.model('Ingredient');
  const [reorderSuggestions, supplierInfo] = await Promise.all([
    this.getReorderSuggestions(),
    this.aggregate([
      {
        $match: {
          movementType: 'PURCHASE',
          movementDate: {
            $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
          }
        }
      },
      {
        $group: {
          _id: {
            supplier: '$supplier',
            ingredientId: '$ingredientId'
          },
          lastUnitCost: { $last: '$unitCost' },
          averageDeliveryTime: { $avg: { $subtract: ['$movementDate', '$createdAt'] } }
        }
      }
    ])
  ]);

  // Group by supplier
  const supplierOrders = reorderSuggestions.reduce((acc, suggestion) => {
    if (suggestion.priority === 'HIGH') {
      const supplierData = supplierInfo.find(s => 
        s._id.ingredientId.equals(suggestion.ingredientId)
      );
      
      if (supplierData) {
        const supplierId = supplierData._id.supplier;
        if (!acc[supplierId]) {
          acc[supplierId] = {
            items: [],
            totalValue: 0,
            expectedDeliveryTime: 0
          };
        }
        
        acc[supplierId].items.push({
          ingredient: suggestion.name,
          quantity: suggestion.suggestedOrderQuantity,
          unitCost: supplierData.lastUnitCost,
          totalCost: supplierData.lastUnitCost * suggestion.suggestedOrderQuantity
        });
        
        acc[supplierId].totalValue += supplierData.lastUnitCost * suggestion.suggestedOrderQuantity;
        acc[supplierId].expectedDeliveryTime = Math.max(
          acc[supplierId].expectedDeliveryTime,
          supplierData.averageDeliveryTime
        );
      }
    }
    return acc;
  }, {});

  return supplierOrders;
};

// Static method for real-time monitoring data
stockMovementSchema.statics.getMonitoringData = async function() {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const yesterdayStart = new Date(now.setDate(now.getDate() - 1));
  
  const [todayMetrics, alerts, activeOrders] = await Promise.all([
    // Today's metrics
    this.aggregate([
      {
        $match: {
          movementDate: { $gte: todayStart }
        }
      },
      {
        $group: {
          _id: '$movementType',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$unitCost'] } }
        }
      }
    ]),
    
    // Active alerts
    this.getNotifications(),
    
    // Active purchase orders
    this.aggregate([
      {
        $match: {
          movementType: 'PURCHASE',
          movementDate: { $gte: yesterdayStart },
          status: { $ne: 'COMPLETED' }
        }
      },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplier',
          foreignField: '_id',
          as: 'supplierInfo'
        }
      },
      {
        $unwind: '$supplierInfo'
      },
      {
        $group: {
          _id: '$supplier',
          supplierName: { $first: '$supplierInfo.name' },
          orders: {
            $push: {
              orderId: '$_id',
              items: '$items',
              value: { $multiply: ['$quantity', '$unitCost'] },
              status: '$status',
              expectedDelivery: '$expectedDelivery'
            }
          }
        }
      }
    ])
  ]);
  
  return {
    metrics: {
      today: todayMetrics.reduce((acc, metric) => {
        acc[metric._id] = {
          count: metric.count,
          quantity: metric.totalQuantity,
          value: metric.totalValue
        };
        return acc;
      }, {}),
      alerts: {
        total: Object.values(alerts).flat().length,
        high: Object.values(alerts).flat().filter(a => a.priority === 'HIGH').length,
        medium: Object.values(alerts).flat().filter(a => a.priority === 'MEDIUM').length,
        low: Object.values(alerts).flat().filter(a => a.priority === 'LOW').length
      }
    },
    alerts,
    activeOrders: activeOrders.reduce((acc, supplier) => {
      acc[supplier._id] = {
        name: supplier.supplierName,
        orders: supplier.orders
      };
      return acc;
    }, {})
  };
};

// Helper function to calculate trend using linear regression
function calculateTrend(weeklyData) {
  if (!weeklyData || weeklyData.length < 2) {
    return { slope: 0, intercept: 0 };
  }

  const n = weeklyData.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  weeklyData.forEach((data, i) => {
    sumX += i;
    sumY += data.usage;
    sumXY += i * data.usage;
    sumXX += i * i;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

// Helper function to calculate variance
function calculateVariance(values) {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
}

const StockMovement = mongoose.model("StockMovement", stockMovementSchema);
export default StockMovement;
