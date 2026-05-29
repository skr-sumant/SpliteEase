export const analyzeExpenses = (expenses) => {
  let totalSpent = 0;
  const categoryTotals = {
    Food: 0,
    Transport: 0,
    Entertainment: 0,
    Shopping: 0,
    Other: 0
  };

  expenses.forEach((expense) => {
    totalSpent += expense.amount;

    const cat = expense.category || "Other";
    if (categoryTotals[cat] === undefined) {
      categoryTotals[cat] = 0;
    }
    categoryTotals[cat] += expense.amount;
  });

  return {
    totalSpent,
    categoryTotals
  };
};
