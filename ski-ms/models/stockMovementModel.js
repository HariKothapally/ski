import mongoose from "mongoose";

const stockMovementSchema = new mongoose.Schema({
  ingredientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ingredient",
    required: true,
  },
  quantity: { type: Number, required: true },
  movementType: { type: String, required: true },
  movementDate: { type: Date, required: true },
  description: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  modified_by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
});

const StockMovement = mongoose.model("StockMovement", stockMovementSchema);
export default StockMovement;
