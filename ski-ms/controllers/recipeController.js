import Recipe from "../models/recipeModel.js";
import { AppError } from '../utils/errorHandler.js';
import { catchAsync } from '../utils/errorHandler.js';
import { validateQuantity, validatePrice, sanitizeInput } from '../utils/validation.js';
import Order from "../models/orderModel.js";

const validateRecipeInput = (data) => {
  const { name, description, ingredients, instructions, category, preparationTime } = data;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new AppError('Recipe name is required', 400);
  }

  if (!description || typeof description !== 'string') {
    throw new AppError('Recipe description is required', 400);
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    throw new AppError('Recipe must contain at least one ingredient', 400);
  }

  ingredients.forEach((ingredient, index) => {
    if (!ingredient.ingredientId) {
      throw new AppError(`Ingredient ID is required for ingredient at index ${index}`, 400);
    }
    if (!validateQuantity(ingredient.quantity)) {
      throw new AppError(`Invalid quantity for ingredient at index ${index}`, 400);
    }
  });

  if (!Array.isArray(instructions) || instructions.length === 0) {
    throw new AppError('Recipe must contain at least one instruction step', 400);
  }

  instructions.forEach((step, index) => {
    if (!step || typeof step !== 'string' || step.trim().length === 0) {
      throw new AppError(`Invalid instruction step at index ${index}`, 400);
    }
  });

  if (category && typeof category !== 'string') {
    throw new AppError('Category must be a string', 400);
  }

  if (preparationTime && !validateQuantity(preparationTime)) {
    throw new AppError('Preparation time must be a positive number', 400);
  }

  return {
    name: sanitizeInput(name),
    description: sanitizeInput(description),
    ingredients,
    instructions: instructions.map(step => sanitizeInput(step)),
    ...(category && { category: sanitizeInput(category) }),
    ...(preparationTime && { preparationTime })
  };
};

// Create a new recipe
export const createRecipe = catchAsync(async (req, res) => {
  const validatedData = validateRecipeInput(req.body);
  
  // Check for duplicate recipe name
  const existingRecipe = await Recipe.findOne({ name: validatedData.name });
  if (existingRecipe) {
    throw new AppError('Recipe with this name already exists', 400);
  }

  const recipe = await Recipe.create({
    ...validatedData,
    created_by: req.user._id,
    created_at: new Date()
  });

  res.status(201).json({
    success: true,
    data: recipe
  });
});

// Get all recipes with filtering and pagination
export const getRecipes = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = {};
  
  // Name search
  if (req.query.name) {
    filter.name = new RegExp(sanitizeInput(req.query.name), 'i');
  }

  // Category filter
  if (req.query.category) {
    filter.category = sanitizeInput(req.query.category);
  }

  // Ingredient filter
  if (req.query.ingredient) {
    filter['ingredients.ingredientId'] = req.query.ingredient;
  }

  // Preparation time range filter
  if (req.query.maxPrepTime) {
    filter.preparationTime = { $lte: parseInt(req.query.maxPrepTime) };
  }

  // Build sort object
  let sort = { name: 1 }; // default sort by name
  if (req.query.sort) {
    sort = {};
    const sortFields = req.query.sort.split(',');
    sortFields.forEach(field => {
      const [key, order] = field.split(':');
      sort[key] = order === 'desc' ? -1 : 1;
    });
  }

  const recipes = await Recipe.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('ingredients.ingredientId', 'name unitCost currentQuantity')
    .populate('created_by', 'name')
    .select('-__v');

  const total = await Recipe.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      recipes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get a recipe by ID
export const getRecipeById = catchAsync(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id)
    .populate('ingredients.ingredientId', 'name unitCost currentQuantity')
    .populate('created_by', 'name')
    .populate('updated_by', 'name')
    .select('-__v');

  if (!recipe) {
    throw new AppError('Recipe not found', 404);
  }

  // Get current ingredient availability status
  const ingredientStatus = recipe.ingredients.map(ing => ({
    name: ing.ingredientId.name,
    required: ing.quantity,
    available: ing.ingredientId.currentQuantity,
    status: ing.ingredientId.currentQuantity >= ing.quantity ? 'available' : 'insufficient'
  }));

  // Calculate total cost
  const totalCost = recipe.ingredients.reduce((sum, ing) => {
    return sum + (ing.ingredientId.unitCost || 0) * (ing.quantity || 0);
  }, 0);

  res.status(200).json({
    success: true,
    data: {
      ...recipe.toObject(),
      ingredientStatus,
      totalCost
    }
  });
});

// Update a recipe
export const updateRecipe = catchAsync(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  
  if (!recipe) {
    throw new AppError('Recipe not found', 404);
  }

  // Check if recipe is being used in any active orders
  const activeOrders = await Order.find({
    'items.recipeId': recipe._id,
    status: { $in: ['pending', 'confirmed', 'in_progress'] }
  });

  if (activeOrders.length > 0) {
    throw new AppError('Cannot modify recipe that is part of active orders', 400);
  }

  const validatedData = validateRecipeInput({
    ...recipe.toObject(),
    ...req.body
  });

  // Check for duplicate name if name is being changed
  if (req.body.name && req.body.name !== recipe.name) {
    const existingRecipe = await Recipe.findOne({ name: validatedData.name });
    if (existingRecipe) {
      throw new AppError('Recipe with this name already exists', 400);
    }
  }

  const updatedRecipe = await Recipe.findByIdAndUpdate(
    req.params.id,
    {
      ...validatedData,
      updated_by: req.user._id,
      updated_at: new Date()
    },
    { new: true }
  ).populate('ingredients.ingredientId', 'name unitCost currentQuantity');

  res.status(200).json({
    success: true,
    data: updatedRecipe
  });
});

// Delete a recipe
export const deleteRecipe = catchAsync(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  
  if (!recipe) {
    throw new AppError('Recipe not found', 404);
  }

  // Check if recipe is being used in any orders
  const usedInOrders = await Order.findOne({ 'items.recipeId': recipe._id });
  if (usedInOrders) {
    throw new AppError('Cannot delete recipe that is used in orders', 400);
  }

  await recipe.remove();

  res.status(200).json({
    success: true,
    message: 'Recipe deleted successfully'
  });
});
