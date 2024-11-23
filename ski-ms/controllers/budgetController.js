import Budget from "../models/budgetModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import { filterObj } from "../utils/filterObj.js";

// Create a new budget
export const createBudget = catchAsync(async (req, res, next) => {
  // Filter allowed fields
  const filteredBody = filterObj(
    req.body,
    'name',
    'period',
    'type',
    'items',
    'department',
    'fiscalYear',
    'description',
    'alerts'
  );

  // Add creator info
  filteredBody.created_by = req.user._id;

  const newBudget = await Budget.create(filteredBody);

  res.status(201).json({
    status: 'success',
    data: {
      budget: newBudget
    }
  });
});

// Get all budgets with filtering, sorting, and pagination
export const getBudgets = catchAsync(async (req, res, next) => {
  // Build query
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);

  // Advanced filtering
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  
  let query = Budget.find(JSON.parse(queryStr));

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-created_at');
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  // Execute query
  const budgets = await query
    .populate('created_by', 'name email')
    .populate('updated_by', 'name email')
    .populate('alerts.recipients', 'name email')
    .populate('approvals.approver', 'name email');

  // Get total count for pagination
  const total = await Budget.countDocuments(JSON.parse(queryStr));

  res.status(200).json({
    status: 'success',
    results: budgets.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: {
      budgets
    }
  });
});

// Get a single budget
export const getBudgetById = catchAsync(async (req, res, next) => {
  const budget = await Budget.findById(req.params.id)
    .populate('created_by', 'name email')
    .populate('updated_by', 'name email')
    .populate('alerts.recipients', 'name email')
    .populate('approvals.approver', 'name email');

  if (!budget) {
    return next(new AppError('Budget not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      budget
    }
  });
});

// Update a budget
export const updateBudget = catchAsync(async (req, res, next) => {
  // Filter allowed fields
  const filteredBody = filterObj(
    req.body,
    'name',
    'period',
    'type',
    'items',
    'department',
    'fiscalYear',
    'description',
    'alerts',
    'status'
  );

  // Add updater info
  filteredBody.updated_by = req.user._id;
  filteredBody.updated_at = Date.now();

  const budget = await Budget.findById(req.params.id);
  if (!budget) {
    return next(new AppError('Budget not found', 404));
  }

  // Prevent updates to completed or archived budgets
  if (['completed', 'archived'].includes(budget.status)) {
    return next(new AppError('Cannot update completed or archived budgets', 400));
  }

  const updatedBudget = await Budget.findByIdAndUpdate(
    req.params.id,
    filteredBody,
    {
      new: true,
      runValidators: true
    }
  ).populate('created_by updated_by alerts.recipients approvals.approver');

  res.status(200).json({
    status: 'success',
    data: {
      budget: updatedBudget
    }
  });
});

// Delete a budget
export const deleteBudget = catchAsync(async (req, res, next) => {
  const budget = await Budget.findById(req.params.id);
  
  if (!budget) {
    return next(new AppError('Budget not found', 404));
  }

  // Only allow deletion of draft budgets
  if (budget.status !== 'draft') {
    return next(new AppError('Only draft budgets can be deleted', 400));
  }

  await Budget.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Archive a budget
export const archiveBudget = catchAsync(async (req, res, next) => {
  const budget = await Budget.findById(req.params.id);
  
  if (!budget) {
    return next(new AppError('Budget not found', 404));
  }

  // Only completed budgets can be archived
  if (budget.status !== 'completed') {
    return next(new AppError('Only completed budgets can be archived', 400));
  }

  budget.status = 'archived';
  budget.updated_by = req.user._id;
  budget.updated_at = Date.now();
  
  await budget.save();

  res.status(200).json({
    status: 'success',
    data: {
      budget
    }
  });
});

// Get budget analytics
export const getBudgetAnalytics = catchAsync(async (req, res, next) => {
  const analytics = await Budget.generateAnalytics(req.query);

  res.status(200).json({
    status: 'success',
    data: {
      analytics: analytics[0] || {
        totalBudgets: 0,
        totalAllocated: 0,
        totalSpent: 0,
        averageSpentPercentage: 0,
        totalRemaining: 0
      }
    }
  });
});

// Add approval to budget
export const addBudgetApproval = catchAsync(async (req, res, next) => {
  const { status, comments } = req.body;
  
  const budget = await Budget.findById(req.params.id);
  if (!budget) {
    return next(new AppError('Budget not found', 404));
  }

  // Add approval
  budget.approvals.push({
    approver: req.user._id,
    status,
    date: Date.now(),
    comments
  });

  // Update budget status if all approvals are complete
  const allApproved = budget.approvals.every(approval => approval.status === 'approved');
  if (allApproved) {
    budget.status = 'active';
  }

  await budget.save();

  res.status(200).json({
    status: 'success',
    data: {
      budget
    }
  });
});

// Update budget item
export const updateBudgetItem = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;
  const { spentAmount } = req.body;

  const budget = await Budget.findById(req.params.id);
  if (!budget) {
    return next(new AppError('Budget not found', 404));
  }

  // Find and update the specific item
  const item = budget.items.id(itemId);
  if (!item) {
    return next(new AppError('Budget item not found', 404));
  }

  // Update spent amount
  item.spentAmount = spentAmount;
  
  // Recalculate totals (this will trigger the pre-save middleware)
  await budget.save();

  res.status(200).json({
    status: 'success',
    data: {
      budget
    }
  });
});
