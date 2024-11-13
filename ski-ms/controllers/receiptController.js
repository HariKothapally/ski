import Receipt from "../models/receiptModel.js";

// Create a new receipt
export const createReceipt = async (req, res) => {
  const { orderId, amount, date, description } = req.body;
  try {
    const newReceipt = new Receipt({ orderId, amount, date, description });
    const savedReceipt = await newReceipt.save();
    res.status(201).json(savedReceipt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all receipts
export const getReceipts = async (req, res) => {
  try {
    const receipts = await Receipt.find().populate("orderId").exec();
    res.status(200).json(receipts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a receipt by ID
export const getReceiptById = async (req, res) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate("orderId")
      .exec();
    if (!receipt) return res.status(404).json({ message: "Receipt not found" });
    res.status(200).json(receipt);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a receipt
export const updateReceipt = async (req, res) => {
  try {
    const updatedReceipt = await Receipt.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: Date.now() },
      { new: true },
    )
      .populate("orderId")
      .exec();
    if (!updatedReceipt)
      return res.status(404).json({ message: "Receipt not found" });
    res.status(200).json(updatedReceipt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a receipt
export const deleteReceipt = async (req, res) => {
  try {
    const deletedReceipt = await Receipt.findByIdAndDelete(req.params.id);
    if (!deletedReceipt)
      return res.status(404).json({ message: "Receipt not found" });
    res.status(200).json({ message: "Receipt deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
