import Ingredient from "../models/ingredientsModel.js";

// Create a new ingredient
export const createIngredient = async (req, res) => {
  const { name, unit, costPerUnit, currentQuantity, reorderPoint, supplier } =
    req.body;
  try {
    const newIngredient = new Ingredient({
      name,
      unit,
      costPerUnit,
      currentQuantity,
      reorderPoint,
      supplier,
    });
    const savedIngredient = await newIngredient.save();
    res.status(201).json(savedIngredient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all ingredients
export const getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.status(200).json(ingredients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get an ingredient by ID
export const getIngredientById = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id);
    if (!ingredient)
      return res.status(404).json({ message: "Ingredient not found" });
    res.status(200).json(ingredient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update an ingredient
export const updateIngredient = async (req, res) => {
  try {
    const updatedIngredient = await Ingredient.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );
    if (!updatedIngredient)
      return res.status(404).json({ message: "Ingredient not found" });
    res.status(200).json(updatedIngredient);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an ingredient
export const deleteIngredient = async (req, res) => {
  try {
    const deletedIngredient = await Ingredient.findByIdAndDelete(req.params.id);
    if (!deletedIngredient)
      return res.status(404).json({ message: "Ingredient not found" });
    res.status(200).json({ message: "Ingredient deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
