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

// 💰 Add Personal Expense (no group, no splits)
export const addPersonalExpense = async (req, res) => {
  try {
    const { title, amount, category } = req.body;
    const numericAmount = safeRound(Number(amount));

    if (!title || !numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        error: "Title and a positive amount are required."
      });
    }

    const finalCategory = category || classifyExpense(title);

    const expense = await Expense.create({
      title,
      amount: numericAmount,
      group: null,
      isPersonal: true,
      paidBy: req.user._id,
      participants: [req.user._id],
      splitType: "equal",
      splits: [{ user: req.user._id, amount: numericAmount }],
      category: finalCategory
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 💰 Get Personal Expenses for the logged-in user
export const getPersonalExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({
      paidBy: req.user._id,
      isPersonal: true
    }).sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 🗑️ Delete an Expense
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ error: "Expense not found." });
    }

    // Only the payer can delete
    if (expense.paidBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the person who paid can delete this expense." });
    }

    await Expense.findByIdAndDelete(id);
    res.json({ success: true, message: "Expense deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};