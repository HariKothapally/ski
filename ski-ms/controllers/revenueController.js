import Revenue from "../models/revenueModel.js";

// Create a new revenue
export const createRevenue = async (req, res) => {
  const { source, amount, date } = req.body;
  try {
    const newRevenue = new Revenue({ source, amount, date });
    const savedRevenue = await newRevenue.save();
    res.status(201).json(savedRevenue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all revenue records
export const getRevenue = async (req, res) => {
  try {
    const revenueRecords = await Revenue.find();
    res.status(200).json(revenueRecords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a revenue record by ID
export const getRevenueById = async (req, res) => {
  try {
    const revenueRecord = await Revenue.findById(req.params.id);
    if (!revenueRecord)
      return res.status(404).json({ message: "Revenue record not found" });
    res.status(200).json(revenueRecord);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a revenue record
export const updateRevenue = async (req, res) => {
  try {
    const updatedRevenue = await Revenue.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: Date.now() },
      { new: true },
    );
    if (!updatedRevenue)
      return res.status(404).json({ message: "Revenue record not found" });
    res.status(200).json(updatedRevenue);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a revenue record
export const deleteRevenue = async (req, res) => {
  try {
    const deletedRevenue = await Revenue.findByIdAndDelete(req.params.id);
    if (!deletedRevenue)
      return res.status(404).json({ message: "Revenue record not found" });
    res.status(200).json({ message: "Revenue record deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
