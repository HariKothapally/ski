import mongoose from "mongoose";
import Revenue from "../models/revenueModel.js";
import Expenditure from "../models/expenditureModel.js";
import MonthlySummary from "../models/monthlySummaryModel.jsjs";

async function updateMonthlySummary(year, month) {
  try {
    const monthString = `${year}-${month.toString().padStart(2, "0")}`;

    // Calculate total revenue for the month
    const totalRevenueResult = await Revenue.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(`${monthString}-01`),
            $lt: new Date(`${monthString}-01`).setMonth(
              new Date(`${monthString}-01`).getMonth() + 1,
            ),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
        },
      },
    ]);
    const totalRevenue = totalRevenueResult[0]
      ? totalRevenueResult[0].totalRevenue
      : 0;

    // Calculate total expenditure for the month
    const totalExpenditureResult = await Expenditure.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(`${monthString}-01`),
            $lt: new Date(`${monthString}-01`).setMonth(
              new Date(`${monthString}-01`).getMonth() + 1,
            ),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalExpenditure: { $sum: "$amount" },
        },
      },
    ]);
    const totalExpenditure = totalExpenditureResult[0]
      ? totalExpenditureResult[0].totalExpenditure
      : 0;

    // Calculate profit or loss for the month
    const profitOrLoss = totalRevenue - totalExpenditure;

    // Update or insert the monthly summary
    const update = {
      month: monthString,
      totalRevenue,
      totalExpenditure,
      profitOrLoss,
    };
    const options = { upsert: true, new: true };
    await MonthlySummary.findOneAndUpdate(
      { month: monthString },
      update,
      options,
    );

    // Close the database connection
    await mongoose.connection.close();
  } catch (error) {
    console.error("Error updating monthly summary:", error);
  }
}

// Example usage
updateMonthlySummary(2023, 9); // Update summary for September 2023
