export const generateInsights = (analytics) => {
  const insights = [];

  const foodSpent = analytics.categoryTotals.Food || 0;
  if (foodSpent > 5000) {
    insights.push("⚠ High food spending this month! Consider cooking at home to save.");
  } else if (foodSpent > 3000) {
    insights.push("💡 Food spending is moderate. Keep it up!");
  }

  const transportSpent = analytics.categoryTotals.Transport || 0;
  if (transportSpent > 3000) {
    insights.push("💡 Transport expenses are high. Consider ridesharing or public transit.");
  }

  const entertainmentSpent = analytics.categoryTotals.Entertainment || 0;
  if (entertainmentSpent > 2500) {
    insights.push("⚠ Entertainment budget exceeded. Try planning free social activities.");
  }

  const shoppingSpent = analytics.categoryTotals.Shopping || 0;
  if (shoppingSpent > 4000) {
    insights.push("⚠ High shopping expenses! Double check if you really need those purchases.");
  }

  // Monthly trend insight
  if (analytics.monthlyData && analytics.monthlyData.length >= 2) {
    const recent = analytics.monthlyData[analytics.monthlyData.length - 1];
    const previous = analytics.monthlyData[analytics.monthlyData.length - 2];
    if (recent.total > previous.total * 1.3) {
      const increase = Math.round(((recent.total - previous.total) / previous.total) * 100);
      insights.push(`🚨 Spending increased by ${increase}% compared to last month. Watch your budget!`);
    } else if (recent.total < previous.total * 0.8) {
      const decrease = Math.round(((previous.total - recent.total) / previous.total) * 100);
      insights.push(`🔥 Great job! You reduced spending by ${decrease}% compared to last month.`);
    }
  }

  if (analytics.totalSpent > 15000) {
    insights.push("🚨 Critical: Monthly overspending detected across multiple categories.");
  } else if (analytics.totalSpent === 0) {
    insights.push("🎉 You have logged no expenses yet. Start tracking to get AI insights!");
  } else {
    insights.push("✨ Great job! Your overall budget is currently within normal limits.");
  }

  return insights;
};
