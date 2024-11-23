import Menu from "../models/menuModel.js";
import Recipe from "../models/recipeModel.js";
import { AppError } from '../utils/errorHandler.js';
import { catchAsync } from '../utils/errorHandler.js';
import { sanitizeInput } from '../utils/validation.js';
import { getStartOfDay, getEndOfDay, isValidDate } from '../utils/dateUtils.js';

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks'];
const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const validateMenuInput = async (data) => {
  const { dayOfWeek, meals, effectiveDate, expiryDate } = data;

  // Validate day of week
  if (!dayOfWeek || !DAYS_OF_WEEK.includes(dayOfWeek.toLowerCase())) {
    throw new AppError('Invalid day of week', 400);
  }

  // Validate dates if provided
  if (effectiveDate && !isValidDate(effectiveDate)) {
    throw new AppError('Invalid effective date', 400);
  }
  if (expiryDate && !isValidDate(expiryDate)) {
    throw new AppError('Invalid expiry date', 400);
  }
  if (effectiveDate && expiryDate && new Date(effectiveDate) >= new Date(expiryDate)) {
    throw new AppError('Effective date must be before expiry date', 400);
  }

  // Validate meals
  if (!Array.isArray(meals) || meals.length === 0) {
    throw new AppError('Menu must contain at least one meal', 400);
  }

  // Validate each meal
  for (const meal of meals) {
    if (!meal.type || !VALID_MEAL_TYPES.includes(meal.type.toLowerCase())) {
      throw new AppError(`Invalid meal type: ${meal.type}. Must be one of: ${VALID_MEAL_TYPES.join(', ')}`, 400);
    }

    if (!Array.isArray(meal.recipes) || meal.recipes.length === 0) {
      throw new AppError(`Meal ${meal.type} must contain at least one recipe`, 400);
    }

    // Validate recipes exist
    for (const recipeId of meal.recipes) {
      const recipe = await Recipe.findById(recipeId);
      if (!recipe) {
        throw new AppError(`Recipe not found: ${recipeId}`, 404);
      }
    }

    // Sanitize description if provided
    if (meal.description) {
      meal.description = sanitizeInput(meal.description);
    }
  }

  return {
    dayOfWeek: dayOfWeek.toLowerCase(),
    meals,
    effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
    expiryDate: expiryDate ? new Date(expiryDate) : undefined
  };
};

// Create a new menu
export const createMenu = catchAsync(async (req, res) => {
  const validatedData = await validateMenuInput(req.body);

  // Check for duplicate menu for the same day
  const existingMenu = await Menu.findOne({
    dayOfWeek: validatedData.dayOfWeek,
    $or: [
      { effectiveDate: { $exists: false } },
      {
        effectiveDate: { $lte: validatedData.effectiveDate || new Date() },
        expiryDate: { $gte: validatedData.effectiveDate || new Date() }
      }
    ]
  });

  if (existingMenu) {
    throw new AppError(`A menu for ${validatedData.dayOfWeek} already exists for this period`, 400);
  }

  const menu = await Menu.create({
    ...validatedData,
    currentVersion: 1,
    created_by: req.user._id,
    created_at: new Date()
  });

  const populatedMenu = await Menu.findById(menu._id)
    .populate('meals.recipes', 'name description preparationTime servingSize cost')
    .populate('created_by', 'name')
    .select('-__v');

  res.status(201).json({
    success: true,
    data: populatedMenu
  });
});

// Get all menus with filtering and pagination
export const getMenus = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 7; // Default to 7 for a week's menu
  const skip = (page - 1) * limit;

  // Build filter object
  let filter = {};
  
  // Day filter
  if (req.query.day) {
    filter.dayOfWeek = req.query.day.toLowerCase();
  }

  // Date range filter
  if (req.query.date) {
    const queryDate = new Date(req.query.date);
    filter.$or = [
      { 
        effectiveDate: { $lte: queryDate },
        expiryDate: { $gte: queryDate }
      },
      {
        effectiveDate: { $exists: false },
        expiryDate: { $exists: false }
      }
    ];
  }

  // Meal type filter
  if (req.query.mealType) {
    filter['meals.type'] = req.query.mealType.toLowerCase();
  }

  // Recipe filter
  if (req.query.recipe) {
    filter['meals.recipes'] = req.query.recipe;
  }

  const menus = await Menu.find(filter)
    .sort({ dayOfWeek: 1 })
    .skip(skip)
    .limit(limit)
    .populate('meals.recipes', 'name description preparationTime servingSize cost')
    .populate('created_by', 'name')
    .populate('updated_by', 'name')
    .select('-__v');

  const total = await Menu.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      menus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// Get a menu by ID
export const getMenuById = catchAsync(async (req, res) => {
  const menu = await Menu.findById(req.params.id)
    .populate('meals.recipes', 'name description preparationTime servingSize cost ingredients')
    .populate('created_by', 'name')
    .populate('updated_by', 'name')
    .select('-__v');

  if (!menu) {
    throw new AppError('Menu not found', 404);
  }

  res.status(200).json({
    success: true,
    data: menu
  });
});

// Update a menu with versioning
export const updateMenu = catchAsync(async (req, res) => {
  const menu = await Menu.findById(req.params.id);
  
  if (!menu) {
    throw new AppError('Menu not found', 404);
  }

  const validatedData = await validateMenuInput({
    ...menu.toObject(),
    ...req.body
  });

  // Check for overlapping menus
  if (validatedData.dayOfWeek !== menu.dayOfWeek) {
    const overlappingMenu = await Menu.findOne({
      _id: { $ne: menu._id },
      dayOfWeek: validatedData.dayOfWeek,
      $or: [
        { effectiveDate: { $exists: false } },
        {
          effectiveDate: { $lte: validatedData.effectiveDate || new Date() },
          expiryDate: { $gte: validatedData.effectiveDate || new Date() }
        }
      ]
    });

    if (overlappingMenu) {
      throw new AppError(`A menu for ${validatedData.dayOfWeek} already exists for this period`, 400);
    }
  }

  // Save current version to history
  menu.history.push({
    meals: menu.meals,
    dayOfWeek: menu.dayOfWeek,
    effectiveDate: menu.effectiveDate,
    expiryDate: menu.expiryDate,
    modified_at: new Date(),
    modified_by: req.user._id,
    version: menu.currentVersion
  });

  // Update menu
  menu.meals = validatedData.meals;
  menu.dayOfWeek = validatedData.dayOfWeek;
  menu.effectiveDate = validatedData.effectiveDate;
  menu.expiryDate = validatedData.expiryDate;
  menu.currentVersion += 1;
  menu.updated_by = req.user._id;
  menu.updated_at = new Date();

  await menu.save();

  const updatedMenu = await Menu.findById(menu._id)
    .populate('meals.recipes', 'name description preparationTime servingSize cost')
    .populate('created_by', 'name')
    .populate('updated_by', 'name')
    .select('-__v');

  res.status(200).json({
    success: true,
    data: updatedMenu
  });
});

// Delete a menu
export const deleteMenu = catchAsync(async (req, res) => {
  const menu = await Menu.findById(req.params.id);
  
  if (!menu) {
    throw new AppError('Menu not found', 404);
  }

  // Optional: Add business logic to prevent deletion of active menus
  if (menu.effectiveDate && menu.effectiveDate <= new Date() && (!menu.expiryDate || menu.expiryDate >= new Date())) {
    throw new AppError('Cannot delete an active menu', 400);
  }

  await menu.remove();

  res.status(200).json({
    success: true,
    message: 'Menu deleted successfully'
  });
});

// Get menu history
export const getMenuHistory = catchAsync(async (req, res) => {
  const menu = await Menu.findById(req.params.menuId)
    .populate('history.meals.recipes', 'name description')
    .populate('history.modified_by', 'name')
    .select('history');

  if (!menu) {
    throw new AppError('Menu not found', 404);
  }

  res.status(200).json({
    success: true,
    data: menu.history.sort((a, b) => b.version - a.version)
  });
});
