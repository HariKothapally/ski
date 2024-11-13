import mongoose from "mongoose";

const revenueSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    description: "Revenue source (e.g., catering orders, hostel supply)",
  },
  amount: {
    type: Number,
    required: true,
    description: "Revenue amount",
  },
  date: {
    type: Date,
    required: true,
    description: "Date of revenue",
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

const Revenue = mongoose.model("Revenue", revenueSchema);

export default Revenue;
