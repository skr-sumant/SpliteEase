import Expense from "../models/Expense.js";
import { classifyExpense } from "../utils/categoryClassifier.js";
import { buildEqualSplits } from "../utils/balanceCalculator.js";
import { safeRound } from "../utils/reconciler.js";

// 💰 Add Expense — with penny-exact splitting and validation
export const addExpense = async (req, res) => {
  try {
    const {
      title,
      amount,
      group,
      participants,
      splitType
    } = req.body;

    const numericAmount = safeRound(Number(amount));

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        error: "Amount must be a positive number."
      });
    }

    if (!participants || participants.length === 0) {
      return res.status(400).json({
        error: "At least one participant is required."
      });
    }

    let splits = [];

    // 🔥 Split Logic — now with penny-exact equal splits
    if (splitType === "equal") {
      // Use penny-exact splitting to ensure sum(splits) === amount exactly
      splits = buildEqualSplits(numericAmount, participants, req.user._id);
    } else if (req.body.splits && req.body.splits.length > 0) {
      // Custom splits from the client
      splits = req.body.splits.map(s => ({
        user: s.user,
        amount: safeRound(Number(s.amount))
      }));

      // Validate: custom splits must sum to the expense amount
      const splitsTotal = safeRound(splits.reduce((sum, s) => sum + s.amount, 0));
      const diff = Math.abs(splitsTotal - numericAmount);

      if (diff > 0.01) {
        return res.status(400).json({
          error: `Split amounts (₹${splitsTotal.toFixed(2)}) don't match expense amount (₹${numericAmount.toFixed(2)}). Difference: ₹${diff.toFixed(2)}`
        });
      }
    } else {
      // Fallback: equal split with penny-exact method
      splits = buildEqualSplits(numericAmount, participants, req.user._id);
    }

    // Final safety check: verify splits sum exactly matches amount
    const finalSplitsTotal = safeRound(splits.reduce((sum, s) => sum + s.amount, 0));
    if (Math.abs(finalSplitsTotal - numericAmount) > 0.01) {
      // Auto-adjust the last split to absorb rounding dust
      const dust = safeRound(numericAmount - finalSplitsTotal);
      if (splits.length > 0) {
        splits[splits.length - 1].amount = safeRound(splits[splits.length - 1].amount + dust);
      }
    }

    // Auto classify expense category
    const category = classifyExpense(title);

    const expense = await Expense.create({
      title,
      amount: numericAmount,
      group,
      paidBy: req.user._id,
      participants,
      splitType,
      splits,
      category
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

// 💰 Get Expenses for a Group (Timeline)
export const getExpensesByGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const expenses = await Expense.find({ group: groupId })
      .populate("paidBy", "name email")
      .populate("splits.user", "name email")
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};