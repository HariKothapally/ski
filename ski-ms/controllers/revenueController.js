import Revenue from "../models/revenueModel.js";
import Order from "../models/orderModel.js";
import { AppError } from '../utils/errorHandler.js';
import { catchAsync } from '../utils/errorHandler.js';
import { validatePrice, sanitizeInput } from '../utils/validation.js';
import { getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth, isValidDate } from '../utils/dateUtils.js';

const VALID_REVENUE_SOURCES = ['orders', 'catering', 'events', 'other'];
const VALID_PAYMENT_METHODS = ['cash', 'card', 'upi', 'bank_transfer', 'cheque'];
const VALID_CATEGORIES = ['food', 'beverage', 'service', 'rental', 'merchandise', 'other'];

const validateRevenueInput = async (data) => {
  const { source, amount, date, description, paymentMethod, referenceNumber, category, orderId, customerInfo } = data;

  // Validate source
  if (!source || !VALID_REVENUE_SOURCES.includes(source.toLowerCase())) {
    throw new AppError(`Invalid revenue source. Must be one of: ${VALID_REVENUE_SOURCES.join(', ')}`, 400);
  }

  // Validate amount
  if (!validatePrice(amount) || amount <= 0) {
    throw new AppError('Invalid amount. Must be a positive number', 400);
  }

  // Validate date
  if (!date || !isValidDate(date)) {
    throw new AppError('Invalid date', 400);
  }

  // Validate payment method if provided
  if (paymentMethod && !VALID_PAYMENT_METHODS.includes(paymentMethod.toLowerCase())) {
    throw new AppError(`Invalid payment method. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`, 400);
  }

  // Validate category if provided
  if (category && !VALID_CATEGORIES.includes(category.toLowerCase())) {
    throw new AppError(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`, 400);
  }

  // If source is 'orders', verify the order exists
  if (source === 'orders') {
    if (!orderId) {
      throw new AppError('Order ID is required for revenue source "orders"', 400);
    }
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
  }

  // Sanitize optional text fields
  const sanitizedData = {
    source: source.toLowerCase(),
    amount,
    date: new Date(date),
    paymentMethod: paymentMethod ? paymentMethod.toLowerCase() : undefined,
    referenceNumber: referenceNumber ? sanitizeInput(referenceNumber) : undefined,
    category: category ? category.toLowerCase() : undefined,
    description: description ? sanitizeInput(description) : undefined,
    orderId,
    customerInfo: customerInfo ? {
      name: sanitizeInput(customerInfo.name),
      contact: sanitizeInput(customerInfo.contact),
      email: sanitizeInput(customerInfo.email)
    } : undefined
  };

  return sanitizedData;
};

// Create a new revenue record
export const createRevenue = catchAsync(async (req, res) => {
  const validatedData = await validateRevenueInput(req.body);

  const revenue = await Revenue.create({
    ...validatedData,
    created_by: req.user._id,
    created_at: new Date()
  });

  const populatedRevenue = await Revenue.findById(revenue._id)
    .populate('orderId', 'orderNumber totalAmount items customer')
    .populate('created_by', 'name')
    .select('-__v');

  res.status(201).json({
    success: true,
    data: populatedRevenue
  });
});

// Get all revenue records with filtering and analytics
export const getRevenue = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = {};
  
  // Date range filter
  if (req.query.startDate && req.query.endDate) {
    filter.date = {
      $gte: getStartOfDay(new Date(req.query.startDate)),
      $lte: getEndOfDay(new Date(req.query.endDate))
    };
  } else if (req.query.month && req.query.year) {
    const startDate = getStartOfMonth(new Date(req.query.year, req.query.month - 1));
    const endDate = getEndOfMonth(startDate);
    filter.date = { $gte: startDate, $lte: endDate };
  }

  // Source filter
  if (req.query.source) {
    filter.source = req.query.source.toLowerCase();
  }

  // Payment method filter
  if (req.query.paymentMethod) {
    filter.paymentMethod = req.query.paymentMethod.toLowerCase();
  }

  // Amount range filter
  if (req.query.minAmount || req.query.maxAmount) {
    filter.amount = {};
    if (req.query.minAmount) filter.amount.$gte = parseFloat(req.query.minAmount);
    if (req.query.maxAmount) filter.amount.$lte = parseFloat(req.query.maxAmount);
  }

  // Category filter
  if (req.query.category) {
    filter.category = req.query.category.toLowerCase();
  }

  // Reference number search
  if (req.query.referenceNumber) {
    filter.referenceNumber = new RegExp(req.query.referenceNumber, 'i');
  }

  // Customer search
  if (req.query.customer) {
    filter['customerInfo.name'] = new RegExp(req.query.customer, 'i');
  }

  // Build sort object
  let sort = { date: -1 }; // default sort by date desc
  if (req.query.sort) {
    sort = {};
    const sortFields = req.query.sort.split(',');
    sortFields.forEach(field => {
      const [key, order] = field.split(':');
      sort[key] = order === 'desc' ? -1 : 1;
    });
  }

  const revenues = await Revenue.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('orderId', 'orderNumber totalAmount items customer')
    .populate('created_by', 'name')
    .populate('updated_by', 'name')
    .select('-__v');

  // Calculate analytics
  const analytics = {
    totalRevenue: await Revenue.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).then(result => result[0]?.total || 0),
    
    sourceBreakdown: await Revenue.aggregate([
      { $match: filter },
      { $group: { _id: "$source", total: { $sum: "$amount" } } },
      { $project: { source: "$_id", total: 1, _id: 0 } },
      { $sort: { total: -1 } }
    ]),
    
    categoryBreakdown: await Revenue.aggregate([
      { $match: filter },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $project: { category: "$_id", total: 1, _id: 0 } },
      { $sort: { total: -1 } }
    ]),
    
    paymentMethodBreakdown: await Revenue.aggregate([
      { $match: filter },
      { $group: { _id: "$paymentMethod", total: { $sum: "$amount" } } },
      { $project: { method: "$_id", total: 1, _id: 0 } },
      { $sort: { total: -1 } }
    ]),
    
    monthlyTrend: await Revenue.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" }
        }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month"
            }
          },
          total: 1,
          count: 1,
          avgAmount: 1,
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]),
    
    dailyTrend: await Revenue.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" }
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          date: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.day"
            }
          },
          total: 1,
          count: 1,
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ])
  };

  const total = await Revenue.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      revenues,
      analytics,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get a revenue record by ID
export const getRevenueById = catchAsync(async (req, res) => {
  const revenue = await Revenue.findById(req.params.id)
    .populate('orderId', 'orderNumber totalAmount items customer')
    .populate('created_by', 'name')
    .populate('updated_by', 'name')
    .select('-__v');

  if (!revenue) {
    throw new AppError('Revenue record not found', 404);
  }

  res.status(200).json({
    success: true,
    data: revenue
  });
});

// Update a revenue record
export const updateRevenue = catchAsync(async (req, res) => {
  const revenue = await Revenue.findById(req.params.id);
  
  if (!revenue) {
    throw new AppError('Revenue record not found', 404);
  }

  // Prevent updates to revenue records older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  if (revenue.date < sevenDaysAgo) {
    throw new AppError('Cannot modify revenue records older than 7 days', 400);
  }

  const validatedData = await validateRevenueInput({
    ...revenue.toObject(),
    ...req.body
  });

  const updatedRevenue = await Revenue.findByIdAndUpdate(
    req.params.id,
    {
      ...validatedData,
      updated_by: req.user._id,
      updated_at: new Date()
    },
    { new: true }
  )
  .populate('orderId', 'orderNumber totalAmount items customer')
  .populate('created_by', 'name')
  .populate('updated_by', 'name')
  .select('-__v');

  res.status(200).json({
    success: true,
    data: updatedRevenue
  });
});

// Delete a revenue record
export const deleteRevenue = catchAsync(async (req, res) => {
  const revenue = await Revenue.findById(req.params.id);
  
  if (!revenue) {
    throw new AppError('Revenue record not found', 404);
  }

  // Prevent deletion of revenue records older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  if (revenue.date < sevenDaysAgo) {
    throw new AppError('Cannot delete revenue records older than 7 days', 400);
  }

  await revenue.remove();

  res.status(200).json({
    success: true,
    message: 'Revenue record deleted successfully'
  });
});
