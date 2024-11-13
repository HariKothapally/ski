import mongoose from "mongoose";

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String, required: true },
  costPerUnit: { type: Number, required: true },
  currentQuantity: { type: Number, required: true },
  reorderPoint: { type: Number, required: true },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Supplier",
    required: true,
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  modified_by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
});

const Ingredient = mongoose.model("Ingredient", ingredientSchema);
export default Ingredient;
