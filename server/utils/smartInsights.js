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

  if (analytics.totalSpent > 15000) {
    insights.push("🚨 Critical: Monthly overspending detected across multiple categories.");
  } else if (analytics.totalSpent === 0) {
    insights.push("🎉 You have logged no expenses this month. Excellent budget control!");
  } else {
    insights.push("✨ Great job! Your overall budget is currently within normal limits.");
  }

  return insights;
};
