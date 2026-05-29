import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  addExpense,
  getExpensesByGroup
} from "../controllers/expenseControllers.js";

const router = express.Router();

router.post("/add", protect, addExpense);
router.get("/group/:groupId", protect, getExpensesByGroup);

export default router;