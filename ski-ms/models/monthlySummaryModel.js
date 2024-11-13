import mongoose from "mongoose";

const monthlySummarySchema = new mongoose.Schema({
  month: {
    type: String,
    required: true,
    description: "Month in YYYY-MM format",
  },
  totalRevenue: {
    type: Number,
    required: true,
    description: "Total revenue for the month",
  },
  totalExpenditure: {
    type: Number,
    required: true,
    description: "Total expenditure for the month",
  },
  profitOrLoss: {
    type: Number,
    required: true,
    description: "Profit or loss for the month",
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

const MonthlySummary = mongoose.model("MonthlySummary", monthlySummarySchema);

export default MonthlySummary;
