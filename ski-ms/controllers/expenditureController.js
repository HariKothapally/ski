import Expenditure from "../models/expenditureModel.js";
import Purchase from "../models/purchaseModel.js";
import { AppError } from '../utils/errorHandler.js';
import { catchAsync } from '../utils/errorHandler.js';
import { validatePrice, sanitizeInput } from '../utils/validation.js';
import { getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth, isValidDate } from '../utils/dateUtils.js';

const VALID_CATEGORIES = [
  'ingredients',
  'utilities',
  'maintenance',
  'salaries',
  'rent',
  'equipment',
  'marketing',
  'transportation',
  'taxes',
  'insurance',
  'other'
];

const VALID_PAYMENT_METHODS = ['cash', 'card', 'upi', 'bank_transfer', 'cheque'];

const validateExpenditureInput = async (data) => {
  const { category, amount, date, description, paymentMethod, referenceNumber, purchaseId, vendor } = data;

  // Validate category
  if (!category || !VALID_CATEGORIES.includes(category.toLowerCase())) {
    throw new AppError(`Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`, 400);
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

  // Validate purchase if provided
  if (purchaseId) {
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      throw new AppError('Purchase not found', 404);
    }
  }

  // Validate and sanitize text fields
  const sanitizedData = {
    category: category.toLowerCase(),
    amount,
    date: new Date(date),
    description: description ? sanitizeInput(description) : undefined,
    paymentMethod: paymentMethod ? paymentMethod.toLowerCase() : undefined,
    referenceNumber: referenceNumber ? sanitizeInput(referenceNumber) : undefined,
    purchaseId,
    vendor: vendor ? sanitizeInput(vendor) : undefined
  };

  return sanitizedData;
};

// Create a new expenditure
export const createExpenditure = catchAsync(async (req, res) => {
  const validatedData = await validateExpenditureInput(req.body);

  const expenditure = await Expenditure.create({
    ...validatedData,
    created_by: req.user._id,
    created_at: new Date()
  });

  const populatedExpenditure = await Expenditure.findById(expenditure._id)
    .populate('purchaseId', 'purchaseNumber totalAmount items')
    .populate('created_by', 'name')
    .select('-__v');

  res.status(201).json({
    success: true,
    data: populatedExpenditure
  });
});

// Get all expenditures with filtering and analytics
export const getExpenditures = catchAsync(async (req, res) => {
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

  // Category filter
  if (req.query.category) {
    filter.category = req.query.category.toLowerCase();
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

  // Vendor search
  if (req.query.vendor) {
    filter.vendor = new RegExp(req.query.vendor, 'i');
  }

  // Reference number search
  if (req.query.referenceNumber) {
    filter.referenceNumber = new RegExp(req.query.referenceNumber, 'i');
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

  const expenditures = await Expenditure.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('purchaseId', 'purchaseNumber totalAmount items')
    .populate('created_by', 'name')
    .populate('updated_by', 'name')
    .select('-__v');

  // Calculate analytics
  const analytics = {
    totalExpenditure: await Expenditure.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).then(result => result[0]?.total || 0),
    byCategory: await Expenditure.aggregate([
      { $match: filter },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $project: { category: "$_id", total: 1, _id: 0 } },
      { $sort: { total: -1 } }
    ]),
    byPaymentMethod: await Expenditure.aggregate([
      { $match: filter },
      { $group: { _id: "$paymentMethod", total: { $sum: "$amount" } } },
      { $project: { method: "$_id", total: 1, _id: 0 } },
      { $sort: { total: -1 } }
    ]),
    monthlyTrend: await Expenditure.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          total: { $sum: "$amount" }
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
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ])
  };

  const total = await Expenditure.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      expenditures,
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

// Get an expenditure by ID
export const getExpenditureById = catchAsync(async (req, res) => {
  const expenditure = await Expenditure.findById(req.params.id)
    .populate('purchaseId', 'purchaseNumber totalAmount items vendor')
    .populate('created_by', 'name')
    .populate('updated_by', 'name')
    .select('-__v');

  if (!expenditure) {
    throw new AppError('Expenditure not found', 404);
  }

  res.status(200).json({
    success: true,
    data: expenditure
  });
});

// Update an expenditure
export const updateExpenditure = catchAsync(async (req, res) => {
  const expenditure = await Expenditure.findById(req.params.id);
  
  if (!expenditure) {
    throw new AppError('Expenditure not found', 404);
  }

  // Prevent updates to expenditures older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  if (expenditure.date < sevenDaysAgo) {
    throw new AppError('Cannot modify expenditures older than 7 days', 400);
  }

  const validatedData = await validateExpenditureInput({
    ...expenditure.toObject(),
    ...req.body
  });

  const updatedExpenditure = await Expenditure.findByIdAndUpdate(
    req.params.id,
    {
      ...validatedData,
      updated_by: req.user._id,
      updated_at: new Date()
    },
    { new: true }
  )
  .populate('purchaseId', 'purchaseNumber totalAmount items')
  .populate('created_by', 'name')
  .populate('updated_by', 'name')
  .select('-__v');

  res.status(200).json({
    success: true,
    data: updatedExpenditure
  });
});

// Delete an expenditure
export const deleteExpenditure = catchAsync(async (req, res) => {
  const expenditure = await Expenditure.findById(req.params.id);
  
  if (!expenditure) {
    throw new AppError('Expenditure not found', 404);
  }

  // Prevent deletion of expenditures older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  if (expenditure.date < sevenDaysAgo) {
    throw new AppError('Cannot delete expenditures older than 7 days', 400);
  }

  await expenditure.remove();

  res.status(200).json({
    success: true,
    message: 'Expenditure deleted successfully'
  });
});
