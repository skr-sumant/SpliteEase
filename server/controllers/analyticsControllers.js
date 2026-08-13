import Expense from "../models/Expense.js";
import { analyzeExpenses } from "../utils/expenseAnalytics.js";
import { generateInsights } from "../utils/smartInsights.js";

export const getAnalytics = async (req, res) => {
  try {
    const expenses = await Expense.find({
      $or: [
        { paidBy: req.user._id },
        { participants: req.user._id },
        { isPersonal: true, paidBy: req.user._id }
      ]
    });

    const analytics = analyzeExpenses(expenses, req.user._id);
    const insights = generateInsights(analytics.overallAnalytics || analytics);

    res.json({
      analytics,
      personalAnalytics: analytics.personalAnalytics,
      groupAnalytics: analytics.groupAnalytics,
      overallAnalytics: analytics.overallAnalytics,
      insights
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
