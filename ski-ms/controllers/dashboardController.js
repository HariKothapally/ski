import Employee from '../models/employeeModel.js';
import Order from '../models/orderModel.js';
import Revenue from '../models/revenueModel.js';
import Ingredient from '../models/ingredientsModel.js';
import Budget from '../models/budgetModel.js';
import Menu from '../models/menuModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Get dashboard summary
export const getDashboardSummary = catchAsync(async (req, res, next) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());

  const [
    employeeStats,
    orderStats,
    revenueStats,
    inventoryStats,
    budgetStats,
    menuStats
  ] = await Promise.all([
    // Employee Statistics
    Employee.aggregate([
      {
        $group: {
          _id: null,
          totalEmployees: { $sum: 1 },
          activeEmployees: { 
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          byDepartment: {
            $push: {
              department: '$department',
              isActive: '$isActive'
            }
          }
        }
      }
    ]),

    // Order Statistics
    Order.aggregate([
      {
        $facet: {
          'todayStats': [
            { $match: { createdAt: { $gte: startOfDay(today) } } },
            { 
              $group: {
                _id: null,
                count: { $sum: 1 },
                revenue: { $sum: '$total' },
                avgOrderValue: { $avg: '$total' }
              }
            }
          ],
          'statusCounts': [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          'recentOrders': [
            { $sort: { createdAt: -1 } },
            { $limit: 5 },
            {
              $project: {
                orderNumber: 1,
                total: 1,
                status: 1,
                items: 1,
                createdAt: 1
              }
            }
          ]
        }
      }
    ]),

    // Revenue Statistics
    Revenue.aggregate([
      {
        $facet: {
          'monthlyStats': [
            {
              $match: {
                date: { $gte: startOfMonth }
              }
            },
            {
              $group: {
                _id: null,
                total: { $sum: '$amount' },
                average: { $avg: '$amount' },
                transactions: { $sum: 1 }
              }
            }
          ],
          'weeklyTrend': [
            {
              $match: {
                date: { $gte: startOfWeek }
              }
            },
            {
              $group: {
                _id: { $dayOfWeek: '$date' },
                total: { $sum: '$amount' }
              }
            },
            { $sort: { '_id': 1 } }
          ],
          'paymentMethods': [
            {
              $group: {
                _id: '$paymentMethod',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]),

    // Inventory Statistics
    Ingredient.aggregate([
      {
        $facet: {
          'stockAlerts': [
            {
              $match: {
                $or: [
                  { quantity: { $lte: '$minimumQuantity' } },
                  { quantity: { $lt: 10 } }
                ]
              }
            },
            {
              $project: {
                name: 1,
                quantity: 1,
                minimumQuantity: 1,
                unit: 1,
                status: {
                  $cond: [
                    { $eq: ['$quantity', 0] },
                    'out_of_stock',
                    'low_stock'
                  ]
                }
              }
            }
          ],
          'categoryStats': [
            {
              $group: {
                _id: '$category',
                totalItems: { $sum: 1 },
                totalValue: { $sum: { $multiply: ['$quantity', '$unitPrice'] } }
              }
            }
          ],
          'expiryAlerts': [
            {
              $match: {
                expiryDate: {
                  $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                }
              }
            },
            {
              $project: {
                name: 1,
                expiryDate: 1,
                quantity: 1,
                daysToExpiry: {
                  $ceil: {
                    $divide: [
                      { $subtract: ['$expiryDate', today] },
                      1000 * 60 * 60 * 24
                    ]
                  }
                }
              }
            },
            { $sort: { daysToExpiry: 1 } }
          ]
        }
      }
    ]),

    // Budget Statistics
    Budget.aggregate([
      {
        $facet: {
          'currentBudget': [
            {
              $match: {
                'period.startDate': { $lte: today },
                'period.endDate': { $gte: today },
                status: 'active'
              }
            },
            {
              $project: {
                name: 1,
                totalAllocated: 1,
                totalSpent: 1,
                remainingAmount: { $subtract: ['$totalAllocated', '$totalSpent'] },
                percentageUsed: {
                  $multiply: [
                    { $divide: ['$totalSpent', '$totalAllocated'] },
                    100
                  ]
                }
              }
            }
          ],
          'departmentSpending': [
            {
              $match: {
                status: 'active'
              }
            },
            {
              $group: {
                _id: '$department',
                allocated: { $sum: '$totalAllocated' },
                spent: { $sum: '$totalSpent' }
              }
            }
          ]
        }
      }
    ]),

    // Menu Statistics
    Menu.aggregate([
      {
        $facet: {
          'popularItems': [
            { $unwind: '$items' },
            {
              $group: {
                _id: '$items.name',
                totalOrders: { $sum: '$items.orderCount' },
                revenue: { $sum: { $multiply: ['$items.price', '$items.orderCount'] } }
              }
            },
            { $sort: { totalOrders: -1 } },
            { $limit: 5 }
          ],
          'categoryPerformance': [
            { $unwind: '$items' },
            {
              $group: {
                _id: '$category',
                itemCount: { $sum: 1 },
                totalRevenue: { 
                  $sum: { $multiply: ['$items.price', '$items.orderCount'] }
                }
              }
            }
          ]
        }
      }
    ])
  ]);

  // Process department statistics
  const departmentStats = employeeStats[0]?.byDepartment.reduce((acc, curr) => {
    if (!acc[curr.department]) {
      acc[curr.department] = { total: 0, active: 0 };
    }
    acc[curr.department].total += 1;
    if (curr.isActive) acc[curr.department].active += 1;
    return acc;
  }, {});

  res.status(200).json({
    status: 'success',
    data: {
      employees: {
        total: employeeStats[0]?.totalEmployees || 0,
        active: employeeStats[0]?.activeEmployees || 0,
        byDepartment: departmentStats
      },
      orders: {
        today: orderStats[0]?.todayStats[0] || {
          count: 0,
          revenue: 0,
          avgOrderValue: 0
        },
        byStatus: orderStats[0]?.statusCounts || [],
        recent: orderStats[0]?.recentOrders || []
      },
      revenue: {
        monthly: revenueStats[0]?.monthlyStats[0] || {
          total: 0,
          average: 0,
          transactions: 0
        },
        weeklyTrend: revenueStats[0]?.weeklyTrend || [],
        byPaymentMethod: revenueStats[0]?.paymentMethods || []
      },
      inventory: {
        alerts: inventoryStats[0]?.stockAlerts || [],
        byCategory: inventoryStats[0]?.categoryStats || [],
        expiringItems: inventoryStats[0]?.expiryAlerts || []
      },
      budget: {
        current: budgetStats[0]?.currentBudget[0] || null,
        departmentSpending: budgetStats[0]?.departmentSpending || []
      },
      menu: {
        popularItems: menuStats[0]?.popularItems || [],
        categoryPerformance: menuStats[0]?.categoryPerformance || []
      }
    }
  });
});

// Get detailed employee analytics
export const getEmployeeAnalytics = catchAsync(async (req, res, next) => {
  const [attendance, performance, schedules] = await Promise.all([
    Employee.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'employeeId',
          as: 'attendance'
        }
      },
      {
        $project: {
          name: 1,
          department: 1,
          attendanceRate: {
            $multiply: [
              {
                $divide: [
                  {
                    $size: {
                      $filter: {
                        input: '$attendance',
                        as: 'a',
                        cond: { $eq: ['$$a.status', 'present'] }
                      }
                    }
                  },
                  { $size: '$attendance' }
                ]
              },
              100
            ]
          }
        }
      }
    ]),
    Employee.aggregate([
      {
        $lookup: {
          from: 'performances',
          localField: '_id',
          foreignField: 'employeeId',
          as: 'performance'
        }
      },
      {
        $project: {
          name: 1,
          department: 1,
          averageRating: { $avg: '$performance.rating' },
          completedTasks: { $sum: '$performance.tasksCompleted' }
        }
      }
    ]),
    Employee.aggregate([
      {
        $lookup: {
          from: 'schedules',
          localField: '_id',
          foreignField: 'employeeId',
          as: 'schedule'
        }
      },
      {
        $project: {
          name: 1,
          department: 1,
          totalHours: { $sum: '$schedule.hours' },
          shifts: { $size: '$schedule' }
        }
      }
    ])
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      attendance,
      performance,
      schedules
    }
  });
});

// Get detailed order analytics
export const getOrderAnalytics = catchAsync(async (req, res, next) => {
  const [hourlyTrend, itemPerformance, customerPreferences] = await Promise.all([
    Order.aggregate([
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 },
          revenue: { $sum: '$total' }
        }
      },
      { $sort: { '_id': 1 } }
    ]),
    Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          totalOrdered: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalOrdered: -1 } },
      { $limit: 10 }
    ]),
    Order.aggregate([
      {
        $group: {
          _id: '$customerId',
          orderCount: { $sum: 1 },
          totalSpent: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          lastOrder: { $max: '$createdAt' }
        }
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 }
    ])
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      hourlyTrend,
      itemPerformance,
      customerPreferences
    }
  });
});

// Helper function to get start of day
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
