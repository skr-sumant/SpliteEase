import express from "express";
import protect from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  scanReceipt,
  reconcileReceipt
} from "../controllers/ocrControllers.js";

const router = express.Router();

router.post(
  "/scan",
  protect,
  upload.single("receipt"),
  scanReceipt
);

router.post(
  "/scan-public",
  upload.single("receipt"),
  scanReceipt
);

// Re-reconcile user-edited items against the grand total
router.post(
  "/reconcile",
  protect,
  reconcileReceipt
);

router.post(
  "/reconcile-public",
  reconcileReceipt
);

export default router;
