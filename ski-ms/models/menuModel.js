import mongoose from "mongoose";

const mealSchema = new mongoose.Schema({
  mealType: {
    type: String,
    enum: ["breakfast", "lunch", "snacks", "dinner"],
    required: true,
  },
  recipes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Recipe" }],
  description: { type: String },
});

const menuHistorySchema = new mongoose.Schema({
  meals: [mealSchema],
  modified_at: { type: Date, default: Date.now },
  modified_by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  version: { type: Number, required: true },
});

const menuSchema = new mongoose.Schema({
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
  meals: [mealSchema],
  history: [menuHistorySchema],
  currentVersion: { type: Number, default: 1 }, // Field to track the current version
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const Menu = mongoose.model("Menu", menuSchema);

export default Menu;
