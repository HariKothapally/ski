import MealTracker from "../models/mealTrackerModel.js";

// Create a new meal tracker entry
export const createMealTracker = async (req, res) => {
  const { dayOfWeek, date, meals } = req.body;
  try {
    const newMeals = meals.map((meal) => ({
      ...meal,
      image: meal.image ? Buffer.from(meal.image, "base64") : null, // Convert Base64 to binary
    }));
    const newMealTracker = new MealTracker({
      dayOfWeek,
      date,
      meals: newMeals,
    });
    const savedMealTracker = await newMealTracker.save();
    res.status(201).json(savedMealTracker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all meal tracker entries
export const getMealTrackers = async (req, res) => {
  try {
    const mealTrackers = await MealTracker.find()
      .populate("meals.recipeId")
      .exec();
    res.status(200).json(mealTrackers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a meal tracker entry by ID
export const getMealTrackerById = async (req, res) => {
  try {
    const mealTracker = await MealTracker.findById(req.params.id)
      .populate("meals.recipeId")
      .exec();
    if (!mealTracker)
      return res.status(404).json({ message: "Meal tracker entry not found" });
    // Convert binary image data to Base64 for response
    mealTracker.meals.forEach((meal) => {
      if (meal.image) {
        meal.image = meal.image.toString("base64");
      }
    });
    res.status(200).json(mealTracker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a meal tracker entry
export const updateMealTracker = async (req, res) => {
  try {
    const updatedMeals = req.body.meals.map((meal) => ({
      ...meal,
      image: meal.image ? Buffer.from(meal.image, "base64") : null, // Convert Base64 to binary
    }));
    const updatedMealTracker = await MealTracker.findByIdAndUpdate(
      req.params.id,
      { ...req.body, meals: updatedMeals, updated_at: Date.now() },
      { new: true },
    )
      .populate("meals.recipeId")
      .exec();
    if (!updatedMealTracker)
      return res.status(404).json({ message: "Meal tracker entry not found" });
    res.status(200).json(updatedMealTracker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a meal tracker entry
export const deleteMealTracker = async (req, res) => {
  try {
    const deletedMealTracker = await MealTracker.findByIdAndDelete(
      req.params.id,
    );
    if (!deletedMealTracker)
      return res.status(404).json({ message: "Meal tracker entry not found" });
    res.status(200).json({ message: "Meal tracker entry deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
