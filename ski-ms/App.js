import express from "express";
import { connectDB, disconnectDB } from "./config/db.js";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";

// Import your modules
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
import { protectedRoute } from "./middleware/authController.js";
import imageRoutes from "./routes/imageRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import mealTrackerRoutes from "./routes/mealTrackerRoutes.js";
// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//connect db
await connectDB();
// Define routes

app.use("/api/users", userRoutes);
app.use("/api/employees", protectedRoute, employeeRoutes);
app.use("/api/suppliers", protectedRoute, supplierRoutes);
app.use("/api/ingredients", protectedRoute, ingredientRoutes);
app.use("/api/orders", protectedRoute, orderRoutes);
app.use("/api/bills", protectedRoute, billRoutes);
app.use("/api/recipes", protectedRoute, recipeRoutes);
app.use("/api/revenue", protectedRoute, revenueRoutes);
app.use("/api/expenditure", protectedRoute, expenditureRoutes);
app.use("/api/receipts", protectedRoute, receiptRoutes);
app.use("/api/budgets", protectedRoute, budgetRoutes);
app.use("/api/stockmovements", protectedRoute, stockMovementRoutes);
app.use("/api/images", protectedRoute, imageRoutes);
app.use("/api/purchases", protectedRoute, purchaseRoutes);
app.use("/api/menus", protectedRoute, menuRoutes);
app.use("/api/mealtrackers", protectedRoute, mealTrackerRoutes);
// Start the server
const PORT = process.env.PORT || 3300;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
// Shutdown hook to disconnect from the database
process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});
