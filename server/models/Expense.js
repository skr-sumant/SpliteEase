import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      default: null
    },

    isPersonal: {
      type: Boolean,
      default: false
    },

    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    splitType: {
      type: String,
      enum: ["equal", "custom", "unequal"],
      default: "equal"
    },

    category: {
      type: String,
      default: "Other"
    },

    splits: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },

        amount: Number
      }
    ]
  },
  { timestamps: true }
);

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;