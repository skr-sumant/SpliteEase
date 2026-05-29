import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  sendPaymentReminderNotification,
  sendExpenseUpdateNotification,
  sendBulkReminders,
  getWhatsAppLink
} from "../controllers/notificationControllers.js";

const router = express.Router();

router.post("/payment-reminder", protect, sendPaymentReminderNotification);
router.post("/expense-update", protect, sendExpenseUpdateNotification);
router.post("/bulk-reminders", protect, sendBulkReminders);
router.post("/whatsapp-link", protect, getWhatsAppLink);

export default router;
