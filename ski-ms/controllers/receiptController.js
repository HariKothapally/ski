import Receipt from "../models/receiptModel.js";
import Order from "../models/orderModel.js";
import { AppError } from '../utils/errorHandler.js';
import { catchAsync } from '../utils/errorHandler.js';
import { validatePrice, sanitizeInput } from '../utils/validation.js';
import { getStartOfDay, getEndOfDay, getStartOfMonth, getEndOfMonth, isValidDate } from '../utils/dateUtils.js';

const VALID_PAYMENT_METHODS = ['cash', 'card', 'upi', 'bank_transfer'];
const VALID_RECEIPT_TYPES = ['order', 'purchase', 'refund', 'other'];

const validateReceiptInput = async (data) => {
  const { orderId, amount, date, description, paymentMethod, receiptType, referenceNumber } = data;

  // Validate order if provided
  if (orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
  }

  // Validate amount
  if (!validatePrice(amount) || amount <= 0) {
    throw new AppError('Invalid amount. Must be a positive number', 400);
  }

  // Validate date
  if (!date || !isValidDate(date)) {
    throw new AppError('Invalid date', 400);
  }

  // Validate payment method
  if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod.toLowerCase())) {
    throw new AppError(`Invalid payment method. Must be one of: ${VALID_PAYMENT_METHODS.join(', ')}`, 400);
  }

  // Validate receipt type
  if (!receiptType || !VALID_RECEIPT_TYPES.includes(receiptType.toLowerCase())) {
    throw new AppError(`Invalid receipt type. Must be one of: ${VALID_RECEIPT_TYPES.join(', ')}`, 400);
  }

  // Validate reference number if provided
  if (referenceNumber && typeof referenceNumber !== 'string') {
    throw new AppError('Invalid reference number', 400);
  }

  // Generate receipt number if not provided
  const receiptNumber = data.receiptNumber || await generateReceiptNumber(receiptType);

  return {
    orderId,
    amount,
    date: new Date(date),
    description: description ? sanitizeInput(description) : undefined,
    paymentMethod: paymentMethod.toLowerCase(),
    receiptType: receiptType.toLowerCase(),
    referenceNumber: referenceNumber ? sanitizeInput(referenceNumber) : undefined,
    receiptNumber
  };
};

// Helper function to generate receipt number
const generateReceiptNumber = async (receiptType) => {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const prefix = receiptType.charAt(0).toUpperCase();
  
  // Get count of receipts for this month
  const count = await Receipt.countDocuments({
    date: {
      $gte: getStartOfMonth(today),
      $lte: getEndOfMonth(today)
    }
  });

  const sequence = (count + 1).toString().padStart(4, '0');
  return `${prefix}${year}${month}${sequence}`;
};

// Create a new receipt
export const createReceipt = catchAsync(async (req, res) => {
  const validatedData = await validateReceiptInput(req.body);

  const receipt = await Receipt.create({
    ...validatedData,
    created_by: req.user._id,
    created_at: new Date()
  });

  const populatedReceipt = await Receipt.findById(receipt._id)
    .populate('orderId', 'orderNumber totalAmount items')
    .populate('created_by', 'name')
    .select('-__v');

  res.status(201).json({
    success: true,
    data: populatedReceipt
  });
});

// Get all receipts with filtering and pagination
export const getReceipts = catchAsync(async (req, res) => {
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

  // Receipt type filter
  if (req.query.receiptType) {
    filter.receiptType = req.query.receiptType.toLowerCase();
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

  // Receipt number search
  if (req.query.receiptNumber) {
    filter.receiptNumber = new RegExp(req.query.receiptNumber, 'i');
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

  const receipts = await Receipt.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('orderId', 'orderNumber totalAmount items')
    .populate('created_by', 'name')
    .populate('updated_by', 'name')
    .select('-__v');

  // Calculate summary statistics
  const summary = {
    totalAmount: await Receipt.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]).then(result => result[0]?.total || 0),
    byPaymentMethod: await Receipt.aggregate([
      { $match: filter },
      { $group: { _id: "$paymentMethod", total: { $sum: "$amount" } } },
      { $project: { method: "$_id", total: 1, _id: 0 } }
    ]),
    byReceiptType: await Receipt.aggregate([
      { $match: filter },
      { $group: { _id: "$receiptType", total: { $sum: "$amount" } } },
      { $project: { type: "$_id", total: 1, _id: 0 } }
    ])
  };

  const total = await Receipt.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      receipts,
      summary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get a receipt by ID
export const getReceiptById = catchAsync(async (req, res) => {
  const receipt = await Receipt.findById(req.params.id)
    .populate('orderId', 'orderNumber totalAmount items customer')
    .populate('created_by', 'name')
    .populate('updated_by', 'name')
    .select('-__v');

  if (!receipt) {
    throw new AppError('Receipt not found', 404);
  }

  res.status(200).json({
    success: true,
    data: receipt
  });
});

// Update a receipt
export const updateReceipt = catchAsync(async (req, res) => {
  const receipt = await Receipt.findById(req.params.id);
  
  if (!receipt) {
    throw new AppError('Receipt not found', 404);
  }

  // Prevent updates to receipts older than 24 hours
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  
  if (receipt.date < twentyFourHoursAgo) {
    throw new AppError('Cannot modify receipts older than 24 hours', 400);
  }

  const validatedData = await validateReceiptInput({
    ...receipt.toObject(),
    ...req.body
  });

  const updatedReceipt = await Receipt.findByIdAndUpdate(
    req.params.id,
    {
      ...validatedData,
      updated_by: req.user._id,
      updated_at: new Date()
    },
    { new: true }
  )
  .populate('orderId', 'orderNumber totalAmount items')
  .populate('created_by', 'name')
  .populate('updated_by', 'name')
  .select('-__v');

  res.status(200).json({
    success: true,
    data: updatedReceipt
  });
});

// Delete a receipt
export const deleteReceipt = catchAsync(async (req, res) => {
  const receipt = await Receipt.findById(req.params.id);
  
  if (!receipt) {
    throw new AppError('Receipt not found', 404);
  }

  // Prevent deletion of receipts older than 24 hours
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  
  if (receipt.date < twentyFourHoursAgo) {
    throw new AppError('Cannot delete receipts older than 24 hours', 400);
  }

  await receipt.remove();

  res.status(200).json({
    success: true,
    message: 'Receipt deleted successfully'
  });
});
