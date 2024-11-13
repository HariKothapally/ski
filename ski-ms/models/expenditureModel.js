import mongoose from "mongoose";

const expenditureSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    description: "Expense category (e.g., ingredients, salaries)",
  },
  amount: {
    type: Number,
    required: true,
    description: "Expense amount",
  },
  date: {
    type: Date,
    required: true,
    description: "Date of expenditure",
  },
  description: {
    type: String,
    required: true,
    description: "Description or reason for the expense",
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

const Expenditure = mongoose.model("Expenditure", expenditureSchema);

export default Expenditure;
