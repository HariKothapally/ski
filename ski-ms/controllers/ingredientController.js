import Ingredient from "../models/ingredientsModel.js";
import { AppError } from '../utils/errorHandler.js';
import { catchAsync } from '../utils/errorHandler.js';
import { validateQuantity, validatePrice, sanitizeInput } from '../utils/validation.js';

const validateIngredientInput = (data) => {
  const { name, unit, costPerUnit, currentQuantity, reorderPoint } = data;
  
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new AppError('Ingredient name is required', 400);
  }
  
  if (!unit || typeof unit !== 'string' || unit.trim().length === 0) {
    throw new AppError('Unit of measurement is required', 400);
  }
  
  if (!validatePrice(costPerUnit)) {
    throw new AppError('Invalid cost per unit', 400);
  }
  
  if (!validateQuantity(currentQuantity)) {
    throw new AppError('Invalid current quantity', 400);
  }
  
  if (!validateQuantity(reorderPoint)) {
    throw new AppError('Invalid reorder point', 400);
  }
  
  return {
    name: sanitizeInput(name),
    unit: sanitizeInput(unit),
    costPerUnit,
    currentQuantity,
    reorderPoint
  };
};

// Create a new ingredient
export const createIngredient = catchAsync(async (req, res) => {
  const validatedData = validateIngredientInput(req.body);
  
  // Check if ingredient with same name already exists
  const existingIngredient = await Ingredient.findOne({ 
    name: { $regex: new RegExp(`^${validatedData.name}$`, 'i') }
  });
  
  if (existingIngredient) {
    throw new AppError('An ingredient with this name already exists', 400);
  }

  const newIngredient = await Ingredient.create({
    ...validatedData,
    supplier: req.body.supplier,
    created_by: req.user._id,
    created_at: new Date()
  });

  res.status(201).json({
    success: true,
    data: newIngredient
  });
});

// Get all ingredients
export const getIngredients = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Build filter object based on query parameters
  const filter = {};
  
  if (req.query.supplier) {
    filter.supplier = req.query.supplier;
  }
  
  if (req.query.lowStock === 'true') {
    filter.currentQuantity = { $lte: { $ref: 'reorderPoint' } };
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

  const ingredients = await Ingredient.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('supplier', 'name contactPerson phone');

  const total = await Ingredient.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      ingredients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get an ingredient by ID
export const getIngredientById = catchAsync(async (req, res) => {
  const ingredient = await Ingredient.findById(req.params.id)
    .populate('supplier', 'name contactPerson phone')
    .populate('created_by', 'name');

  if (!ingredient) {
    throw new AppError('Ingredient not found', 404);
  }

  res.status(200).json({
    success: true,
    data: ingredient
  });
});

// Update an ingredient
export const updateIngredient = catchAsync(async (req, res) => {
  const ingredient = await Ingredient.findById(req.params.id);
  
  if (!ingredient) {
    throw new AppError('Ingredient not found', 404);
  }

  // If name is being updated, check for duplicates
  if (req.body.name && req.body.name !== ingredient.name) {
    const existingIngredient = await Ingredient.findOne({ 
      name: { $regex: new RegExp(`^${req.body.name}$`, 'i') },
      _id: { $ne: req.params.id }
    });
    
    if (existingIngredient) {
      throw new AppError('An ingredient with this name already exists', 400);
    }
  }

  const validatedData = validateIngredientInput({
    ...ingredient.toObject(),
    ...req.body
  });

  const updatedIngredient = await Ingredient.findByIdAndUpdate(
    req.params.id,
    {
      ...validatedData,
      supplier: req.body.supplier,
      updated_by: req.user._id,
      updated_at: new Date()
    },
    { new: true }
  ).populate('supplier', 'name contactPerson phone');

  res.status(200).json({
    success: true,
    data: updatedIngredient
  });
});

// Delete an ingredient
export const deleteIngredient = catchAsync(async (req, res) => {
  const ingredient = await Ingredient.findById(req.params.id);
  
  if (!ingredient) {
    throw new AppError('Ingredient not found', 404);
  }

  // Check if the ingredient is being used in any recipes or orders
  const isInUse = await checkIngredientUsage(req.params.id);
  if (isInUse) {
    throw new AppError(
      'This ingredient cannot be deleted as it is being used in recipes or has movement history',
      400
    );
  }

  await ingredient.remove();

  res.status(200).json({
    success: true,
    message: 'Ingredient deleted successfully'
  });
});
