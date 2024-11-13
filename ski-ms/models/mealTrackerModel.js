import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "snacks", "dinner"],
    required: true,
  },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: "Recipe" },
  delivered: { type: Boolean, default: false },
  image: {
    type: Buffer,
    contentType: String,
    description: "Binary data of the meal image",
  }, // Storing image data as binary
});

const mealTrackerSchema = new mongoose.Schema({
  dayOfWeek: {
    type: String,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    required: true,
  },
  date: { type: Date, required: true },
  meals: [mealSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const MealTracker = mongoose.model("MealTracker", mealTrackerSchema);

export default MealTracker;
