import { safeRound, pennyExactSplit } from "./reconciler.js";

/**
 * Calculate net balances for all members in a group.
 * Payer is credited the full amount, each participant is debited their split share.
 * Uses safe rounding to avoid floating-point accumulation errors.
 */
export const calculateBalances = (expenses) => {
  const balances = {};

  expenses.forEach((expense) => {
    const paidBy = expense.paidBy.toString();

    // Initialize payer
    if (!balances[paidBy]) {
      balances[paidBy] = 0;
    }
    // Payer gets credited full amount
    balances[paidBy] = safeRound(balances[paidBy] + expense.amount);

    // Deduct each participant's share
    expense.splits.forEach((split) => {
      const userId = split.user.toString();
      if (!balances[userId]) {
        balances[userId] = 0;
      }
      balances[userId] = safeRound(balances[userId] - split.amount);
    });
  });

  return balances;
};

/**
 * Simplify debts between group members using a greedy settlement algorithm.
 * Matches the largest debtor with the largest creditor iteratively.
 * All amounts are safely rounded to 2 decimal places.
 */
export const simplifyDebts = (balances) => {
  const settlements = [];
  const creditors = [];
  const debtors = [];

  // Separate creditors & debtors, rounding to avoid dust
  for (const user in balances) {
    const balance = safeRound(balances[user]);
    if (balance > 0.005) {
      creditors.push({ user, amount: balance });
    } else if (balance < -0.005) {
      debtors.push({ user, amount: -balance });
    }
  }

  // Sort by descending amount for optimal matching
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Settlement logic with safe rounding
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settledAmount = safeRound(Math.min(debtor.amount, creditor.amount));

    if (settledAmount > 0.005) {
      settlements.push({
        from: debtor.user,
        to: creditor.user,
        amount: settledAmount
      });
    }

    debtor.amount = safeRound(debtor.amount - settledAmount);
    creditor.amount = safeRound(creditor.amount - settledAmount);

    if (debtor.amount < 0.005) i++;
    if (creditor.amount < 0.005) j++;
  }

  return settlements;
};

/**
 * Build penny-exact equal splits for an expense.
 * Ensures that sum(splits) === amount exactly (no missing pennies).
 *
 * @param {number} amount - Total expense amount
 * @param {string[]} participantIds - Array of user IDs
 * @param {string|null} payerId - The payer's user ID (gets extra penny on remainder)
 * @returns {Array<{user: string, amount: number}>}
 */
export const buildEqualSplits = (amount, participantIds, payerId = null) => {
  if (!participantIds || participantIds.length === 0) return [];

  // Find payer's index in the participants list (for penny allocation priority)
  const payerIndex = payerId
    ? participantIds.findIndex((id) => id.toString() === payerId.toString())
    : 0;

  const shares = pennyExactSplit(amount, participantIds.length, payerIndex >= 0 ? payerIndex : 0);

  return participantIds.map((userId, idx) => ({
    user: userId,
    amount: shares[idx]
  }));
};
