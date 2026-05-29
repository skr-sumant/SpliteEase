import Expense from "../models/Expense.js";
import { analyzeExpenses } from "../utils/expenseAnalytics.js";
import { generateInsights } from "../utils/smartInsights.js";

export const getAnalytics = async (req, res) => {
  try {
    // Fetch expenses paid by this user or where they are a participant to get their absolute share
    const expenses = await Expense.find({
      $or: [
        { paidBy: req.user._id },
        { participants: req.user._id }
      ]
    });

    const analytics = analyzeExpenses(expenses);
    const insights = generateInsights(analytics);

    res.json({
      analytics,
      insights
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
