import MealTracker from "../models/mealTrackerModel.js";
import Recipe from "../models/recipeModel.js";
import { AppError } from '../utils/errorHandler.js';
import { catchAsync } from '../utils/errorHandler.js';
import { sanitizeInput } from '../utils/validation.js';
import { getStartOfDay, getEndOfDay, getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth, isValidDate } from '../utils/dateUtils.js';

const VALID_MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const VALID_MEAL_STATUS = ['planned', 'prepared', 'served', 'completed'];
const VALID_DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const validateMealInput = async (meal) => {
  const { type, status, recipeId, servingSize, notes, nutritionalInfo } = meal;

  // Validate meal type
  if (!type || !VALID_MEAL_TYPES.includes(type.toLowerCase())) {
    throw new AppError(`Invalid meal type. Must be one of: ${VALID_MEAL_TYPES.join(', ')}`, 400);
  }

  // Validate meal status
  if (status && !VALID_MEAL_STATUS.includes(status.toLowerCase())) {
    throw new AppError(`Invalid meal status. Must be one of: ${VALID_MEAL_STATUS.join(', ')}`, 400);
  }

  // Validate recipe if provided
  if (recipeId) {
    const recipe = await Recipe.findById(recipeId);
    if (!recipe) {
      throw new AppError('Recipe not found', 404);
    }
  }

  // Validate serving size
  if (servingSize && (typeof servingSize !== 'number' || servingSize <= 0)) {
    throw new AppError('Serving size must be a positive number', 400);
  }

  // Sanitize text fields
  const sanitizedMeal = {
    type: type.toLowerCase(),
    status: status ? status.toLowerCase() : 'planned',
    recipeId,
    servingSize,
    notes: notes ? sanitizeInput(notes) : undefined,
    nutritionalInfo: nutritionalInfo ? {
      calories: nutritionalInfo.calories,
      protein: nutritionalInfo.protein,
      carbs: nutritionalInfo.carbs,
      fat: nutritionalInfo.fat
    } : undefined,
    image: meal.image ? Buffer.from(meal.image, 'base64') : undefined
  };

  return sanitizedMeal;
};

const validateMealTrackerInput = async (data) => {
  const { dayOfWeek, date, meals } = data;

  // Validate day of week
  if (!dayOfWeek || !VALID_DAYS.includes(dayOfWeek.toLowerCase())) {
    throw new AppError(`Invalid day of week. Must be one of: ${VALID_DAYS.join(', ')}`, 400);
  }

  // Validate date
  if (!date || !isValidDate(date)) {
    throw new AppError('Invalid date', 400);
  }

  // Validate meals array
  if (!Array.isArray(meals) || meals.length === 0) {
    throw new AppError('Meals must be a non-empty array', 400);
  }

  // Validate each meal
  const validatedMeals = await Promise.all(meals.map(validateMealInput));

  return {
    dayOfWeek: dayOfWeek.toLowerCase(),
    date: new Date(date),
    meals: validatedMeals
  };
};

// Create a new meal tracker entry
export const createMealTracker = catchAsync(async (req, res) => {
  const validatedData = await validateMealTrackerInput(req.body);

  const mealTracker = await MealTracker.create({
    ...validatedData,
    created_by: req.user._id,
    created_at: new Date()
  });

  const populatedMealTracker = await MealTracker.findById(mealTracker._id)
    .populate('meals.recipeId', 'name ingredients instructions nutritionalInfo')
    .populate('created_by', 'name')
    .select('-__v');

  res.status(201).json({
    success: true,
    data: populatedMealTracker
  });
});

// Get all meal tracker entries with filtering and analytics
export const getMealTrackers = catchAsync(async (req, res) => {
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
  } else if (req.query.week) {
    const startDate = getStartOfWeek(new Date(req.query.week));
    const endDate = getEndOfWeek(startDate);
    filter.date = { $gte: startDate, $lte: endDate };
  } else if (req.query.month && req.query.year) {
    const startDate = getStartOfMonth(new Date(req.query.year, req.query.month - 1));
    const endDate = getEndOfMonth(startDate);
    filter.date = { $gte: startDate, $lte: endDate };
  }

  // Day of week filter
  if (req.query.dayOfWeek) {
    filter.dayOfWeek = req.query.dayOfWeek.toLowerCase();
  }

  // Meal type filter
  if (req.query.mealType) {
    filter['meals.type'] = req.query.mealType.toLowerCase();
  }

  // Status filter
  if (req.query.status) {
    filter['meals.status'] = req.query.status.toLowerCase();
  }

  // Recipe filter
  if (req.query.recipeId) {
    filter['meals.recipeId'] = req.query.recipeId;
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

  const mealTrackers = await MealTracker.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('meals.recipeId', 'name ingredients instructions nutritionalInfo')
    .populate('created_by', 'name')
    .populate('updated_by', 'name')
    .select('-__v');

  // Calculate analytics
  const analytics = {
    totalMeals: await MealTracker.aggregate([
      { $match: filter },
      { $unwind: '$meals' },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]).then(result => result[0]?.count || 0),

    mealTypeBreakdown: await MealTracker.aggregate([
      { $match: filter },
      { $unwind: '$meals' },
      { $group: { _id: '$meals.type', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]),

    statusBreakdown: await MealTracker.aggregate([
      { $match: filter },
      { $unwind: '$meals' },
      { $group: { _id: '$meals.status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]),

    recipeUsage: await MealTracker.aggregate([
      { $match: filter },
      { $unwind: '$meals' },
      { $match: { 'meals.recipeId': { $exists: true } } },
      { $group: { _id: '$meals.recipeId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'recipes',
          localField: '_id',
          foreignField: '_id',
          as: 'recipe'
        }
      },
      {
        $project: {
          recipeName: { $arrayElemAt: ['$recipe.name', 0] },
          count: 1,
          _id: 0
        }
      }
    ]),

    nutritionalAverages: await MealTracker.aggregate([
      { $match: filter },
      { $unwind: '$meals' },
      {
        $group: {
          _id: null,
          avgCalories: { $avg: '$meals.nutritionalInfo.calories' },
          avgProtein: { $avg: '$meals.nutritionalInfo.protein' },
          avgCarbs: { $avg: '$meals.nutritionalInfo.carbs' },
          avgFat: { $avg: '$meals.nutritionalInfo.fat' }
        }
      },
      {
        $project: {
          _id: 0,
          calories: { $round: ['$avgCalories', 2] },
          protein: { $round: ['$avgProtein', 2] },
          carbs: { $round: ['$avgCarbs', 2] },
          fat: { $round: ['$avgFat', 2] }
        }
      }
    ]).then(result => result[0] || null)
  };

  const total = await MealTracker.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      mealTrackers,
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

// Get a meal tracker entry by ID
export const getMealTrackerById = catchAsync(async (req, res) => {
  const mealTracker = await MealTracker.findById(req.params.id)
    .populate('meals.recipeId', 'name ingredients instructions nutritionalInfo')
    .populate('created_by', 'name')
    .populate('updated_by', 'name')
    .select('-__v');

  if (!mealTracker) {
    throw new AppError('Meal tracker entry not found', 404);
  }

  // Convert binary image data to Base64 for response
  mealTracker.meals.forEach(meal => {
    if (meal.image) {
      meal.image = meal.image.toString('base64');
    }
  });

  res.status(200).json({
    success: true,
    data: mealTracker
  });
});

// Update a meal tracker entry
export const updateMealTracker = catchAsync(async (req, res) => {
  const mealTracker = await MealTracker.findById(req.params.id);
  
  if (!mealTracker) {
    throw new AppError('Meal tracker entry not found', 404);
  }

  // Prevent updates to entries older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  if (mealTracker.date < sevenDaysAgo) {
    throw new AppError('Cannot modify meal tracker entries older than 7 days', 400);
  }

  const validatedData = await validateMealTrackerInput({
    ...mealTracker.toObject(),
    ...req.body
  });

  const updatedMealTracker = await MealTracker.findByIdAndUpdate(
    req.params.id,
    {
      ...validatedData,
      updated_by: req.user._id,
      updated_at: new Date()
    },
    { new: true }
  )
  .populate('meals.recipeId', 'name ingredients instructions nutritionalInfo')
  .populate('created_by', 'name')
  .populate('updated_by', 'name')
  .select('-__v');

  res.status(200).json({
    success: true,
    data: updatedMealTracker
  });
});

// Delete a meal tracker entry
export const deleteMealTracker = catchAsync(async (req, res) => {
  const mealTracker = await MealTracker.findById(req.params.id);
  
  if (!mealTracker) {
    throw new AppError('Meal tracker entry not found', 404);
  }

  // Prevent deletion of entries older than 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  if (mealTracker.date < sevenDaysAgo) {
    throw new AppError('Cannot delete meal tracker entries older than 7 days', 400);
  }

  await mealTracker.remove();

  res.status(200).json({
    success: true,
    message: 'Meal tracker entry deleted successfully'
  });
});
