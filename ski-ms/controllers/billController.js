import Bill from "../models/billModel.js";

// Create a new bill
export const createBill = async (req, res) => {
  const { orderId, billingDate, totalAmount, status, items, modified_by } =
    req.body;
  try {
    const newBill = new Bill({
      orderId,
      billingDate,
      totalAmount,
      status,
      items,
      modified_by,
    });
    const savedBill = await newBill.save();
    res.status(201).json(savedBill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all bills
export const getBills = async (req, res) => {
  try {
    const bills = await Bill.find().populate("orderId").exec();
    res.status(200).json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a bill by ID
export const getBillById = async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id).populate("orderId").exec();
    if (!bill) return res.status(404).json({ message: "Bill not found" });
    res.status(200).json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a bill
export const updateBill = async (req, res) => {
  try {
    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: Date.now() },
      { new: true },
    )
      .populate("orderId")
      .exec();
    if (!updatedBill)
      return res.status(404).json({ message: "Bill not found" });
    res.status(200).json(updatedBill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a bill
export const deleteBill = async (req, res) => {
  try {
    const deletedBill = await Bill.findByIdAndDelete(req.params.id);
    if (!deletedBill)
      return res.status(404).json({ message: "Bill not found" });
    res.status(200).json({ message: "Bill deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
