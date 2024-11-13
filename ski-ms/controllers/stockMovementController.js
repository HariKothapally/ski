import StockMovement from "../models/stockMovementModel.js";

// Create a new stock movement
export const createStockMovement = async (req, res) => {
  const { ingredientId, quantity, movementType, movementDate, description } =
    req.body;
  try {
    const newStockMovement = new StockMovement({
      ingredientId,
      quantity,
      movementType,
      movementDate,
      description,
    });
    const savedStockMovement = await newStockMovement.save();
    res.status(201).json(savedStockMovement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all stock movements
export const getStockMovements = async (req, res) => {
  try {
    const stockMovements = await StockMovement.find()
      .populate("ingredientId")
      .exec();
    res.status(200).json(stockMovements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a stock movement by ID
export const getStockMovementById = async (req, res) => {
  try {
    const stockMovement = await StockMovement.findById(req.params.id)
      .populate("ingredientId")
      .exec();
    if (!stockMovement)
      return res.status(404).json({ message: "Stock movement not found" });
    res.status(200).json(stockMovement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a stock movement
export const updateStockMovement = async (req, res) => {
  try {
    const updatedStockMovement = await StockMovement.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: Date.now() },
      { new: true },
    )
      .populate("ingredientId")
      .exec();
    if (!updatedStockMovement)
      return res.status(404).json({ message: "Stock movement not found" });
    res.status(200).json(updatedStockMovement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a stock movement
export const deleteStockMovement = async (req, res) => {
  try {
    const deletedStockMovement = await StockMovement.findByIdAndDelete(
      req.params.id,
    );
    if (!deletedStockMovement)
      return res.status(404).json({ message: "Stock movement not found" });
    res.status(200).json({ message: "Stock movement deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
