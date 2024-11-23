import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  orderDate: { type: Date, required: true },
  deliveryDate: { type: Date, required: true },
  items: [
    {
      recipeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Recipe",
        required: true,
      },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true },
      totalCost: { type: Number, required: true },
      // Track ingredient requirements per recipe order
      ingredientRequirements: [{
        ingredientId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Ingredient",
          required: true,
        },
        requiredQuantity: { type: Number, required: true },
        unitCost: { type: Number, required: true },
      }],
    },
  ],
  totalCost: { type: Number, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING',
    required: true
  },
  notes: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  modified_by: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
});

// Update the updated_at timestamp before saving
orderSchema.pre('save', function(next) {
  this.updated_at = new Date();
  next();
});

const Order = mongoose.model("Order", orderSchema);
export default Order;
