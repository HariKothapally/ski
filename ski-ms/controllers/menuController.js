import Menu from "../models/menuModel.js";

// Create a new menu
export const createMenu = async (req, res) => {
  const { dayOfWeek, meals } = req.body;
  try {
    const newMenu = new Menu({ dayOfWeek, meals });
    const savedMenu = await newMenu.save();
    res.status(201).json(savedMenu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all menus
export const getMenus = async (req, res) => {
  try {
    const menus = await Menu.find().populate("meals.recipes").exec();
    res.status(200).json(menus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a menu by ID
export const getMenuById = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id)
      .populate("meals.recipes")
      .exec();
    if (!menu) return res.status(404).json({ message: "Menu not found" });
    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a menu with versioning
export const updateMenu = async (req, res) => {
  try {
    const existingMenu = await Menu.findById(req.params.id);
    if (!existingMenu)
      return res.status(404).json({ message: "Menu not found" });

    // Save the current state of the menu to the history array
    const newVersion = existingMenu.currentVersion + 1;
    existingMenu.history.push({
      meals: existingMenu.meals,
      modified_at: Date.now(),
      modified_by: req.body.modified_by,
      version: existingMenu.currentVersion,
    });

    // Update the menu
    existingMenu.meals = req.body.meals;
    existingMenu.currentVersion = newVersion;
    existingMenu.updated_at = Date.now();
    const updatedMenu = await existingMenu.save();
    res.status(200).json(updatedMenu);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a menu
export const deleteMenu = async (req, res) => {
  try {
    const deletedMenu = await Menu.findByIdAndDelete(req.params.id);
    if (!deletedMenu)
      return res.status(404).json({ message: "Menu not found" });
    res.status(200).json({ message: "Menu deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get menu history
export const getMenuHistory = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.menuId)
      .populate("history.meals.recipes")
      .exec();
    if (!menu) return res.status(404).json({ message: "Menu not found" });
    res.status(200).json(menu.history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
