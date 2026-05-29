import Expense from "../models/Expense.js";
import {
  calculateBalances,
  simplifyDebts
} from "../utils/balanceCalculator.js";

export const getGroupBalances = async (req, res) => {
  try {
    const { groupId } = req.params;
    
    // Fetch expenses
    const expenses = await Expense.find({
      group: groupId
    });
    
    // Calculate balances
    const balances = calculateBalances(expenses);
    
    // Simplify debts
    const settlements = simplifyDebts(balances);
    
    res.json({
      balances,
      settlements
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
