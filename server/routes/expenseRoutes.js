import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  addExpense,
  getExpensesByGroup,
  addPersonalExpense,
  getPersonalExpenses,
  deleteExpense
} from "../controllers/expenseControllers.js";

const router = express.Router();

// Group expense routes
router.post("/add", protect, addExpense);
router.get("/group/:groupId", protect, getExpensesByGroup);

// Personal expense routes
router.post("/personal", protect, addPersonalExpense);
router.get("/personal", protect, getPersonalExpenses);

// Delete expense
router.delete("/:id", protect, deleteExpense);

export default router;