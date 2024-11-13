import mongoose from "mongoose";

const receiptSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Order",
    description: "ID of the associated order",
  },
  amount: {
    type: Number,
    required: true,
    description: "Receipt amount",
  },
  date: {
    type: Date,
    required: true,
    description: "Date of receipt",
  },
  description: {
    type: String,
    required: true,
    description: "Description of the receipt",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "Record creation timestamp",
  },
  updated_at: {
    type: Date,
    default: Date.now,
    description: "Last update timestamp",
  },
});

const Receipt = mongoose.model("Receipt", receiptSchema);

export default Receipt;
