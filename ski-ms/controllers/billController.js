import Bill from "../models/billModel.js";
import Order from "../models/orderModel.js";
import { AppError, catchAsync } from '../utils/errorHandler.js';
import { sanitizeInput } from '../utils/validation.js';

// Create a new bill
export const createBill = catchAsync(async (req, res) => {
  const {
    orderId,
    customerId,
    items,
    subtotal,
    tax,
    discount,
    totalAmount,
    dueDate,
    notes,
    termsAndConditions
  } = req.body;

  // Validate order exists
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Generate bill number
  const billNumber = await Bill.generateBillNumber();

  // Calculate amounts if not provided
  const calculatedSubtotal = items.reduce((sum, item) => sum + item.totalCost, 0);
  if (subtotal && subtotal !== calculatedSubtotal) {
    throw new AppError('Subtotal mismatch with items total', 400);
  }

  // Calculate total amount with tax and discount
  let calculatedTotal = calculatedSubtotal;
  
  // Apply tax
  if (tax) {
    calculatedTotal += tax;
  }

  // Apply discount
  if (discount) {
    const discountAmount = discount.type === 'percentage' 
      ? (calculatedTotal * discount.value / 100)
      : discount.value;
    calculatedTotal -= discountAmount;
  }

  if (totalAmount && Math.abs(totalAmount - calculatedTotal) > 0.01) {
    throw new AppError('Total amount mismatch with calculations', 400);
  }

  // Create new bill
  const newBill = await Bill.create({
    billNumber,
    orderId,
    customerId,
    items: items.map(item => ({
      ...item,
      name: sanitizeInput(item.name),
      unit: sanitizeInput(item.unit)
    })),
    subtotal: calculatedSubtotal,
    tax,
    discount,
    totalAmount: calculatedTotal,
    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
    notes: notes ? sanitizeInput(notes) : undefined,
    termsAndConditions: termsAndConditions ? sanitizeInput(termsAndConditions) : undefined,
    created_by: req.user._id
  });

  res.status(201).json({
    success: true,
    data: await newBill.populate([
      { path: 'orderId' },
      { path: 'customerId', select: 'name email phone' },
      { path: 'created_by', select: 'name' }
    ])
  });
});

// Get all bills with filtering and pagination
export const getBills = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = {};

  // Status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Date range filter
  if (req.query.startDate && req.query.endDate) {
    filter.billingDate = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate)
    };
  }

  // Customer filter
  if (req.query.customerId) {
    filter.customerId = req.query.customerId;
  }

  // Amount range filter
  if (req.query.minAmount || req.query.maxAmount) {
    filter.totalAmount = {};
    if (req.query.minAmount) filter.totalAmount.$gte = parseFloat(req.query.minAmount);
    if (req.query.maxAmount) filter.totalAmount.$lte = parseFloat(req.query.maxAmount);
  }

  // Search by bill number
  if (req.query.billNumber) {
    filter.billNumber = new RegExp(sanitizeInput(req.query.billNumber), 'i');
  }

  // Build sort object
  let sort = { created_at: -1 }; // default sort by creation date desc
  if (req.query.sort) {
    sort = {};
    const sortFields = req.query.sort.split(',');
    sortFields.forEach(field => {
      const [key, order] = field.split(':');
      sort[key] = order === 'desc' ? -1 : 1;
    });
  }

  const [bills, total] = await Promise.all([
    Bill.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate([
        { path: 'orderId', select: 'orderNumber' },
        { path: 'customerId', select: 'name email phone' },
        { path: 'created_by', select: 'name' }
      ]),
    Bill.countDocuments(filter)
  ]);

  // Calculate analytics
  const analytics = {
    totalBills: total,
    totalAmount: await Bill.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]).then(result => result[0]?.total || 0),
    byStatus: await Bill.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$totalAmount' } } },
      { $project: { status: '$_id', count: 1, amount: 1, _id: 0 } }
    ]),
    overdueBills: await Bill.countDocuments({
      ...filter,
      status: 'overdue'
    }),
    averageBillAmount: await Bill.aggregate([
      { $match: filter },
      { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
    ]).then(result => result[0]?.avg || 0)
  };

  res.status(200).json({
    success: true,
    data: {
      bills,
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

// Get bill by ID
export const getBillById = catchAsync(async (req, res) => {
  const bill = await Bill.findById(req.params.id)
    .populate([
      { path: 'orderId' },
      { path: 'customerId', select: 'name email phone' },
      { path: 'created_by', select: 'name' },
      { path: 'updated_by', select: 'name' }
    ]);

  if (!bill) {
    throw new AppError('Bill not found', 404);
  }

  res.status(200).json({
    success: true,
    data: bill
  });
});

// Update bill
export const updateBill = catchAsync(async (req, res) => {
  const bill = await Bill.findById(req.params.id);
  
  if (!bill) {
    throw new AppError('Bill not found', 404);
  }

  // Prevent updates to cancelled or refunded bills
  if (['cancelled', 'refunded'].includes(bill.status)) {
    throw new AppError(`Cannot update ${bill.status} bill`, 400);
  }

  // Validate and sanitize updates
  const updates = {
    ...req.body,
    updated_by: req.user._id,
    updated_at: new Date()
  };

  if (updates.notes) updates.notes = sanitizeInput(updates.notes);
  if (updates.termsAndConditions) updates.termsAndConditions = sanitizeInput(updates.termsAndConditions);

  // Handle payment updates
  if (updates.amountPaid !== undefined) {
    if (updates.amountPaid > bill.totalAmount) {
      throw new AppError('Amount paid cannot exceed total amount', 400);
    }
    updates.balance = bill.totalAmount - updates.amountPaid;

    // Update status based on payment
    if (updates.amountPaid === 0) updates.status = 'pending';
    else if (updates.amountPaid < bill.totalAmount) updates.status = 'partially_paid';
    else updates.status = 'paid';
  }

  const updatedBill = await Bill.findByIdAndUpdate(
    req.params.id,
    updates,
    { 
      new: true,
      runValidators: true 
    }
  ).populate([
    { path: 'orderId' },
    { path: 'customerId', select: 'name email phone' },
    { path: 'created_by', select: 'name' },
    { path: 'updated_by', select: 'name' }
  ]);

  res.status(200).json({
    success: true,
    data: updatedBill
  });
});

// Cancel bill
export const cancelBill = catchAsync(async (req, res) => {
  const bill = await Bill.findById(req.params.id);
  
  if (!bill) {
    throw new AppError('Bill not found', 404);
  }

  // Can only cancel pending or partially paid bills
  if (!['pending', 'partially_paid'].includes(bill.status)) {
    throw new AppError(`Cannot cancel bill with status: ${bill.status}`, 400);
  }

  bill.status = 'cancelled';
  bill.updated_by = req.user._id;
  bill.updated_at = new Date();
  bill.notes = req.body.notes 
    ? `${bill.notes ? bill.notes + '\n' : ''}Cancellation Note: ${sanitizeInput(req.body.notes)}`
    : bill.notes;

  await bill.save();

  res.status(200).json({
    success: true,
    data: bill
  });
});

// Refund bill
export const refundBill = catchAsync(async (req, res) => {
  const { amount, reason, refundMethod } = req.body;
  
  const bill = await Bill.findById(req.params.id);
  
  if (!bill) {
    throw new AppError('Bill not found', 404);
  }

  // Can only refund paid bills
  if (bill.status !== 'paid') {
    throw new AppError('Can only refund paid bills', 400);
  }

  // Validate refund amount
  if (!amount || amount <= 0 || amount > bill.amountPaid) {
    throw new AppError('Invalid refund amount', 400);
  }

  bill.status = 'refunded';
  bill.amountPaid -= amount;
  bill.balance = bill.totalAmount - bill.amountPaid;
  bill.updated_by = req.user._id;
  bill.updated_at = new Date();
  bill.paymentDetails = {
    ...bill.paymentDetails,
    refundAmount: amount,
    refundDate: new Date(),
    refundMethod,
    refundReason: sanitizeInput(reason)
  };
  bill.notes = reason 
    ? `${bill.notes ? bill.notes + '\n' : ''}Refund Note: ${sanitizeInput(reason)}`
    : bill.notes;

  await bill.save();

  res.status(200).json({
    success: true,
    data: bill
  });
});

// Delete bill (soft delete or restricted delete)
export const deleteBill = catchAsync(async (req, res) => {
  const bill = await Bill.findById(req.params.id);
  
  if (!bill) {
    throw new AppError('Bill not found', 404);
  }

  // Only allow deletion of draft bills
  if (bill.status !== 'draft') {
    throw new AppError('Only draft bills can be deleted', 400);
  }

  await bill.remove();

  res.status(200).json({
    success: true,
    message: 'Bill deleted successfully'
  });
});
