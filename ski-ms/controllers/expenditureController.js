import Expenditure from "../models/expenditureModel.js";

// Create a new expenditure
export const createExpenditure = async (req, res) => {
  const { category, amount, date, description } = req.body;
  try {
    const newExpenditure = new Expenditure({
      category,
      amount,
      date,
      description,
    });
    const savedExpenditure = await newExpenditure.save();
    res.status(201).json(savedExpenditure);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all expenditures
export const getExpenditures = async (req, res) => {
  try {
    const expenditures = await Expenditure.find();
    res.status(200).json(expenditures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get an expenditure by ID
export const getExpenditureById = async (req, res) => {
  try {
    const expenditure = await Expenditure.findById(req.params.id);
    if (!expenditure)
      return res.status(404).json({ message: "Expenditure not found" });
    res.status(200).json(expenditure);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an expenditure
export const updateExpenditure = async (req, res) => {
  try {
    const updatedExpenditure = await Expenditure.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: Date.now() },
      { new: true },
    );
    if (!updatedExpenditure)
      return res.status(404).json({ message: "Expenditure not found" });
    res.status(200).json(updatedExpenditure);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an expenditure
export const deleteExpenditure = async (req, res) => {
  try {
    const deletedExpenditure = await Expenditure.findByIdAndDelete(
      req.params.id,
    );
    if (!deletedExpenditure)
      return res.status(404).json({ message: "Expenditure not found" });
    res.status(200).json({ message: "Expenditure deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
