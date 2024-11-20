import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";

// Load environment variables
dotenv.config();

import { connectDB, disconnectDB } from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import ingredientRoutes from "./routes/ingredientRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import revenueRoutes from "./routes/revenueRoutes.js";
import expenditureRoutes from "./routes/expenditureRoutes.js";
import receiptRoutes from "./routes/receiptRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import stockMovementRoutes from "./routes/stockMovementRoutes.js";
import { authenticateToken } from "./middleware/authMiddleware.js";
import imageRoutes from "./routes/imageRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import mealTrackerRoutes from "./routes/mealTrackerRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to database
await connectDB();

// Define routes
// Auth routes
app.use("/api/auth", userRoutes);

// Protected routes
app.use("/api/employees", authenticateToken, employeeRoutes);
app.use("/api/suppliers", authenticateToken, supplierRoutes);
app.use("/api/ingredients", authenticateToken, ingredientRoutes);
app.use("/api/orders", authenticateToken, orderRoutes);
app.use("/api/bills", authenticateToken, billRoutes);
app.use("/api/recipes", authenticateToken, recipeRoutes);
app.use("/api/revenue", authenticateToken, revenueRoutes);
app.use("/api/expenditure", authenticateToken, expenditureRoutes);
app.use("/api/receipts", authenticateToken, receiptRoutes);
app.use("/api/budgets", authenticateToken, budgetRoutes);
app.use("/api/stockmovements", authenticateToken, stockMovementRoutes);
app.use("/api/images", authenticateToken, imageRoutes);
app.use("/api/purchases", authenticateToken, purchaseRoutes);
app.use("/api/menus", authenticateToken, menuRoutes);
app.use("/api/mealtrackers", authenticateToken, mealTrackerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
const PORT = process.env.PORT || 3300;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Shutdown hook to disconnect from the database
process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});
