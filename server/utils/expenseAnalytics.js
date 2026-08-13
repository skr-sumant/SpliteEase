/**
 * Expense Analytics — Completely Separated Personal vs Group Expenses
 */

const computeAnalyticsForSet = (expenses, userId, filterType) => {
  let totalSpent = 0;
  const categoryTotals = {};
  const monthlyMap = {};
  const userIdStr = userId ? userId.toString() : null;

  expenses.forEach((expense) => {
    // Strict Separation Filter:
    // "personal": strictly expenses with NO group attached (group is null/undefined)
    // "group": strictly expenses WITH a group attached (group is not null)
    const isGroupExp = Boolean(expense.group);
    
    if (filterType === "personal" && isGroupExp) return;
    if (filterType === "group" && !isGroupExp) return;

    let userShare = 0;

    if (!isGroupExp) {
      // Personal expense — full amount belongs to user
      userShare = Number(expense.amount) || 0;
    } else if (userIdStr && expense.splits && expense.splits.length > 0) {
      // Group expense — user's share from splits
      const userSplit = expense.splits.find(
        (s) => s.user && s.user.toString() === userIdStr
      );
      if (userSplit) {
        userShare = Number(userSplit.amount) || 0;
      }
    } else {
      // Fallback for group expense if paid by user
      if (userIdStr && expense.paidBy && (expense.paidBy.toString() === userIdStr || expense.paidBy._id?.toString() === userIdStr)) {
        userShare = Number(expense.amount) || 0;
      }
    }

    if (userShare <= 0) return;

    totalSpent += userShare;

    // Category breakdown
    const cat = expense.category || "Other";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + userShare;

    // Monthly breakdown
    const date = expense.createdAt ? new Date(expense.createdAt) : new Date();
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleString("en-US", { month: "short", year: "numeric" });

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { month: monthLabel, monthKey, total: 0, categories: {} };
    }
    monthlyMap[monthKey].total += userShare;
    monthlyMap[monthKey].categories[cat] = (monthlyMap[monthKey].categories[cat] || 0) + userShare;
  });

  const monthlyData = Object.values(monthlyMap)
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .slice(-12)
    .map(({ month, total, categories }) => ({
      month,
      total: Math.round(total * 100) / 100,
      categories
    }));

  for (const cat in categoryTotals) {
    categoryTotals[cat] = Math.round(categoryTotals[cat] * 100) / 100;
  }

  return {
    totalSpent: Math.round(totalSpent * 100) / 100,
    categoryTotals,
    monthlyData
  };
};

export const analyzeExpenses = (expenses, userId) => {
  const personalAnalytics = computeAnalyticsForSet(expenses, userId, "personal");
  const groupAnalytics = computeAnalyticsForSet(expenses, userId, "group");
  const overallAnalytics = computeAnalyticsForSet(expenses, userId, "all");

  return {
    personalAnalytics,
    groupAnalytics,
    overallAnalytics,
    // Legacy properties for backwards compatibility
    totalSpent: overallAnalytics.totalSpent,
    categoryTotals: overallAnalytics.categoryTotals,
    monthlyData: overallAnalytics.monthlyData
  };
};
