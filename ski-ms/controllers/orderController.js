import Order from "../models/orderModel.js";
import Recipe from "../models/recipeModel.js";
import { AppError } from '../utils/errorHandler.js';
import { catchAsync } from '../utils/errorHandler.js';
import { validateQuantity, validatePrice, sanitizeInput } from '../utils/validation.js';
import { getStartOfDay, getEndOfDay, formatDate } from '../utils/dateUtils.js';

const ORDER_STATUS = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

const validateOrderInput = (data) => {
  const { customerName, orderDate, deliveryDate, items, status } = data;
  
  if (!customerName || typeof customerName !== 'string' || customerName.trim().length === 0) {
    throw new AppError('Customer name is required', 400);
  }

  if (!orderDate || !Date.parse(orderDate)) {
    throw new AppError('Valid order date is required', 400);
  }

  if (!deliveryDate || !Date.parse(deliveryDate)) {
    throw new AppError('Valid delivery date is required', 400);
  }

  // Check if delivery date is after order date
  if (new Date(deliveryDate) <= new Date(orderDate)) {
    throw new AppError('Delivery date must be after order date', 400);
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('Order must contain at least one item', 400);
  }

  items.forEach((item, index) => {
    if (!item.recipeId) {
      throw new AppError(`Recipe ID is required for item at index ${index}`, 400);
    }
    if (!validateQuantity(item.quantity)) {
      throw new AppError(`Invalid quantity for item at index ${index}`, 400);
    }
  });

  if (status && !ORDER_STATUS.includes(status)) {
    throw new AppError('Invalid order status', 400);
  }

  return {
    customerName: sanitizeInput(customerName),
    orderDate: new Date(orderDate),
    deliveryDate: new Date(deliveryDate),
    items,
    status: status || 'pending'
  };
};

// Create a new order for recipe items
export const createOrder = catchAsync(async (req, res) => {
  const validatedData = validateOrderInput(req.body);
  
  // Get recipe details and calculate costs
  const estimates = await Promise.all(validatedData.items.map(async (item, index) => {
    const recipe = await Recipe.findById(item.recipeId)
      .populate('ingredients.ingredientId', 'name unitCost currentQuantity');
    
    if (!recipe) {
      throw new AppError(`Recipe not found for item at index ${index}`, 404);
    }
    
    // Check ingredient availability
    recipe.ingredients.forEach(ing => {
      const required = ing.quantity * item.quantity;
      if (required > ing.ingredientId.currentQuantity) {
        throw new AppError(
          `Insufficient stock for ingredient ${ing.ingredientId.name} in recipe ${recipe.name}`,
          400
        );
      }
    });
    
    // Calculate recipe cost based on ingredients
    const recipeCost = recipe.ingredients.reduce((sum, ing) => {
      return sum + (ing.ingredientId.unitCost || 0) * (ing.quantity || 0);
    }, 0);

    return {
      recipeId: item.recipeId,
      name: recipe.name,
      quantity: item.quantity,
      unitCost: recipeCost,
      totalCost: recipeCost * item.quantity,
      ingredients: recipe.ingredients.map(ing => ({
        ingredientId: ing.ingredientId._id,
        name: ing.ingredientId.name,
        required: ing.quantity * item.quantity,
        available: ing.ingredientId.currentQuantity
      }))
    };
  }));

  const totalCost = estimates.reduce((sum, item) => sum + item.totalCost, 0);

  const newOrder = await Order.create({
    ...validatedData,
    estimates,
    totalCost,
    created_by: req.user._id,
    created_at: new Date()
  });

  res.status(201).json({
    success: true,
    data: newOrder
  });
});

// Get all orders with current estimates
export const getOrders = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = {};
  
  // Date range filter
  if (req.query.startDate && req.query.endDate) {
    filter.orderDate = {
      $gte: getStartOfDay(new Date(req.query.startDate)),
      $lte: getEndOfDay(new Date(req.query.endDate))
    };
  }

  // Status filter
  if (req.query.status && ORDER_STATUS.includes(req.query.status)) {
    filter.status = req.query.status;
  }

  // Customer name search
  if (req.query.customer) {
    filter.customerName = new RegExp(req.query.customer, 'i');
  }

  // Build sort object
  let sort = { orderDate: -1 }; // default sort by order date desc
  if (req.query.sort) {
    sort = {};
    const sortFields = req.query.sort.split(',');
    sortFields.forEach(field => {
      const [key, order] = field.split(':');
      sort[key] = order === 'desc' ? -1 : 1;
    });
  }

  const orders = await Order.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('created_by', 'name')
    .select('-__v');

  const total = await Order.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      orders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get a single order
export const getOrderById = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('created_by', 'name')
    .populate('updated_by', 'name')
    .select('-__v');

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Get current recipe and ingredient details
  const currentEstimates = await Promise.all(order.items.map(async item => {
    const recipe = await Recipe.findById(item.recipeId)
      .populate('ingredients.ingredientId', 'name unitCost currentQuantity');
    
    if (!recipe) {
      return {
        ...item.toObject(),
        currentStatus: 'Recipe not found'
      };
    }

    const ingredients = recipe.ingredients.map(ing => ({
      name: ing.ingredientId.name,
      required: ing.quantity * item.quantity,
      available: ing.ingredientId.currentQuantity,
      status: ing.ingredientId.currentQuantity >= (ing.quantity * item.quantity) ? 'available' : 'insufficient'
    }));

    return {
      ...item.toObject(),
      recipe: recipe.name,
      currentStatus: ingredients.every(ing => ing.status === 'available') ? 'ready' : 'pending',
      ingredients
    };
  }));

  res.status(200).json({
    success: true,
    data: {
      ...order.toObject(),
      currentEstimates
    }
  });
});

// Update order
export const updateOrder = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Validate status transition
  if (req.body.status) {
    if (!ORDER_STATUS.includes(req.body.status)) {
      throw new AppError('Invalid order status', 400);
    }

    // Prevent certain status transitions
    if (order.status === 'completed' && req.body.status !== 'completed') {
      throw new AppError('Cannot modify a completed order', 400);
    }
    if (order.status === 'cancelled' && req.body.status !== 'cancelled') {
      throw new AppError('Cannot modify a cancelled order', 400);
    }
  }

  const validatedData = validateOrderInput({
    ...order.toObject(),
    ...req.body
  });

  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.id,
    {
      ...validatedData,
      updated_by: req.user._id,
      updated_at: new Date()
    },
    { new: true }
  ).populate('created_by', 'name');

  res.status(200).json({
    success: true,
    data: updatedOrder
  });
});

// Delete an order
export const deleteOrder = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.status !== 'pending' && order.status !== 'cancelled') {
    throw new AppError('Only pending or cancelled orders can be deleted', 400);
  }

  await order.remove();

  res.status(200).json({
    success: true,
    message: 'Order deleted successfully'
  });
});

// Modify order items
export const modifyOrderItems = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id);
  
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Get cost and stock estimates for modified items
  const estimates = await Promise.all(req.body.items.map(async item => {
    const recipe = await Recipe.findById(item.recipeId)
      .populate('ingredients.ingredientId', 'name unitCost currentQuantity');
    
    if (!recipe) {
      throw new AppError(`Recipe not found for item`, 404);
    }
    
    // Check ingredient availability
    recipe.ingredients.forEach(ing => {
      const required = ing.quantity * item.quantity;
      if (required > ing.ingredientId.currentQuantity) {
        throw new AppError(
          `Insufficient stock for ingredient ${ing.ingredientId.name} in recipe ${recipe.name}`,
          400
        );
      }
    });
    
    // Calculate recipe cost based on ingredients
    const recipeCost = recipe.ingredients.reduce((sum, ing) => {
      return sum + (ing.ingredientId.unitCost || 0) * (ing.quantity || 0);
    }, 0);

    return {
      recipeId: item.recipeId,
      name: recipe.name,
      quantity: item.quantity,
      unitCost: recipeCost,
      totalCost: recipeCost * item.quantity,
      ingredients: recipe.ingredients.map(ing => ({
        ingredientId: ing.ingredientId._id,
        name: ing.ingredientId.name,
        required: ing.quantity * item.quantity,
        available: ing.ingredientId.currentQuantity
      }))
    };
  }));

  const totalCost = estimates.reduce((sum, item) => sum + item.totalCost, 0);

  // Update order with new items and estimates
  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.id,
    { 
      items: req.body.items,
      totalCost,
      estimates
    },
    { new: true }
  ).populate({
    path: 'items.recipeId',
    populate: {
      path: 'ingredients.ingredientId',
      select: 'name unitCost'
    }
  });

  res.status(200).json({
    order: updatedOrder,
    estimates,
    totalCost
  });
});
