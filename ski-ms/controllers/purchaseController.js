import Purchase from "../models/purchaseModel.js";

// Create a new purchase
export const createPurchase = async (req, res) => {
  const { supplierId, purchaseDate, items, totalAmount } = req.body;
  try {
    const newPurchase = new Purchase({
      supplierId,
      purchaseDate,
      items,
      totalAmount,
    });
    const savedPurchase = await newPurchase.save();
    res.status(201).json(savedPurchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all purchases
export const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().populate("supplierId").exec();
    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a purchase by ID
export const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("supplierId")
      .exec();
    if (!purchase)
      return res.status(404).json({ message: "Purchase not found" });
    res.status(200).json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a purchase
export const updatePurchase = async (req, res) => {
  try {
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: Date.now() },
      { new: true },
    )
      .populate("supplierId")
      .exec();
    if (!updatedPurchase)
      return res.status(404).json({ message: "Purchase not found" });
    res.status(200).json(updatedPurchase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a purchase
export const deletePurchase = async (req, res) => {
  try {
    const deletedPurchase = await Purchase.findByIdAndDelete(req.params.id);
    if (!deletedPurchase)
      return res.status(404).json({ message: "Purchase not found" });
    res.status(200).json({ message: "Purchase deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
