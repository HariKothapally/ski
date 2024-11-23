import Purchase from "../models/purchaseModel.js";
import Supplier from "../models/supplierModel.js";
import Ingredient from "../models/ingredientsModel.js";
import { AppError } from '../utils/errorHandler.js';
import { catchAsync } from '../utils/errorHandler.js';
import { validateQuantity, validatePrice, sanitizeInput } from '../utils/validation.js';
import { getStartOfDay, getEndOfDay } from '../utils/dateUtils.js';

const validatePurchaseInput = (data) => {
  const { supplierId, purchaseDate, items, totalAmount, status } = data;

  if (!supplierId) {
    throw new AppError('Supplier ID is required', 400);
  }

  if (!purchaseDate || !Date.parse(purchaseDate)) {
    throw new AppError('Valid purchase date is required', 400);
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('Purchase must contain at least one item', 400);
  }

  items.forEach((item, index) => {
    if (!item.ingredientId) {
      throw new AppError(`Ingredient ID is required for item at index ${index}`, 400);
    }
    if (!validateQuantity(item.quantity)) {
      throw new AppError(`Invalid quantity for item at index ${index}`, 400);
    }
    if (!validatePrice(item.unitPrice)) {
      throw new AppError(`Invalid unit price for item at index ${index}`, 400);
    }
  });

  if (!validatePrice(totalAmount)) {
    throw new AppError('Invalid total amount', 400);
  }

  const validStatuses = ['pending', 'confirmed', 'received', 'cancelled'];
  if (status && !validStatuses.includes(status)) {
    throw new AppError('Invalid purchase status', 400);
  }

  return {
    supplierId,
    purchaseDate: new Date(purchaseDate),
    items,
    totalAmount,
    status: status || 'pending'
  };
};

// Create a new purchase
export const createPurchase = catchAsync(async (req, res) => {
  const validatedData = validatePurchaseInput(req.body);
  
  // Verify supplier exists
  const supplier = await Supplier.findById(validatedData.supplierId);
  if (!supplier) {
    throw new AppError('Supplier not found', 404);
  }

  // Verify all ingredients exist and belong to the supplier
  await Promise.all(validatedData.items.map(async (item, index) => {
    const ingredient = await Ingredient.findById(item.ingredientId);
    if (!ingredient) {
      throw new AppError(`Ingredient not found for item at index ${index}`, 404);
    }
    if (ingredient.supplier.toString() !== validatedData.supplierId) {
      throw new AppError(`Ingredient at index ${index} does not belong to the specified supplier`, 400);
    }
  }));

  // Calculate and verify total amount
  const calculatedTotal = validatedData.items.reduce((sum, item) => {
    return sum + (item.quantity * item.unitPrice);
  }, 0);

  if (Math.abs(calculatedTotal - validatedData.totalAmount) > 0.01) {
    throw new AppError('Total amount does not match item prices and quantities', 400);
  }

  const purchase = await Purchase.create({
    ...validatedData,
    created_by: req.user._id,
    created_at: new Date()
  });

  const populatedPurchase = await Purchase.findById(purchase._id)
    .populate('supplierId', 'name contactPerson phone')
    .populate('items.ingredientId', 'name unit')
    .populate('created_by', 'name');

  res.status(201).json({
    success: true,
    data: populatedPurchase
  });
});

// Get all purchases with filtering and pagination
export const getPurchases = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = {};
  
  // Date range filter
  if (req.query.startDate && req.query.endDate) {
    filter.purchaseDate = {
      $gte: getStartOfDay(new Date(req.query.startDate)),
      $lte: getEndOfDay(new Date(req.query.endDate))
    };
  }

  // Supplier filter
  if (req.query.supplier) {
    filter.supplierId = req.query.supplier;
  }

  // Status filter
  if (req.query.status) {
    filter.status = req.query.status;
  }

  // Amount range filter
  if (req.query.minAmount || req.query.maxAmount) {
    filter.totalAmount = {};
    if (req.query.minAmount) filter.totalAmount.$gte = parseFloat(req.query.minAmount);
    if (req.query.maxAmount) filter.totalAmount.$lte = parseFloat(req.query.maxAmount);
  }

  // Build sort object
  let sort = { purchaseDate: -1 }; // default sort by purchase date desc
  if (req.query.sort) {
    sort = {};
    const sortFields = req.query.sort.split(',');
    sortFields.forEach(field => {
      const [key, order] = field.split(':');
      sort[key] = order === 'desc' ? -1 : 1;
    });
  }

  const purchases = await Purchase.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('supplierId', 'name contactPerson phone')
    .populate('items.ingredientId', 'name unit')
    .populate('created_by', 'name')
    .select('-__v');

  const total = await Purchase.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      purchases,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get a purchase by ID
export const getPurchaseById = catchAsync(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id)
    .populate('supplierId', 'name contactPerson phone email address')
    .populate('items.ingredientId', 'name unit currentQuantity')
    .populate('created_by', 'name')
    .populate('updated_by', 'name')
    .select('-__v');

  if (!purchase) {
    throw new AppError('Purchase not found', 404);
  }

  res.status(200).json({
    success: true,
    data: purchase
  });
});

// Update a purchase
export const updatePurchase = catchAsync(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id);
  
  if (!purchase) {
    throw new AppError('Purchase not found', 404);
  }

  // Prevent updates to completed or cancelled purchases
  if (purchase.status === 'received' || purchase.status === 'cancelled') {
    throw new AppError(`Cannot modify a ${purchase.status} purchase`, 400);
  }

  const validatedData = validatePurchaseInput({
    ...purchase.toObject(),
    ...req.body
  });

  // If status is being updated to 'received', update ingredient quantities
  if (req.body.status === 'received' && purchase.status !== 'received') {
    await Promise.all(purchase.items.map(async (item) => {
      const ingredient = await Ingredient.findById(item.ingredientId);
      if (!ingredient) {
        throw new AppError(`Ingredient not found: ${item.ingredientId}`, 404);
      }
      
      ingredient.currentQuantity += item.quantity;
      await ingredient.save();
    }));
  }

  const updatedPurchase = await Purchase.findByIdAndUpdate(
    req.params.id,
    {
      ...validatedData,
      updated_by: req.user._id,
      updated_at: new Date()
    },
    { new: true }
  )
  .populate('supplierId', 'name contactPerson phone')
  .populate('items.ingredientId', 'name unit')
  .populate('created_by', 'name')
  .populate('updated_by', 'name');

  res.status(200).json({
    success: true,
    data: updatedPurchase
  });
});

// Delete a purchase
export const deletePurchase = catchAsync(async (req, res) => {
  const purchase = await Purchase.findById(req.params.id);
  
  if (!purchase) {
    throw new AppError('Purchase not found', 404);
  }

  // Only allow deletion of pending or cancelled purchases
  if (purchase.status !== 'pending' && purchase.status !== 'cancelled') {
    throw new AppError(`Cannot delete a ${purchase.status} purchase`, 400);
  }

  await purchase.remove();

  res.status(200).json({
    success: true,
    message: 'Purchase deleted successfully'
  });
});
