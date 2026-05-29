import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  getGroupBalances
} from "../controllers/balanceControllers.js";

const router = express.Router();

router.get(
  "/:groupId",
  protect,
  getGroupBalances
);

export default router;
